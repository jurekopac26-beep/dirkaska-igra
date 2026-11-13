/* The relief of a gravel road (makadam) across and along it: ruts, hollows, ridges and the road's own tilt, as Killar's (js/tracks/killar.js,
   killarCross), for the other real gravel roads (the user, 13. 11. 2026: »spremeni da imajo vse makedamkse ceste nagibano pot kot jo ima sedaj
   indija«). index.html loads it before the track files; a track asks for it with def.cross = MakadamCesta.cross({ seed }) (Katu, Pikes Peak on
   gravel, the gravel parts of Harju: T.sf, def.surf). The physics of driving unchanged: only the road's surface (js/core.js Track: def.cross ->
   Track.bankAt, the cars ride it and lean with it as on a banked bend, as on Killar).
   Built once per Track from the road itself, seeded (its own generator: Math.random untouched), so the same every time:
     - one feature after another along the whole gravel road, their ends overlapping (the road wrinkled from the start to the finish, as Killar's
       since 13. 11. 2026): in a bend tighter than 150 m a wide hollow along its inside (the road worn into the bend); elsewhere by turns left and
       right a rut in a wheel track (two thirds, a third of them long), a ridge between (never on a drop's side, def.drops) or a rut across the
       road at a slant; each [s, metres from the middle (+ right), height, half-length a, half-width b, level half-length p, skew q] as Killar's:
       h exp(-u^2 - v^2), u = max(0, |x| - p) / a, v = (d - d0 - q x) / b;
     - the depth no more than lets a car at the bend's speed (sqrt(8 R), at most 42 m/s) keep its wheels on it (2 h v^2 / a^2 <= 6 m/s^2), lower in
       tighter bends (to 0.4 at 60 m), on a road narrower than Killar's (half width 4.5 m) in proportion (to 0.6);
     - under them the tilt across (camber, every 10 m, linear between): 2-3 % one way or the other for 20-60 m, into a bend tighter than 150 m,
       toward a drop at most 0.8 %; its higher side at the road's height to 0.6 w from the middle, the lower side down (at most ~0.17 m: less on a
       wide road); the whole relief back to the road's own height over the outer 0.4 w (what stands by the road stays where it was);
     - none where the road is not gravel (Harju's tarmac and paving), from 40 m before the start line to 40 m after it, from 30 m before the finish
       and 20 m round a checkpoint, eased in and out over 10 m (the whole relief: no feature's tail runs into them).
   The road's mesh draws it with MakadamCesta.y and shades it with MakadamCesta.lit (js/world-katu.js, js/world-pikes.js, js/world-harju.js). */
