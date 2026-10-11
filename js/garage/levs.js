/* The LEV S's garage model (js/garage.js: the car screen's turntable only; a race draws its kit look, js/cars/levs.js). The same
   sections as the kit's look, but a smooth shell: cubic between the sections (Fritsch-Carlson, never past them), its ring's corners
   rounded, the sides and the haunches over the arches bulging a little, the glass curved. One picture over the whole shell (x along it,
   the ring's place p round it) holds its colours: the paint (the alpha picture's red: the colour the player picks), the glass (tinted,
   see-through: the cabin behind it), the dark roof, the frit, the seals, the shut lines, the lamps (smoked chrome, projector bowls, the
   rear lamps' LED light guide), the vents; its roughness, metal and clear coat in pictures of their own. In 3D: the bumpers' thick black
   strips, the rubbing strips, the wide mouth (a honeycomb, two chrome slats), the slim grille with a plain badge (no name), the
   projectors with LED rings, the LED brows, the fog lamps, the mirrors, the wipers, the roof spoiler with a third brake light, the
   exhaust, the cabin, the wheels (a tyre with a tread, a concave five-twin-spoke alloy, a drilled disc, a red calliper) and the roof
   rack: a black basket on two load bars, slotted aluminium rails along it (the places for what goes on it later), on it the spare
   wheel and two 20-litre fuel cans (no marks), strapped down. Look units = metres, x forward (the axles at 1.15 / -1.32), z right. */
