/* Deli iz garaže, sklop 2 · spredaj: aero, hauba, maska, zmigavci, relijske_luci. Each element registers its 16 options with DELI.add(id,
   build(K, n, m, M)) (js/deli.js; the contract: docs/deli.md). Loaded after js/deli.js, before the cars. The mounts (look units):
     aero: { xf, xr: the bumpers' faces (front, rear), w: their half width, yf, yr: their foot's height, sill: [x0, x1] between the arches,
             ws: the side's half width there, ys: the sill's foot, lipF, lipR: the stock lips under the bumpers [cx, cy, sx, sy, sz] (an option
             without a piece of its own there keeps them), partF, partR (the bumpers' parts), exh: [z, r] the exhaust (no piece over it) }
     hauba: { x0, x1: the bonnet's top from the cowl to its front edge, w: its half width (its shut lines) }: in the bonnet's part
     maska: { x, y0, lean: the face between the lamps (x at y0, leaning back lean per metre up), yc: the grille's middle, w, h: its room }
     zmigavci: { front: { x, y, z, w, h, part }, side: { x, y, z, host }, rear: { x, y, z, part }, mirror: { x, y, z, w, parts } }: the
             indicators on the front bumper, the repeaters on the fenders (z out from the middle), the rear's on the rear bumper, the
             mirrors' housings' front faces
     relijske_luci: { bumper: [x, y, z], nose: [x, y], intake: [x, y, w, h], roof: [x, w], pod: [x, y0, y1, w], part }: the bumper's face
             with the lamps' middle, the face between the head lamps, the lower intake, the roof's front edge, the pod over the nose
   Every option is a few primitives in the body's material; the details (bulbs, rivets, the weave's finer cells) only on Visoki (K.hi). */
