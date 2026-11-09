/* Makete novih tovornjakov in avtobusov (samo lokalno, za predstavitev 9. 11. 2026; ne v repozitorij, ne v pull request).
   Hitri modeli v slogu igre: polpriklopniki na vlačilcih TITAN in KAMEN (graditelj prikolice B), toga vozila (KIT K, dolžina čez 6,4 m
   samo z lokalnim popravkom v core.js). Brez znamk in napisov podjetij; imena izmišljena. */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const find = (id) => VEHICLE_DEFS.find(d => d && d.id === id);
  const lcg = (s) => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const TAU = Math.PI * 2;
  function add(baseId, o, drop) {
    const b = find(baseId); if (!b) return;
    const d = Object.assign({}, b, o);
    for (const k of drop || []) delete d[k];
    VEHICLE_DEFS.push(d);
  }
  // the tank's picture: text as read from each side (the +z side's rows run up the tank, the -z side's down it)
  function onSide(g, cx, cy, mid, k, draw) { g.save(); if (cy < mid) g.setTransform(1, 0, 0, -k, cx, cy); else g.setTransform(-1, 0, 0, k, cx, cy); draw(); g.restore(); }
  function wheels3(B, AX, lo, rim) {
    const full = !lo, sh = lo === 2;
    for (const ax of AX) {
      if (!sh) B.box(ax, 0.5, 0, 0.12, 0.12, 1.72, 0x1c1c1e);
      for (const sd of [-1, 1]) {
        if (full) { B.cyl([ax, 0.5, sd * 0.86], [ax, 0.5, sd * 1.22], 0.5, 0x1b1b1b, { n: 14 }); B.cyl([ax, 0.5, sd * 1.22], [ax, 0.5, sd * 1.235], 0.3, rim, { n: 12 }); B.cyl([ax, 0.5, sd * 1.235], [ax, 0.5, sd * 1.25], 0.09, 0x3a3b3d, { n: 8 }); }
        else B.cyl([ax, 0.5, sd * 0.86], [ax, 0.5, sd * 1.23], 0.5, 0x1b1b1b, { n: sh ? 6 : 8, capK: rim });
      }
    }
  }
  function landing(B, x, lo) {
    if (lo === 2) return;
    for (const sd of [-1, 1]) { B.box(x, 0.62, sd * 0.55, 0.14, 0.78, 0.14, 0x2a2a2c); if (!lo) B.box(x, 0.2, sd * 0.55, 0.32, 0.05, 0.32, 0x1c1c1e); }
  }

  // ======================= a1 · TITAN PLIN: a round gas tank with hemispherical ends, white, an orange band =======================
  const PL = { x0: -9.45, x1: -0.3, yc: 2.12, r: 1.06, dome: 0.92 };
  const PLP = { skin: [0, 0, 1024, 400], end: [0, 400, 112, 512], bump: [120, 400, 640, 450] };
  function paintPlin(g) {
    const rnd = lcg(91101), [S0, S1, S2, S3] = PLP.skin, SW = S2 - S0, SH = S3 - S1, LEN = PL.x1 - PL.x0, PER = TAU * PL.r;
    const mx = SW / LEN, my = SH / PER, k = my / mx, PX = (x) => S0 + (x - PL.x0) * mx, PY = (f) => S1 + f / TAU * SH, MID = S1 + SH / 2;
    const gr = g.createLinearGradient(0, S1, 0, S3);
    [[0, '#8f8b82'], [0.08, '#c9c6bd'], [0.18, '#efeee9'], [0.5, '#fbfbf8'], [0.82, '#efeee9'], [0.92, '#c9c6bd'], [1, '#8f8b82']].forEach(([t, c]) => gr.addColorStop(t, c));
    g.fillStyle = gr; g.fillRect(S0, S1, SW, SH);
    for (const f of [Math.PI / 2, Math.PI * 1.5]) {   // the orange band along each side, a thin red line under it
      g.fillStyle = '#e8731c'; g.fillRect(S0, PY(f - 0.13), SW, PY(f + 0.13) - PY(f - 0.13));
      g.fillStyle = '#b8261c'; const yl = f < Math.PI ? PY(f - 0.2) : PY(f + 0.17); g.fillRect(S0, yl, SW, PY(0.03) - PY(0));
    }
    for (let i = 0; i < 700; i++) { const y = rnd() < 0.5 ? S1 + rnd() * SH * 0.12 : S3 - rnd() * SH * 0.12, x = S0 + rnd() * SW * (0.35 + 0.65 * rnd()); g.globalAlpha = 0.08 + 0.18 * rnd(); g.fillStyle = rnd() < 0.5 ? '#6b6153' : '#4f4840'; g.fillRect(x, y, 2 + rnd() * 9, 1 + rnd() * 2); }   // (road grime low on it, more toward the rear)
    g.globalAlpha = 1;
    for (const f of [Math.PI / 2 + 0.36, Math.PI * 1.5 - 0.36]) {
      onSide(g, PX(-7.7), PY(f), MID, k, () => { g.fillStyle = '#ffffff'; g.fillRect(-92, -17, 184, 34); g.strokeStyle = '#b8261c'; g.lineWidth = 2; g.strokeRect(-90, -15, 180, 30);
        g.fillStyle = '#b8261c'; g.font = 'bold 21px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FLAMMABLE GAS', 0, 1); });
      onSide(g, PX(-1.3), PY(f), MID, k, () => { g.rotate(Math.PI / 4); g.fillStyle = '#c8261c'; g.fillRect(-18, -18, 36, 36); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(-15, -15, 30, 30);
        g.rotate(-Math.PI / 4); g.fillStyle = '#ffffff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2', 0, 14);
        g.beginPath(); g.moveTo(0, -14); g.quadraticCurveTo(7, -4, 0, 4); g.quadraticCurveTo(-7, -4, 0, -14); g.fill(); });
    }
    { const [E0, E1, E2, E3] = PLP.end, cx = (E0 + E2) / 2, cy = (E1 + E3) / 2, R = (E2 - E0) / 2;   // the ends: white, a seam round them
      const rg = g.createRadialGradient(cx, cy - 8, 3, cx, cy, R); rg.addColorStop(0, '#fbfbf8'); rg.addColorStop(0.8, '#e9e8e2'); rg.addColorStop(1, '#a9a69d');
      g.fillStyle = rg; g.fillRect(E0, E1, E2 - E0, E3 - E1); g.strokeStyle = '#9d9a92'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R - 5, 0, TAU); g.stroke(); }
    { const [L0, L1, L2, L3] = PLP.bump, w = L2 - L0, h = L3 - L1;   // the rear bumper: red and white reflective stripes
      g.save(); g.beginPath(); g.rect(L0, L1, w, h); g.clip(); g.fillStyle = '#f4f4f0'; g.fillRect(L0, L1, w, h);
      g.fillStyle = '#c8261c'; for (let x = L0 - h; x < L2 + h; x += 44) { g.beginPath(); g.moveTo(x, L3); g.lineTo(x + 22, L3); g.lineTo(x + 22 + h, L1); g.lineTo(x + h, L1); g.fill(); }
      g.restore(); }
  }
  function buildPlin(B) {
    const lo = B.lo || 0, full = !lo, sh = lo === 2, DK = 0x1d1e20, FRM = 0x2c2d30, BLK = 0x131313, GR = 0xc6c9cc;
    B.tex(1024, 512, paintPlin);
    for (const sd of [-1, 1]) B.box(-4.9, 0.98, sd * 0.5, 11.2, 0.2, 0.14, DK);
    B.box(-0.2, 0.95, 0, 2.1, 0.07, 1.9, DK);
    if (!sh) for (const x of [-0.9, -4.8, -8.7]) B.box(x, 1.13, 0, 0.3, 0.16, 1.5, FRM);
    B.tank(PL.x0, PL.x1, PL.yc, PL.r, PL.r, { n: [36, 18, 10][lo], uv: PLP.skin, end: PLP.end, dome: PL.dome });
    if (!sh) {   // the valve dome on top, its lid; a short walkway with a folded rail
      B.cyl([-4.8, 3.1, 0], [-4.8, 3.34, 0], 0.36, GR, { n: full ? 14 : 8 });
      if (full) { B.cyl([-4.8, 3.34, 0], [-4.8, 3.38, 0], 0.4, 0xa9adb1, { n: 14 }); B.box(-4.8, 3.2, 0.5, 1.6, 0.04, 0.34, 0x8d9195); for (const x of [-4.1, -5.5]) B.box(x, 3.32, 0.66, 0.04, 0.24, 0.04, 0xd8261c); B.box(-4.8, 3.44, 0.66, 1.44, 0.04, 0.04, 0xd8261c); }
    }
    if (!sh) {   // the pump and valve cabinet ahead of the axles (+z), a tool box (-z), the side guards
      B.box(-5.6, 0.88, 0.98, 1.7, 0.64, 0.38, 0xd9dbdd);
      if (full) { B.box(-5.6, 0.88, 1.175, 0.02, 0.6, 0.012, 0x6d7175); for (const y of [0.62, 1.14]) B.box(-5.6, y, 1.175, 1.66, 0.02, 0.012, 0x6d7175); B.box(-5.2, 0.9, 1.18, 0.12, 0.05, 0.02, 0x2a2a2a); B.box(-6.0, 0.9, 1.18, 0.12, 0.05, 0.02, 0x2a2a2a); }
      B.box(-5.4, 0.86, -0.98, 1.1, 0.52, 0.36, 0x8e9296);
      for (const sd of [-1, 1]) for (const y of [0.62, 0.38]) B.box(-3.3, y, sd * 1.18, 3.0, 0.09, 0.05, 0xb5b9bd);
    }
    landing(B, -2.1, lo);
    wheels3(B, [-7.25, -8.55, -9.85], lo, 0xb8bcc0);
    for (const sd of [-1, 1]) { B.box(-8.55, 1.08, sd * 1.04, 3.9, 0.05, 0.42, BLK); if (!sh) B.box(-10.45, 0.68, sd * 1.04, 0.02, 0.76, 0.4, BLK); }
    B.box(-10.62, 0.47, 0, 0.1, 0.2, 2.3, 0xf4f4f0, { face: '-x', uv: PLP.bump });
    if (!sh) for (const sd of [-1, 1]) { if (full) B.box(-10.4, 0.75, sd * 0.5, 0.42, 0.46, 0.08, DK); B.lamp(-10.68, 0.47, sd * 0.98, 0.14, 0.26); }
  }
  add('cisterna', {
    id: 'titanplin', name: 'TITAN PLIN', ord: 5, price: 80000, field: ['titanplin'], fieldN: 5,
    desc: 'TITAN s plinsko cisterno: okrogla, bela, zaobljeni dni, lažja od TITAN CISTERNE.',
    look: find('titan').look,
    trailer: { mass: 10000, len: 11.5, wid: 2.5, ht: 3.4, f: 0.9, ax: [-7.25, -8.55, -9.85], kp: [-1.8, 0.98], rw: 0.5, mu: 1.5, brk: 7.5, look: { build: buildPlin } },
  });

  // ======================= b1 · TITAN AVTOVOZ: a two-deck car carrier with five cars of no make =======================
  function carOn(B, x, y, len, col, lo) {   // a car (no make): the body to the belt, the dark glasshouse, the roof, the wheels; x its middle, y its tyres' foot
    if (lo === 2) { B.box(x, y + 0.66, 0, len, 1.0, 1.74, 0x222222); return; }
    B.box(x, y + 0.52, 0, len, 0.56, 1.76, col);
    B.box(x - 0.12, y + 1.03, 0, len * 0.52, 0.46, 1.5, 0x182029);
    B.box(x - 0.18, y + 1.27, 0, len * 0.4, 0.04, 1.42, col);
    for (const ex of [0.33, -0.33]) for (const sd of [-1, 1]) {
      if (!lo) B.cyl([x + ex * len, y + 0.31, sd * 0.7], [x + ex * len, y + 0.31, sd * 0.9], 0.31, 0x151515, { n: 10, capK: 0x8d9195 });
      else B.box(x + ex * len, y + 0.31, sd * 0.8, 0.6, 0.6, 0.2, 0x151515);
    }
    if (!lo) for (const sd of [-1, 1]) { B.box(x + len / 2 + 0.005, y + 0.66, sd * 0.62, 0.02, 0.1, 0.3, 0xf2f0e6); B.box(x - len / 2 - 0.005, y + 0.68, sd * 0.66, 0.02, 0.1, 0.26, 0x9e1b14); }
  }
  function buildAvtovoz(B) {
    const lo = B.lo || 0, full = !lo, sh = lo === 2, FRM = 0x5f6368, DECK = 0x3a3d41, POST = 0xc8302a, BLK = 0x131313;
    B.box(-0.35, 1.18, 0, 2.5, 0.34, 2.3, FRM);                 // the gooseneck on the fifth wheel
    B.box(-1.75, 0.9, 0, 0.3, 0.6, 2.3, FRM);                   // its step down to the well
    B.box(-5.2, 0.58, 0, 7.2, 0.14, 2.36, DECK);                // the low well
    B.box(-8.9, 0.9, 0, 0.3, 0.6, 2.3, FRM);                    // up over the axles
    B.box(-10.85, 1.22, 0, 3.7, 0.2, 2.36, FRM);                // the rear deck over the axles
    if (!sh) for (const sd of [-1, 1]) B.box(-5.2, 0.72, sd * 1.18, 7.2, 0.16, 0.06, FRM);
    for (const sd of [-1, 1]) { B.box(-5.85, 2.7, sd * 0.8, 13.1, 0.08, 0.62, DECK); if (!sh) B.box(-5.85, 2.62, sd * 1.19, 13.1, 0.2, 0.08, POST); }   // the upper deck: its two tracks, its side beams
    if (!sh) for (const [x, yb] of [[0.6, 1.35], [-2.0, 0.65], [-4.6, 0.65], [-7.2, 0.65], [-9.4, 1.32], [-12.2, 1.32]]) for (const sd of [-1, 1]) B.box(x, (yb + 2.52) / 2, sd * 1.2, 0.12, 2.52 - yb, 0.1, POST);
    if (full) for (let x = 0.3; x > -12.4; x -= 0.9) B.box(x, 2.75, 0, 0.05, 0.03, 2.2, 0x2b2d30);   // (the upper deck's cross bars)
    landing(B, -1.3, lo);
    wheels3(B, [-9.9, -11.0, -12.1], lo, 0xa9adb1);
    for (const sd of [-1, 1]) B.box(-11.0, 1.08, sd * 1.04, 3.2, 0.04, 0.42, BLK);
    B.box(-12.68, 0.9, 0, 0.08, 0.3, 2.4, BLK);
    if (!sh) for (const sd of [-1, 1]) B.lamp(-12.73, 0.9, sd * 1.0, 0.14, 0.26);
    const CC = [0xd6dade, 0x1f3f8f, 0xb51d1d, 0x18191b, 0xf2f2ee];
    carOn(B, -0.75, 2.74, 4.3, CC[0], lo); carOn(B, -5.3, 2.74, 4.4, CC[1], lo); carOn(B, -9.95, 2.74, 4.4, CC[2], lo);
    carOn(B, -4.3, 0.65, 4.4, CC[3], lo); carOn(B, -10.75, 1.32, 3.9, CC[4], lo);
  }
  add('cisterna', {
    id: 'avtovoz', name: 'TITAN AVTOVOZ', ord: 6, price: 85000, field: ['avtovoz'], fieldN: 4,
    desc: 'TITAN z avtovozom: dve palubi, pet avtomobilov; visok, dolg 17 metrov.',
    look: find('titan').look,
    trailer: { mass: 13000, len: 13.6, wid: 2.5, ht: 4.1, f: 0.9, ax: [-9.9, -11.0, -12.1], kp: [-1.8, 0.98], rw: 0.5, mu: 1.5, brk: 7.5, look: { build: buildAvtovoz } },
  });

  // ======================= b2 · KRILO VETRNICE: a 27 m wind-turbine blade on a spine trailer, far out behind its bogie =======================
  function loftX(B, S, n, col) {   // elliptic rings along x joined (S: [x, yc, ry, rz] from the root back to the tip), smooth
    const K = B.rgb(col), P = (s, f) => [s[0], s[1] - s[2] * Math.cos(f), s[3] * Math.sin(f)];
    const N = (s, f) => { const y = -Math.cos(f) / s[2], z = Math.sin(f) / s[3], l = Math.hypot(y, z) || 1; return [0, y / l, z / l]; };
    for (let j = 0; j < S.length - 1; j++) for (let i = 0; i < n; i++) {
      const a = S[j], b = S[j + 1], f0 = TAU * i / n, f1 = TAU * (i + 1) / n;
      B.tri(P(a, f0), P(a, f1), P(b, f1), N(a, f0), N(a, f1), N(b, f1), K); B.tri(P(a, f0), P(b, f1), P(b, f0), N(a, f0), N(b, f1), N(b, f0), K);
    }
  }
  function buildKrilo(B) {
    const lo = B.lo || 0, full = !lo, sh = lo === 2, FRM = 0x2c2d30, YEL = 0xe0b21c, BLK = 0x131313, WH = 0xeeeee9, n = [20, 12, 8][lo];
    B.box(-0.6, 1.15, 0, 2.6, 0.3, 2.4, FRM);                   // the gooseneck, the root's frame on it
    B.box(-7.6, 1.05, 0, 13.0, 0.36, 0.7, FRM);                 // the telescopic spine
    B.box(-13.4, 1.12, 0, 3.6, 0.24, 2.4, FRM);                 // the rear bogie's frame
    if (!sh) { B.box(0.05, 1.62, 0, 0.5, 0.65, 2.3, YEL); for (const sd of [-1, 1]) B.box(0.05, 2.3, sd * 1.12, 0.5, 1.4, 0.14, YEL); B.box(-13.4, 1.48, 0, 0.6, 0.48, 1.9, YEL); }
    B.cyl([0.42, 2.3, 0], [0.3, 2.3, 0], 1.08, 0x8d9195, { n: full ? 24 : 12 });   // the root's flange
    const S = [[0.3, 2.3, 1.0, 1.0], [-1.8, 2.3, 1.0, 1.0], [-3.6, 2.28, 0.86, 1.18], [-5.8, 2.25, 0.62, 1.42], [-8.5, 2.2, 0.5, 1.36], [-12, 2.15, 0.39, 1.1],
      [-16, 2.12, 0.3, 0.84], [-20, 2.12, 0.22, 0.58], [-23.5, 2.16, 0.14, 0.34], [-25.8, 2.22, 0.07, 0.15], [-26.9, 2.25, 0.02, 0.03]];
    loftX(B, S.slice(0, 9), n, WH); loftX(B, S.slice(8), n, 0xd8261c);   // (white, its tip red)
    if (full) for (const x of [-1.0, -13.4]) B.hoop(x, x > -2 ? 2.3 : 2.15, x > -2 ? 1.0 : 0.39, x > -2 ? 1.0 : 1.08, 0.12, 0.03, 0xe8731c, { n: 20 });   // the straps
    if (!sh) { B.box(-26.6, 2.3, 0, 0.04, 0.5, 0.5, 0xd8261c); if (full) B.box(-26.6, 2.3, 0, 0.05, 0.16, 0.5, 0xf4f4f0); }   // the marker board at its tip
    landing(B, -1.6, lo);
    wheels3(B, [-12.2, -13.4, -14.6], lo, 0xa9adb1);
    for (const sd of [-1, 1]) B.box(-13.4, 1.06, sd * 1.04, 3.6, 0.04, 0.42, BLK);
    B.box(-15.12, 0.9, 0, 0.08, 0.3, 2.4, BLK);
    if (!sh) for (const sd of [-1, 1]) B.lamp(-15.17, 0.9, sd * 1.0, 0.14, 0.26);
  }
  add('cisterna', {
    id: 'vetrnica', name: 'KRILO VETRNICE', ord: 7, price: 95000, field: ['vetrnica'], fieldN: 3,
    desc: 'TITAN s krilom vetrnice: 27 metrov krila daleč čez zadnje osi; v ovinku pometa čez rob.',
    look: find('titan').look,
    trailer: { mass: 16000, len: 16, wid: 2.5, ht: 3.4, f: 0.9, ax: [-12.2, -13.4, -14.6], kp: [-1.8, 0.98], rw: 0.5, mu: 1.5, brk: 7.5, look: { build: buildKrilo } },
  });

  // ======================= d1 · HRAST: KAMEN's bonneted tractor in the player's paint, a stake trailer with two stacks of logs =======================
  function kamenSkin(K) {   // the road train's tractor (js/cars/zrcalni.js) painted the player's way, without its roof rack
    const Q = Object.create(K);
    Q.rgb = (h) => h === 0x0c0d0f ? K.paint : K.rgb(h);
    Q.box = function (cx, cy) { if (cy >= 2.95 && cx > -0.45 && cx < 0.8) return; return K.box.apply(null, arguments); };
    Q.bar = function (a, b) { if (a[1] >= 3.0 && b[1] >= 3.0 && Math.max(a[0], b[0]) < 0.8) return; return K.bar.apply(null, arguments); };
    Q.tyre = function (x, y) { if (y > 2.5) return; return K.tyre.apply(null, arguments); };
    return Q;
  }
  function buildHrast(B) {
    const lo = B.lo || 0, full = !lo, sh = lo === 2, DK = 0x1d1e20, STK = 0x2b2c2e, BLK = 0x131313, rnd = lcg(91109);
    const BARK = [0x5b4331, 0x4e3a2b, 0x67503a, 0x56402f], END = [0xd9b27a, 0xcfa56b, 0xe2bf8a, 0xc99d62];
    for (const sd of [-1, 1]) B.box(-5.6, 1.33, sd * 0.5, 12.6, 0.24, 0.16, DK);
    B.box(-0.2, 1.3, 0, 2.0, 0.08, 1.9, DK);
    if (!sh) {   // the headboard behind the cab: posts and bars
      for (const sd of [-1, 1]) B.box(0.55, 2.45, sd * 1.15, 0.12, 2.1, 0.12, STK);
      for (const y of [1.7, 2.3, 2.9, 3.42]) B.box(0.55, y, 0, 0.08, 0.08, 2.3, STK);
      if (full) for (const z of [-0.7, -0.35, 0, 0.35, 0.7]) B.box(0.55, 2.55, z, 0.05, 1.8, 0.05, STK);
    }
    for (const x of [-1.3, -5.5, -7.3, -11.5]) { B.box(x, 1.53, 0, 0.22, 0.16, 2.5, STK); if (!sh) for (const sd of [-1, 1]) B.box(x, 2.47, sd * 1.2, 0.14, 1.76, 0.12, STK); }
    for (const [xa, xb] of [[-0.7, -6.1], [-6.7, -12.4]]) {
      if (sh) { B.box((xa + xb) / 2, 2.45, 0, xa - xb, 1.7, 2.3, 0x3a2a1c); continue; }
      const rows = [[5, 0], [4, 0.41], [3, 0.82], [2, 1.23]];
      let i = 0;
      for (const [m, dy] of rows) for (let j = 0; j < m; j++) {
        const z = (j - (m - 1) / 2) * 0.48, r = 0.21 + 0.05 * rnd(), y = 1.61 + 0.25 + dy, j0 = (rnd() - 0.5) * 0.24, j1 = (rnd() - 0.5) * 0.24;
        B.cyl([xa + j0, y, z], [xb + j1, y, z], r, BARK[i % 4], { n: full ? 10 : 6, r2: r * 0.9, capK: END[(i * 7) % 4] }); i++;
      }
    }
    if (full) for (const x of [-2.4, -4.4, -8.4, -10.4]) for (const sd of [-1, 1]) B.box(x, 2.47, sd * 1.24, 0.04, 1.75, 0.03, 0x7c7e81);   // the chains down the sides
    landing(B, -2.4, lo);
    wheels3(B, [-8.6, -9.8, -11.0], lo, 0xa9adb1);
    for (const sd of [-1, 1]) B.box(-9.8, 1.12, sd * 1.04, 3.8, 0.05, 0.42, BLK);
    B.box(-12.02, 0.6, 0, 0.1, 0.16, 2.3, 0xc9ccd0);
    if (!sh) for (const sd of [-1, 1]) B.lamp(-12.08, 0.6, sd * 0.98, 0.14, 0.26);
  }
  { const zr = find('zrcalni');
    if (zr) add('zrcalni', {
      id: 'hrast', name: 'HRAST', ord: 8, price: 88000, field: ['hrast'], fieldN: 4,
      desc: 'KAMEN z gozdarsko prikolico: dva kupa hlodov, štirje pari kolov, en zgib.',
      look: { body: zr.look.body, wheels: zr.look.wheels, regions: 'none', build(K) { zr.look.build(kamenSkin(K)); } },
      trailer: { mass: 14000, len: 13.0, wid: 2.5, ht: 3.45, f: 0.9, ax: [-8.6, -9.8, -11.0], kp: [-2.0, 1.28], rw: 0.5, mu: 1.5, brk: 7.5, look: { build: buildHrast } },
    }, ['expect']); }

  // ======================= the rigid ones: a cab-over cab (the TITAN's shape, moved forward) =======================
  const TSECS = [[0.66, 1.06, 1.16, 1.96, 0.99, 2.55, 0.05, 'r', 0.06], [0.684, 1.15, 1.16, 1.96, 1.08, 2.59, 0.055, 'r', 0.06], [0.75, 1.216, 1.16, 1.96, 1.146, 2.612, 0.06, 'r', 0.06],
    [0.84, 1.24, 1.16, 1.96, 1.17, 2.62, 0.06, 'r', 0.06], [2.44, 1.24, 1.16, 1.97, 1.17, 2.63, 0.06, 'r', 0.06], [2.505, 1.24, 1.16, 1.97, 1.17, 2.616, 0.06, 'r', 0.06],
    [2.559, 1.24, 1.16, 1.97, 1.17, 2.577, 0.058, 'r', 0.06], [2.591, 1.238, 1.16, 1.97, 1.168, 2.523, 0.055, 'gf', 0.06], [2.68, 1.208, 1.16, 1.96, 1.138, 2.296, 0.045, 'gf', 0.06],
    [2.768, 1.12, 1.16, 1.955, 1.05, 2.072, 0.03, 'gf', 0.06], [2.8, 1.0, 1.16, 1.95, 0.93, 1.99, 0.02, 'b', 0.06]];
  const cabSecs = (dx) => TSECS.map(r => [r[0] + dx, ...r.slice(1)]);
  function cabOver(K, dx, stepX) {   // the cab (main loft), its grille, bumper, lamps, steps, mirrors; dx: the TITAN's cab moved forward
    const P = K.paint, B = K.black, D = [0.16, 0.16, 0.17], CH = K.chrome, G = K.GLASS, X = (x) => x + dx;
    const C = K.loft(K.body.secs, (k, e, kind, at) => { if (at.end) return P; if (e === 0 || e === 8) return D; if (kind === 'gf') return e >= 3 && e <= 5 ? G : P; if (e === 2 || e === 6) return at.x > X(1.56) && at.x < X(2.49) ? G : P; return P; },
      { caps: { front: { col: P, low: 'body', high: 'body' }, rear: { col: P, low: 'body', high: 'body' } }, arches: false });
    C.decal.band([[X(1.55), 0], [X(2.5), 0], [X(2.5), 0.06], [X(1.55), 0.06]], B, null, 0.008);
    C.decal.side([[X(2.78), 1.23], [X(2.78), 1.36], [X(0.68), 1.78], [X(0.68), 1.56]], K.strp, null, 0.008);
    K.grille(X(2.803), 1.58, 0, 1.86, 0.62, { slats: 5, slatCol: [0.55, 0.56, 0.6], frame: CH, frameH: 0.03 });
    K.rect(X(0.655), 2.2, 0, 1.3, 0.32, G, { dir: '-x' });
    K.box(X(2.55), 0.42, 0, 0.5, 0.74, 2.42, 0, D);                       // the low front module ahead of the wheels
    K.box(X(2.86), 0.36, 0, 0.18, 0.62, 2.46, 0, K.strp);                 // the bumper
    for (const sd of [-1, 1]) K.box(K.fx, 1.12, sd * 1.05, 1.3, 0.05, 0.46, 0, B);   // the front mudguards
    for (const sd of [-1, 1]) {
      for (const z of [0.94, 0.6]) K.headLamp(X(2.955), 0.82, sd * z, 0.07, { shape: 'rect', w: 0.3, h: 0.15, ring: B });
      if (stepX != null) for (const yy of [0.58, 0.86]) K.box(stepX, yy, sd * 1.18, 0.26, 0.04, 0.12, 0, [0.42, 0.43, 0.45]);
      K.box(X(2.35), 2.0, sd * 1.36, 0.06, 0.42, 0.2, 0, B); K.box(X(2.45), 2.32, sd * 1.25, 0.04, 0.04, 0.28, 0, D);   // the mirror on its arm
    }
  }
  function axleTyres(K, x, o) { for (const sd of [-1, 1]) K.tyre(x, K.M.rw, sd * K.hw, Object.assign({ axis: 'z', face: sd, hi: true }, o || {})); }
  function rigid(o) {   // a rigid vehicle on the TITAN's def (its engine, its sound), the parts none (no doors or bumpers that come off)
    const t = find('titan'); if (!t) return;
    const d = Object.assign({}, t, o);
    d.phys = Object.assign({}, t.phys, o.phys);
    delete d.mounts; delete d.partNames; delete d.expect;
    VEHICLE_DEFS.push(d);
  }

  // ======================= a2 · JAK CISTERNA: a rigid 6x4 tanker, short and nimble, no fold =======================
  rigid({
    id: 'jak', name: 'JAK CISTERNA', ord: 9, price: 70000, field: ['jak'], fieldN: 5, drive: 'FR',
    desc: 'Toga cisterna 6x4: brez zgiba, kratka in okretna za ozke serpentine.',
    phys: { mass: 15000, a: 3.4, b: 2.05, len: 9.6, kI: 2.4, vLim: 130 },
    parts: { set: 'none', ht: 3.2, y0: 0.6 },
    look: {
      body: { len: 9.6, wid: 2.5, roofY: 2.69, wz: 0.2, secs: cabSecs(2.0), eye: { x: 4.12, y: 2.27, near: 0.25, tilt: 0.1, style: 'closed' }, decalX: 3.4, decalY: 2.7, decalRz: 0, decalS: 1.1 },
      wheels: { style: 'truck', w: 0.34, wR: 0.34, gap: 0.06, rim: [0.84, 0.85, 0.87], dual: true },
      regions: 'none',
      build(K) {
        const P = K.paint, AL = [0.78, 0.79, 0.8], ALD = [0.6, 0.61, 0.62], D = [0.16, 0.16, 0.17], FRM = [0.2, 0.2, 0.22];
        cabOver(K, 2.0, 2.55);
        for (const sd of [-1, 1]) K.box(-0.8, 0.82, sd * 0.5, 7.6, 0.28, 0.14, 0, FRM);                 // the chassis rails
        K.cyl([2.25, 2.12, 0], [-4.35, 2.12, 0], 0.98, AL, { n: 24, capA: null, capB: null });            // the tank, its rounded ends, its painted hoops
        K.cyl([2.25, 2.12, 0], [2.5, 2.12, 0], 0.98, AL, { n: 24, r2: 0.72, capA: null, capB: ALD });
        K.cyl([-4.35, 2.12, 0], [-4.6, 2.12, 0], 0.98, AL, { n: 24, r2: 0.72, capA: null, capB: ALD });
        for (const x of [1.6, -0.4, -2.4, -4.0]) K.cyl([x + 0.08, 2.12, 0], [x - 0.08, 2.12, 0], 1.02, P, { n: 24 });
        K.box(-1.05, 3.08, 0, 5.4, 0.04, 0.5, 0, [0.3, 0.31, 0.33]);                                      // the walkway on top, its folded rail
        for (const sd of [-1, 1]) K.box(-1.05, 3.12, sd * 0.32, 5.2, 0.05, 0.04, 0, [0.85, 0.2, 0.15]);
        for (const x of [1.0, -1.0, -3.0]) K.cyl([x, 3.04, 0], [x, 3.18, 0], 0.26, ALD, { n: 10 });     // the manholes
        K.box(-4.72, 0.5, 0, 0.2, 0.8, 2.3, 0, [0.85, 0.86, 0.87]);                                       // the rear cabinet (hose and meter)
        for (const sd of [-1, 1]) { K.box(-4.6, 0.62, sd * 0.85, 0.12, 2.3, 0.1, 0, D); K.tailLamp(-4.83, 0.68, sd * 0.95, 0.24, 0.14); }   // the ladder's rails, the lamps
        for (let y = 0.9; y < 2.9; y += 0.32) K.box(-4.62, y, 0.85, 0.06, 0.04, 0.0001 + 0.1, 0, D);
        for (const sd of [-1, 1]) for (const y of [0.5, 0.72]) K.box(-0.2, y, sd * 1.18, 2.6, 0.08, 0.05, 0, [0.7, 0.71, 0.72]);   // the side guards
        K.box(-4.8, 0.32, 0, 0.12, 0.16, 2.4, 0, D);                                                      // the rear bumper
        axleTyres(K, -3.4, { style: 'truck', w: 0.34 });
        for (const sd of [-1, 1]) K.box(-2.72, 1.0, sd * 1.04, 2.6, 0.05, 0.46, 0, K.black);              // the mudguards over the tandem
      },
    },
  });

  // ======================= d2 · LOS 6x6: a rigid logging truck with its crane, three axles, short logs =======================
  rigid({
    id: 'los', name: 'LOS 6x6', ord: 12, price: 72000, field: ['los'], fieldN: 5, drive: 'AWD',
    desc: 'Gozdarski 6x6 z dvigalom za kabino: kratki hlodi, brez zgiba, za makadam.',
    phys: { mass: 16000, a: 3.0, b: 2.3, len: 9.4, kI: 2.4, vLim: 120, loose: 1.3, looseDrag: 0.4 },
    parts: { set: 'none', ht: 3.3, y0: 0.6 },
    look: {
      body: { len: 9.4, wid: 2.5, roofY: 2.69, wz: 0.24, secs: cabSecs(1.9), eye: { x: 4.02, y: 2.27, near: 0.25, tilt: 0.1, style: 'closed' }, decalX: 3.3, decalY: 2.7, decalRz: 0, decalS: 1.1 },
      wheels: { style: 'knob', w: 0.42, rimK: 0.48, rim: [0.8, 0.8, 0.78], gap: 0.1 },
      regions: 'none',
      build(K) {
        const D = [0.16, 0.16, 0.17], FRM = [0.2, 0.2, 0.22], CR = K.rgb(0xd9a51c), STK = [0.17, 0.17, 0.18], rnd = lcg(91112);
        const BARK = [K.rgb(0x5b4331), K.rgb(0x4e3a2b), K.rgb(0x67503a)], END = [K.rgb(0xd9b27a), K.rgb(0xcfa56b), K.rgb(0xe2bf8a)];
        cabOver(K, 1.9, null);
        for (const sd of [-1, 1]) K.box(-1.0, 0.92, sd * 0.5, 7.4, 0.3, 0.16, 0, FRM);
        K.box(2.0, 1.22, 0, 0.6, 0.24, 2.4, 0, CR);                                                       // the crane's base, its legs
        for (const sd of [-1, 1]) K.box(2.0, 0.3, sd * 1.15, 0.22, 0.95, 0.2, 0, CR);
        K.cyl([2.0, 1.46, 0], [2.0, 2.85, 0], 0.22, CR, { n: 10 });                                       // the column, the boom folded back over the logs
        K.box(0.4, 2.85, 0, 3.4, 0.22, 0.26, 0, CR); K.box(-1.4, 2.88, 0.32, 3.0, 0.16, 0.2, 0, CR);
        K.box(-2.9, 2.1, 0.32, 0.18, 0.8, 0.18, 0, D);                                                    // the grapple hanging at its end
        K.cyl([1.6, 2.5, 0.2], [0.0, 2.95, 0.2], 0.07, [0.75, 0.76, 0.78], { n: 6 });                    // a ram
        for (const x of [0.9, -3.9]) { K.box(x, 1.24, 0, 0.22, 0.16, 2.5, 0, STK); for (const sd of [-1, 1]) K.box(x, 1.4, sd * 1.2, 0.14, 1.66, 0.12, 0, STK); }
        const rows = [[4, 0], [3, 0.41], [2, 0.82], [1, 1.23]];
        let i = 0;
        for (const [m, dy] of rows) for (let j = 0; j < m; j++) {
          const z = (j - (m - 1) / 2) * 0.5, r = 0.21 + 0.05 * rnd(), y = 1.4 + 0.25 + dy;
          K.cyl([1.25 + (rnd() - 0.5) * 0.2, y, z], [-4.55 + (rnd() - 0.5) * 0.3, y, z], r, BARK[i % 3], { n: 10, r2: r * 0.9, capA: END[i % 3], capB: END[(i + 1) % 3] }); i++;
        }
        axleTyres(K, -3.62, { style: 'knob', w: 0.42 });
        for (const sd of [-1, 1]) K.box(-2.96, 1.2, sd * 1.05, 2.7, 0.05, 0.5, 0, K.black);
        K.box(-4.66, 0.5, 0, 0.12, 0.16, 2.3, 0, D);
        for (const sd of [-1, 1]) K.tailLamp(-4.73, 0.62, sd * 0.95, 0.24, 0.14);
      },
    },
  });

  // ======================= c1 · SVIZEC: an old bonneted mountain bus, two-tone, glass along its roof's edges =======================
  rigid({
    id: 'svizec', name: 'SVIZEC', ord: 10, price: 60000, field: ['svizec'], fieldN: 5, drive: 'FR',
    desc: 'Star gorski avtobus s smrčkom: dvobarven, s stekli ob robu strehe; mehko vzmeten.',
    phys: { mass: 9000, a: 3.4, b: 2.6, len: 10.4, kI: 2.2, vLim: 110 },
    parts: { set: 'none', ht: 3.1, y0: 0.6 },
    look: {
      body: { len: 10.4, wid: 2.5, roofY: 3.05,
        secs: [[-5.2, 1.12, 0.62, 1.55, 0.98, 2.78, 0.1, 'r', 0.2], [-5.02, 1.24, 0.55, 1.55, 1.1, 2.92, 0.13, 'r', 0.2], [-4.6, 1.25, 0.55, 1.55, 1.1, 2.92, 0.13, 'r', 0.2],
          [1.9, 1.25, 0.55, 1.55, 1.1, 2.92, 0.13, 'r', 0.2], [2.3, 1.25, 0.55, 1.55, 1.1, 2.92, 0.13, 'gf', 0.2],
          [2.66, 1.22, 0.55, 1.55, 1.07, 2.56, 0.08, 'b', 0.2], [2.76, 1.02, 0.55, 1.4, 0.88, 1.62, 0.1, 'b', 0.2], [4.9, 0.95, 0.55, 1.32, 0.8, 1.5, 0.12, 'b', 0.2],
          [5.2, 0.86, 0.6, 1.2, 0.7, 1.36, 0.08, 'b', 0.22]],
        eye: { x: 2.0, y: 2.3, near: 0.25, tilt: 0.08, style: 'closed' }, decalX: -1.5, decalY: 3.06, decalRz: 0, decalS: 1.2 },
      wheels: { style: 'truck', w: 0.3, wR: 0.3, gap: 0.08, rim: [0.92, 0.9, 0.8], dual: true },
      regions: 'none',
      build(K) {
        const P = K.paint, CRM = [0.93, 0.89, 0.78], G = K.GLASS, CH = K.chrome, D = [0.16, 0.16, 0.17];
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return kind === 'b' && at.x > 0 ? P : CRM;
          if (e === 0 || e === 8) return D;
          if (kind === 'r') return e === 1 || e === 7 ? P : e === 4 ? CRM : (e === 3 || e === 5) ? (at.x > -4.6 && at.x < 1.9 ? G : CRM) : G;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          return P;
        }, { caps: { front: { col: P, low: 'body', high: 'body' }, rear: { col: CRM, low: 'body', high: 'body' } } });
        for (let x = -4.7; x < 2.0; x += 1.1) L.decal.band([[x - 0.07, 0], [x + 0.07, 0], [x + 0.07, 1], [x - 0.07, 1]], CRM, null, 0.008);   // the window pillars
        L.decal.band([[-5.02, 0], [-4.75, 0], [-4.75, 1], [-5.02, 1]], CRM, null, 0.008); L.decal.band([[1.95, 0], [2.3, 0], [2.3, 1], [1.95, 1]], CRM, null, 0.008);
        L.decal.side([[-5.0, 1.5], [2.7, 1.5], [2.7, 1.535], [-5.0, 1.535]], CH, null, 0.008);                   // the chrome belt, a cream flash along the side
        L.decal.side([[-4.9, 0.92], [1.2, 1.18], [1.2, 1.3], [-4.9, 1.04]], CRM, null, 0.008);
        K.rect(1.65, 1.42, 1.257, 0.82, 1.65, G, { dir: 'z' }); K.rect(1.65, 1.42, 1.258, 0.04, 1.65, CRM, { dir: 'z' });   // the door (right), its split
        K.rect(-5.205, 2.2, 0, 1.6, 0.55, G, { dir: '-x' });                                                      // the rear window
        K.grille(5.21, 0.98, 0, 0.8, 0.46, { slats: 7, slatCol: CH, frame: CH, frameH: 0.03 });
        for (const sd of [-1, 1]) {
          K.cyl([4.4, 0.85, sd * 1.0], [5.05, 0.85, sd * 1.0], 0.2, P, { n: 10, r2: 0.15, capB: P });            // the wings' noses, the round lamps in them
          K.headLamp(5.06, 0.95, sd * 1.0, 0.11, { ring: CH });
          K.tailLamp(-5.21, 1.0, sd * 1.0, 0.14, 0.2);
          K.box(2.85, 2.05, sd * 1.4, 0.05, 0.3, 0.16, 0, D); K.box(2.85, 2.2, sd * 1.3, 0.03, 0.03, 0.2, 0, CH);  // the mirrors
        }
        K.box(5.25, 0.38, 0, 0.12, 0.14, 2.2, 0, CH); K.box(-5.27, 0.42, 0, 0.12, 0.14, 2.3, 0, CH);           // the chrome bumpers
        K.box(2.28, 2.88, 0, 0.1, 0.2, 1.4, 0, D); K.rect(2.335, 2.98, 0, 1.3, 0.14, [0.95, 0.94, 0.86], { dir: 'x' });   // the route board (blank)
      },
    },
  });

  // ======================= c2 · LASTOVKA: a modern touring coach, 12 m, black glass, three axles =======================
  rigid({
    id: 'lastovka', name: 'LASTOVKA', ord: 11, price: 78000, field: ['lastovka'], fieldN: 4, drive: 'FR',
    desc: 'Sodoben turistični avtobus, dvanajst metrov: miren, težek, velika vetrobranska stekla.',
    phys: { mass: 14000, a: 3.4, b: 3.2, len: 12.0, kI: 2.4, vLim: 120 },
    parts: { set: 'none', ht: 3.6, y0: 0.6 },
    look: {
      body: { len: 12.0, wid: 2.55, roofY: 3.52,
        secs: [[-6.0, 1.2, 0.45, 1.6, 1.12, 3.2, 0.1, 'b', 0.25], [-5.85, 1.27, 0.4, 1.6, 1.2, 3.38, 0.14, 'r', 0.25], [5.3, 1.27, 0.4, 1.6, 1.2, 3.38, 0.14, 'gf', 0.25],
          [5.75, 1.25, 0.4, 1.4, 1.15, 3.1, 0.1, 'gf', 0.25], [6.0, 1.2, 0.45, 1.0, 1.08, 2.2, 0.06, 'b', 0.25]],
        eye: { x: 5.2, y: 2.3, near: 0.25, tilt: 0.08, style: 'closed' }, decalX: -2.0, decalY: 3.53, decalRz: 0, decalS: 1.2 },
      wheels: { style: 'truck', w: 0.32, wR: 0.32, gap: 0.08, rim: [0.8, 0.81, 0.83], dual: true },
      regions: 'none',
      build(K) {
        const P = K.paint, WH = [0.93, 0.93, 0.92], G = [0.05, 0.06, 0.08], D = [0.16, 0.16, 0.17], SV = [0.75, 0.76, 0.78];
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return D;
          if (kind === 'r') return e === 1 || e === 7 ? P : e === 2 || e === 6 ? G : WH;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          return P;
        }, { caps: { front: { col: P, low: 'body', high: 'body' }, rear: { col: P, low: 'body', high: 'body' } }, arches: [{ x: K.fx }, { x: K.rx }, { x: -4.55 }] });
        L.decal.side([[-5.8, 1.5], [5.6, 1.5], [5.6, 1.56], [-5.8, 1.56]], SV, null, 0.008);                     // the silver line under the glass
        L.decal.side([[-5.8, 0.72], [-1.0, 0.72], [1.6, 1.38], [-5.8, 1.38]], WH, null, 0.008);                  // a white swoosh along the side
        for (const sd of [-1, 1]) for (const x of [-2.4, -0.9, 0.6, 2.1]) K.rect(x, 0.95, sd * 1.282, 0.02, 0.8, D, { dir: sd < 0 ? '-z' : 'z' });   // the luggage bays' seams
        K.rect(4.75, 1.5, 1.283, 0.9, 2.3, G, { dir: 'z' });                                                       // the front door (right)
        K.rect(-6.005, 2.6, 0, 1.9, 0.6, G, { dir: '-x' }); K.rect(-6.005, 1.0, 0, 1.6, 0.55, D, { dir: '-x' });  // the rear window, the engine's grille
        for (const sd of [-1, 1]) {
          K.tailLamp(-6.01, 1.3, sd * 1.05, 0.14, 0.7);
          K.headLamp(6.0, 0.9, sd * 0.88, 0.08, { shape: 'rect', w: 0.38, h: 0.14, ring: D });
          K.bar([5.85, 3.2, sd * 1.15], [6.35, 2.95, sd * 1.25], 0.03, D, { n: 4 }); K.box(6.35, 2.35, sd * 1.25, 0.08, 0.45, 0.2, 0, D);   // the mirrors on their arms
        }
        K.rect(6.005, 0.62, 0, 1.4, 0.2, D, { dir: 'x' });                                                         // the front grille
        K.rect(5.5, 3.25, 0, 1.6, 0.18, [0.02, 0.02, 0.02], { dir: 'x' });                                         // the route display (dark)
        K.box(-1.2, 3.45, 0, 2.8, 0.18, 1.7, 0, WH);                                                               // the air conditioning's fairing
        axleTyres(K, -4.55, { style: 'truck', w: 0.32 });
      },
    },
  });

  // ======================= izboljšava 1 · zadek TITAN CISTERNE za kamero za avtom: brez police z gumami in kanistri; svetlobni pas,
  // oranžna tabla, tabli za dolgo vozilo, rdeče-bela stebrička ob dnu cisterne, rdeč odsevni obroč na zadnjem dnu, rumen odsevni trak ob boku =======================
  const cis = find('cisterna');
  if (cis) {
    const base = cis.trailer.look.build;
    const rear = function (B) {
      const lo = B.lo || 0, full = !lo, sh = lo === 2;
      const P = Object.create(B);
      P.box = function (x, y, z, lx, ly, lz, k, o, lamp) {
        if (x > -11.32 && x < -10.6 && !(lx === 0.02 && ly === 0.8) && y > 0.55) return;   // (the rack: its floor, posts, shelf, cans, straps)
        return B.box(x, y, z, lx, ly, lz, k, o, lamp);
      };
      P.cyl = function (a, b, r, k, o) { if (a[0] < -10.95 && a[0] > -11.3 && Math.abs(a[1] - 0.905) < 0.01) return; return B.cyl(a, b, r, k, o); };   // (its spare tyres)
      base(P);
      if (sh) return;
      const BLK = 0x141414, RED = 0xc81e1e, WHT = 0xf2f2ee, YEL = 0xf2c21a, ORA = 0xe8731c, AMB = 0xe08a1c;
      // the light bar on its two brackets: three red lamps a side (lit with the brakes), amber indicators, white reversing lamps
      B.box(-11.27, 0.86, 0, 0.08, 0.28, 2.44, BLK);
      for (const sd of [-1, 1]) {
        B.box(-11.2, 1.0, sd * 0.62, 0.14, 0.3, 0.07, 0x1c1c1e);
        for (const z of [1.0, 0.84]) B.lamp(-11.315, 0.86, sd * z, 0.16, 0.13);
        B.box(-11.315, 0.86, sd * 0.68, 0.01, 0.14, 0.13, AMB);
        if (full) B.box(-11.315, 0.86, sd * 0.52, 0.01, 0.12, 0.11, 0xdcdcd8);
        // the long-vehicle boards (yellow, a red rim), one a side over the light bar
        B.box(-11.31, 1.17, sd * 0.66, 0.02, 0.2, 0.62, YEL);
        if (full) { B.box(-11.32, 1.27, sd * 0.66, 0.01, 0.03, 0.62, RED); B.box(-11.32, 1.07, sd * 0.66, 0.01, 0.03, 0.62, RED); B.box(-11.32, 1.17, sd * 0.955, 0.01, 0.2, 0.03, RED); B.box(-11.32, 1.17, sd * 0.365, 0.01, 0.2, 0.03, RED); }
        // the red-white marker posts at the tank's lower corners
        for (let j = 0; j < 6; j++) B.box(-10.66, 1.08 + j * 0.2, sd * 1.12, 0.05, 0.2, 0.1, j % 2 ? WHT : RED);
        // the yellow contour tape along the tank's side (at its widest), in pieces
        if (full) for (let x = -0.9; x > -10.0; x -= 0.75) B.box(x, TKY, sd * 1.123, 0.42, 0.06, 0.008, YEL);
      }
      // the orange plate in the middle, its black rim
      B.box(-11.32, 1.17, 0, 0.02, 0.26, 0.36, ORA);
      if (full) { B.box(-11.33, 1.17, 0, 0.01, 0.02, 0.36, BLK); B.box(-11.33, 1.3, 0, 0.01, 0.02, 0.36, BLK); B.box(-11.33, 1.04, 0, 0.01, 0.02, 0.36, BLK); }
      // the red reflective ring round the tank's rear end
      B.hoop(-10.12, TKY, 1.0, 1.12, 0.1, 0.03, RED, { n: full ? 28 : 14 });
    };
    const TKY = 2.2;
    add('cisterna', { id: 'cisternarep', name: 'CISTERNA ZADEK', ord: 13, field: ['cisternarep'], fieldN: 3, trailer: Object.assign({}, cis.trailer, { look: { build: rear } }) });
  }
})();