Garage.add('levs', function (G) {
  'use strict';
  const HI = G.hi, lin = G.lin, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let rs = 7; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;

  // ---------------- the sections (js/cars/levs.js; behind the side glass the belt and the window band's top evened out (the kit's dip
  //                  at the rear axle and pinch at the roof's rear edge: a groove on a smooth shell), two thin ones at each end: the
  //                  face's edge rounded over 1.5 cm ----------------
  const ROWS = [[-1.93, 0.5, 0.27, 0.56, 0.42, 0.64, 0.03, 0.06], [-1.89, 0.56, 0.26, 0.62, 0.46, 0.69, 0.02, 0.07], [-1.875, 0.62, 0.255, 0.66, 0.3, 0.9, 0.03, 0.08],
    [-1.82, 0.73, 0.25, 0.66, 0.46, 0.95, 0.03, 0.1], [-1.76, 0.785, 0.25, 0.7, 0.52, 0.99, 0.035, 0.1], [-1.685, 0.815, 0.25, 0.74, 0.56, 1.06, 0.045, 0.1],
    [-1.636, 0.83, 0.25, 0.78, 0.6, 1.1, 0.05, 0.1], [-1.57, 0.843, 0.26, 0.79, 0.59, 1.175, 0.07, 0.1], [-1.5026, 0.855, 0.27, 0.8, 0.58, 1.25, 0.09, 0.1],
    [-1.32, 0.86, 0.28, 0.79, 0.55, 1.3, 0.1, 0.1], [-1.2, 0.85, 0.27, 0.82, 0.535, 1.37, 0.055, 0.1], [-1.137, 0.845, 0.265, 0.86, 0.52, 1.39, 0.045, 0.1],
    [-1.004, 0.835, 0.255, 0.9, 0.52, 1.4, 0.046, 0.1], [-0.955, 0.83, 0.25, 0.94, 0.52, 1.405, 0.046, 0.1], [-0.59, 0.825, 0.24, 0.95, 0.53, 1.42, 0.045, 0.1],
    [0.18, 0.83, 0.22, 0.9, 0.55, 1.34, 0.048, 0.1], [0.6, 0.83, 0.21, 0.89, 0.62, 1.12, 0.077, 0.1], [0.72, 0.835, 0.205, 0.88, 0.66, 1.06, 0.08, 0.1],
    [0.78, 0.85, 0.205, 0.87, 0.68, 1.02, 0.08, 0.1], [0.83, 0.855, 0.205, 0.86, 0.69, 1.0, 0.075, 0.1], [0.965, 0.87, 0.21, 0.84, 0.7, 0.95, 0.065, 0.1],
    [1.15, 0.871, 0.21, 0.8, 0.69, 0.9, 0.068, 0.1], [1.335, 0.865, 0.22, 0.77, 0.66, 0.85, 0.067, 0.1], [1.47, 0.835, 0.17, 0.72, 0.66, 0.81, 0.068, 0.1],
    [1.52, 0.82, 0.17, 0.74, 0.62, 0.81, 0.052, 0.1], [1.65, 0.745, 0.15, 0.66, 0.6, 0.77, 0.05, 0.09], [1.76, 0.655, 0.12, 0.58, 0.46, 0.72, 0.045, 0.07],
    [1.82, 0.55, 0.12, 0.56, 0.38, 0.675, 0.04, 0.06], [1.87, 0.42, 0.14, 0.555, 0.28, 0.635, 0.025, 0.05]];
  const S = ROWS.map(r => ({ x: r[0], w: r[1], yb: r[2], ybelt: r[3], wt: r[4], yt: r[5], cr: r[6], tk: r[7] }));
  const shrink = (s, x, d) => ({ x, w: s.w - d, yb: s.yb + d * 0.7, ybelt: s.ybelt, wt: s.wt - d, yt: s.yt - d * 0.7, cr: s.cr * (1 - d * 20), tk: Math.max(0.03, s.tk - d * 0.7) });
  { const f = S[S.length - 1], r = S[0]; S.push(shrink(f, f.x + 0.006, 0.005), shrink(f, f.x + 0.011, 0.016)); S.unshift(shrink(r, r.x - 0.011, 0.016), shrink(r, r.x - 0.006, 0.005)); }
  const XK = S.map(s => s.x), XMIN = XK[0], XMAX = XK[XK.length - 1];
  function monotone(xs, ys) {
    const n = xs.length, d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
    return (x) => { if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1]; let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]; };
  }
  const IP = {}; for (const k of ['w', 'yb', 'ybelt', 'wt', 'yt', 'cr', 'tk']) IP[k] = monotone(XK, S.map(s => s[k]));
  const RW = 0.32, ARCH_R = 0.37, AXLES = [1.15, -1.32], HUBZ = 0.87 - 0.1515;
  // the section at x: the wheel arches cut into its foot (the lower edge on the arch's circle, a narrow lip into it)
  function sec(x) {
    const s = { x, w: IP.w(x), yb: IP.yb(x), ybelt: IP.ybelt(x), wt: IP.wt(x), yt: IP.yt(x), cr: IP.cr(x), tk: IP.tk(x) }; s.y1 = s.yb + s.tk;
    for (const c of AXLES) { const dx = x - c; if (Math.abs(dx) > ARCH_R) continue;
      const ya = RW + Math.sqrt(Math.max(0, ARCH_R * ARCH_R - dx * dx)); if (ya <= s.yb + s.tk) continue;
      s.tk = 0.018; s.yb = ya - s.tk; if (s.ybelt < ya + 0.03) s.ybelt = ya + 0.03; if (s.yt < s.ybelt) s.yt = s.ybelt; }
    return s;
  }
  // the ring (z, y): 0 the right tuck's foot ... 9 the left's; segment i from point i to i + 1 (as the kit's panels e); p in 0..9 round it
  const ring = (s) => [[0.93 * s.w, s.yb], [s.w, s.yb + s.tk], [s.w, s.ybelt], [s.wt, s.yt], [0.38 * s.wt, s.yt + s.cr], [-0.38 * s.wt, s.yt + s.cr], [-s.wt, s.yt], [-s.w, s.ybelt], [-s.w, s.yb + s.tk], [-0.93 * s.w, s.yb]];
  const RAD = [0, 0.03, 0.012, 0.045, 0.13, 0.13, 0.045, 0.012, 0.03, 0];   // (each corner's radius: the belt sharp, the roof domed)
  let RADX = 0;
  function corner(R, k) {
    const rad = (k === 2 || k === 7) ? RAD[k] + 0.04 * RADX : RAD[k];   // (behind the B-pillar the belt softer)
    const P = R[k], A0 = R[k - 1], B0 = R[k + 1], la = Math.hypot(P[0] - A0[0], P[1] - A0[1]), lb = Math.hypot(B0[0] - P[0], B0[1] - P[1]);
    const fa = la > 1e-6 ? Math.min(0.48, rad / la) : 0, fb = lb > 1e-6 ? Math.min(0.48, rad / lb) : 0;
    return { P, fa, fb, A: [P[0] + (A0[0] - P[0]) * fa, P[1] + (A0[1] - P[1]) * fa], B: [P[0] + (B0[0] - P[0]) * fb, P[1] + (B0[1] - P[1]) * fb] };
  }
  const bez = (A, P, B, t) => { const u = 1 - t; return [u * u * A[0] + 2 * u * t * P[0] + t * t * B[0], u * u * A[1] + 2 * u * t * P[1] + t * t * B[1]]; };
  function prof(R, p) {
    let i = Math.floor(p), t = p - i; if (i >= 9) { i = 8; t = 1; } if (i < 0) { i = 0; t = 0; }
    if (i + 1 <= 8) { const C = corner(R, i + 1); if (C.fa > 0 && t > 1 - C.fa) return bez(C.A, C.P, C.B, (t - (1 - C.fa)) / C.fa * 0.5); }
    if (i >= 1) { const C = corner(R, i); if (C.fb > 0 && t < C.fb) return bez(C.A, C.P, C.B, 0.5 + t / C.fb * 0.5); }
    const a = R[i], b = R[i + 1]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  const bulge = (x) => sstep(-1.96, -1.62, x) * sstep(1.9, 1.55, x) * (0.008 + 0.011 * Math.exp(-(((x + 1.32) / 0.45) ** 2)) + 0.006 * Math.exp(-(((x - 1.15) / 0.4) ** 2)));
  function profPoint(s, R, p) {
    RADX = sstep(-0.9, -1.15, s.x); let q = prof(R, p); const i = Math.min(8, Math.max(0, Math.floor(p))), t = p - i;
    const cur = i === 2 || i === 6 ? 0.009 * sstep(-1.45, -1.12, s.x) + 0.008 * sstep(-1.2, -1.5, s.x) * sstep(-1.95, -1.7, s.x) : i === 3 || i === 5 ? 0.006 : 0;   // (the glass curved, the roof's edge)
    if (cur) { const a = R[i], b = R[i + 1], dz = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dz, dy) || 1; let nz = dy / l, ny = -dz / l;
      if (nz * (a[0] + b[0]) / 2 + ny * ((a[1] + b[1]) / 2 - 0.6) < 0) { nz = -nz; ny = -ny; }
      const k = cur * Math.sin(Math.PI * clamp(t, 0, 1)); q = [q[0] + nz * k, q[1] + ny * k]; }
    // the sides fuller up to the belt (the shoulder the widest point: convex from the sill's crease up), the bulge fading out over the
    // window band to the roof's edge, so nothing dips in under the belt
    if (p < 3 || p > 6) { const y = q[1], f = y <= s.ybelt ? Math.sin(Math.PI / 2 * clamp((y - s.y1) / Math.max(0.05, s.ybelt - s.y1), 0, 1)) : Math.cos(Math.PI / 2 * clamp((y - s.ybelt) / Math.max(0.02, s.yt - s.ybelt), 0, 1));
      q = [q[0] + Math.sign(q[0]) * bulge(s.x) * f, q[1]]; }
    return q;
  }
  const P3 = (x, p) => { const s = sec(x), q = profPoint(s, ring(s), p); return [x, q[1], q[0]]; };
  function normalAt(x, p) {
    const h = 0.003, a = P3(x - h, p), b = P3(x + h, p), c = P3(x, p - 0.01), d = P3(x, p + 0.01);
    return V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).cross(V3(d[0] - c[0], d[1] - c[1], d[2] - c[2])).normalize();
  }
  function pAtY(x, y) { let a = 0, b = 4; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (P3(x, m)[1] < y) a = m; else b = m; } return (a + b) / 2; }   // (the right half, height y)
  function pAtZ(x, z) { let a = 3, b = 6; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (P3(x, m)[2] > z) a = m; else b = m; } return (a + b) / 2; }   // (the top, at z)
  // the kit's band coordinates (s 0..1 the window band from the belt, 1..2 the edge, 2..3 the crown to the middle) and side heights as p
  const sToP = (s, sd) => sd > 0 ? (s <= 2 ? 2 + s : 4 + (s - 2) * 0.5) : (s <= 2 ? 7 - s : 5 - (s - 2) * 0.5);
  function yToP(x, y, sd) { const s = sec(x), y1 = s.yb + s.tk; let p;
    if (y <= y1) p = clamp((y - s.yb) / s.tk, 0, 1); else if (y <= s.ybelt) p = 1 + (y - y1) / (s.ybelt - y1); else if (y <= s.yt) p = 2 + (y - s.ybelt) / Math.max(1e-4, s.yt - s.ybelt); else p = 3;
    return sd > 0 ? p : 9 - p; }

  // ---------------- the shell's grid (Normalni: a phone's, about 70 000 triangles; Visoki twice as fine) ----------------
  let xs = []; const DX = HI ? 0.007 : 0.014; for (let x = XMIN; x < XMAX; x += DX) xs.push(x); xs.push(XMAX); XK.forEach(x => xs.push(x));
  for (const c of AXLES) for (let a = 0; a <= 180; a += HI ? 3 : 5) xs.push(c + ARCH_R * Math.cos(a * Math.PI / 180));
  xs.sort((a, b) => a - b); xs = xs.filter((x, i) => x >= XMIN && x <= XMAX && (i === 0 || x - xs[i - 1] > 0.0012));
  const NSEG = HI ? [6, 28, 24, 16, 30, 16, 24, 28, 6] : [4, 16, 16, 10, 18, 10, 16, 16, 4], ps = [];
  NSEG.forEach((n, i) => { for (let j = 0; j < n; j++) ps.push(i + 0.5 - 0.5 * Math.cos(Math.PI * j / n)); }); ps.push(9);
  const WTS = [0.05, 0.15, 0.14, 0.10, 0.12, 0.10, 0.14, 0.15, 0.05], CUM = [0]; WTS.forEach(w => CUM.push(CUM[CUM.length - 1] + w));
  const Vp = (p) => { const i = Math.min(8, Math.max(0, Math.floor(p))); return CUM[i] + clamp(p - i, 0, 1) * WTS[i]; };   // (the picture's v of p)
  const NX = xs.length, NP = ps.length, pos = new Float32Array(NX * NP * 3), uv = new Float32Array(NX * NP * 2), cu = new Float64Array(NX);
  for (let i = 0; i < NX; i++) { const s = sec(xs[i]), R = ring(s);
    for (let j = 0; j < NP; j++) { const q = profPoint(s, R, ps[j]), o = (i * NP + j) * 3; pos[o] = xs[i]; pos[o + 1] = q[1]; pos[o + 2] = q[0]; } }
  // (the picture's u along x: the most any point moves from one row to the next, summed, so no stretch where the faces turn across)
  for (let i = 1; i < NX; i++) { let m = 0; for (let j = 0; j < NP; j++) { if (ps[j] < 1 || ps[j] > 8) continue; const a = ((i - 1) * NP + j) * 3, b = (i * NP + j) * 3;
    m = Math.max(m, Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2])); } cu[i] = cu[i - 1] + m; }
  const UL = cu[NX - 1];
  const Ux = (x) => { if (x <= xs[0]) return 0; if (x >= xs[NX - 1]) return 1; let a = 0, b = NX - 1; while (b - a > 1) { const m = (a + b) >> 1; if (xs[m] <= x) a = m; else b = m; }
    return (cu[a] + (cu[b] - cu[a]) * (x - xs[a]) / (xs[b] - xs[a])) / UL; };
  for (let i = 0; i < NX; i++) for (let j = 0; j < NP; j++) { const o = (i * NP + j) * 2; uv[o] = cu[i] / UL; uv[o + 1] = Vp(ps[j]); }
  const idx = []; for (let i = 0; i < NX - 1; i++) for (let j = 0; j < NP - 1; j++) { const a = i * NP + j, b = (i + 1) * NP + j, c = a + 1, d = b + 1; idx.push(a, b, c, b, d, c); }
  const bodyGeo = new THREE.BufferGeometry(); bodyGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bodyGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bodyGeo.setIndex(idx); bodyGeo.computeVertexNormals();
  // the lining (the shell's inside, seen only through the glass, dark): every third row and second point of the same grid (a chord of a
  // convex shell lies inside it), so a sixth of its triangles
  const lineGeo = (() => { const I = [], J = []; for (let i = 0; i < NX; i += 3) I.push(i); if (I[I.length - 1] !== NX - 1) I.push(NX - 1); for (let j = 0; j < NP; j += 2) J.push(j); if (J[J.length - 1] !== NP - 1) J.push(NP - 1);
    const lp = new Float32Array(I.length * J.length * 3), lu = new Float32Array(I.length * J.length * 2), li = [];
    I.forEach((i, a) => J.forEach((j, b) => { const o = a * J.length + b; for (let k = 0; k < 3; k++) lp[o * 3 + k] = pos[(i * NP + j) * 3 + k]; lu[o * 2] = uv[(i * NP + j) * 2]; lu[o * 2 + 1] = uv[(i * NP + j) * 2 + 1]; }));
    for (let a = 0; a < I.length - 1; a++) for (let b = 0; b < J.length - 1; b++) { const p = a * J.length + b, q = (a + 1) * J.length + b; li.push(p, q, p + 1, q, q + 1, p + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(lp, 3)); g.setAttribute('uv', new THREE.BufferAttribute(lu, 2)); g.setIndex(li); g.computeVertexNormals(); return g; })();
  function capGeo(x, dir) {   // the end caps (the bumpers' faces): the end ring, flat
    const s = sec(x), R = ring(s), pts = ps.map(p => profPoint(s, R, p)), c = pts.reduce((a, q) => [a[0] + q[0] / pts.length, a[1] + q[1] / pts.length], [0, 0]);
    const v = [x, c[1], c[0]]; pts.forEach(q => v.push(x, q[1], q[0])); const id = [];
    for (let j = 0; j < pts.length; j++) { const k = (j + 1) % pts.length; if (dir > 0) id.push(0, k + 1, j + 1); else id.push(0, j + 1, k + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(id); g.computeVertexNormals(); return g; }

  // ---------------- the shell's pictures: colour (the paint black: the paint's colour is added where the mask says, so an edge blends
  //                  the two exactly), the shade in the gaps (r: their reflections too) / roughness (g) / metal (b), clear coat (r)
  //                  and its roughness (g), glow, see-through (g) with the paint mask (r: the colour's own size, so its edges are the
  //                  colour's) ----------------
  const TW = HI ? 4096 : 2048, TH = TW / 2, AW = TW / 2, AH = TH / 2, REF = 6144;   // (line widths in pixels of a 6144 wide picture)
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const L = { c: mk(TW, TH), rm: mk(AW, AH), cc: mk(AW, AH), em: mk(AW, AH), al: mk(TW, TH) };
  const LX = {}; for (const k in L) LX[k] = L[k].getContext('2d');
  const g255 = (v) => Math.round(clamp(v, 0, 1) * 255);
  const style = (k, M) => k === 'c' ? M.c : k === 'rm' ? 'rgb(' + g255(M.ao == null ? 1 : M.ao) + ',' + g255(M.r) + ',' + g255(M.m) + ')' : k === 'cc' ? 'rgb(' + g255(M.cc) + ',' + g255(M.ccr) + ',0)'
    : k === 'em' ? (M.e || '#000') : 'rgb(' + (M.paint ? 255 : 0) + ',' + g255(M.a == null ? 1 : M.a) + ',0)';
  const MT = {
    paint: { c: '#000000', r: 0.36, m: 0.5, cc: 1, ccr: 0.035, paint: true },
    roof: { c: '#141619', r: 0.22, m: 0.35, cc: 1, ccr: 0.03 },
    glass: { c: '#04070a', r: 0.02, m: 0, cc: 1, ccr: 0.0, a: 0.8 },
    frit: { c: '#050506', r: 0.3, m: 0, cc: 1, ccr: 0.0 },
    satin: { c: '#070708', r: 0.8, m: 0, cc: 0, ccr: 0.5, ao: 0.35 },
    gloss: { c: '#050506', r: 0.1, m: 0, cc: 1, ccr: 0.02 },
    plastic: { c: '#161718', r: 0.78, m: 0, cc: 0, ccr: 0.6 },
    chrome: { c: '#e4e7eb', r: 0.05, m: 1, cc: 0.6, ccr: 0.02 },
    gap: { c: '#000000', r: 0.9, m: 0, cc: 0, ccr: 0.6, ao: 0 },
  };
  // a polygon (or a line: stroke, its width) in the shell's (x, p), its edges cut fine, onto every picture (or those named)
  function fillXP(pts, M, only, stroke) {
    const fine = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if (stroke && i === pts.length - 1) { fine.push(a); break; }
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]) / 0.004, Math.abs(b[1] - a[1]) / 0.01)));
      for (let k = 0; k < n; k++) fine.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    for (const k in L) { if (only && !only.includes(k)) continue; const cv = L[k], x = LX[k], cw = cv.width, ch = cv.height;
      x.beginPath(); fine.forEach((q, i) => { const u = Ux(q[0]) * cw, v = Vp(q[1]) * ch; if (i) x.lineTo(u, v); else x.moveTo(u, v); });
      if (stroke) { x.lineWidth = Math.max(0.9, stroke * cw / REF); x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = style(k, M); x.stroke(); }
      else { x.closePath(); x.fillStyle = style(k, M); x.fill(); } }
  }
  function fineIn(pts, f, closed, step) { const out = [], n0 = closed ? pts.length : pts.length - 1;   // (points in another space, cut fine there first)
    for (let i = 0; i < n0; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (step || 0.005))); for (let k = 0; k < n; k++) out.push(f([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n])); }
    if (!closed) out.push(f(pts[pts.length - 1])); return out; }
  const band = (pts, sd, M) => fillXP(fineIn(pts, ([x, s]) => [x, sToP(s, sd)], true), M);
  const bandLine = (pts, sd, M, w) => fillXP(fineIn(pts, ([x, s]) => [x, sToP(s, sd)], false), M, null, w);
  const side = (pts, sd, M) => fillXP(fineIn(pts, ([x, y]) => [x, yToP(x, y, sd)], true), M);
  const sideLine = (pts, sd, M, w) => fillXP(fineIn(pts, ([x, y]) => [x, yToP(x, y, sd)], false), M, null, w);
  const xpLine = (pts, M, w, only) => fillXP(fineIn(pts, q => q, false, 0.004), M, only, w);
  const rect = (x0, x1, p0, p1, M) => fillXP([[x0, p0], [x1, p0], [x1, p1], [x0, p1]], M);
  const scaleAbout = (pts, k) => { const c = [0, 1].map(i => pts.reduce((t, p) => t + p[i], 0) / pts.length); return pts.map(p => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]); };
  // a round spot on the band at (x, s), r in metres (an ellipse in the picture: the band's local scale)
  function bandSpot(x, s, sd, r, fill) {
    const p = sToP(s, sd), sc = sec(x), bh = Math.hypot(sc.yt - sc.ybelt, sc.w - sc.wt) || 0.1, du = (Ux(x + 0.01) - Ux(x - 0.01)) / 0.02;
    for (const k in L) { const cv = L[k], c = LX[k], rx = r * du * cv.width, ry = r / bh * WTS[2] * cv.height;
      c.save(); c.translate(Ux(x) * cv.width, Vp(p) * cv.height); c.scale(1, ry / rx); c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fillStyle = fill(k, c, rx); c.fill(); c.restore(); }
  }

  // the paint everywhere, its metal flakes in the roughness and the metal
  for (const k in L) { LX[k].fillStyle = style(k, MT.paint); LX[k].fillRect(0, 0, L[k].width, L[k].height); }
  { const n = mk(256, 256), nx = n.getContext('2d'), im = nx.createImageData(256, 256), d = im.data;   // (a noise tile laid over it thinly: nothing read back)
    for (let i = 0; i < d.length; i += 4) { d[i] = 255; d[i + 1] = rnd() * 255; d[i + 2] = rnd() * 255; d[i + 3] = 255; }
    nx.putImageData(im, 0, 0); LX.rm.globalAlpha = 0.06; LX.rm.fillStyle = LX.rm.createPattern(n, 'repeat'); LX.rm.fillRect(0, 0, AW, AH); LX.rm.globalAlpha = 1; }
  // the lower edge black (the sills, the bumpers' lips, the arches' lips); the dark roof to the spoiler; the windscreen and the rear glass
  // with their black frit, the rear glass's heating lines
  rect(XMIN - 0.01, XMAX + 0.01, 0, 1, MT.plastic); rect(XMIN - 0.01, XMAX + 0.01, 8, 9, MT.plastic);
  rect(-1.30, 0.18, 3, 6, MT.roof);
  rect(0.18, 0.965, 3, 6, MT.glass); rect(-1.76, -1.32, 3, 6, MT.glass);
  for (const [x0, x1] of [[0.18, 0.212], [0.93, 0.965], [-1.355, -1.32], [-1.76, -1.722]]) rect(x0, x1, 3, 6, MT.frit);
  rect(0.18, 0.965, 3, 3.07, MT.frit); rect(0.18, 0.965, 5.93, 6, MT.frit); rect(-1.76, -1.32, 3, 3.08, MT.frit); rect(-1.76, -1.32, 5.92, 6, MT.frit);
  for (let k = 0; k < 9; k++) { const x = -1.70 + k * 0.034; xpLine([[x, 3.16], [x, 5.84]], { c: '#2b1710', r: 0.4, m: 0.3, cc: 1, ccr: 0, a: 0.85 }, 2, ['c', 'al']); }
  // the side glass (the door's to the slanted A-pillar foot, the quarter's foot rising to the C-pillar) in black seals, the gloss B-pillar
  for (const sd of [-1, 1]) {
    band([[-0.575, 0.02], [0.55, 0.02], [0.625, 0.985], [-0.575, 0.985]], sd, MT.satin); band([[-0.62, 0.02], [-0.955, 0.02], [-1.004, 0.21], [-1.13, 0.39], [-1.13, 0.985], [-0.62, 0.985]], sd, MT.satin);
    band([[-0.567, 0.04], [0.54, 0.04], [0.61, 0.96], [-0.567, 0.96]], sd, MT.glass);
    band([[-0.628, 0.04], [-0.95, 0.04], [-0.998, 0.225], [-1.12, 0.40], [-1.12, 0.96], [-0.628, 0.96]], sd, MT.glass);
    band([[-0.62, 0], [-0.575, 0], [-0.575, 1], [-0.62, 1]], sd, MT.gloss);
    bandLine([[-1.13, 0.012], [0.56, 0.012]], sd, MT.satin, 8);
  }
  // the shut lines: the doors, the bumpers, the bonnet round the lamps, the tailgate, the fuel flap (right)
  for (const sd of [-1, 1]) {
    for (const x of [0.72, -0.59]) xpLine([[x, sd > 0 ? 1.05 : 7.95], [x, sd > 0 ? (x > 0 ? 2.98 : 2.0) : (x > 0 ? 6.02 : 7.0)]], MT.gap, 6.5);
    sideLine([[1.505, 0.38], [1.505, 0.62], [1.90, 0.62]], sd, MT.gap, 6.5);
    sideLine([[-1.70, 0.44], [-1.70, 0.66], [-1.95, 0.66]], sd, MT.gap, 6.5);
    bandLine([[0.975, 1.0], [1.50, 1.0], [1.56, 1.08], [1.65, 1.25], [1.76, 1.27], [1.83, 1.18], [1.862, 1.0], [1.862, 2.999]], sd, MT.gap, 6.5);
    bandLine([[-1.76, 1.0], [-1.888, 1.0], [-1.888, 2.999]], sd, MT.gap, 6.5);
  }
  xpLine([[0.975, 3.0], [0.975, 6.0]], MT.gap, 6.5);
  { const fl = []; for (let a = 0; a <= 24; a++) { const t = a / 24 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); fl.push([-1.06 + Math.sign(c) * Math.pow(Math.abs(c), 0.35) * 0.052, 0.775 + Math.sign(s) * Math.pow(Math.abs(s), 0.35) * 0.044]); }
    sideLine(fl, 1, MT.gap, 5); }
  // the door handles (a dark pocket, the body-coloured grip), the side repeaters
  for (const sd of [-1, 1]) {
    const pk = []; for (let a = 0; a < 20; a++) { const t = a / 20 * Math.PI * 2; pk.push([-0.47 + Math.cos(t) * 0.085, 0.882 + Math.sin(t) * 0.022]); }
    side(pk, sd, { c: '#120403', r: 0.7, m: 0, cc: 0.3, ccr: 0.3, ao: 0.3 });
    side([[-0.54, 0.874], [-0.40, 0.874], [-0.392, 0.882], [-0.40, 0.892], [-0.54, 0.892], [-0.548, 0.882]], sd, MT.paint);
    side([[0.80, 0.652], [0.857, 0.652], [0.862, 0.664], [0.857, 0.674], [0.80, 0.674], [0.795, 0.664]], sd, { c: '#d97a12', r: 0.05, m: 0, cc: 1, ccr: 0 });
  }
  // the bonnet's two vents (its right side): dark, two chrome slats each
  for (const s0 of [1.2, 1.34]) {
    band([[1.21, s0], [1.33, s0], [1.33, s0 + 0.1], [1.21, s0 + 0.1]], 1, { c: '#030303', r: 0.6, m: 0, cc: 0.4, ccr: 0.2, ao: 0.2 });
    for (const t of [0.03, 0.065]) band([[1.215, s0 + t], [1.325, s0 + t], [1.325, s0 + t + 0.012], [1.215, s0 + t + 0.012]], 1, MT.chrome);
  }
  // the head lamps: the almond on the corner (a gloss rim, a smoked-chrome housing under the clear lens, a dark carrier), two projector
  // bowls, the amber indicator at the grille's end
  const HL = [[1.866, 0.15], [1.866, 0.85], [1.82, 1.1], [1.76, 1.2], [1.65, 1.18], [1.57, 1.0], [1.52, 0.8], [1.55, 0.4], [1.63, 0.12], [1.73, 0.0], [1.82, 0.02]];
  const PROJ = [[1.7, 0.72, 0.04], [1.79, 0.58, 0.033]];
  for (const sd of [-1, 1]) {
    band(scaleAbout(HL, 1.055).map(([x, s]) => [Math.min(x, 1.868), s]), sd, MT.gloss);
    band(HL, sd, { c: '#8d959e', r: 0.22, m: 0.55, cc: 1, ccr: 0, e: '#11161c' });
    band([[1.6, 0.6], [1.67, 0.42], [1.80, 0.34], [1.862, 0.38], [1.862, 0.6], [1.80, 0.8], [1.70, 0.9], [1.62, 0.86]], sd, { c: '#3b4148', r: 0.3, m: 0.6, cc: 1, ccr: 0 });
    for (const [x, s, r] of PROJ) bandSpot(x, s, sd, r * 1.55, (k, c, rx) => { if (k !== 'c') return k === 'rm' ? 'rgb(0,30,255)' : k === 'cc' ? 'rgb(255,0,0)' : k === 'al' ? 'rgb(0,255,0)' : '#05070a';
      const gr = c.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#d4dae0'); gr.addColorStop(0.85, '#7c848c'); gr.addColorStop(1, '#30353b'); return gr; });
    band([[1.838, 0.27], [1.864, 0.22], [1.864, 0.62], [1.84, 0.66]], sd, { c: '#e88a17', r: 0.1, m: 0, cc: 1, ccr: 0 });
  }
  // the tail lamps round the corners: a chrome surround, the deep red lens, its light guide's channel, a clear reverse lamp
  const TL = [[-1.85, 0.42], [-1.85, 0.9], [-1.79, 0.84], [-1.66, 0.64], [-1.48, 0.31], [-1.5, 0.2], [-1.58, 0.17], [-1.7, 0.24], [-1.8, 0.34]];
  for (const sd of [-1, 1]) {
    band(scaleAbout(TL, 1.1), sd, MT.chrome);
    band(TL, sd, { c: '#4a0306', r: 0.05, m: 0, cc: 1, ccr: 0, e: '#120000' });
    band(scaleAbout(TL, 0.8), sd, { c: '#6d070b', r: 0.05, m: 0, cc: 1, ccr: 0, e: '#200000' });
    band([[-1.845, 0.63], [-1.845, 0.69], [-1.7, 0.5], [-1.6, 0.38], [-1.53, 0.3], [-1.55, 0.29], [-1.6, 0.33], [-1.7, 0.44]], sd, { c: '#9a1015', r: 0.1, m: 0, cc: 1, ccr: 0, e: '#5a0402' });
    band([[-1.848, 0.46], [-1.848, 0.58], [-1.80, 0.52], [-1.80, 0.42]], sd, { c: '#d8dadc', r: 0.05, m: 0.3, cc: 1, ccr: 0 });
  }
  const tex = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.flipY = false; t.anisotropy = 4; if (srgb) t.encoding = THREE.sRGBEncoding; return t; };

  // ---------------- the materials (Garage: tone-mapped, sRGB, the studio's reflections) ----------------
  const car = new THREE.Group(), add = (m) => { car.add(m); return m; };
  const PAINT = G.paintMat({ roughness: 0.36, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.035 });
  const M = {
    gloss: G.phys({ color: lin(0x050506), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, side: THREE.DoubleSide }),
    satin: G.std({ color: lin(0x09090a), roughness: 0.55, metalness: 0, side: THREE.DoubleSide }),
    plastic: G.std({ color: lin(0x121314), roughness: 0.8, metalness: 0, side: THREE.DoubleSide }),
    chrome: G.std({ color: lin(0xf2f4f7), roughness: 0.06, metalness: 1, side: THREE.DoubleSide }),
    mirror: G.std({ color: lin(0xc8d0d8), roughness: 0.01, metalness: 1 }),
    roof: G.phys({ color: lin(0x141619), roughness: 0.22, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide }),
    lens: G.phys({ color: lin(0x1a2633), roughness: 0.02, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0 }),
    red: G.phys({ color: lin(0x8a0b0f), roughness: 0.05, emissive: lin(0xff1810), emissiveIntensity: 0.6, clearcoat: 1 }),
    black: G.std({ color: lin(0x060606), roughness: 0.9, side: THREE.DoubleSide }),
    cabin: G.std({ color: lin(0x1c1d20), roughness: 0.85 }),
    seatRed: G.std({ color: lin(0x5a1418), roughness: 0.8 }),
    led: G.std({ color: lin(0xffffff), emissive: lin(0xe6f0ff), emissiveIntensity: 2.2, roughness: 0.3 }),
    ledTail: G.std({ color: lin(0xff5040), emissive: lin(0xff1408), emissiveIntensity: 2.0, roughness: 0.3 }),
    amber: G.std({ color: lin(0xffb347), emissive: lin(0xff9a1f), emissiveIntensity: 0.2, roughness: 0.2 }),
  };
  bodyGeo.setAttribute('uv2', bodyGeo.attributes.uv);   // (the gaps' shade: the aoMap reads the second uv set)
  const bodyMat = G.shellMat({ color: 0xffffff, map: tex(L.c, true), roughness: 1, metalness: 1, roughnessMap: tex(L.rm), metalnessMap: null, clearcoat: 1, clearcoatMap: tex(L.cc),
    clearcoatRoughness: 1, emissive: 0xffffff, emissiveMap: tex(L.em, true), emissiveIntensity: 1.6, alphaMap: tex(L.al), transparent: true });
  bodyMat.metalnessMap = bodyMat.aoMap = bodyMat.roughnessMap; bodyMat.clearcoatRoughnessMap = bodyMat.clearcoatMap;   // (one picture each: r / g / b, r / g)
  // the shell, its inside dark (seen through the glass: the far side's), the end caps
  const lining = add(new THREE.Mesh(lineGeo, G.std({ color: lin(0x0b0b0c), roughness: 0.9, side: THREE.BackSide, alphaMap: bodyMat.alphaMap, transparent: true }))); lining.renderOrder = 1;
  const body = add(new THREE.Mesh(bodyGeo, bodyMat)); body.renderOrder = 2;
  add(new THREE.Mesh(capGeo(XMAX, 1), PAINT)); add(new THREE.Mesh(capGeo(XMIN, -1), PAINT));

  // a profile [[u, v] ...] (closed) along a path; frame(i) -> { n: u's direction, b: v's direction }; scale(i) -> [su, sv]; capped
  function sweep(path, profile, mat, frame, scale) {
    const v = [], id = [], n = profile.length;
    path.forEach((P, i) => { const F = frame(i), k = scale ? scale(i) : [1, 1]; for (const [u, w] of profile) v.push(P.x + F.n.x * u * k[0] + F.b.x * w * k[1], P.y + F.n.y * u * k[0] + F.b.y * w * k[1], P.z + F.n.z * u * k[0] + F.b.z * w * k[1]); });
    for (let i = 0; i < path.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * n + j, b = i * n + (j + 1) % n, c = a + n, d = b + n; id.push(a, c, b, b, c, d); }
    for (const [i, f] of [[0, 1], [path.length - 1, -1]]) { const c0 = v.length / 3; let cx = 0, cy = 0, cz = 0; for (let j = 0; j < n; j++) { cx += v[(i * n + j) * 3] / n; cy += v[(i * n + j) * 3 + 1] / n; cz += v[(i * n + j) * 3 + 2] / n; }
      v.push(cx, cy, cz); for (let j = 0; j < n; j++) { const a = i * n + j, b = i * n + (j + 1) % n; if (f > 0) id.push(c0, b, a); else id.push(c0, a, b); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(id); g.computeVertexNormals();
    return add(new THREE.Mesh(g, mat));
  }
  const rrect = (w, h, r, nC) => { const pts = [], cs = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 1], [-w / 2 + r, -h / 2 + r, 2], [w / 2 - r, -h / 2 + r, 3]];
    for (const [cx, cy, q] of cs) for (let k = 0; k <= (nC || 4); k++) { const a = (q + k / (nC || 4)) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return pts; };
  const UP = V3(0, 1, 0), tangent = (path, i) => path[Math.min(path.length - 1, i + 1)].clone().sub(path[Math.max(0, i - 1)]).normalize();
  // the bumpers' thick black strips round the nose and the tail at height y (from the arch on one side, across the face, to the other)
  function wrapStrip(y, xArch, front, prof) {
    const pts = [], end = front ? XMAX : XMIN, n = 24;
    for (let k = 0; k <= n; k++) { const x = xArch + (end - xArch) * Math.pow(k / n, 0.8), q = P3(x, pAtY(x, y)); pts.push([x, q[2] + 0.003]); }
    const zc = pts[pts.length - 1][1], face = []; for (let k = 1; k < 12; k++) face.push([end + (front ? 0.003 : -0.003), zc * (1 - 2 * k / 12)]);
    const half = pts.slice(0, -1).concat([[end + (front ? 0.001 : -0.001), zc * 0.985]]);
    const all = half.map(([x, z]) => V3(x, y, z)).concat(face.map(([x, z]) => V3(x, y, z)), half.slice().reverse().map(([x, z]) => V3(x, y, -z)));
    const path = new THREE.CatmullRomCurve3(front ? all : all.reverse(), false, 'centripetal').getSpacedPoints(HI ? 220 : 140);
    sweep(path, prof, M.satin, (i) => ({ n: tangent(path, i).cross(UP).normalize(), b: UP }), (i) => { const t = Math.min(i, path.length - 1 - i) / 10; return [t >= 1 ? 1 : 0.35 + 0.65 * t, 1]; });
  }
  const stripProf = rrect(0.03, 0.1, 0.014, 5).map(([u, v]) => [u + 0.006, v]);
  wrapStrip(0.49, 1.53, true, stripProf); wrapStrip(0.64, -1.68, false, stripProf);
  for (const sd of [-1, 1]) {   // the black rubbing strips along the doors (rising to the back)
    const path = []; for (let k = 0; k <= 40; k++) { const x = -0.955 + (0.78 + 0.955) * k / 40, y = 0.6035 + (0.5425 - 0.6035) * k / 40, q = P3(x, pAtY(x, y)); path.push(V3(x, y, sd * (q[2] + 0.002))); }
    if (sd < 0) path.reverse();
    sweep(path, rrect(0.016, 0.05, 0.007, 4).map(([u, v]) => [u + 0.004, v]), M.satin, (i) => ({ n: tangent(path, i).cross(UP).normalize(), b: UP }),
      (i) => { const t = Math.min(i, path.length - 1 - i) / 4; return [t >= 1 ? 1 : 0.3 + 0.7 * t, t >= 1 ? 1 : 0.6 + 0.4 * t]; });
  }

  // ---------------- the nose: the wide mouth (a gloss frame, a honeycomb, two chrome slats), the slim grille with a plain oval badge,
  //                  the splitter lip; the lamps: fog lamps, projectors with LED rings, the LED brows, the tail lamps' light guides ----------------
  const shapeFrom = (pts) => { const s = new THREE.Shape(); pts.forEach(([a, b], i) => i ? s.lineTo(a, b) : s.moveTo(a, b)); s.closePath(); return s; };
  const onFace = (geo, x, y, dir, mat) => { const m = add(new THREE.Mesh(geo, mat)); m.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(x, y, 0); return m; };
  const ext = (pts, depth, bevel, segs) => new THREE.ExtrudeGeometry(shapeFrom(pts), bevel ? { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: segs || 2 } : { depth, bevelEnabled: false });
  { const sh = shapeFrom(rrect(0.80, 0.215, 0.05, 6)); sh.holes.push(shapeFrom(rrect(0.74, 0.17, 0.035, 6).reverse()));
    onFace(new THREE.ExtrudeGeometry(sh, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 8 }), XMAX - 0.004, 0.305, 1, M.gloss);
    const hc = mk(512, 128), x = hc.getContext('2d'); x.fillStyle = '#020202'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#3a3d42'; x.lineWidth = 2.2;
    for (let j = -1; j < 12; j++) for (let i = -1; i < 40; i++) { const cx = i * 14 + (j % 2 ? 7 : 0), cy = j * 12; x.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; x.lineTo(cx + Math.cos(a) * 7.6, cy + Math.sin(a) * 7.6); } x.closePath(); x.stroke(); }
    const ht = new THREE.CanvasTexture(hc); ht.encoding = THREE.sRGBEncoding;
    const hg = new THREE.ShapeGeometry(shapeFrom(rrect(0.75, 0.18, 0.036, 6))), pa = hg.attributes.position, u = [];
    for (let i = 0; i < pa.count; i++) u.push(pa.getX(i) / 0.75 + 0.5, pa.getY(i) / 0.18 + 0.5); hg.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    const hm = add(new THREE.Mesh(hg, G.std({ map: ht, roughness: 0.45, metalness: 0.4 }))); hm.rotation.y = Math.PI / 2; hm.position.set(XMAX + 0.001, 0.305, 0);
    for (const dy of [-0.032, 0.032]) onFace(ext(rrect(0.73, 0.02, 0.009, 3), 0.014, 0.003), XMAX + 0.004, 0.305 + dy, 1, M.chrome);
    onFace(ext(rrect(0.53, 0.04, 0.018, 5), 0.006, 0.002), XMAX - 0.002, 0.6, 1, M.chrome);
    onFace(ext(rrect(0.515, 0.03, 0.014, 5), 0.008), XMAX - 0.001, 0.6, 1, M.gloss);
    const ov = []; for (let a = 0; a < 32; a++) { const t = a / 32 * Math.PI * 2; ov.push([Math.cos(t) * 0.042, Math.sin(t) * 0.027]); }
    onFace(ext(ov, 0.006, 0.004, 3), XMAX + 0.004, 0.6, 1, M.chrome);
    onFace(ext(ov.map(([a, b]) => [a * 0.72, b * 0.62]), 0.004), XMAX + 0.012, 0.6, 1, PAINT);
    const lip = []; for (let k = 0; k <= 40; k++) { const z = -0.62 + 1.24 * k / 40; lip.push(V3(XMAX + 0.012 - 0.09 * Math.pow(Math.abs(z) / 0.62, 3), 0.155, z)); }
    sweep(lip, rrect(0.05, 0.016, 0.006, 3).map(([u, v]) => [u - 0.012, v]), M.plastic, (i) => ({ n: tangent(lip, i).cross(UP).normalize().negate(), b: UP }));
  }
  const radial = (stops) => { const c = mk(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const REFL = G.std({ map: radial([[0, '#ffffff'], [0.5, '#c9d0d8'], [0.8, '#6f7780'], [1, '#2a2f35']]), roughness: 0.15, metalness: 0.9 });
  const fogLens = G.phys({ color: lin(0xffffff), roughness: 0.02, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.18 });
  const SEG = HI ? 48 : 28;
  // a round lamp at the surface point (x, p), facing between the surface and forward / back: a black cup sunk into the shell, a chrome
  // reflector, a bezel, the lens (a dome or flat), an LED ring
  function roundLamp(x, p, r, fwd, o) {
    const q = P3(x, p), n = normalAt(x, p), d = n.clone().add(V3(fwd, 0, 0)).normalize(), g = new THREE.Group();
    g.position.set(q[0], q[1], q[2]).addScaledVector(d, o.out || 0.004); g.quaternion.setFromUnitVectors(V3(0, 0, 1), d); car.add(g);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.22, r * 1.22, 0.05, SEG), M.gloss); cup.rotation.x = Math.PI / 2; cup.position.z = -0.026; g.add(cup);
    const ref = new THREE.Mesh(new THREE.CircleGeometry(r * 1.06, SEG), REFL); ref.position.z = 0.0015; g.add(ref);
    const bez = new THREE.Mesh(new THREE.TorusGeometry(r * 1.13, r * 0.1, 8, SEG), o.bezel || M.chrome); bez.position.z = 0.002; g.add(bez);
    if (o.dome) { const l = new THREE.Mesh(new THREE.SphereGeometry(r * 0.72, SEG, 12, 0, Math.PI * 2, 0, 0.9), M.lens); l.rotation.x = Math.PI / 2; l.position.z = -r * 0.32; g.add(l);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, r * 0.075, 6, SEG), M.led); ring.position.z = 0.004; g.add(ring); }
    if (o.lens) { const l = new THREE.Mesh(new THREE.CircleGeometry(r * 1.05, SEG), o.lens); l.position.z = 0.005; g.add(l); }
  }
  function ledStrip(pts, sd, r, mat) {   // an LED strip on the shell along points (x, s) of the band
    const P = pts.map(([x, s]) => { const p = sToP(s, sd), q = P3(x, p); return V3(q[0], q[1], q[2]).addScaledVector(normalAt(x, p), 0.004); });
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P, false, 'centripetal'), HI ? 80 : 48, r, 6, false), mat)); }
  for (const sd of [-1, 1]) {
    roundLamp(1.795, sd > 0 ? pAtY(1.795, 0.30) : 9 - pAtY(1.795, 0.30), 0.036, 0.9, { bezel: M.gloss, lens: fogLens, out: 0.003 });
    for (const [x, s, r] of PROJ) roundLamp(x, sToP(s, sd), r * 0.85, 1.1, { dome: true, out: 0.002 });
    ledStrip([[1.585, 0.95], [1.63, 1.05], [1.69, 1.105], [1.76, 1.115], [1.812, 1.04], [1.842, 0.86], [1.848, 0.66]], sd, 0.0055, M.led);
    ledStrip([[-1.846, 0.665], [-1.77, 0.575], [-1.7, 0.48], [-1.62, 0.375], [-1.56, 0.31]], sd, 0.0065, M.ledTail);
  }

  // ---------------- the mirrors (paint caps, black frames and arms, mirror glass, an amber LED), the wipers ----------------
  const SPH = HI ? [40, 28] : [24, 16];
  function supershape(rx, ry, rz, eF, eB) { const g = new THREE.SphereGeometry(1, SPH[0], SPH[1]), pa = g.attributes.position, f = (v, k) => Math.sign(v) * Math.pow(Math.abs(v), k);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); pa.setXYZ(i, f(x, x < 0 ? eB : eF) * rx, f(y, 0.6) * ry, f(z, 0.55) * rz); } g.computeVertexNormals(); return g; }
  for (const sd of [-1, 1]) {
    add(new THREE.Mesh(supershape(0.06, 0.055, 0.082, 0.75, 0.25), PAINT)).position.set(0.47, 0.975, sd * 0.875);
    const gl = add(new THREE.Mesh(new THREE.ShapeGeometry(shapeFrom(rrect(0.14, 0.088, 0.03, 5))), M.mirror)); gl.rotation.y = -Math.PI / 2; gl.position.set(0.47 - 0.062, 0.975, sd * 0.875);
    const fr = add(new THREE.Mesh(new THREE.ShapeGeometry(shapeFrom(rrect(0.156, 0.102, 0.036, 5))), M.satin)); fr.rotation.y = -Math.PI / 2; fr.position.set(0.47 - 0.0605, 0.975, sd * 0.875);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.08), M.satin)).position.set(0.49, 0.94, sd * 0.79);
    const led = add(new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.008, 0.07), M.amber)); led.position.set(0.52, 0.952, sd * 0.905); led.rotation.y = sd * 0.5;
  }
  const onTop = (x, z, lift) => { const q = P3(x, pAtZ(x, z)); return V3(q[0], q[1] + lift, q[2]); };
  function bar(a, b, w, h, mat) { const d = b.clone().sub(a), m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d.length()), mat)); m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); return m; }
  for (const z of [-0.36, 0.2]) { const a = onTop(0.985, z - 0.26, 0.012), b = onTop(0.925, z + 0.26, 0.012); bar(a, b, 0.012, 0.016, M.satin); bar(a.clone().add(V3(0.012, 0.01, 0)), b.clone().add(V3(0.012, 0.01, 0)), 0.006, 0.008, M.satin); }
  bar(onTop(-1.66, -0.04, 0.012), onTop(-1.55, 0.3, 0.012), 0.012, 0.014, M.satin);

  // ---------------- the tail: the roof spoiler (its ends down onto the C-pillars, a third brake light under its edge), the gloss garnish,
  //                  the plain oval badge, the diffuser, the red fog lamp, the exhaust ----------------
  { const x0 = -1.285, path = [], fr = [];
    for (let k = 0; k <= 60; k++) { const p = 2.92 + 3.16 * k / 60, q = P3(x0, p), n = normalAt(x0, p); path.push(V3(q[0], q[1], q[2]).addScaledVector(n, 0.004)); fr.push({ n: V3(-1, 0, 0).addScaledVector(n, n.x).normalize(), b: n }); }
    const L0 = 0.19, pr = [[0, 0], [0.01, -0.006], [L0 * 0.5, -0.004], [L0, -0.014], [L0 + 0.004, -0.008], [L0, -0.002], [L0 * 0.5, 0.02], [0.03, 0.026], [0.006, 0.018]];
    sweep(path, pr, M.roof, (i) => fr[i], (i) => { const t = Math.min(i, 60 - i) / 14, k = t >= 1 ? 1 : 0.35 + 0.65 * Math.sin(t * Math.PI / 2); return [k, 0.6 + 0.4 * k]; });
    const c = P3(x0, 4.5); add(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.006, 0.34), M.red)).position.set(c[0] - L0 + 0.004, c[1] - 0.008, 0); }
  const faceX = (y, x0, x1) => { let a = x0, b = x1; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (P3(m, 4.5)[1] < y) a = m; else b = m; } return (a + b) / 2; };
  { onFace(ext(rrect(0.62, 0.05, 0.012, 4), 0.008, 0.002), faceX(0.86, -1.90, -1.874) - 0.002, 0.86, -1, M.gloss);
    const ov = []; for (let a = 0; a < 32; a++) { const t = a / 32 * Math.PI * 2; ov.push([Math.cos(t) * 0.034, Math.sin(t) * 0.022]); }
    onFace(ext(ov, 0.004, 0.003), faceX(0.925, -1.90, -1.80) - 0.004, 0.927, -1, M.chrome);
    onFace(ext(rrect(0.66, 0.05, 0.018, 4), 0.004, 0.002), XMIN + 0.001, 0.315, -1, M.plastic);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.1), M.red)).position.set(XMIN - 0.018, 0.375, 0);
    const ex = new THREE.Group(); ex.position.set(XMIN - 0.025, 0.272, -0.43); car.add(ex);
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.16, SEG, 1, true), M.chrome); t1.rotation.z = Math.PI / 2; t1.position.x = 0.07; ex.add(t1);
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.039, 0.004, 8, SEG), M.chrome); t2.rotation.y = Math.PI / 2; t2.position.x = -0.01; ex.add(t2);
    const t3 = new THREE.Mesh(new THREE.CircleGeometry(0.036, SEG), M.black); t3.rotation.y = -Math.PI / 2; t3.position.x = 0.01; ex.add(t3); }

  // ---------------- the wheel arches' tubs, the floor, the cabin (seats with a red middle, the bench, the dashboard, the wheel) ----------------
  for (const c of AXLES) for (const sd of [-1, 1]) { const v = [], id = [], N = 32;
    for (let k = 0; k <= N; k++) { const a = -0.12 + (Math.PI + 0.24) * k / N, x = c + Math.cos(a) * (ARCH_R - 0.004), y = RW + Math.sin(a) * (ARCH_R - 0.004); v.push(x, y, sd * 0.42, x, y, sd * 0.86); if (k) { const o = (k - 1) * 2; id.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(id); g.computeVertexNormals(); add(new THREE.Mesh(g, M.black)); }
  add(new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.03, 1.3), M.black)).position.set(-0.1, 0.24, 0);
  { const soft = (x, y, z, rx, ry, rz, mat, rot) => { const m = add(new THREE.Mesh(supershape(rx, ry, rz, 0.45, 0.45), mat)); m.position.set(x, y, z); if (rot) m.rotation.z = rot; };
    for (const sd of [-1, 1]) { const z = sd * 0.36; soft(-0.36, 0.5, z, 0.25, 0.06, 0.24, M.cabin); soft(-0.64, 0.82, z, 0.06, 0.31, 0.24, M.cabin, -0.25); soft(-0.6, 0.82, z, 0.05, 0.25, 0.1, M.seatRed, -0.25);
      for (const zz of [-0.19, 0.19]) soft(-0.6, 0.85, z + zz, 0.07, 0.28, 0.05, M.cabin, -0.25); soft(-0.73, 1.18, z, 0.05, 0.08, 0.13, M.cabin, -0.25); }
    soft(-0.98, 0.5, 0, 0.25, 0.06, 0.6, M.cabin); soft(-1.18, 0.78, 0, 0.06, 0.26, 0.6, M.cabin, -0.3); soft(0.58, 0.74, 0, 0.16, 0.13, 0.71, M.cabin); soft(0.36, 0.86, -0.36, 0.08, 0.04, 0.16, M.cabin);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.2), M.cabin)).position.set(0.2, 0.45, 0); add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 1.5), M.cabin)).position.set(0, 0.3, 0);
    const sw = add(new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, SEG), M.cabin)); sw.position.set(0.22, 0.88, -0.36); sw.rotation.set(0, Math.PI / 2, 0.35); }

  // ---------------- the wheels: a rounded tyre with a tread, a concave five-twin-spoke alloy with a machined lip, the hub, the
  //                  drilled disc, a red calliper ----------------
  const tread = (() => { const c = mk(512, 128), x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 128);
    x.fillStyle = '#1a1a1a'; for (const v of [48, 61, 67, 80]) x.fillRect(0, v - 1.5, 512, 3);
    x.strokeStyle = '#3a3a3a'; x.lineWidth = 1.5; for (let i = 0; i < 512; i += 8) for (const [a, b] of [[40, 46], [50, 59], [68, 77], [81, 88]]) { x.beginPath(); x.moveTo(i, a); x.lineTo(i + 3, b); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t; })();
  const W = { tyre: G.std({ color: lin(0x1b1b1c), roughness: 0.88, metalness: 0, bumpMap: tread, bumpScale: 0.6 }), rim: G.std({ color: lin(0xc4c8cd), roughness: 0.28, metalness: 0.85, side: THREE.DoubleSide }),
    dark: G.std({ color: lin(0x2c2f33), roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide }), lip: G.std({ color: lin(0xeef0f2), roughness: 0.12, metalness: 1 }),
    cap: G.phys({ color: lin(0x0b0b0c), roughness: 0.15, clearcoat: 1 }), cal: G.phys({ color: lin(0xc0141a), roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }) };
  { const dc = mk(256, 256), dx = dc.getContext('2d'), gr = dx.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, '#3a3c40'); gr.addColorStop(0.42, '#3a3c40'); gr.addColorStop(0.45, '#9a9ea4'); gr.addColorStop(1, '#8a8e94'); dx.fillStyle = gr; dx.fillRect(0, 0, 256, 256);
    dx.fillStyle = '#111'; for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2, r = 70 + (k % 3) * 16; dx.beginPath(); dx.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3.2, 0, 7); dx.fill(); }
    const dt = new THREE.CanvasTexture(dc); dt.encoding = THREE.sRGBEncoding; W.disc = G.std({ map: dt, roughness: 0.42, metalness: 0.85 }); }
  const WS = HI ? 96 : 56, spoke = (() => {   // (one spoke, concave: the hub sunk 3.5 cm under the lip)
    const s = new THREE.Shape(); s.moveTo(0.05, -0.016); s.lineTo(0.19, -0.013); s.quadraticCurveTo(0.196, 0, 0.19, 0.013); s.lineTo(0.05, 0.016); s.quadraticCurveTo(0.045, 0, 0.05, -0.016);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: HI ? 3 : 1, curveSegments: HI ? 6 : 2, steps: 1 }), pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const r = Math.hypot(pa.getX(i), pa.getY(i)); pa.setZ(i, pa.getZ(i) + 0.052 - 0.04 * Math.pow(1 - clamp((r - 0.05) / 0.14, 0, 1), 1.4)); } g.computeVertexNormals(); return g; })();
  function wheel(disc) {
    const g = new THREE.Group(), put = (m) => { g.add(m); return m; };
    const tp = [[0.214, -0.094], [0.24, -0.1], [0.275, -0.104], [0.302, -0.1], [0.315, -0.09], [0.32, -0.075], [0.321, -0.04], [0.321, 0.04], [0.32, 0.075], [0.315, 0.09], [0.302, 0.1], [0.275, 0.104], [0.24, 0.1], [0.214, 0.094]];
    put(new THREE.Mesh(new THREE.LatheGeometry(tp.map(([r, y]) => new THREE.Vector2(r, y)), WS), W.tyre)).rotation.x = Math.PI / 2;
    const br = put(new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.17, WS, 1, true), W.dark)); br.rotation.x = Math.PI / 2; br.position.z = -0.01;
    put(new THREE.Mesh(new THREE.LatheGeometry([[0.186, 0.058], [0.2, 0.074], [0.214, 0.084], [0.221, 0.09], [0.219, 0.097], [0.208, 0.099], [0.196, 0.094]].map(([r, y]) => new THREE.Vector2(r, y)).reverse(), WS), W.lip)).rotation.x = Math.PI / 2;
    put(new THREE.Mesh(new THREE.LatheGeometry([[0.172, 0.03], [0.188, 0.06], [0.196, 0.094]].map(([r, y]) => new THREE.Vector2(r, y)).reverse(), WS), W.rim)).rotation.x = Math.PI / 2;
    for (let k = 0; k < 5; k++) for (const da of [-0.075, 0.075]) { const a = k * Math.PI * 2 / 5 + da; put(new THREE.Mesh(spoke, W.rim)).rotation.z = a;
      if (HI) { const f = put(new THREE.Mesh(spoke, W.lip)); f.scale.set(1, 0.35, 1); f.position.z = 0.0035; f.rotation.z = a; } }   // (Visoki: the machined face along each spoke)
    const hub = put(new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.072, 0.03, SEG), W.rim)); hub.rotation.x = Math.PI / 2; hub.position.z = 0.024;
    const cap = put(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, SEG), W.cap)); cap.rotation.x = Math.PI / 2; cap.position.z = 0.042;
    put(new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.003, 6, SEG), W.lip)).position.z = 0.048;
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 + Math.PI / 5, n = put(new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.014, 6), M.chrome)); n.rotation.x = Math.PI / 2; n.position.set(Math.cos(a) * 0.048, Math.sin(a) * 0.048, 0.044); }
    if (disc) { const d = put(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.024, WS), W.disc)); d.rotation.x = Math.PI / 2; d.position.z = -0.03; }
    return g;
  }
  for (const c of AXLES) for (const sd of [-1, 1]) {
    const w = wheel(true); w.position.set(c, RW, sd * HUBZ); if (sd < 0) w.rotation.y = Math.PI; w.rotation.z = sd * (c > 0 ? 0.6 : 1.9); car.add(w);
    const sh = new THREE.Shape(), a0 = 2.35, a1 = 3.1; for (let k = 0; k <= 12; k++) { const a = a0 + (a1 - a0) * k / 12; sh[k ? 'lineTo' : 'moveTo'](Math.cos(a) * 0.178, Math.sin(a) * 0.178); }
    for (let k = 12; k >= 0; k--) { const a = a0 + (a1 - a0) * k / 12; sh.lineTo(Math.cos(a) * 0.112, Math.sin(a) * 0.112); }
    const cg = new THREE.Group(); cg.position.set(c, RW, sd * (HUBZ - 0.012)); car.add(cg);
    const cm = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), W.cal); cm.position.z = sd > 0 ? -0.03 : 0.03; if (sd < 0) cm.rotation.y = Math.PI; if (c < 0) cm.scale.x = -1; cg.add(cm);
  }

  // ---------------- the roof rack: a black basket on two load bars (feet on the roof's edges), a wind deflector at its front, four slotted
  //                  aluminium rails along its floor (the places for what goes on it later); on it the spare wheel (the car's own, lying
  //                  flat) and two 20-litre fuel cans side by side (red, no marks; the X pressed in, three handles and the spout outwards),
  //                  strapped down with orange straps ----------------
  { const blk = G.std({ color: lin(0x121314), roughness: 0.42, metalness: 0.45 });
    const st = mk(512, 32), sx = st.getContext('2d'); sx.fillStyle = '#b4b9be'; sx.fillRect(0, 0, 512, 32); sx.fillStyle = '#26292c';
    for (let i = 0; i < 26; i++) { const x = 9 + i * 19.3; sx.beginPath(); sx.arc(x, 16, 4.5, Math.PI / 2, Math.PI * 1.5); sx.arc(x + 7, 16, 4.5, -Math.PI / 2, Math.PI / 2); sx.closePath(); sx.fill(); }
    const stt = new THREE.CanvasTexture(st); stt.encoding = THREE.sRGBEncoding; const alu = G.std({ map: stt, roughness: 0.35, metalness: 0.8 });
    const tube = (a, b, r) => { const d = b.clone().sub(a), m = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), HI ? 12 : 8), blk)); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); };
    const box = (x, y, z, a, b, c, mat) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(a, b, c), mat)); m.position.set(x, y, z); return m; };
    const Y0 = 1.53, X0 = -1.18, X1 = 0.1, ZW = 0.5, YT = 1.6, RY = Y0 + 0.015;
    for (const x of [-0.98, -0.08]) { for (const sd of [-1, 1]) { const z = sd * 0.46, y = P3(x, pAtZ(x, z))[1]; box(x, (y + Y0 - 0.02) / 2, z, 0.08, Y0 - 0.02 - y, 0.05, blk); box(x, y + 0.006, z, 0.11, 0.012, 0.07, M.plastic); }
      box(x, Y0 - 0.02, 0, 0.065, 0.024, 1.14, blk); }
    const C = [V3(X0, Y0, -ZW), V3(X1, Y0, -ZW), V3(X1, Y0, ZW), V3(X0, Y0, ZW)];
    for (let i = 0; i < 4; i++) tube(C[i], C[(i + 1) % 4], 0.012);
    for (const sd of [-1, 1]) { tube(V3(X0, YT, sd * ZW), V3(X1 - 0.04, YT, sd * ZW), 0.011); tube(V3(X1 - 0.04, YT, sd * ZW), V3(X1 + 0.03, Y0 + 0.02, sd * ZW), 0.011);
      for (let x = X0; x <= X1 - 0.05; x += 0.16) tube(V3(x, Y0, sd * ZW), V3(x, YT, sd * ZW), 0.0075); }
    tube(V3(X0, YT, -ZW), V3(X0, YT, ZW), 0.011); for (let z = -ZW; z <= ZW + 1e-6; z += 0.2) tube(V3(X0, Y0, z), V3(X0, YT, z), 0.0075);
    box(X1 + 0.035, Y0 + 0.045, 0, 0.004, 0.1, 2 * ZW, blk).rotation.z = -0.55;
    for (const x of [-1.1, -0.64, -0.18]) tube(V3(x, Y0, -ZW), V3(x, Y0, ZW), 0.01);
    for (const z of [-0.36, -0.12, 0.12, 0.36]) box((X0 + X1) / 2, Y0 + 0.009, z, X1 - X0 - 0.02, 0.012, 0.045, alu);
    const strapMat = G.std({ color: lin(0xf0a21a), roughness: 0.7 }), buckle = G.std({ color: lin(0x8d949b), roughness: 0.3, metalness: 0.9 });
    const strap = (x, top, half) => { const P = [V3(x, Y0 + 0.004, -ZW + 0.02), V3(x, top, -half), V3(x, top + 0.004, half), V3(x, Y0 + 0.004, ZW - 0.02)];
      for (let i = 0; i < 3; i++) bar(P[i], P[i + 1], 0.034, 0.004, strapMat); add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.06), buckle)).position.copy(P[2]).lerp(P[3], 0.45); };
    const sp = wheel(false); sp.rotation.x = -Math.PI / 2; sp.position.set(-0.8, RY + 0.105, 0); car.add(sp);
    for (const dx of [-0.13, 0.13]) strap(-0.8 + dx, RY + 0.215, Math.sqrt(0.32 * 0.32 - dx * dx) - 0.02);
    const canMat = G.std({ color: lin(0xb3141b), roughness: 0.48, metalness: 0.35 }), capMat = G.std({ color: lin(0x1b1c1e), roughness: 0.5 });
    const rbox = (hx, hy, hz, e) => { const g = new THREE.SphereGeometry(1, SPH[0], SPH[1]), pa = g.attributes.position, f = (v) => Math.sign(v) * Math.pow(Math.abs(v), e);
      for (let i = 0; i < pa.count; i++) pa.setXYZ(i, f(pa.getX(i)) * hx, f(pa.getY(i)) * hy, f(pa.getZ(i)) * hz); g.computeVertexNormals(); return g; };
    for (const sd of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(-0.2, RY + 0.0825, sd * 0.19); car.add(g);
      const pc = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; }, slab = (a, b, c) => new THREE.BoxGeometry(a, b, c);
      pc(new THREE.Mesh(rbox(0.235, 0.0825, 0.1725, 0.22), canMat), 0, 0, 0);
      for (const a of [-0.63, 0.63]) pc(new THREE.Mesh(slab(0.47, 0.01, 0.028), canMat), 0, 0.082, 0).rotation.y = a;
      for (const [w, d, x, z] of [[0.42, 0.016, 0, 0.145], [0.42, 0.016, 0, -0.145], [0.016, 0.29, 0.205, 0], [0.016, 0.29, -0.205, 0]]) pc(new THREE.Mesh(slab(w, 0.008, d), canMat), x, 0.08, z);
      for (const x of [-0.11, 0, 0.11]) { const z0 = sd * 0.1725; pc(new THREE.Mesh(slab(0.022, 0.012, 0.035), canMat), x, 0.04, z0 + sd * 0.015); pc(new THREE.Mesh(slab(0.022, 0.012, 0.035), canMat), x, -0.04, z0 + sd * 0.015);
        pc(new THREE.Mesh(slab(0.022, 0.092, 0.014), canMat), x, 0, z0 + sd * 0.032); }
      pc(new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.045, 16), capMat), 0.19, 0.02, sd * 0.19).rotation.x = sd * Math.PI / 2;
      pc(new THREE.Mesh(slab(0.05, 0.012, 0.02), buckle), 0.19, 0.045, sd * 0.2);
    }
    strap(-0.2, RY + 0.169, 0.36);
  }

  // ---------------- the contact shadow on the turntable: one soft patch under the car, a darker one under each tyre (one mesh) ----------------
  const blob = (() => { const c = mk(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 5, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.55, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const P = [], T = [], quad = (cx, cz, w, d, y) => { const a = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]; for (const [u, v] of a) { P.push(cx + u * w / 2, y, cz - v * d / 2); T.push((u + 1) / 2, (v + 1) / 2); } };
    quad(0, 0, 4.8, 2.5, 0.006); for (const cx of AXLES) for (const sd of [-1, 1]) quad(cx, sd * HUBZ, 0.5, 0.36, 0.007);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2));
    return add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }))); })();

  return { grp: car, body, blob, keep: [lining] };
});
