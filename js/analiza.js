/* =========================================================================
   ANALIZA — the lap analysis (Analiza kroga, predlog I12, docs/analiza-kroga.md): after every lap where the player lost or gained
   time against the best lap, and one short tip (»Prezgodaj zaviraš pred 3. ovinkom«). No words, no DOM and no THREE: the game
   (js/game.js, "the lap analysis") records, stores and shows it; in Node tests/analiza.test.js drives it.
   - A trace (start(L)): the lap cut into B-metre bins from the line (a closed track: L its length; an open road: the run to the
     finish). t[k] the lap clock when the car crossed k·B (k = 0..nb, t[nb] the lap's time), and per bin the speed (m/s, the last
     one in it), the most brake pressed and the throttle (the mean). step() after each physics step, end() at the line.
   - A best lap stored (pack / unpack): { v, B, L, lt, t: [cs], v: [km/h], b: [0..9] }, a few KB.
   - compare(cur, ref, corners): the difference all round (dt[k] = cur.t[k] - ref.t[k]), the rate of it per bin (smoothed: the colours
     of the map), the zones (one per corner: from the end of the one before to its own exit) with the time each lost, the worst and
     the best, and the tip { kind, n, ... } (n: the corner's number from the line, 1 the first).
   ========================================================================= */
const Analiza = (() => {
  'use strict';
  const B = 10, V = 1;   // the bin (m), the stored format
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function start(L) {
    const nb = Math.max(1, Math.ceil(L / B));
    const R = { L, nb, t: new Float32Array(nb + 1).fill(NaN), v: new Float32Array(nb), b: new Float32Array(nb), g: new Float32Array(nb), gn: new Uint16Array(nb),
      k: 1, d0: 0, t0: 0, hit: 0, pit: false, done: false, lt: NaN };
    R.t[0] = 0;
    return R;
  }
  // after each physics step: d the lap's distance (m from the line), t the lap clock (s), v the speed (m/s), brk and thr 0..1, pit in the lane
  function step(R, d, t, v, brk, thr, pit) {
    if (!R || R.done || !Number.isFinite(d) || !Number.isFinite(t)) return;
    if (pit) R.pit = true;
    if (d > R.d0 + 60) { R.k = Math.max(R.k, Math.floor(d / B) + 1); R.d0 = d; R.t0 = t; }   // (a rescue forward or a jump of the lookup: the bins in between are filled in at the line)
    while (R.k <= R.nb && R.k * B <= d) {
      const x = R.k * B, a = d > R.d0 + 1e-6 ? clamp((x - R.d0) / (d - R.d0), 0, 1) : 1;
      R.t[R.k] = R.t0 + (t - R.t0) * a; R.hit++; R.k++;
    }
    if (d >= R.d0 || d < R.d0 - 30) { R.d0 = Math.max(0, d); R.t0 = t; }   // (a small step back: the time keeps on from the furthest point)
    const i = Math.floor(d / B);
    if (i >= 0 && i < R.nb) { R.v[i] = v; if (brk > R.b[i]) R.b[i] = brk; R.g[i] += thr; R.gn[i]++; }
  }
  // the line: the lap's time; the bins never crossed (a rescue, a cut) filled in between; null when too little of the lap was driven
  function end(R, lt) {
    if (!R || R.done) return R && R.done ? R : null;
    R.done = true; R.lt = lt; R.t[R.nb] = lt;
    for (let i = 0; i < R.nb; i++) if (R.gn[i]) { R.g[i] /= R.gn[i]; R.gn[i] = 1; }
    let last = 0;
    for (let k = 1; k <= R.nb; k++) if (Number.isFinite(R.t[k])) { for (let j = last + 1; j < k; j++) R.t[j] = R.t[last] + (R.t[k] - R.t[last]) * (j - last) / (k - last); last = k; }
    for (let k = 1; k <= R.nb; k++) if (R.t[k] < R.t[k - 1]) R.t[k] = R.t[k - 1];
    for (let i = 1; i < R.nb; i++) if (!R.gn[i] && R.v[i] === 0) R.v[i] = R.v[i - 1];
    R.ok = R.hit >= R.nb * 0.85 && lt > 0;
    return R;
  }
  // stored best lap
  function pack(R) {
    const r = (x, m) => Math.round(x * m);
    return { v: V, B, L: Math.round(R.L * 10) / 10, lt: Math.round(R.lt * 1000) / 1000, t: Array.from(R.t, x => r(x, 100)), s: Array.from(R.v, x => r(x * 3.6, 1)), b: Array.from(R.b, x => r(x * 9, 1)), g: Array.from(R.g, x => r(x * 9, 1)) };
  }
  function unpack(o, L) {
    if (!o || typeof o !== 'object' || o.v !== V || o.B !== B || !(o.lt > 0) || !Array.isArray(o.t) || !Array.isArray(o.s) || !Array.isArray(o.b)) return null;
    if (L != null && Math.abs(o.L - L) > 1) return null;   // (a track re-made since: another length)
    const R = start(o.L); if (o.t.length !== R.nb + 1 || o.s.length !== R.nb || o.b.length !== R.nb) return null;
    for (let k = 0; k <= R.nb; k++) { const x = +o.t[k] / 100; if (!Number.isFinite(x)) return null; R.t[k] = x; }
    for (let i = 0; i < R.nb; i++) { R.v[i] = (+o.s[i] || 0) / 3.6; R.b[i] = (+o.b[i] || 0) / 9; R.g[i] = Array.isArray(o.g) ? (+o.g[i] || 0) / 9 : 0; R.gn[i] = 1; }
    R.done = true; R.ok = true; R.lt = o.lt; R.hit = R.nb;
    return R;
  }
  // the corners as lap distances in order from the line: [{ a0, a1, dir, sev }] (track.corners: s0 and i0..i1 on the centreline)
  function lapCorners(track) {
    const T = track, L = T.open ? T.raceLen : T.len, out = [];
    for (const c of T.corners || []) {
      let a0 = c.i0 * T.ds - T.startS, a1 = c.i1 * T.ds - T.startS;
      if (!T.open) { a0 = ((a0 % L) + L) % L; a1 = ((a1 % L) + L) % L; if (a1 < a0) a1 = a0 + (((c.i1 - c.i0 + T.N) % T.N) * T.ds); }
      if (a0 < 0 || a0 >= L) continue;
      out.push({ a0, a1: Math.min(a1, L), dir: c.dir, sev: c.sev });
    }
    out.sort((x, y) => x.a0 - y.a0);
    return out;
  }
  const at = (R, d) => { const u = clamp(d / B, 0, R.nb), k = Math.min(R.nb - 1, Math.floor(u)), a = u - k; return R.t[k] + (R.t[k + 1] - R.t[k]) * a; };
  const bin = (R, d) => clamp(Math.floor(d / B), 0, R.nb - 1);
  function vMin(R, d0, d1) { let m = Infinity; for (let i = bin(R, d0); i <= bin(R, d1); i++) if (R.v[i] > 0 && R.v[i] < m) m = R.v[i]; return Number.isFinite(m) ? m : NaN; }
  function brakeAt(R, d0, d1) { for (let i = bin(R, d0); i <= bin(R, d1); i++) if (R.b[i] > 0.3) return i * B; return NaN; }
  // cur against ref (both ended, the same length); corners from lapCorners. skip0: a standing start (the first zone left out of the tip)
  function compare(cur, ref, corners, skip0) {
    const nb = cur.nb, dt = new Float32Array(nb + 1), rate = new Float32Array(nb);
    for (let k = 0; k <= nb; k++) dt[k] = cur.t[k] - ref.t[k];
    for (let i = 0; i < nb; i++) { let s = 0, n = 0; for (let j = Math.max(0, i - 3); j <= Math.min(nb - 1, i + 3); j++) { s += dt[j + 1] - dt[j]; n++; } rate[i] = s / n; }
    const C = corners || [], L = cur.L, zones = [];
    let b0 = 0;
    for (let n = 0; n < C.length; n++) {
      const c = C[n], nx = C[n + 1], b1 = n === C.length - 1 ? L : Math.min(c.a1 + Math.max(10, Math.min(80, ((nx ? nx.a0 : L) - c.a1) * 0.5)), nx ? nx.a0 : L);
      zones.push({ n: n + 1, d0: b0, d1: b1, c, loss: at(cur, b1) - at(ref, b1) - (at(cur, b0) - at(ref, b0)) });
      b0 = b1;
    }
    if (!C.length) zones.push({ n: 0, d0: 0, d1: L, c: null, loss: cur.lt - ref.lt });
    else if (b0 < L - 1) zones[zones.length - 1].d1 = L;
    const pick = zones.filter(z => !(skip0 && z.d0 < 150));
    let worst = null, best = null;
    for (const z of pick) { if (!worst || z.loss > worst.loss) worst = z; if (!best || z.loss < best.loss) best = z; }
    const delta = cur.lt - ref.lt;
    return { delta, dt, rate, zones, worst, best, tip: tip(cur, ref, delta, worst, best) };
  }
  function tip(cur, ref, delta, worst, best) {
    if (delta < 0 && best && best.loss < -0.05) return { kind: 'gain', n: best.n, s: -best.loss };
    if (delta < 0) return { kind: 'pb' };
    if (!worst || worst.loss < 0.08) return { kind: 'even' };
    const z = worst, c = z.c;
    if (!c) return { kind: 'most', n: 0, s: z.loss };
    const bc = brakeAt(cur, z.d0, c.a1), br = brakeAt(ref, z.d0, c.a1);
    const vc = vMin(cur, c.a0 - 20, c.a1), vr = vMin(ref, c.a0 - 20, c.a1);
    const ex = Math.min(z.d1, c.a1 + 40), ec = cur.v[bin(cur, ex)], er = ref.v[bin(ref, ex)];
    const kmh = (x) => Math.round(x * 3.6);
    if (Number.isFinite(bc) && Number.isFinite(br)) {
      if (bc < br - 12 && !(vc < vr - 1.5)) return { kind: 'early', n: z.n, m: Math.round((br - bc) / 5) * 5, s: z.loss };
      if (bc > br + 10 && vc < vr - 1.2) return { kind: 'late', n: z.n, s: z.loss };
    }
    if (Number.isFinite(bc) && !Number.isFinite(br) && !(vc < vr - 1.5)) return { kind: 'brake', n: z.n, s: z.loss };   // (the best lap took it without braking)
    if (vc < vr - 1.4) return { kind: 'slow', n: z.n, v: kmh(vr), vc: kmh(vc), s: z.loss };
    if (ec < er - 1.4) return { kind: 'exit', n: z.n, s: z.loss };
    return { kind: 'most', n: z.n, s: z.loss };
  }
  return { B, V, start, step, end, pack, unpack, lapCorners, compare, at };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Analiza;