var MakadamCesta = (typeof MakadamCesta !== 'undefined' && MakadamCesta) || (function () {
  'use strict';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rnd = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // the ruts and the tilt of track T (opts: seed, k: a scale, 1 by default)
  function build(T, opts) {
    const N = T.N, ds = T.ds, len = T.len, def = T.def || {}, K = opts.k == null ? 1 : opts.k, R = rnd(opts.seed || 1), open = !!T.open;
    const wAt = (i) => (T.wAt ? T.wAt(i) : T.w), idx = (s) => { const i = Math.round(s / ds) % N; return i < 0 ? i + N : i; };
    // where: the gravel (T.sf: 5, else the whole road), off the quiet places, eased over 10 m
    const on = new Uint8Array(N), q0 = open ? T.startS + 40 : T.startS + 40, q1 = open ? T.finishS - 30 : T.startS + len - 40;
    for (let i = 0; i < N; i++) { const s = open ? i * ds : ((i * ds - T.startS) % len + len) % len + T.startS; on[i] = (!T.sf || T.sf[i] === 5) && s > q0 && s < q1 && !(T.cpS || []).some(c => Math.abs(s - c) < 20) ? 1 : 0; }
    const F = Math.ceil(10 / ds), dist = new Float32Array(N).fill(1e9);
    for (let i = 0, d = 1e9; i < N; i++) { d = on[i] ? d + 1 : 0; dist[i] = d; }
    for (let i = N - 1, d = 1e9; i >= 0; i--) { d = on[i] ? d + 1 : 0; dist[i] = Math.min(dist[i], d); }
    const mask = new Float32Array(N); for (let i = 0; i < N; i++) mask[i] = sstep(0, F, dist[i]);
    // the bend: the curvature averaged over 20 m (+ right), its radius
    const H = Math.max(1, Math.round(10 / ds)), kav = new Float32Array(N);
    for (let i = 0; i < N; i++) { let a = 0, n = 0; for (let j = -H; j <= H; j++) { const t = open ? i + j : (i + j + N) % N; if (t >= 0 && t < N) { a += T.k[t]; n++; } } kav[i] = a / n; }
    const drops = (def.drops || []).map(([a, b, sd]) => [T.startS + a - 15, T.startS + b + 15, sd]), dropOn = (s, sd) => drops.some(([a, b, d]) => d === sd && s >= a && s <= b);
    const ruts = [];
    let side = R() < 0.5 ? 1 : -1;
    for (let s = 0; s < len;) {
      const i = idx(s), m = mask[i]; if (m < 0.05) { s += 4; continue; }
      const w = wAt(i), kk = kav[i], rr = 1 / Math.max(1e-4, Math.abs(kk)), bs = kk > 0 ? 1 : -1, v = Math.min(42, Math.sqrt(8 * rr)), a = 6 + 4 * R();
      const hmax = 6 * a * a / (2 * v * v), low = rr < 150 ? clamp(0.4 + 0.6 * (rr - 60) / 90, 0.4, 1) : 1, b = clamp(0.45 * w, 1.4, 2.4), sc = K * m * clamp(w / 4.5, 0.6, 1);   // (a road narrower than Killar's 4.5 m half width: shallower)
      let r;
      if (rr < 150) r = [s, bs * 0.5 * w, -sc * low * Math.min(hmax, 0.13 + 0.06 * R()), a * 1.3, b * 1.15, 0, 0];   // (a wide hollow along the bend's inside)
      else {
        const t = R(); side = -side;
        if (t < 0.66) r = [s, side * 0.5 * w, -sc * Math.min(hmax, 0.1 + 0.08 * R()), a, b, R() < 0.33 ? 4 + 8 * R() : 0, 0];   // (a rut in a wheel track)
        else if (t < 0.84 && !dropOn(s, side)) r = [s, side * 0.5 * w, sc * Math.min(0.7 * hmax, 0.06 + 0.05 * R()), a, b * 0.9, 0, 0];   // (a ridge)
        else r = [s, 0, -sc * Math.min(hmax, 0.1 + 0.05 * R()), a, b, 6 + 6 * R(), (R() < 0.5 ? -1 : 1) * (0.08 + 0.05 * R())];   // (a rut across at a slant)
      }
      ruts.push(r); s += (r[5] || 0) + r[3] * (1.2 + 0.4 * R());
    }
    // the tilt across every 10 m (+ the right side higher)
    const nc = Math.ceil(len / 10) + 2, cb = new Float32Array(nc);
    for (let j = 0; j < nc;) {
      const n = 2 + Math.floor(R() * 5), i = idx((j + n / 2) * 10), kk = kav[i], rr = 1 / Math.max(1e-4, Math.abs(kk)), E0 = 0.6 * wAt(i), cmax = Math.min(0.03, 0.17 / (2 * E0));
      let c = rr < 150 ? -(kk > 0 ? 1 : -1) * cmax * (0.85 + 0.15 * R()) : (R() < 0.5 ? -1 : 1) * cmax * (0.67 + 0.33 * R());
      const lowSide = c > 0 ? -1 : 1;   // (c > 0: the left side lower)
      for (let t = 0; t < n && j < nc; t++, j++) { const s = j * 10, ii = idx(s); let cc = c; if (dropOn(s, lowSide)) cc = Math.sign(c) * Math.min(Math.abs(c), 0.008); cb[j] = K * mask[ii] * cc; }
    }
    const tilt = (s) => { const f = s / 10, j = Math.floor(f); return j >= 0 && j < nc - 1 ? cb[j] + (cb[j + 1] - cb[j]) * (f - j) : 0; };
    // the features near each 2 m of the road
    const bd = 2, nb = Math.ceil(len / bd) + 1, near = [];
    ruts.forEach((r, k) => { const e = (r[5] || 0) + 3 * r[3]; for (let i = Math.max(0, Math.floor((r[0] - e) / bd)); i <= Math.min(nb - 1, Math.floor((r[0] + e) / bd)); i++) (near[i] || (near[i] = [])).push(k); });
    const at = (s, d, out) => {
      out.dy = 0; out.sl = 0; if (open && (s < 0 || s >= len)) return out; if (!open) s = ((s % len) + len) % len;
      const ii = idx(s), M = mask[ii], W = wAt(ii), ad = Math.abs(d); if (!(ad < W) || !(M > 0)) return out;
      const E0 = 0.6 * W, L = near[Math.floor(s / bd)], c = tilt(s), q = E0 - (c > 0 ? d : -d);
      let y = 0, sl = 0; if (q > 0 && c) { y = -Math.abs(c) * q; sl = c; }
      if (L) for (let n = 0; n < L.length; n++) { const r = ruts[L[n]], x = s - r[0], u = Math.max(0, Math.abs(x) - (r[5] || 0)) / r[3], v = (d - r[1] - (r[6] || 0) * x) / r[4], g = r[2] * Math.exp(-u * u - v * v); y += g; sl -= 2 * v / r[4] * g; }
      if (ad > E0) { const t = (ad - E0) / (W - E0), e = 0.5 + 0.5 * Math.cos(Math.PI * t); sl = sl * e - y * 0.5 * Math.PI / (W - E0) * Math.sin(Math.PI * t) * Math.sign(d); y *= e; }
      out.dy = y * M; out.sl = sl * M; return out;   // (the whole relief eased out by the quiet places: no feature's tail runs into them)
    };
    at.makadam = true; at.ruts = ruts; at.tilt = tilt;   // (the road meshes and the tests)
    return at;
  }
  // def.cross for a track: (T) => the relief's function (js/core.js Track)
  const cross = (opts) => (T) => build(T, opts || {});
  // the road's height at s m along it and o m from its middle, over its profile (0 off a road without this relief)
  const _o = { dy: 0, sl: 0 }, has = (T) => !!(T && T.relief && T.bankAt && T.bankAt.makadam);
  const y = (T, s, o) => (has(T) ? T.bankAt(s, o, _o).dy : 0);
  // its light as Killar's road's (js/world-killar.js): k = clamp(1 - 7 r' - 4.5 r_d sg + 0.7 r, 0.45, 1.4) by its height r, its slopes along (r')
  // and across (r_d, from the sun's side sg: def.look.sunOff), a hollow dark at its bottom and on the flank away from the sun, a ridge light
  const lit = (T, i, o, sun) => {
    if (!has(T)) return 1;
    const ds = T.ds, s = i * ds, a = T.bankAt(s - ds, o, _o).dy, b = T.bankAt(s + ds, o, _o).dy, c = T.bankAt(s, o, _o), r = c.dy, rd = c.sl;
    const su = sun || [0, 1, 0], sh = Math.hypot(su[0], su[2]) || 1, li = (su[0] * T.nx[i] + su[2] * T.nz[i]) / sh, sg = li < 0 ? Math.min(-0.5, li) : Math.max(0.5, li);
    return clamp(1 - 7 * (b - a) / (2 * ds) - 4.5 * rd * sg + 0.7 * r, 0.45, 1.4);
  };
  return { cross, y, lit, has };
})();