(function () {
  'use strict';
  if (typeof DELI === 'undefined') return;
  const CF = [0.075, 0.078, 0.085], CF2 = [0.105, 0.11, 0.12], CFW = [0.094, 0.097, 0.106], AL = [0.74, 0.76, 0.8], ALB = [0.58, 0.6, 0.64], DK = [0.09, 0.09, 0.1], BP = [0.06, 0.06, 0.065], GR = [0.16, 0.16, 0.17];
  const RED = [0.78, 0.09, 0.07], AMB = [1, 0.6, 0.1], AMB2 = [0.62, 0.34, 0.05], WHITE = [1, 1, 1], ICE = [0.78, 0.9, 1];
  const seg = (K, k) => DELI.seg(K, k);
  // a flat convex polygon facing out (its winding turned to the side out points to)
  const fc = (K, pts, col, out, o) => { const [a, b, c] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; K.face(nn[0] * out[0] + nn[1] * out[1] + nn[2] * out[2] < 0 ? pts.slice().reverse() : pts, col, o); };
  // a disc of radius r round c, facing ax (a unit vector)
  const basis = (ax) => { const s = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], p = [s[1] * ax[2] - s[2] * ax[1], s[2] * ax[0] - s[0] * ax[2], s[0] * ax[1] - s[1] * ax[0]], l = Math.hypot(p[0], p[1], p[2]);
    const e1 = [p[0] / l, p[1] / l, p[2] / l]; return [e1, [ax[1] * e1[2] - ax[2] * e1[1], ax[2] * e1[0] - ax[0] * e1[2], ax[0] * e1[1] - ax[1] * e1[0]]]; };
  const disc = (K, c, ax, r, k, col, o) => { const [e1, e2] = basis(ax);
    fc(K, Array.from({ length: k }, (_, i) => { const a = (i + 0.5) / k * Math.PI * 2, cs = Math.cos(a) * r, sn = Math.sin(a) * r; return [c[0] + e1[0] * cs + e2[0] * sn, c[1] + e1[1] * cs + e2[1] * sn, c[2] + e1[2] * cs + e2[2] * sn]; }), col, ax, o); };
  const add3 = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  // a round lamp: its housing back from the front's middle c along -ax, the bezel (rim) and the lens on its front; on Visoki the reflector
  // and the bulb in it. o: { part, host }; q: { d (the housing's depth), k (segments), cover (a cover's colour over the lens) }
  const lamp = (K, c, ax, r, house, lens, rim, o, q) => { q = q || {}; const k = q.k || seg(K, 12);
    K.cyl(add3(c, ax, -(q.d || 0.05)), add3(c, ax, -0.002), r, house, Object.assign({ n: k, capA: house, capB: null }, o));
    disc(K, add3(c, ax, 0.0005), ax, r, k, rim, o);
    if (q.cover) { disc(K, add3(c, ax, 0.004), ax, r * 0.93, k, q.cover, o); return; }
    disc(K, add3(c, ax, 0.002), ax, r * 0.84, k, lens, o);
    if (K.hi) { disc(K, add3(c, ax, 0.0028), ax, r * 0.42, Math.max(6, k - 4), [Math.min(1, lens[0] * 0.8 + 0.2), Math.min(1, lens[1] * 0.8 + 0.2), Math.min(1, lens[2] * 0.8 + 0.2)], o);
      disc(K, add3(c, ax, 0.0036), ax, r * 0.14, 6, [1, 0.98, 0.9], o); } };

  // ================================================================ aero: the kit round the car's foot (the bumpers' lips, the skirts, the
  // diffuser, the arches' flares), in place of the stock lips under the bumpers
  function aero(K, n, m) {
    const P = K.paint, xf = m.xf, xr = m.xr, W = m.w, yf = m.yf, yr = m.yr, s0 = m.sill[0], s1 = m.sill[1], ws = m.ws, ys = m.ys;
    const oF = { part: m.partF || 'bumperF' }, oR = { part: m.partR || 'bumperR' }, oS = { part: 'body' }, ez = m.exh ? Math.abs(m.exh[0]) - m.exh[1] - 0.03 : W;   // (ez: the rear's middle pieces end short of the exhaust)
    const stock = (b, o) => K.box(b[0], b[1], 0, b[2], b[3], b[4], 0, BP, null, false, o);
    // the front lip under the bumper's face: d out in front of it, h under its foot (ends drawn back and thinner)
    const lip = (col, d, h, o2) => { o2 = o2 || {}; const ring = (z, k) => [[xf - 0.12, yf + 0.004], [xf + 0.004, yf + 0.03], [xf + d * k, yf - h * 0.35], [xf + d * k - 0.006, yf - h * k], [xf - 0.12, yf - h * k + 0.008]].map(([x, y]) => [x, y, z]);
      const zs = K.hi ? [-W, -W * 0.9, -W * 0.5, W * 0.5, W * 0.9, W] : [-W, -W * 0.88, W * 0.88, W], ks = K.hi ? [0.45, 1, 1, 1, 1, 0.45] : [0.45, 1, 1, 0.45];
      K.skin(zs.map((z, i) => ring(z * 0.985, ks[i])), (k, e) => e === 2 && o2.edge ? o2.edge : col, col, col, oF); };
    // a flat splitter blade under the bumper, d out in front, with the face down to it; endplates
    const splitter = (col, d, ep, edge) => { const y = yf - 0.06, Wz = W + 0.015;
      K.plate([[xf - 0.12, y, -Wz], [xf - 0.12, y, Wz], [xf + d, y, Wz - 0.05], [xf + d, y, -Wz + 0.05]], 0.012, col, oF);
      fc(K, [[xf + 0.002, y + 0.006, -W + 0.02], [xf + 0.002, y + 0.006, W - 0.02], [xf + 0.002, yf + 0.006, W - 0.02], [xf + 0.002, yf + 0.006, -W + 0.02]], col === P ? K.shade(P, 0.5) : BP, [1, 0, 0], oF);
      if (edge) K.rect(xf + d + 0.0005, y, 0, 2 * (Wz - 0.05), 0.012, edge, oF);
      if (ep) for (const sd of [-1, 1]) K.endplate([[xf - 0.08, y + 0.006], [xf + d - 0.005, y + 0.006], [xf + d - 0.03, y + 0.06], [xf - 0.08, y + 0.1]], sd * (Wz - 0.012), 0.01, ep, oF); };
    // canards on the bumper's corners (k a side, the lower one first)
    const canards = (col, k) => { for (const sd of [-1, 1]) for (let i = 0; i < k; i++) { const y = 0.3 + i * 0.075;
      K.plate([[xf + 0.004, y, sd * (W - 0.05)], [xf + 0.004, y, sd * (W + 0.035)], [xf - 0.13, y + 0.045, sd * (W + 0.01)]], 0.008, col, oF); } };
    // the skirts along the sills between the arches: out past the side, h under the sill's foot
    const skirts = (col, out, h, line) => { for (const sd of [-1, 1]) { const pr = (x, k) => [[ws - 0.012, ys + 0.115], [ws + out * k, ys + 0.1], [ws + out * k + 0.004, ys + 0.012], [ws + out * k - 0.012, ys - h * k], [ws - 0.07, ys - h * k + 0.006]].map(([z, y]) => [x, y, sd * z]);
      const xs = K.hi ? [s0, s0 + 0.05, s1 - 0.05, s1] : [s0, s1], ks = K.hi ? [0.4, 1, 1, 0.4] : [1, 1];
      K.skin(xs.map((x, i) => pr(x, ks[i])), col, col, col, oS);
      if (line) { const z = sd * (ws + out + 0.0045), xa = s0 + 0.05, xb = s1 - 0.05; fc(K, [[xa, ys + 0.028, z], [xb, ys + 0.028, z], [xb, ys + 0.042, z], [xa, ys + 0.042, z]], line, [0, 0, sd], oS); } } };
    // the rear: the lips at its corners (clear of the exhaust), a diffuser in its middle with k fins
    const rearLips = (col) => { for (const sd of [-1, 1]) { const za = sd < 0 && m.exh && m.exh[0] < 0 ? ez + 0.02 : 0.36, ring = (z) => [[xr + 0.12, yr + 0.004], [xr - 0.004, yr + 0.03], [xr - 0.028, yr - 0.02], [xr - 0.02, yr - 0.045], [xr + 0.12, yr - 0.04]].map(([x, y]) => [x, y, sd * z]);
      K.skin([ring(za), ring(W * 0.985)], col, col, col, oR); } };
    const diffuser = (col, k, fin) => { const D = Math.min(0.36, ez), y = yr - 0.05;
      K.box(xr + 0.06, y + 0.035, 0, 0.13, 0.045, 2 * W - 0.15, 0, BP, null, false, oR);   // (the valance: the diffuser's channel set into it)
      K.plate([[xr + 0.2, y, -D], [xr + 0.2, y, D], [xr - 0.02, y + 0.075, D], [xr - 0.02, y + 0.075, -D]], 0.01, col, oR);
      for (let i = 0; i < k; i++) { const z = -D * 0.82 + 2 * D * 0.82 * i / (k - 1);
        K.endplate([[xr + 0.17, y - 0.002], [xr + 0.04, y - 0.03], [xr - 0.026, y - 0.03], [xr - 0.02, y + 0.072]], z, 0.008, fin || col, oR); } };
    // the arches' flares (bolt-on, rivets on Visoki)
    const flares = (col, out) => { for (const A of K.arches) for (const sd of [-1, 1]) {
      K.flare(A.x, A.r - 0.012, A.r + 0.07, sd * (ws - 0.004), sd * (ws + out), col, { n: 5, y: A.y, part: 'body' });
      if (K.hi) for (let i = 0; i < 5; i++) { const a = 0.35 + (Math.PI - 0.7) * i / 4, r = A.r + 0.035; K.rect(A.x + Math.cos(a) * r / K.sx, A.y + Math.sin(a) * r, sd * (ws + out + 0.001), 0.012, 0.012, [0.8, 0.81, 0.84], { dir: sd < 0 ? '-z' : 'z', part: 'body' }); } } };
    const keepF = () => stock(m.lipF, oF), keepR = () => stock(m.lipR, oR);
    const D2 = K.shade(P, 0.5);
    switch (n) {
      case 1: lip(BP, 0.035, 0.035); keepR(); break;                                   // sprednji spojler
      case 2: keepF(); skirts(BP, 0.022, 0.012); keepR(); break;                       // pragovi
      case 3: lip(BP, 0.035, 0.035); skirts(BP, 0.022, 0.012); keepR(); break;         // spojler in pragovi
      case 4: keepF(); diffuser(BP, 4, GR); break;                                      // difuzor
      case 5: case 6: { const c = n === 6 ? P : GR;                                    // cestni (lakiran: in the body's paint)
        lip(c, 0.045, 0.045); skirts(c, 0.03, 0.02); rearLips(c); keepR(); break; }
      case 7: case 8: { const c = n === 8 ? P : GR;                                    // športni: a deeper lip with a black blade, the skirts' step, a diffuser
        lip(c, 0.06, 0.055, { edge: BP }); skirts(c, 0.038, 0.03, BP); rearLips(c); diffuser(BP, 3); break; }
      case 9: splitter(BP, 0.09, BP); canards(BP, 1); skirts(BP, 0.04, 0.03); diffuser(BP, 4, GR); break;   // dirkalni
      case 10: lip(BP, 0.045, 0.045); skirts(BP, 0.075, 0.02); flares(BP, 0.075); rearLips(BP); keepR(); break;   // široki
      case 11: case 12: { const c = n === 12 ? P : BP;                                 // paket GT (lakiran: the blades black)
        lip(c, 0.05, 0.03); splitter(BP, 0.11, c); canards(c, 2); skirts(c, 0.045, 0.035, n === 12 ? BP : null); diffuser(BP, 4, n === 12 ? D2 : GR); break; }
      case 13: lip(CF, 0.045, 0.045); skirts(CF, 0.03, 0.02); rearLips(CF); keepR(); break;                          // karbonski cestni
      case 14: splitter(CF, 0.11, CF2); canards(CF, 2); skirts(CF, 0.045, 0.035); diffuser(CF, 4, CF2); break;      // karbonski GT
      case 15: lip(CF, 0.05, 0.045); skirts(CF, 0.075, 0.025); flares(CF, 0.075); diffuser(CF, 3, CF2); break;      // karbonski široki
      case 16: splitter(CF, 0.12, CF2, RED); canards(CF, 2); skirts(CF, 0.075, 0.035, RED); flares(CF, 0.075); diffuser(CF, 3, CF2); break;   // karbonski dirkalni
    }
  }

  // ================================================================ hauba: the bonnet's top in its own material, its vents, scoops and pins
  // (in place of the stock scoop; in the bonnet's part, it opens and flies off with it)
  function hauba(K, n, m) {
    const P = K.paint, X0 = m.x0, X1 = m.x1, W = m.w, T = (x, z) => K.topY(x, z), up = [0, 1, 0];
    const pt = (x, z, l) => [x, T(x, z) + l, z];
    // a skin of the bonnet's top over [xa, xb] x [za, zb] (nx by nz cells, col(i, j)), lift off the paint
    // (c2: each cell's two triangles in two shades, alternating: carbon's twill)
    const top = (xa, xb, za, zb, col, lift, nx, nz, c2) => { for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x0 = xa + (xb - xa) * i / nx, x1 = xa + (xb - xa) * (i + 1) / nx, z0 = za + (zb - za) * j / nz, z1 = za + (zb - za) * (j + 1) / nz;
      const A = pt(x0, z0, lift), B = pt(x1, z0, lift), C = pt(x1, z1, lift), D = pt(x0, z1, lift);
      if (!c2) { fc(K, [A, B, C, D], col, up); continue; }
      const f = (i + j) % 2; fc(K, f ? [A, B, C] : [A, B, D], f ? col : c2, up); fc(K, f ? [A, C, D] : [B, C, D], f ? c2 : col, up); } };
    // the whole bonnet: carbon's weave (finer on Visoki), a bare metal's in one shade
    const panel = (c1, c2) => top(X0, X1, -W, W, c1, 0.005, K.hi ? 10 : 5, K.hi ? 8 : 4, c2);
    // louvres: a dark panel, k slats across it stepping up towards the back (xc its middle, len along x, wid across, at z +-zc or 0)
    const vents = (xc, len, zc, wid, k, col, slat) => { for (const sd of zc ? [-1, 1] : [0]) { const z = sd * zc;
      top(xc - len / 2, xc + len / 2, z - wid / 2, z + wid / 2, [0.02, 0.02, 0.022], 0.008, 1, 1);
      for (let i = 0; i < k; i++) { const x = xc - len / 2 + len * (i + 0.5) / k, d = len / k * 0.22;   // (each slat leaning back over its gap)
        fc(K, [pt(x + d, z - wid / 2 + 0.008, 0.009), pt(x - d, z - wid / 2 + 0.008, 0.02), pt(x - d, z + wid / 2 - 0.008, 0.02), pt(x + d, z + wid / 2 - 0.008, 0.009)], slat || col, up); }
      if (K.hi) for (const e of [-1, 1]) top(xc - len / 2, xc + len / 2, z + e * wid / 2 - 0.006, z + e * wid / 2 + 0.006, slat || col, 0.011, 1, 1); } };   // (its frame's sides)
    // a scoop (its black mouth forward, as the stock one) or a closed bulge: xf its front, len back from there, h tall, w its half width
    const scoop = (xf, len, h, w, col, mouth) => { const ring = (x, hh, ww) => { const y = T(x, 0); return [[x, y - 0.012, -ww], [x, y + hh * 0.72, -ww + 0.012], [x, y + hh, -ww + 0.05], [x, y + hh, ww - 0.05], [x, y + hh * 0.72, ww - 0.012], [x, y - 0.012, ww]]; };
      const xs = [xf, xf - len * 0.07, xf - len * 0.35, xf - len], hs = mouth ? [h, h * 1.05, h * 0.9, 0.006] : [0.004, h * 0.75, h, 0.006], wk = [1, 0.99, 0.96, 0.85];
      K.skin(xs.map((x, i) => ring(x, hs[i], w * wk[i])), col, mouth ? BP : col, col);
      if (mouth) K.grille(xf + 0.002, T(xf, 0) + h * 0.46, 0, (w - 0.04) * 2, h * 0.62, { slats: K.hi ? 3 : 2, col: BP, slatCol: DK }); };
    // the quick-release pins at the bonnet's front corners: a chrome disc lying flat, its clip
    const pins = (clip) => { for (const sd of [-1, 1]) { const x = X1 - 0.07, z = sd * (W - 0.1), c = pt(x, z, 0.006);
      disc(K, c, up, 0.022, 8, K.chrome); disc(K, add3(c, up, 0.002), up, 0.009, 6, DK);
      K.bar(add3(c, up, 0.003), [x - 0.05, T(x - 0.05, z + sd * 0.03) + 0.012, z + sd * 0.03], 0.0035, clip, { n: 3 }); } };
    // a stripe along the middle
    const stripe = (w, col) => top(X0 + 0.02, X1 - 0.01, -w, w, col, 0.007, 2, 1);
    switch (n) {
      case 1: scoop(X1 - 0.12, 0.55, 0.02, 0.24, P, false); break;                                                   // jeklena, nadomestna: a low flat bulge
      case 2: vents(1.4, 0.22, 0.42, 0.18, 5, P); break;                                                              // jeklena z režami
      case 3: panel(ALB); break;                                                                                      // aluminijasta (bare)
      case 4: panel(ALB); vents(1.4, 0.22, 0.42, 0.18, 5, ALB); break;                                                 // aluminijasta z režami
      case 5: scoop(X1 - 0.1, 0.7, 0.045, 0.27, P, false); break;                                                    // iz steklenih vlaken: a power bulge
      case 6: scoop(X1 - 0.1, 0.7, 0.045, 0.27, P, false); vents(1.38, 0.24, 0.47, 0.12, 6, P); break;                // z režami
      case 7: scoop(X1 - 0.13, 0.5, 0.1, 0.25, P, true); break;                                                       // z zajemalko (a tall one)
      case 8: scoop(X1 - 0.13, 0.5, 0.1, 0.25, P, true); vents(1.32, 0.24, 0.47, 0.12, 6, P); break;                  // z režami in zajemalko
      case 9: panel(CF, CFW); break;                                                                                 // karbonska
      case 10: panel(CF, CFW); vents(1.4, 0.22, 0.42, 0.18, 5, CF); break;                                             // karbonska z režami
      case 11: panel(CF, CFW); scoop(X1 - 0.13, 0.48, 0.085, 0.24, CF, true); break;                                 // karbonska z zajemalko
      case 12: panel([0.12, 0.125, 0.135], [0.085, 0.088, 0.096]); break;                                          // karbonska, suha (glossier, its weave crisper)
      case 13: stripe(0.2, BP); pins(RED); break;                                                                     // dirkalna hauba: the black anti-glare stripe, pins
      case 14: vents(1.36, 0.3, 0.38, 0.22, 7, GR); pins(RED); break;                                             // dirkalna z režami: the big extractors
      case 15: scoop(X1 - 0.12, 0.5, 0.11, 0.27, BP, true); pins(RED); break;                                        // dirkalna z zajemalko
      case 16: panel(CF, CFW); vents(1.3, 0.26, 0.4, 0.16, 6, CF); scoop(X1 - 0.12, 0.42, 0.09, 0.2, CF, true); pins(RED); break;   // motošport
    }
  }

  // ================================================================ maska: the grille between the head lamps, in place of the stock one
  function maska(K, n, m) {
    const P = K.paint, xAt = (y) => m.x - (y - m.y0) * m.lean, YC = m.yc, fw = [1, 0, 0];
    // a polygon on the face [[z, y] ...], off in front of it
    const f = (pts, col, off) => fc(K, pts.map(([z, y]) => [xAt(y) + off, y, z]), col, fw);
    const rect = (z0, y0, z1, y1, col, off) => f([[z0, y0], [z1, y0], [z1, y1], [z0, y1]], col, off);
    // a bar from (z0, y0) to (z1, y1), w wide
    const bar = (z0, y0, z1, y1, w, col, off) => { const dz = z1 - z0, dy = y1 - y0, l = Math.hypot(dz, dy) || 1, oz = -dy / l * w / 2, oy = dz / l * w / 2;
      f([[z0 + oz, y0 + oy], [z1 + oz, y1 + oy], [z1 - oz, y1 - oy], [z0 - oz, y0 - oy]], col, off); };
    // the grille's box: its opening (w x h round the middle), its back dark, a frame round it (fr wide)
    let G = null;
    const open = (w, h, back, frame, fr) => { G = { z0: -w / 2, z1: w / 2, y0: YC - h / 2, y1: YC + h / 2 };
      rect(G.z0, G.y0, G.z1, G.y1, back || HOLE, 0.003);
      if (frame) { const t = fr || 0.012; rect(G.z0 - t, G.y1, G.z1 + t, G.y1 + t, frame, 0.008); rect(G.z0 - t, G.y0 - t, G.z1 + t, G.y0, frame, 0.008);
        rect(G.z0 - t, G.y0, G.z0, G.y1, frame, 0.008); rect(G.z1, G.y0, G.z1 + t, G.y1, frame, 0.008); } };
    // a line clipped to the opening (Liang-Barsky), drawn as a bar
    const clipBar = (z0, y0, z1, y1, w, col, off) => { let t0 = 0, t1 = 1; const dz = z1 - z0, dy = y1 - y0;
      for (const [p, q] of [[-dz, z0 - G.z0], [dz, G.z1 - z0], [-dy, y0 - G.y0], [dy, G.y1 - y0]]) { if (p === 0) { if (q < 0) return; continue; } const t = q / p; if (p < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t); }
      if (t1 - t0 > 0.05) bar(z0 + dz * t0, y0 + dy * t0, z0 + dz * t1, y0 + dy * t1, w, col, off); };
    // a diamond mesh (bars at +-a, step apart), a square one (k across, j up), slats (k, horizontal), slots (k, upright), a honeycomb
    const diamond = (step, w, col) => { const h = G.y1 - G.y0, s = h / Math.tan(0.75); for (let z = G.z0 - s; z < G.z1 + step; z += step) { clipBar(z, G.y0, z + s, G.y1, w, col, 0.005); clipBar(z + s, G.y0, z, G.y1, w, col, 0.0055); } };
    const square = (k, j, w, col) => { for (let i = 1; i < k; i++) { const z = G.z0 + (G.z1 - G.z0) * i / k; rect(z - w / 2, G.y0, z + w / 2, G.y1, col, 0.005); }
      for (let i = 1; i < j; i++) { const y = G.y0 + (G.y1 - G.y0) * i / j; rect(G.z0, y - w / 2, G.z1, y + w / 2, col, 0.0055); } };
    const slats = (k, th, col, hi) => { for (let i = 0; i < k; i++) { const y = G.y0 + (G.y1 - G.y0) * (i + 0.5) / k; rect(G.z0, y - th / 2, G.z1, y + th / 2, col, 0.006); if (hi && K.hi) rect(G.z0, y + th / 2 - 0.003, G.z1, y + th / 2, hi, 0.0065); } };
    const slots = (k, w, col) => { for (let i = 0; i <= k; i++) { const z = G.z0 + (G.z1 - G.z0) * i / k; rect(z - w / 2, G.y0, z + w / 2, G.y1, col, 0.006); } };
    const comb = (r, col) => { const dz = r * 1.75, dy = r * 1.52;   // (hexagons, their flat sides up; rows staggered)
      for (let y = G.y0 + r; y <= G.y1 - r * 0.85; y += dy) { const odd = Math.round((y - G.y0 - r) / dy) % 2;
        for (let z = G.z0 + r + (odd ? dz / 2 : 0); z <= G.z1 - r; z += dz) f(Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2 + Math.PI / 6; return [z + Math.cos(a) * r, y + Math.sin(a) * r]; }), col, 0.005); } };
    const W0 = m.w, H0 = m.h, Hs = 0.075, HOLE = [0.03, 0.03, 0.035], CFD = [0.12, 0.125, 0.135];   // (the full room; a slim grille as the stock one)
    switch (n) {
      case 1: open(W0 * 0.98, Hs, null, BP, 0.01); diamond(0.05, 0.006, [0.13, 0.13, 0.14]); break;                       // črna mreža (slim)
      case 2: open(W0 * 0.96, H0 * 0.8, [0.14, 0.14, 0.15], BP, 0.012); comb(K.hi ? 0.017 : 0.022, HOLE); break;         // satasta
      case 3: open(W0 * 0.96, H0 * 0.8, null, BP, 0.012); square(K.hi ? 12 : 8, K.hi ? 5 : 4, 0.005, [0.2, 0.2, 0.21]); break;   // mrežasta
      case 4: open(W0 * 0.98, H0 * 0.7, null, [0.02, 0.02, 0.022], 0.012); slats(3, 0.018, [0.035, 0.035, 0.04], [0.32, 0.33, 0.36]); break;   // sijajno črna
      case 5: open(W0 * 0.96, H0 * 0.8, null, AL, 0.012); diamond(0.045, 0.007, AL); break;                               // aluminijasta mreža
      case 6: open(W0 * 0.98, H0 * 0.8, null, K.chrome, 0.014); slats(4, 0.016, K.chrome); break;                         // kromirana
      case 7: open(W0 * 0.96, H0 * 0.8, null, K.chrome, 0.01); square(K.hi ? 14 : 9, K.hi ? 6 : 4, 0.006, [0.86, 0.87, 0.9]); break;   // nerjaveča mreža
      case 8: open(W0 * 0.98, H0 * 0.8, null, P, 0.016); slats(3, 0.016, P); break;                                      // v barvi avta
      case 9: open(W0 * 0.96, H0 * 0.8, null, CF2, 0.02); diamond(0.045, 0.006, [0.13, 0.13, 0.14]); break;               // karbonski okvir
      case 10: open(W0 * 0.98, H0 * 0.8, CF, CF2, 0.012); slots(K.hi ? 9 : 6, 0.022, [0.15, 0.155, 0.165]); slats(2, 0.014, [0.15, 0.155, 0.165]); break;   // karbonska (the weave's ribs)
      case 11: open(W0 * 0.96, H0 * 0.8, null, CF, 0.02); square(K.hi ? 12 : 8, K.hi ? 5 : 4, 0.005, [0.6, 0.61, 0.64]); break;   // karbonska z mrežo
      case 12: open(W0 * 0.98, H0 * 0.8, null, CF2, 0.012); slots(K.hi ? 11 : 7, 0.026, CF); break;                          // karbonska z režami
      case 13: open(W0 * 0.96, H0 * 0.8, CFD, CFD, 0.016); comb(K.hi ? 0.017 : 0.022, HOLE); break;   // suhi karbon
      case 14: open(W0 * 0.98, Hs, null, ICE, 0.006); diamond(0.05, 0.006, [0.13, 0.13, 0.14]); break;                    // s svetlečim robom (a slim one, its edge lit)
      case 15: open(W0, H0, null, CFD, 0.012); square(K.hi ? 8 : 6, 3, 0.008, CFD); break;   // suhi karbon, dirkalna (the widest opening)
      case 16: open(W0 * 0.96, H0 * 0.8, CFD, CFD, 0.016); comb(K.hi ? 0.017 : 0.022, HOLE);   // suhi karbon s svetlobo
        rect(G.z0, G.y0 - 0.004, G.z1, G.y0, ICE, 0.0095); break;
    }
  }

  // ================================================================ zmigavci: the indicators (front, the fenders' repeaters; the mirrors' and
  // the rear's on the options that have them), in place of the stock amber lenses
  function zmigavci(K, n, m) {
    const F = m.front, S = m.side, R = m.rear, MI = m.mirror, CH = K.chrome;
    const CLEAR = [0.9, 0.91, 0.93], SMK = [0.2, 0.2, 0.22];
    // a lamp on a face: dir 'x' (the front), '-x' (the rear), 'z' / '-z' (a side): its lens a rounded rectangle w x h (r its corners),
    // a frame (fr wide) behind it; inside it k segments (sequential: dim in, bright out), bulbs or LED dots
    const pane = (x, y, z, w, h, col, dir, o, off, round) => { const s = dir[0] === '-' ? -1 : 1, ax = dir.slice(-1), r = Math.min(w, h) * 0.45, P = [];   // (round: its corners rounded, on Visoki)
      if (round && K.hi) { for (const [cu, cv, a0] of [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]]) for (let i = 0; i <= 2; i++) { const a = (a0 + 45 * i) * Math.PI / 180; P.push([cu * (w / 2 - r) + Math.cos(a) * r, cv * (h / 2 - r) + Math.sin(a) * r]); } }
      else P.push([w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2], [w / 2, -h / 2]);
      const d = off || 0; fc(K, P.map(([u, v]) => ax === 'x' ? [x + s * d, y + v, z + u] : [x + u, y + v, z + s * d]), col, ax === 'x' ? [s, 0, 0] : [0, 0, s], o); };
    const lamp = (x, y, z, w, h, dir, o, L) => {
      if (L.frame) pane(x, y, z, w + 0.012, h + 0.012, L.frame, dir, o, 0, true);
      pane(x, y, z, w, h, L.lens, dir, o, 0.001, true);
      const s = dir[0] === '-' ? -1 : 1, ax = dir.slice(-1), outS = Math.sign(z) || 1, at = (u, v, du, dv, col) => {   // (u: along it, out from the car's middle (front, rear) or forward (a side))
        const uu = ax === 'x' ? outS * u : s * u; pane(ax === 'x' ? x : x + uu, y + v, ax === 'x' ? z + uu : z, du, dv, col, dir, o, 0.002); };
      if (L.seq) { const k = L.seq; for (let i = 0; i < k; i++) { const t = (i + 0.5) / k, c = [AMB2[0] + (AMB[0] - AMB2[0]) * t, AMB2[1] + (AMB[1] - AMB2[1]) * t, AMB2[2] + (AMB[2] - AMB2[2]) * t];
        at(-w / 2 + w * t, L.drl ? -h * 0.18 : 0, w / k * 0.8, L.drl ? h * 0.42 : h * 0.62, c); } }
      else if (L.leds) { const k = L.leds; for (let i = 0; i < k; i++) at(-w / 2 + w * (i + 0.5) / k, 0, Math.min(h * 0.5, w / k * 0.6), h * 0.5, L.dot || AMB); }
      else if (L.bulb) at(w * 0.1, 0, h * 0.62, h * 0.62, L.bulb);
      if (L.drl) at(0, h * 0.3, w * 0.94, h * 0.2, WHITE); };
    // the option: the front's look, the repeater's (on the fenders, or on the mirrors), the rear's (k: segments; null: none)
    const looks = [
      { lens: AMB, rib: true }, { lens: CLEAR, bulb: AMB }, { lens: SMK, bulb: AMB2 }, { lens: AMB, frame: CH },
      { lens: CLEAR, leds: 4 }, { lens: SMK, leds: 4 }, { lens: CLEAR, leds: 4, mirror: true }, { lens: CLEAR, leds: 4, frame: CH },
      { lens: [0.14, 0.14, 0.15], seq: 5 }, { lens: SMK, seq: 5 }, { lens: [0.14, 0.14, 0.15], seq: 5, rear: true }, { lens: [0.14, 0.14, 0.15], seq: 6, drl: true },
      { lens: CLEAR, leds: 5, rear: true }, { lens: [0.14, 0.14, 0.15], seq: 6, rear: true }, { lens: [0.14, 0.14, 0.15], seq: 6, drl: true, rear: true }, { lens: SMK, seq: 6, drl: true, rear: true, mirror: true, frame: CH }];
    const L = looks[n - 1]; if (!L) return;
    const seqLike = L.seq || L.leds, fw = seqLike ? F.w * 1.12 : F.w, fh = L.drl ? F.h * 1.2 : seqLike ? F.h * 0.8 : F.h;
    for (const sd of [-1, 1]) {
      lamp(F.x, F.y, sd * F.z, fw, fh, 'x', { part: F.part }, L);
      if (L.rib && K.hi) for (const v of [-0.3, 0.3]) pane(F.x, F.y + v * fh, sd * F.z, fw * 0.96, 0.004, AMB2, 'x', { part: F.part }, 0.002);
      // the repeater: an amber lens as stock on the first four, a slim LED or sequential strip after them; on the mirrors instead (7, 16)
      const sz = sd * S.z, sdir = sd < 0 ? '-z' : 'z', so = { host: S.host };
      if (L.mirror && MI) { const mp = MI.parts ? { part: MI.parts[sd < 0 ? 0 : 1] } : {}, k = L.seq ? 4 : 3, w = MI.w || 0.11;
        pane(MI.x, MI.y, sd * MI.z, w, 0.016, [0.14, 0.14, 0.15], 'x', mp, 0);
        for (let i = 0; i < k; i++) pane(MI.x, MI.y, sd * (MI.z - w / 2 + w * (i + 0.5) / k), w / k * 0.8, 0.01, i === k - 1 ? AMB : AMB2, 'x', mp, 0.0015); }
      else if (n <= 4) lamp(S.x, S.y, sz, 0.065, 0.026, sdir, so, { lens: L.lens, frame: L.frame, bulb: L.bulb });
      else lamp(S.x, S.y, sz, L.seq ? 0.12 : 0.09, 0.016, sdir, so, { lens: L.lens, frame: L.frame, seq: L.seq ? 4 : 0, leds: L.seq ? 0 : 3 });
      if (L.rear && R) lamp(R.x, R.y, sd * R.z, 0.15, 0.026, '-x', { part: R.part }, { lens: L.lens, seq: L.seq || 0, leds: L.seq ? 0 : L.leds });
    }
  }

  // ================================================================ relijske_luci: the extra lamps (none stock): two on the bumper, four
  // in front of the grille, a light bar on the roof or in the lower intake, a pod over the nose
  function relijske(K, n, m) {
    const P = K.paint, o = { part: m.part || 'bumperF' }, ob = { part: 'body' }, fw = [1, 0, 0], CH = K.chrome;
    const WARM = [1, 0.96, 0.82], COOL = [0.9, 0.95, 1], YEL = [1, 0.82, 0.2], LED = [0.86, 0.92, 1];
    const [bx, by, bz] = m.bumper, [nx, ny] = m.nose, [ix, iy, iw, ih] = m.intake, [rx, rw] = m.roof, [px, py0, py1, pw] = m.pod;
    // a lamp facing forward on a bracket down to the bumper (or the bar's tube): y0 the bracket's foot
    const front = (x, y, z, r, lens, rim, house, y0, q) => { lamp(K, [x, y, z], fw, r, house || BP, lens, rim, o, q);
      if (y0 != null) K.box(x - 0.03, y0, z, 0.03, y - r * 0.6 - y0, 0.025, 0, DK, null, false, o); };
    // the light bar's housing (x its front, y its foot, w its half width), its cells across the front
    const bar = (x, y, w, h, k, cell, oo) => { K.box(x - 0.035, y, 0, 0.07, h, w * 2, 0, BP, [0.12, 0.12, 0.13], false, oo);
      for (let i = 0; i < k; i++) K.rect(x + 0.0008, y + h / 2, -w + 0.02 + (2 * w - 0.04) * (i + 0.5) / k, (2 * w - 0.04) / k * 0.82, h * 0.6, cell, Object.assign({ dir: 'x' }, oo));
      if (K.hi) K.rect(x + 0.0012, y + h * 0.88, 0, w * 2 - 0.03, 0.006, CH, Object.assign({ dir: 'x' }, oo)); };
    const roofBar = (w, k, cell) => { const y = K.topY(rx, 0) + 0.035;
      for (const sd of [-1, 1]) { const z = sd * w * 0.6; K.box(rx - 0.04, K.topY(rx - 0.04, z) - 0.006, z, 0.05, y - K.topY(rx - 0.04, z) + 0.006, 0.03, 0, BP, null, false, ob); }
      bar(rx + 0.03, y, w, 0.065, k, cell, ob); return y; };
    // the pod over the nose: a plate leaning back with the face, k lamps across it (rows: 1 or 2)
    const pod = (col, lamps, r, lens, rim, heat) => { const xa = px + 0.025, xb = px + 0.025 - (py1 - py0) * 0.067;
      K.plate([[xa, py0, -pw], [xa, py0, pw], [xb, py1, pw - 0.04], [xb, py1, -pw + 0.04]], 0.02, col, o);
      for (const [z, y, rr] of lamps) { const x = xa - (y - py0) * 0.067 + 0.012; lamp(K, [x + 0.03, y, z], fw, rr || r, BP, lens, rim, o, { d: 0.04 });
        if (heat) { const k = K.hi ? 4 : 2; for (let i = 0; i < k; i++) K.rect(x + 0.0335, y - (rr || r) * 0.55 + (rr || r) * 1.1 * (i + 0.5) / k, z, (rr || r) * 1.4, 0.003, [0.95, 0.5, 0.15], o); } }
      if (K.hi) for (const sd of [-1, 1]) K.rect(xb + 0.004, py1 - 0.01, sd * (pw - 0.06), 0.03, 0.02, DK, o); };   // (its straps over the bonnet's edge)
    const row = (k, y, w, r) => Array.from({ length: k }, (_, i) => [-w + 2 * w * i / (k - 1), y, r]);
    switch (n) {
      case 1: case 2: case 3: case 4: {   // dve luči na odbijaču: halogen, brighter (chrome), LED (cool, black rim), yellow LED
        const lens = n === 4 ? YEL : n === 3 ? LED : WARM, rim = n === 1 ? DK : n === 2 ? CH : BP, r = n >= 3 ? 0.07 : 0.078;
        for (const sd of [-1, 1]) front(bx + 0.07, by, sd * bz, r, lens, rim, null, by - 0.075); break; }
      case 5: case 6: case 7: case 8: {   // štiri pred masko na cevi (LED, yellow, covers)
        const lens = n === 7 ? YEL : n === 6 ? LED : WARM, rim = n === 5 ? CH : BP, y = ny, x = nx + 0.11, r = 0.08;
        K.cyl([x - 0.06, y - r - 0.03, -0.52], [x - 0.06, y - r - 0.03, 0.52], 0.014, CH, Object.assign({ n: 6 }, o));   // (the bar across the nose)
        for (const sd of [-1, 1]) K.box(x - 0.08, m.bumper[1] + 0.13, sd * 0.5, 0.03, y - r - 0.03 - m.bumper[1] - 0.13, 0.03, 0, DK, null, false, o);   // (its feet on the bumper)
        for (const z of [-0.39, -0.13, 0.13, 0.39]) front(x, y, z, r, lens, rim, null, y - r - 0.03, n === 8 ? { cover: BP } : null);
        break; }
      case 9: roofBar(0.42, K.hi ? 10 : 6, LED); break;                                          // letev na strehi
      case 10: bar(ix + 0.012, iy - 0.025, iw * 0.38, 0.05, K.hi ? 12 : 8, LED, o); break;        // LED-letev v maski (the lower intake)
      case 11: roofBar(0.6, K.hi ? 14 : 8, LED); break;                                          // široka letev
      case 12: { const y = roofBar(0.45, K.hi ? 10 : 6, LED);                                     // letev s stranskimi: lamps at its ends, turned out into the bend
        for (const sd of [-1, 1]) { const a = 0.6, ax = [Math.cos(a), 0, sd * Math.sin(a)]; lamp(K, [rx + 0.03, y + 0.034, sd * 0.5], ax, 0.04, BP, LED, CH, ob, { d: 0.04 }); } break; }
      case 13: pod(BP, row(4, (py0 + py1) / 2, pw - 0.15, 0.09), 0.09, WARM, CH); break;          // relijski, 4 luči
      case 14: pod(BP, row(6, (py0 + py1) / 2, pw - 0.1, 0.07), 0.07, WARM, CH); break;          // relijski, 6 luči
      case 15: pod(BP, row(4, (py0 + py1) / 2, pw - 0.15, 0.09), 0.09, [1, 0.93, 0.78], BP, true); break;   // z ogrevanjem: the heater's wires on the lenses
      case 16: pod(P, row(4, (py0 + py1) / 2, pw - 0.15, 0.095), 0.095, COOL, CH); break;         // tovarniški (in the body's paint)
    }
  }

  DELI.add('aero', aero);
  DELI.add('hauba', hauba);
  DELI.add('maska', maska);
  DELI.add('zmigavci', zmigavci);
  DELI.add('relijske_luci', relijske);
})();
