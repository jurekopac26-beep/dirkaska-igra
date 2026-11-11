/* Vehicle 'cisterna' — TITAN CISTERNA: the TITAN racing tractor with a tank semi-trailer on its fifth wheel (docs/titan-cisterna.md).
   The tractor is the TITAN as it is (its look drawn by K.lookOf('titan'), only a little rust at its lower edges and steps); the trailer is a
   body of its own on the kingpin (model.trailer, Core: tlStep): it folds in a bend, pushes on the brakes, jackknifes, knocks the walls and
   the cars and falls over a drop's edge, on its own too. Its look (trailer.look, built by the renderer's trailer builder: js/render.js,
   tlBuild): a sun-faded tank, heavy rust, six grey riveted plates welded on, its hoops and manhole covers, the railing on top, the walkway
   along its side with its rusty railing (two tubes gone), the ladder up to it (a rung gone), the spare tyres on its rear rack
   strapped down, a yellow bumper. Tractor L 5.90 W 2.50 H 3.00; the trailer L 12.40 W 2.50 H 3.56, its kingpin 0.90 behind its front,
   three axles 7.5, 8.8 and 10.1 m behind the kingpin (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const titan = () => { const d = VEHICLE_DEFS.find(q => q && q.id === 'titan'); return d && d.look; };   // (the TITAN's look, read when drawn)

  // ---- the tank: its size (m: x from the kingpin, its middle yc above the ground, half its height ry, half its width rz), its hoops and covers ----
  const TK = { x0: -10.2, x1: 0.55, yc: 2.2, ry: 1.0, rz: 1.12, dome: 0.32 };
  const HOOPS = [-0.75, -2.65, -4.55, -6.45, -8.35, -9.95], COVERS = [-1.7, -4.2, -6.7, -9.1];
  const RACK = [-0.87, -0.29, 0.29, 0.87];   // (the rear rack's four spare tyres across (z): the look's, the parts tlSpare1..4)
  // its picture (1024 x 512 px): the skin (x0 to x1 along; around from the bottom up the +z side, over the top, down the -z side), the domed
  // ends (as seen from outside), the walkway's grating (x along, z down), the bumper's label
  const PIC = { skin: [0, 0, 1024, 380], end: [0, 384, 128, 512], grate: [128, 384, 1016, 448], label: [128, 448, 672, 512] };
  const lcg = (s) => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;   // (its own numbers: the same picture every time)

  function paint(g) {
    const rnd = lcg(20261104), r = (a, b) => a + (b - a) * rnd(), pick = (A) => A[Math.floor(rnd() * A.length) % A.length], TAU = Math.PI * 2;
    const [S0, S1, S2, S3] = PIC.skin, SW = S2 - S0, SH = S3 - S1, LEN = TK.x1 - TK.x0;
    const PER = Math.PI * (3 * (TK.ry + TK.rz) - Math.sqrt((3 * TK.ry + TK.rz) * (TK.ry + 3 * TK.rz)));   // (round it, m)
    const mx = SW / LEN, my = SH / PER, k = my / mx, PX = (x) => S0 + (x - TK.x0) * mx, PY = (f) => S1 + f / TAU * SH, MID = S1 + SH / 2;
    const dn = (y) => y < MID ? -1 : 1;   // (down the tank, on the picture: toward its bottom on either side)
    const RUST = [[139, 74, 34], [154, 85, 40], [122, 60, 28], [176, 104, 47], [106, 52, 24], [166, 93, 42], [94, 46, 21]];
    const css = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')';
    const ell = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), 0, 0, TAU); g.fill(); };
    const blot = (x, y, s, a, kk) => { const q = kk || k, n = 3 + Math.floor(rnd() * 7);   // (a patch of rust: a few round spots, round on the tank)
      for (let j = 0; j < n; j++) { g.globalAlpha = a * r(0.5, 1); g.fillStyle = css(pick(RUST)); const rr = s * r(0.3, 1); ell(x + r(-s, s) * 1.1, y + r(-s, s) * q * 1.1, rr, rr * q * r(0.8, 1.3)); } };
    const streak = (x, y, len, w, c, a, d) => { const y2 = y + (d || dn(y)) * len, lg = g.createLinearGradient(0, y, 0, y2);   // (rust run down from where it was)
      lg.addColorStop(0, css(c, 1)); lg.addColorStop(0.6, css(c, 0.5)); lg.addColorStop(1, css(c, 0)); g.globalAlpha = a; g.fillStyle = lg;
      g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.lineTo(x + w * 0.15 + r(-1, 1), y2); g.lineTo(x - w * 0.15 + r(-1, 1), y2); g.closePath(); g.fill(); };
    const rivet = (x, y, d) => { g.globalAlpha = 0.85; g.fillStyle = '#4a2e1a'; ell(x, y, 1.5, 1.5 * k + 0.35); g.globalAlpha = 0.55; g.fillStyle = '#f3e3bd'; ell(x - 0.4, y - d * 0.45, 0.6, 0.45); };

    // ---- the skin: the paint (a pale orange yellow) faded by the sun on top, dirty toward the bottom ----
    g.save(); g.beginPath(); g.rect(S0, S1, SW, SH); g.clip();
    const gr = g.createLinearGradient(0, S1, 0, S3);
    [[0, '#74502c'], [0.1, '#a3753f'], [0.25, '#cc9b5c'], [0.4, '#dcb478'], [0.5, '#e7c992'], [0.6, '#dcb478'], [0.75, '#cc9b5c'], [0.9, '#a3753f'], [1, '#74502c']].forEach(([t, c]) => gr.addColorStop(t, c));
    g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(S0, S1, SW, SH);
    // the rust: a noise of its own over the skin (its spots round on the tank: k across), heavy, more of it low down and by the hoops and
    // the covers; dark and pitted where it is old, orange at its edges; the paint between chalky in places
    { const img = g.getImageData(S0, S1, SW, SH), DA = img.data, sm = (t) => t * t * (3 - 2 * t);
      const NG = (sz) => { const nx = Math.ceil(SW / sz) + 2, ny = Math.ceil(SH / (sz * k)) + 2, a = new Float32Array(nx * ny); for (let i = 0; i < a.length; i++) a[i] = rnd(); return { sz, nx, a }; };
      const val = (O, x, y) => { const fx = x / O.sz, fy = y / (O.sz * k), ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy), i0 = iy * O.nx + ix;
        const a = O.a[i0], b = O.a[i0 + 1], c = O.a[i0 + O.nx], d = O.a[i0 + O.nx + 1]; return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty; };
      const O = [NG(110), NG(48), NG(20), NG(8), NG(3.2)], WT = [0.36, 0.27, 0.19, 0.11, 0.07], OC = [NG(60), NG(14)], OF = NG(140);
      const colB = new Float32Array(SW);
      for (let x = 0; x < SW; x++) { let b = 0; for (const h of HOOPS) b = Math.max(b, Math.exp(-(((x - PX(h)) / 16) ** 2))); colB[x] = b; }
      for (let y = 0; y < SH; y++) {
        const lw = Math.abs(y + S1 - MID) / (SH / 2), by = 0.2 * lw * lw + 0.06 * lw, top = Math.max(0, 1 - lw * 4);   // (lw: 0 its top, 0.5 its side, 1 its bottom)
        for (let x = 0; x < SW; x++) {
          let n = 0; for (let o = 0; o < 5; o++) n += WT[o] * val(O[o], x, y);
          let cb = 0; if (top > 0) for (const c of COVERS) { const dx = (x - PX(c)) / 40; if (dx > -1 && dx < 1) cb = Math.max(cb, (1 - dx * dx) * top); }
          const e = n + by + colB[x] * 0.1 + cb * 0.12, p = (y * SW + x) * 4, a = e < 0.585 ? 0 : e > 0.615 ? 1 : sm((e - 0.585) / 0.03);
          if (a <= 0) { const f = val(OF, x, y); if (f > 0.62) { const l = Math.min(1, (f - 0.62) * 4) * 0.16; DA[p] += (246 - DA[p]) * l; DA[p + 1] += (236 - DA[p + 1]) * l; DA[p + 2] += (205 - DA[p + 2]) * l; } continue; }
          const t = 0.65 * val(OC[0], x, y) + 0.35 * val(OC[1], x, y), old = e < 0.62 ? 0 : Math.min(1, (e - 0.62) / 0.12);   // (its colour; old: deep in it)
          let R = 104 + 92 * t, G2 = 50 + 52 * t, B2 = 22 + 24 * t;
          const dk = 1 - 0.38 * old - (rnd() < 0.06 + 0.12 * old ? 0.3 : 0) - (a < 1 ? 0.12 * (1 - a) * a * 4 : 0);   // (darker deep in it, pitted; a dark rim at its edge)
          R *= dk; G2 *= dk; B2 *= dk;
          DA[p] += (R - DA[p]) * a; DA[p + 1] += (G2 - DA[p + 1]) * a; DA[p + 2] += (B2 - DA[p + 2]) * a;
        }
      }
      g.putImageData(img, S0, S1); }
    const sideY = (bias) => { const d = Math.pow(rnd(), bias), s = rnd() < 0.5 ? -1 : 1; return MID + s * (1 - d) * SH / 2; };   // (0 the top, 1 the bottom: low ones more often)
    for (let i = 0; i < 2600; i++) { const y = sideY(0.7); g.globalAlpha = r(0.2, 0.55); g.fillStyle = css(pick(RUST)); g.fillRect(r(S0, S2), y, r(0.7, 1.8), r(0.6, 1.3)); }   // (a fine speckle)
    // where it ran: from the hoops, from the covers on top, here and there
    for (const h of HOOPS) for (const s of [-1, 1]) for (let j = 0; j < 7; j++) streak(PX(h) + r(-7, 7), MID + s * r(0.1, 0.6) * SH / 2, r(25, 120), r(1.5, 4.5), pick(RUST), r(0.45, 0.85));
    for (const c of COVERS) for (const s of [-1, 1]) for (let j = 0; j < 5; j++) streak(PX(c) + r(-22, 22), MID + s * r(1, 8), r(40, 140), r(1.5, 4), pick(RUST), r(0.4, 0.8));
    for (let i = 0; i < 260; i++) streak(r(S0, S2), sideY(1.4), r(10, 80), r(0.7, 2.2), pick(RUST), r(0.25, 0.6));
    // its rivets: the seams along it, the rows by the hoops (a few with their own rust run)
    for (const f of [0.85, 1.95, 4.33, 5.43]) { const y = PY(f); for (let x = S0 + 4; x < S2; x += 8) { rivet(x, y, dn(y)); if (rnd() < 0.09) streak(x, y + dn(y) * 2, r(8, 26), r(1, 2), pick(RUST), 0.55); } }
    for (const h of HOOPS) for (const dx of [-9, 9]) for (let y = S1 + 3; y < S3; y += 6) rivet(PX(h) + dx, y, dn(y));
    // the six grey plates welded on (light zinc, primer, dark steel): the weld round each, its rivets, the rust run from under it
    const PATCH = [[-2.1, 1.85, 1.3, 0.8, '#b9bec2', 0.03], [-5.4, 1.35, 1.0, 0.7, '#8c9196', -0.04], [-8.2, 2.0, 1.4, 0.9, '#5c6166', 0.02],
      [-3.2, 4.5, 1.2, 0.85, '#8a8f94', -0.03], [-6.1, 4.05, 1.0, 0.6, '#5a5f64', 0.04], [-9.15, 4.7, 1.1, 0.75, '#b5babe', -0.02]];
    for (const [x, f, w, h, c, rot] of PATCH) {
      const cx = PX(x), cy = PY(f), pw = w * mx, ph = h * my, d = dn(cy);
      const edge = (t, ins) => { const W2 = pw / 2 - ins, H2 = ph / 2 - ins * k, P = 2 * (W2 + H2); t = ((t % (2 * P)) + 2 * P) % (2 * P) / 2;
        return t < W2 * 2 ? [-W2 + t, -H2] : t < W2 * 2 + H2 * 2 ? [W2, -H2 + t - W2 * 2] : t < W2 * 4 + H2 * 2 ? [W2 - (t - W2 * 2 - H2 * 2), H2] : [-W2, H2 - (t - W2 * 4 - H2 * 2)]; };
      g.save(); g.translate(cx, cy); g.rotate(rot);
      g.globalAlpha = 1; g.fillStyle = c; g.fillRect(-pw / 2, -ph / 2, pw, ph);
      for (let j = 0; j < 170; j++) { g.globalAlpha = r(0.06, 0.22); g.fillStyle = rnd() < 0.5 ? '#ffffff' : '#262626'; g.fillRect(r(-pw / 2, pw / 2), r(-ph / 2, ph / 2), r(1, 4), r(0.6, 1.6)); }
      for (let j = 0; j < 6; j++) { g.globalAlpha = 0.25; g.strokeStyle = '#e8ecef'; g.lineWidth = 0.6; g.beginPath(); const a = [r(-pw / 2, pw / 2), r(-ph / 2, ph / 2)]; g.moveTo(a[0], a[1]); g.lineTo(a[0] + r(-25, 25), a[1] + r(-6, 6)); g.stroke(); }   // (scratches)
      g.globalAlpha = 0.95; g.strokeStyle = '#3a3430'; g.lineWidth = 3.4; g.strokeRect(-pw / 2, -ph / 2, pw, ph);   // (the weld: a dark bead, its ripples)
      g.fillStyle = '#8b8174'; for (let t = 0; t < 4 * (pw + ph); t += 3) { const p = edge(t, 0); g.globalAlpha = r(0.4, 0.75); g.fillRect(p[0] - 0.8, p[1] - 0.8, 1.6, 1.6); }
      for (let t = 0; t < 4 * (pw + ph); t += 15) { const p = edge(t, 6); g.globalAlpha = 0.9; g.fillStyle = '#34312e'; ell(p[0], p[1], 1.6, 1.6 * k + 0.3); g.globalAlpha = 0.6; g.fillStyle = '#f2f4f5'; ell(p[0] - 0.4, p[1] - d * 0.4, 0.6, 0.45); }
      g.restore();
      for (let j = 0; j < 5; j++) blot(cx + r(-pw / 2, pw / 2), cy + d * (ph / 2 + 1), r(2, 5), 0.85);
      for (let j = 0; j < 7; j++) streak(cx + r(-pw / 2, pw / 2), cy + d * ph / 2, r(15, 70), r(1.5, 3.5), pick(RUST), r(0.45, 0.85));
    }
    // its labels, faded (generic: no names): FLAMMABLE near the rear, the class diamond near the front, on both sides (as read from each side)
    const label = (x, f, draw) => { const cx = PX(x), cy = PY(f); g.save(); if (dn(cy) < 0) g.setTransform(1, 0, 0, -k, cx, cy); else g.setTransform(-1, 0, 0, k, cx, cy); draw(); g.restore(); };
    for (const f of [Math.PI / 2 + 0.1, Math.PI * 1.5 - 0.1]) {
      label(-9.0, f, () => { g.globalAlpha = 0.5; g.fillStyle = '#f1e9d4'; g.fillRect(-74, -17, 148, 34); g.globalAlpha = 0.7; g.fillStyle = '#a8291e';
        g.font = 'bold 23px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FLAMMABLE', 0, 1); });
      label(-0.35, f, () => { g.rotate(Math.PI / 4); g.globalAlpha = 0.65; g.fillStyle = '#c23a2a'; g.fillRect(-17, -17, 34, 34); g.globalAlpha = 0.6; g.strokeStyle = '#f2ead8'; g.lineWidth = 2; g.strokeRect(-14, -14, 28, 28);
        g.rotate(-Math.PI / 4); g.fillStyle = '#f2ead8'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('3', 0, 14); });
    }
    for (const f of [Math.PI / 2 + 0.1, Math.PI * 1.5 - 0.1]) for (const x of [-9.0, -0.35]) for (let j = 0; j < 6; j++) blot(PX(x) + r(-60, 60), PY(f) + r(-12, 12), r(2, 6), 0.7);   // (the rust over them)
    g.restore();

    // ---- the domed ends: the same paint, rustier at the rim, runs down ----
    { const [E0, E1, E2, E3] = PIC.end, cx = (E0 + E2) / 2, cy = (E1 + E3) / 2, R = (E2 - E0) / 2;
      g.save(); g.beginPath(); g.rect(E0, E1, E2 - E0, E3 - E1); g.clip();
      const rg = g.createRadialGradient(cx, cy - 12, 4, cx, cy, R); rg.addColorStop(0, '#dcc08a'); rg.addColorStop(0.65, '#c49a5e'); rg.addColorStop(1, '#6e4c2a');
      g.globalAlpha = 1; g.fillStyle = rg; g.fillRect(E0, E1, E2 - E0, E3 - E1);
      for (let i = 0; i < 900; i++) { const a = r(0, TAU), q = R * Math.sqrt(rnd()); g.globalAlpha = r(0.3, 0.7); g.fillStyle = css(pick(RUST)); g.fillRect(cx + Math.cos(a) * q, cy + Math.sin(a) * q, r(0.7, 2), r(0.7, 1.6)); }
      for (let i = 0; i < 26; i++) { const a = r(0, TAU), q = R * (0.55 + 0.45 * Math.sqrt(rnd())); blot(cx + Math.cos(a) * q, cy + Math.sin(a) * q, r(3, 9), 0.85, 1); }
      for (let i = 0; i < 14; i++) streak(cx + r(-R * 0.8, R * 0.8), cy + r(-R * 0.7, R * 0.2), r(15, 45), r(1.5, 3.5), pick(RUST), r(0.4, 0.8), 1);
      g.globalAlpha = 0.9; g.strokeStyle = '#5a3a20'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R - 6, 0, TAU); g.stroke();   // (the seam round it)
      for (let a = 0; a < TAU; a += 0.16) rivet(cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10), 1);
      g.restore(); }

    // ---- the walkway's grating: its bars across, rusty ----
    { const [G0, G1, G2, G3] = PIC.grate;
      g.globalAlpha = 1; g.fillStyle = '#3a2213'; g.fillRect(G0, G1, G2 - G0, G3 - G1);
      g.fillStyle = '#6e4224'; for (let x = G0; x < G2; x += 7) g.fillRect(x, G1, 3, G3 - G1);
      g.fillStyle = '#231409'; for (let y = G1 + 4; y < G3; y += 13) g.fillRect(G0, y, G2 - G0, 2);
      for (let i = 0; i < 1400; i++) { g.globalAlpha = r(0.2, 0.65); g.fillStyle = pick(['#8a4a20', '#a55d27', '#2a170c', '#b8733a']); g.fillRect(r(G0, G2), r(G1, G3), r(1, 4), r(1, 3)); }
      g.globalAlpha = 1; g.fillStyle = '#7a4a26'; g.fillRect(G0, G1, G2 - G0, 3); g.fillRect(G0, G3 - 3, G2 - G0, 3); }

    // ---- the bumper's label: FLAMMABLE on yellow, dirty ----
    { const [L0, L1, L2, L3] = PIC.label, w = L2 - L0, h = L3 - L1;
      g.globalAlpha = 1; g.fillStyle = '#dbb11f'; g.fillRect(L0, L1, w, h);
      g.fillStyle = '#161616'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FLAMMABLE', L0 + w / 2, L1 + h / 2 + 2);
      g.strokeStyle = '#161616'; g.lineWidth = 3; g.strokeRect(L0 + 5, L1 + 5, w - 10, h - 10);
      for (let i = 0; i < 500; i++) { g.globalAlpha = r(0.1, 0.4); g.fillStyle = pick(['#5a4020', '#3a2a18', '#8a5a2a']); g.fillRect(r(L0, L2), r(L1 + h * 0.3, L3), r(1, 4), r(1, 3)); } }
    g.globalAlpha = 1;
  }

  // ---- the trailer's pieces (the renderer's builder B; its metres: x forward from the kingpin, y up from the ground, z across: +z the walkway's side) ----
  // B.lo: 0 the look (the player's trailer, the previews), 1 the light look (a rival's: the phone's budget; fewer sides, no small parts, the
  // hoops and the tyres' rims in their colour on the tyres' sides), 2 the shadow (drawn only into the shadow map: the tank, the frame, the
  // wheels, the rack as blocks)
  function build(B) {
    const DK = 0x1c1c1e, FRM = 0x2a2a2c, BLK = 0x131313, RUST = 0x7a3f1e, RUSTD = 0x5c3420, RAIL = 0x6b625a, TYRE = 0x1b1b1b, RIM = 0x76665a, YEL = 0xe0b21c;
    const lo = B.lo || 0, full = !lo, sh = lo === 2;
    B.tex(1024, 512, paint);
    // the frame: its rails, the kingpin's plate, the cross members, the saddles under the tank
    for (const sd of [-1, 1]) B.box(-5.3, 1.09, sd * 0.5, 12.0, 0.22, 0.14, DK);
    B.box(-0.2, 1.02, 0, 2.1, 0.08, 1.9, DK);
    if (full) for (const x of [-1.8, -3.3, -4.8, -6.3, -10.9]) B.box(x, 1.06, 0, 0.1, 0.12, 1.9, DK);
    if (!sh) for (const x of [-0.3, -5.0, -9.7]) B.box(x, 1.3, 0, 0.3, 0.2, 1.7, 0x2a2420);
    // the tank, its hoops, its manhole covers on top
    B.tank(TK.x0, TK.x1, TK.yc, TK.ry, TK.rz, { n: [32, 16, 10][lo], uv: PIC.skin, end: PIC.end, dome: TK.dome });
    if (full) for (const x of HOOPS) B.hoop(x, TK.yc, TK.ry, TK.rz, 0.12, 0.035, 0x8b5a33);
    if (!sh) for (const x of COVERS) { B.cyl([x, 3.06, 0], [x, 3.3, 0], 0.3, 0x5e4330, { n: full ? 12 : 6 }); if (full) { B.cyl([x, 3.3, 0], [x, 3.35, 0], 0.34, 0x4c3324, { n: 12 }); B.box(x + 0.36, 3.31, 0, 0.06, 0.06, 0.2, RUSTD); } }
    // the railing on top: posts both sides, a top and a middle rail
    const TP = [-1.0, -2.3, -3.6, -4.9, -6.2, -7.5, -8.8, -9.8];
    if (!sh) for (const sd of [-1, 1]) { if (full) for (const x of TP) B.box(x, 3.28, sd * 0.6, 0.04, 0.56, 0.04, RAIL); for (const y of [3.55, 3.3]) B.box(-5.4, y, sd * 0.6, 8.84, 0.04, 0.04, RAIL); }
    // the walkway along the +z side: its grating, its brackets, its rusty railing (two of its middle tubes gone), the ladder up to it (a rung gone)
    B.box(-5.35, 1.32, 0.93, 8.7, 0.04, 0.62, 0x3a2414, { face: '+y', uv: PIC.grate });
    const WP = [-1.75, -3.05, -4.35, -5.65, -6.95, -8.25, -9.6];
    if (full) { for (const x of [-1.2, -2.6, -4.0, -5.4, -6.8, -8.2, -9.55]) B.box(x, 1.26, 0.86, 0.06, 0.08, 0.76, DK); for (const x of WP) B.box(x, 1.83, 1.215, 0.04, 0.98, 0.04, RUST); }
    if (!sh) B.box((WP[0] + WP[6]) / 2, 2.33, 1.215, WP[0] - WP[6] + 0.04, 0.04, 0.04, RUST);
    if (full) {
      for (let i = 0; i < WP.length - 1; i++) if (i !== 1 && i !== 4) B.box((WP[i] + WP[i + 1]) / 2, 1.83, 1.215, WP[i] - WP[i + 1], 0.035, 0.035, RUST);
      for (const x of [-1.05, -1.45]) B.box(x, 1.09, 1.235, 0.04, 1.62, 0.04, RUST);
      [0.46, 0.73, 1.0, 1.27].forEach((y, i) => { if (i !== 2) B.box(-1.25, y, 1.235, 0.4, 0.035, 0.035, RUST); });
    }
    // the landing gear, the side guards
    if (!sh) for (const sd of [-1, 1]) { B.box(-2.1, 0.62, sd * 0.55, 0.14, 0.78, 0.14, FRM); if (full) B.box(-2.1, 0.2, sd * 0.55, 0.32, 0.05, 0.32, DK); }
    if (full) { B.box(-2.1, 0.75, 0, 0.06, 0.06, 1.1, DK); B.box(-2.1, 0.85, -0.7, 0.06, 0.06, 0.22, DK); }
    if (!sh) for (const sd of [-1, 1]) { B.box(-4.7, 0.68, sd * 1.18, 4.2, 0.1, 0.05, 0x202022); if (full) for (const x of [-3.0, -4.7, -6.4]) B.box(x, 0.85, sd * 0.86, 0.06, 0.06, 0.64, DK); }
    // the wheels on their three axles (rusty rims), the mudguards over them, the mud flaps behind
    for (const ax of [-7.5, -8.8, -10.1]) {
      if (!sh) B.box(ax, 0.5, 0, 0.12, 0.12, 1.72, DK);
      for (const sd of [-1, 1]) {
        if (full) { B.cyl([ax, 0.5, sd * 0.86], [ax, 0.5, sd * 1.22], 0.5, TYRE, { n: 14 }); B.cyl([ax, 0.5, sd * 1.22], [ax, 0.5, sd * 1.235], 0.3, RIM, { n: 12 }); B.cyl([ax, 0.5, sd * 1.235], [ax, 0.5, sd * 1.25], 0.09, RUSTD, { n: 8 }); }
        else B.cyl([ax, 0.5, sd * 0.86], [ax, 0.5, sd * 1.23], 0.5, TYRE, { n: sh ? 6 : 8, capK: RIM });
      }
    }
    for (const sd of [-1, 1]) { B.box(-8.8, 1.1, sd * 1.04, 3.9, 0.05, 0.42, BLK); if (!sh) B.box(-10.78, 0.68, sd * 1.04, 0.02, 0.8, 0.4, BLK); }
    // the rear rack: its floor, posts and the shelf on them; four spare tyres side by side under the shelf, strapped down (no cans on it:
    // the user's decision of 9. 11. 2026, docs/titan-cisterna.md). The tyres are the core's parts tlSpare1..4 (spare, tl: from half the
    // rig's damage the stack rocks on the rack, at 80 % they come off; the user's decision of 9. 11. 2026, docs/deli.md »Rezervno kolo«):
    // B.spare, each tyre its part's, the straps (and the shadow's block) go with them
    const SP = B.spare || ((f) => f());
    B.box(-11.02, 0.6, 0, 0.82, 0.05, 2.4, BLK);
    if (sh) { SP(() => B.box(-11.12, 0.905, 0, 0.24, 0.56, 2.3, TYRE), ''); B.box(-11.05, 1.245, 0, 0.75, 0.05, 2.4, BLK); }   // (the shadow: the tyres as a block, the shelf)
    else {
      for (const sd of [-1, 1]) { if (full) B.box(-10.8, 0.8, sd * 0.5, 0.08, 0.4, 0.1, DK); for (const x of [-11.4, -10.65]) B.box(x, 0.935, sd * 1.18, 0.05, 0.67, 0.05, BLK); }
      RACK.forEach((z, i) => SP(() => { B.cyl([-11.0, 0.905, z], [-11.24, 0.905, z], 0.28, TYRE, { n: full ? 12 : 8, capK: 0x262626 }); if (full) B.cyl([-11.24, 0.905, z], [-11.255, 0.905, z], 0.16, RIM, { n: 10 }); }, 'tlSpare' + (i + 1)));
      B.box(-11.05, 1.245, 0, 0.75, 0.05, 2.4, BLK);
      SP(() => { for (const sd of [-1, 1]) B.box(-11.265, 0.92, sd * 0.58, 0.012, 0.62, 0.05, YEL); B.box(-11.265, 0.905, 0, 0.012, 0.05, 2.36, YEL); }, '');
    }
    // the yellow bumper with its label, the lamps' housings at its ends, its brackets; the tail lamps
    B.box(-11.44, 0.42, 0, 0.08, 0.2, 1.7, 0xdbb11f, { face: '-x', uv: PIC.label });
    if (!sh) for (const sd of [-1, 1]) { B.box(-11.44, 0.42, sd * 1.025, 0.08, 0.2, 0.35, BLK); if (full) B.box(-11.33, 0.75, sd * 0.5, 0.06, 0.46, 0.08, DK); B.lamp(-11.485, 0.43, sd * 1.03, 0.12, 0.26); }
  }

  VEHICLE_DEFS.push({
    id: 'cisterna', name: 'TITAN CISTERNA', cat: 'tovornjaki', ord: 3, drive: 'FR',
    desc: 'TITAN s cisterno: prikolica se v ovinku lomi, pri zaviranju potiska in je težka.',
    phys: { mass: 5300, a: 1.65, b: 2.05, kI: 1.6, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.8, len: 5.9, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 150, sway: 1.4, landV: 13 },
    arc: { amax: 1.0, kv: 1.8, rmin: 9 },   // (1.3 g: what its axles hold with the kingpin's push, tlHoldSet)
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },   // (the TITAN's)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },   // (Core.statsOf: the TITAN's engine, the rig's grip)
    expect: { t100: [9.15, 10.15], vmax: [144, 152], latG: [1.17, 1.29], d100: [40.9, 45.1] },   // (the rig: tests/fleet.test.js, its envelope 'prikolica')
    price: 75000, pk: 'open', field: ['cisterna'], fieldN: 5,   // (5 of its own, no others: a long rig each, the phone's budget)
    snd: { kind: 'diesel', hz: 0.95, turbo: 0.8, loud: 1.35 },
    // (the TITAN's parts and mounts, as in js/cars/titan.js: its tractor is the TITAN's look; tests/cisterna.test.js keeps them the same)
    partNames: { grille: 'front grille', deflector: 'roof deflector', skirtL: 'left side skirt', skirtR: 'right side skirt', headL: 'left head lamps', headR: 'right head lamps',
      tailL: 'left tail lamp', tailR: 'right tail lamp', wiperFront: 'windscreen wipers',
      tlSpare1: 'spare tyre', tlSpare2: 'spare tyre', tlSpare3: 'spare tyre', tlSpare4: 'spare tyre' },
    parts: { set: 'truck', ht: 3, y0: 0.6,
      extra: {
        grille: { z: 0, th: 0.6, m: 6, rW: 0.35, h: 0.08, lx: 1, lz: 0, f: 0.35 },
        deflector: { z: 0, th: 0.6, m: 8, rW: 0.38, h: 0.13, lx: 0.62, lz: 0, f: 0.95 },
        skirtL: { z: 2, th: 0.58, m: 7, r: 0.8, h: 0.06, lx: -0.12, lz: -1, f: 0.08 },
        skirtR: { z: 3, th: 0.58, m: 7, r: 0.8, h: 0.06, lx: -0.12, lz: 1, f: 0.08 },
        // (as KAMEN's: each side's pair of head lamps a part of its own, on the bumper (they go with it); a hit on their corner knocks one
        // out. Each tail lamp with its black panel on the lamp bar likewise; the two wipers one part)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: -0.616, y: 0.82, on: 'bumperF' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: 0.616, y: 0.82, on: 'bumperF' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -0.991, lz: -0.576, y: 1.0 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -0.991, lz: 0.576, y: 1.0 },
        wiperFront: { z: 0, th: 0.65, m: 0.6, r: 0.5, h: 0.03, lx: 0.944, lz: -0.04, y: 2.04 },
        // (the trailer's: the four spare tyres on its rear rack, tl: lx / lz from its middle (x -5.3, half 6.2 m long, 1.25 m wide), y their
        // middles; spare: from half the rig's damage they rock, at 80 % they come off, docs/deli.md »Rezervno kolo«. Not the TITAN's)
        ...Object.fromEntries(RACK.map((z, i) => ['tlSpare' + (i + 1), { z: 1, th: 1, m: 10, r: 0.28, h: 0.24, lx: -0.939, lz: +(z / 1.25).toFixed(3), y: 0.905, spare: 1, tl: 1 }])),
      },
      // (where the look has them: the cab's doors and mirrors are far forward on a cab-over; a lost one flies off from there)
      over: { doorL: { lx: 0.64, y: 1.84 }, doorR: { lx: 0.64, y: 1.84 }, mirrorL: { lx: 0.87, y: 2.17 }, mirrorR: { lx: 0.87, y: 2.17 }, bumperF: { h: 0.2 } },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the roof deflector's rear edge (its part; its top along x, a truck's
    // size: s); the head lamps, one unit a side over the four lamps' place on the bumper's face (in the lamps' parts); the rims on its wheels
    // (the truck's tyres kept)
    mounts: {
      krilo: { x: 0.74, w: 0.8, part: 'deflector', s: 2, top: [[0.74, 3.0], [2.3, 2.78]] },
      zarometi: { x: 2.955, y0: 0.82, lean: 0, zc: 0.77, yc: 0.82, s: 1.35, hosts: ['headL', 'headR'] },
      platisca: {},
      // (sklop 2 · spredaj) no kit (a truck's bumper) and no bonnet (the cab over the engine); the grille in the cab's front face (in place of
      // its slats), the indicators on the bumper's face over the outer lamps, on the bumper's sides in front of the wheels, on the lamp bar
      // beside the tail lamps; the rally lamps low on the bumper's face, on a bar over the bumper in front of the grille, in the grille, on
      // the roof's front edge before the deflector, a pod on the grille
      maska: { x: 2.803, y0: 1.58, lean: 0, yc: 1.58, w: 1.86, h: 0.62, comb: 3, part: 'grille' },
      zmigavci: { front: { x: 2.952, y: 1.0, z: 0.94, w: 0.2, h: 0.07, part: 'bumperF' }, side: { x: 2.62, y: 0.98, z: 1.24, host: 'bumperF' },
        rear: { x: -2.922, y: 0.98, z: 0.42, part: 'body' } },
      relijske_luci: { bumper: [2.944, 0.56, 0.25], nose: [2.8, 1.36], intake: [2.803, 1.58, 1.86, 0.62], roof: [2.535, 0.6], pod: [2.78, 1.86, 1.36, 0.6], foot: 1.18, part: 'bumperF' },
      // (sklop 2 · streha) none: the deflector covers the cab's roof from the windscreen's top to the rear wall (a sunroof, a scoop or the
      // aerials would be in it); no rear window for the louvres
      // (sklop 2 · zadaj) the tail lamps in place of the stock ones in their black panels (on their side: the room's long way across); no
      // exhaust of the garage's (the stacks behind the cab) and no boot; the tow points in place of the towing eye and on the rear bar's tube;
      // the flaps behind the front wheels and on the rear bar (the rear mudguards end over the tyre's back: the bar's tube holds them)
      zadnje_luci: { x: -2.902, zc: 0.72, yc: 1.0, w: 0.14, h: 0.3, s: 0.9, shape: [[-0.17, -0.06], [-0.17, 0.06], [0.17, 0.06], [0.17, -0.06]], hosts: ['tailL', 'tailR'] },
      vlecne_kljuke: { f: [2.95, 0.54, 0], r: [-2.95, 0.72, 0.3], tube: [2.95, null] },
      lovilci_blata: { x: [1.04, -2.815], z: [0.84, 1.2], y: [0.79, 0.3], parts: ['body', 'body', 'bumperR', 'bumperR'] },
      // (sklop 2 · bok) the car's mirrors on the A-pillars (in place of the big stock ones on their arms), the doors (no glass of the garage's:
      // the stock ones' in the loft), the brakes, the nuts
      ogledala: { x: 2.54, y: 2.2, z: 1.29, w: 0.07, h: 0.12, d: 0.18, z0: 1.215 },
      vrata: { x: [1.0, 2.49], y: [1.16, 1.96], handle: [1.12, 1.72, 1.256, 0.16, 0.035], win: null, rub: 1.36, crease: [1.36, 1.4], rubSide: true },
      zavore: { s: 1 }, matice: { k: 10, r: 0.24 },
      // (sklop 3 · barve) no stripes and no decals (the roof under the deflector, no bonnet: their bonnet's options would have no place);
      // the sun strip across the windscreen's top; the fuel cap on the fuel cell's right side over the skirt; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      soncni_pas: { x: [2.592, 2.65] }, zamasek: { x: -0.62, y: 1.2, z: 0.311, r: 0.05 },
      celjusti: { r: [0.15, 0.27], a: [70, 125] },
      // (sklop 3 · skriti deli) the four on the engine's top under the cab (its tunnel between the seats); the springs and the dampers at the
      // frame's rails over the axles (up to the rails' top), the bars on them
      filter_zraka: { x: 1.6, y: 1.13, z: -0.15 }, akumulator: { x: 1.35, y: 1.2, z: 0.15 }, turbo: { x: 2.1, y: 1.2, z: 0.15, twin: [-0.12, 0.02] }, cip: { x: 1.9, y: 1.2, z: -0.15 },
      vzmeti: { in: 0.55, top: 0.92, seat: 0.6 }, amortizerji: { in: 0.55, top: 0.92 }, stabilizatorji: { in: 0.5, floor: 0.94 }, dim_gum: {},
    },
    // the semi-trailer (Core: tlDefBad, tlStep): 12 t with its tank full; its kingpin on the TITAN's fifth wheel (x -1.8, 0.98 up)
    trailer: { mass: 12000, len: 12.4, wid: 2.5, ht: 3.56, f: 0.9, ax: [-7.5, -8.8, -10.1], kp: [-1.8, 0.98], rw: 0.5, mu: 1.5, brk: 7.5, look: { build } },
    // the tractor's look: the TITAN's (its shape, colours, chrome), a little rust low on it: the doors' lower edges, the steps, the bumper's lip
    look: {
      get body() { return titan().body; }, get wheels() { return titan().wheels; }, regions: 'none',
      hi: true, budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (the TITAN's: its cabin and its Visoki details come with its build)
      build(K) {
        K.lookOf('titan').build(K);
        const R1 = [0.45, 0.24, 0.12], R2 = [0.36, 0.18, 0.09];
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            const dir = sd < 0 ? '-z' : 'z';
            [[0.86, 0.47, 0.26, 0.07, R1], [1.32, 0.45, 0.18, 0.05, R2], [2.3, 0.46, 0.22, 0.06, R1], [2.62, 0.44, 0.12, 0.05, R2]].forEach(([x, y, l, h, c]) => K.rect(x, y, sd * 1.243, l, h, c, { dir }));
            for (const yy of [0.58, 0.86]) K.box(0.9, yy + 0.021, sd * 1.18, 0.18, 0.004, 0.09, 0, R2);   // (the steps' treads worn to rust)
          }
        });
        K.part('bumperF', () => { for (const z of [-0.95, -0.2, 0.7]) K.rect(2.955, 0.36, z, 0.2, 0.04, R1, { dir: 'x' }); });
      },
    },
  });
})();
