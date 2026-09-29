/* =========================================================================
   CORE — track, car physics, AI, race logic (no DOM, no THREE)
   World: x = east (screen right), z = south (screen down), y = up.
   Heading h: forward = (cos h, sin h); right = (-sin h, cos h).
   Positive yaw rate = turning right (clockwise on screen).
   ========================================================================= */
const Core = (function () {
  'use strict';
  const G = 9.81;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrapPi = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function rng(seed) { // mulberry32
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0; let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------------------
     TRACK
     --------------------------------------------------------------------- */
  // The track definitions (layout, heights, scenery anchors, named places) live in js/tracks/<id>.js, one file per track.
  // Each adds itself to TRACK_DEFS; index.html loads them before this file, in the order of the track menu. (In Node, load
  // Core with tests/lib/core.js, which reads the track files first; a plain require of this file gives a Core without tracks.)
  const TRACKS = (typeof TRACK_DEFS !== 'undefined' ? TRACK_DEFS : []).slice();
  const TRACK_DEF = TRACKS.find(d => d.id === 'jezero'), PIKES_DEF = TRACKS.find(d => d.id === 'pikes');   // (exported by name)

  // centripetal Catmull-Rom through the control points. Closed loop by default; open = a road with two ends
  // (phantom end points mirror the first / last segment, and the last point itself is appended).
  function catmullRom(pts, n, open) {
    const out = [], N = pts.length;
    const P = open ? (i) => (i < 0 ? [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]] : i >= N ? [2 * pts[N - 1][0] - pts[N - 2][0], 2 * pts[N - 1][1] - pts[N - 2][1]] : pts[i]) : null;
    for (let i = 0; i < (open ? N - 1 : N); i++) {
      const p0 = open ? P(i - 1) : pts[(i - 1 + N) % N], p1 = pts[i], p2 = open ? P(i + 1) : pts[(i + 1) % N], p3 = open ? P(i + 2) : pts[(i + 2) % N];
      const tj = (ti, a, b) => ti + Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5);
      const t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
      const L = (a, b, ta, tb, t) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
      for (let k = 0; k < n; k++) {
        const t = t1 + (t2 - t1) * k / n;
        const A1 = L(p0, p1, t0, t1, t), A2 = L(p1, p2, t1, t2, t), A3 = L(p2, p3, t2, t3, t);
        const B1 = L(A1, A2, t0, t2, t), B2 = L(A2, A3, t1, t3, t);
        out.push(L(B1, B2, t1, t2, t));
      }
    }
    if (open) out.push([pts[N - 1][0], pts[N - 1][1]]);
    return out;
  }

  class Track {
    constructor(def) {
      this.def = def;
      this.w = def.halfWidth;
      // def.open: a point-to-point road (hill climb). Sample 0 = points[0] (bottom end), sample N-1 = the last point (top end);
      // nothing wraps: every neighbour lookup is clamped to [0, N-1] instead of taken modulo N.
      const open = this.open = !!def.open;
      const dense = catmullRom(def.points, 32, open);
      // arc length resample
      const M = dense.length, cum = [0], MS = open ? M - 1 : M;
      for (let i = 0; i < MS; i++) { const a = dense[i], b = dense[(i + 1) % M]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
      const len = cum[MS];
      const N = open ? Math.round(len / 2.0) + 1 : Math.round(len / 2.0);   // open: the last sample lands on the end of the road
      const ds = open ? len / (N - 1) : len / N;
      this.N = N; this.ds = ds; this.len = len;
      const px = this.px = new Float32Array(N), pz = this.pz = new Float32Array(N);
      let j = 0;
      for (let k = 0; k < N; k++) {
        const s = k * ds;
        if (open) while (j < MS - 1 && cum[j + 1] < s) j++;
        else while (cum[j + 1] < s) j++;
        const a = dense[j], b = dense[(j + 1) % M];
        let t = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]); if (open) t = clamp(t, 0, 1);
        px[k] = a[0] + (b[0] - a[0]) * t; pz[k] = a[1] + (b[1] - a[1]) * t;
      }
      const tx = this.tx = new Float32Array(N), tz = this.tz = new Float32Array(N);
      const nx = this.nx = new Float32Array(N), nz = this.nz = new Float32Array(N);
      const hd = this.hd = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const a = open ? Math.max(0, i - 1) : (i - 1 + N) % N, b = open ? Math.min(N - 1, i + 1) : (i + 1) % N;
        let dx = px[b] - px[a], dz = pz[b] - pz[a]; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
        tx[i] = dx; tz[i] = dz; nx[i] = -dz; nz[i] = dx; hd[i] = Math.atan2(dz, dx);
      }
      // signed curvature (positive = right turn) smoothed
      const kr = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        if (open) { const a = Math.max(0, i - 3), b = Math.min(N - 1, i + 3); kr[i] = wrapPi(hd[b] - hd[a]) / ((b - a) * ds); continue; }
        const a = (i - 3 + N) % N, b = (i + 3) % N;
        kr[i] = wrapPi(hd[b] - hd[a]) / (6 * ds);
      }
      const k = this.k = new Float32Array(N);
      for (let i = 0; i < N; i++) { let s = 0; for (let o = -3; o <= 3; o++) s += kr[open ? clamp(i + o, 0, N - 1) : (i + o + N) % N]; k[i] = s / 7; }

      this._buildElevation(def);
      this._buildEdges();
      this._buildRacingLine();
      this._buildCorners();
      // start line index: nearest sample to startX on main straight (first straight near z of point 0)
      let best = 0, bd = 1e9;
      for (let i = 0; i < N; i++) {
        const d = def.start ? Math.hypot(px[i] - def.start[0], pz[i] - def.start[1]) : Math.abs(px[i] - def.startX) + Math.abs(pz[i] - def.points[0][1]) * 3;
        if (d < bd) { bd = d; best = i; }
      }
      this.startIdx = best; this.startS = best * ds;
      // finish line, checkpoints and heights (open roads). Closed circuits: finish = start, no checkpoints.
      if (open) {
        this.finishIdx = def.finish ? this.nearestIdx(def.finish[0], def.finish[1]) : N - 1;
        this.finishS = this.finishIdx * ds;
        this.raceLen = this.finishS - this.startS;
        this.cpS = (def.cps || []).map(p => this.nearestIdx(p[0], p[1]) * ds).filter(s => s > this.startS && s < this.finishS).sort((a, b) => a - b);
        this.hStart = this.hy[this.startIdx]; this.hFinish = this.hy[this.finishIdx];
      } else {
        this.finishIdx = this.startIdx; this.finishS = this.startS; this.raceLen = len; this.cpS = []; this.hStart = 0; this.hFinish = 0;
      }
      this.cpDist = this.cpS.map(s => s - this.startS);   // metres from the start line
      // named places (def.names = [[name, x, z, lines?], ...] snapped to the centre line, or { n, d, say? } with d = metres after the
      // start line, for scaled roads): { n, d, say } in lap order (HUD label, commentator lines or null). Open roads keep only the run.
      this.names = (def.names || []).map((e) => {
        const arr = Array.isArray(e), n = arr ? e[0] : e.n, say = arr ? e[3] : e.say;
        let d = !arr && e.d != null ? +e.d : this.nearestIdx(arr ? e[1] : e.x, arr ? e[2] : e.z) * ds - this.startS;
        if (!open) d = ((d % len) + len) % len;
        return { n, d, say: Array.isArray(say) && say.length ? say : null };
      }).filter(q => !open || (q.d >= 0 && q.d <= this.raceLen)).sort((a, b) => a.d - b.d);
      // banked corners (def.bank = [[from, to, slope], ...], metres after the start line; closed circuits): the road surface tilts across
      // its width towards the inside of the bend (slope = height lost per metre towards the inside), eased in and out over ~20 m
      this.bank = null;
      if (def.bank && !open) {
        const bk = this.bank = new Float32Array(N), bs = this.bankSide = new Int8Array(N);
        for (const [a, b, sl] of def.bank) {
          let km = 0; for (let d = a; d <= b; d += ds) km += this.k[this.idx(this.startS + d)];
          const side = km > 0 ? 1 : -1;   // the inside of the bend
          for (let d = a - 22; d <= b + 22; d += ds / 2) { const i = this.idx(this.startS + d), f = Math.min(sstep(a - 22, a + 6, d), sstep(b + 22, b - 6, d)); if (sl * f > bk[i]) { bk[i] = sl * f; bs[i] = side; } }
        }
      }
      // gravel strips (def.gravelStrips = [[from, to, side, width], ...], metres after the start line, side -1 left / 1 right; closed
      // circuits): a band of gravel from the kerb's outer edge outwards, as the strips the Red Bull Ring laid at the exits of Turns 9 and
      // 10 in 2024 against running wide (see surface: gravel there even where the run-off beyond it is asphalt)
      this.gstrip = null;
      if (def.gravelStrips && !open) {
        const g = this.gstrip = [new Float32Array(N), new Float32Array(N)];
        for (const [a, b, side, wd] of def.gravelStrips) for (let d = a; d <= b; d += ds / 2) g[side > 0 ? 1 : 0][this.idx(this.startS + d)] = wd;
      }
      // DRS zones (def.drs = [[turn, detection, activation, next turn], ...], metres relative to the turns of def.turns; closed circuits):
      // { det, act, end } in metres after the start line, the zone closing 60 m before the next turn (see Race._drs)
      this.drs = null;
      if (def.drs && def.turns && !open) {
        const tS = (k) => { const t = def.turns[k - 1]; return this.nearestIdx(t[0], t[1]) * ds - this.startS; }, W = (d) => ((d % len) + len) % len;
        this.drs = def.drs.map(([t, det, act, nt]) => ({ det: W(tS(t) + det), act: W(tS(t) + act), end: W(tS(nt) - 60) }));
      }
    }

    // banked corners: the road surface's height offset at lateral offset d (m, + right) and its lateral slope there (dy/dd, 0 off the road)
    bankAt(s, d, out) {
      out.dy = 0; out.sl = 0; if (!this.bank) return out;
      const N = this.N, f = s / this.ds, fi = Math.floor(f), i0 = ((fi % N) + N) % N, i1 = (i0 + 1) % N, t = f - fi;
      const b = this.bank[i0] * (1 - t) + this.bank[i1] * t; if (!(b > 0)) return out;
      const side = this.bankSide[i0] || this.bankSide[i1], u = d * side;   // metres towards the inside of the bend
      out.dy = -b * clamp(u, -this.w, this.w + 6); out.sl = u > -this.w && u < this.w + 6 ? -b * side : 0;   // (the bowl runs on 6 m past the inner edge; the outer verge stays at the edge's height)
      return out;
    }

    // index of the centreline sample nearest to (x, z) (full scan)
    nearestIdx(x, z) {
      let best = 0, bd = 1e18;
      for (let i = 0; i < this.N; i++) { const dx = this.px[i] - x, dz = this.pz[i] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
      return best;
    }

    // real altitude (metres above sea level) for a road height y, if the track defines def.alt = [alt at start, alt at finish]; else null
    altAt(y) {
      const A = this.def.alt; if (!A) return null;
      const dh = this.hFinish - this.hStart;
      return A[0] + (dh ? (y - this.hStart) / dh : 0) * (A[1] - A[0]);
    }

    // Longitudinal height profile of the road (0 everywhere for flat tracks).
    // def.elev: [[frac,height], ...] smooth hills around the loop (periodic, start≈end).
    // def.bumps: [{at:frac, h:meters, w:halfWidth}] Gaussian bumps → the car flies off crests.
    _buildElevation(def) {
      const N = this.N, ds = this.ds, len = this.len;
      const hy = this.hy = new Float32Array(N);
      const grade = this.grade = new Float32Array(N);
      const curv = this.curv = new Float32Array(N);
      this.hasElev = !!(def.elev || def.bumps);
      if (!this.hasElev) return;
      if (this.open) return this._buildElevationOpen(def);
      // piecewise-linear base from keyframes (cyclic), then heavily smoothed into rolling hills
      const kf = (def.elev || [[0, 0], [1, 0]]).slice().map(p => [((p[0] % 1) + 1) % 1 * len, p[1]]);
      kf.sort((a, b) => a[0] - b[0]);
      const baseAt = (s) => {
        s = ((s % len) + len) % len;
        let a = kf[kf.length - 1], b = kf[0];
        for (let m = 0; m < kf.length; m++) { if (kf[m][0] <= s) { a = kf[m]; b = kf[(m + 1) % kf.length]; } }
        let s0 = a[0], s1 = b[0]; if (s1 <= s0) s1 += len; let sc = s; if (sc < s0) sc += len;
        const t = (sc - s0) / Math.max(1e-6, s1 - s0);
        return a[1] + (b[1] - a[1]) * t;
      };
      for (let i = 0; i < N; i++) hy[i] = baseAt(i * ds);
      // smooth the base hills (periodic box filter) into gentle rolling terrain; a long real profile (def.elevSmooth, metres) keeps its detail
      const smooth = (arr, r, it) => { let a = arr; for (let n = 0; n < it; n++) { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let d = -r; d <= r; d++) s += a[(i + d + N) % N]; o[i] = s / (2 * r + 1); } a = o; } return a; };
      const sm = smooth(hy, Math.max(1, def.elevSmooth ? Math.round(def.elevSmooth / ds) : Math.round(N / 90)), 3);
      for (let i = 0; i < N; i++) hy[i] = sm[i];
      // add sharp Gaussian bumps (kickers/dips) AFTER smoothing so they keep their shape and launch the car
      for (const b of (def.bumps || [])) {
        const c = (((b.at % 1) + 1) % 1) * len, w = b.w || 8, h = b.h || 1;
        for (let i = 0; i < N; i++) { let d = i * ds - c; if (d > len / 2) d -= len; if (d < -len / 2) d += len; hy[i] += h * Math.exp(-(d * d) / (w * w)); }
      }
      // tiny final smooth to remove sampling steppiness without killing the bumps
      const sm2 = smooth(hy, 1, 1); for (let i = 0; i < N; i++) hy[i] = sm2[i];
      // grade (dh/ds) and profile curvature (d²h/ds²)
      for (let i = 0; i < N; i++) { const a = (i - 1 + N) % N, b = (i + 1) % N; grade[i] = (hy[b] - hy[a]) / (2 * ds); }
      for (let i = 0; i < N; i++) { const a = (i - 1 + N) % N, b = (i + 1) % N; curv[i] = (grade[b] - grade[a]) / (2 * ds); }
      let mx = 0; for (let i = 0; i < N; i++) mx = Math.max(mx, hy[i]); this.maxElev = mx;
    }

    // open road: def.elev = [[x, z, h], ...] (snapped to the nearest sample) or [[frac, h], ...]; linear in s between keyframes,
    // clamped before the first / after the last one, then smoothed with a FIXED radius in metres (def.elevSmooth, default 20 m),
    // edge-replicated (nothing wraps). grade / curv are one-sided at the two ends.
    _buildElevationOpen(def) {
      const N = this.N, ds = this.ds, len = this.len, hy = this.hy, grade = this.grade, curv = this.curv;
      const kf = (def.elev || [[0, 0]]).map(p => p.length >= 3 ? [this.nearestIdx(p[0], p[1]) * ds, p[2]] : [clamp(p[0], 0, 1) * len, p[1]]);
      kf.sort((a, b) => a[0] - b[0]);
      const K = kf.length;
      for (let i = 0, m = 0; i < N; i++) {
        const s = i * ds;
        while (m < K - 1 && kf[m + 1][0] <= s) m++;
        if (s <= kf[0][0]) hy[i] = kf[0][1];
        else if (m >= K - 1) hy[i] = kf[K - 1][1];
        else { const a = kf[m], b = kf[m + 1]; hy[i] = a[1] + (b[1] - a[1]) * clamp((s - a[0]) / Math.max(1e-6, b[0] - a[0]), 0, 1); }
      }
      const smooth = (arr, r, it) => { let a = arr; for (let n = 0; n < it; n++) { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let d = -r; d <= r; d++) s += a[clamp(i + d, 0, N - 1)]; o[i] = s / (2 * r + 1); } a = o; } return a; };
      const sm = smooth(hy, Math.max(1, Math.round((def.elevSmooth || 20) / ds)), 3);
      for (let i = 0; i < N; i++) hy[i] = sm[i];
      for (const b of (def.bumps || [])) {
        const c = clamp(b.at, 0, 1) * len, w = b.w || 8, h = b.h || 1;
        for (let i = 0; i < N; i++) { const d = i * ds - c; hy[i] += h * Math.exp(-(d * d) / (w * w)); }
      }
      const sm2 = smooth(hy, 1, 1); for (let i = 0; i < N; i++) hy[i] = sm2[i];
      for (let i = 0; i < N; i++) { const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1); grade[i] = (hy[b] - hy[a]) / ((b - a) * ds); }
      for (let i = 0; i < N; i++) { const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1); curv[i] = (grade[b] - grade[a]) / ((b - a) * ds); }
      let mx = -1e9; for (let i = 0; i < N; i++) mx = Math.max(mx, hy[i]); this.maxElev = mx;
    }

    elevAt(s) {
      if (!this.hasElev) return { y: 0, grade: 0, curv: 0 };
      if (this.open) {
        const N = this.N, fi = clamp(s / this.ds, 0, N - 1), i0 = Math.min(N - 2, Math.floor(fi)), f = fi - i0, i1 = i0 + 1;
        return { y: this.hy[i0] * (1 - f) + this.hy[i1] * f, grade: this.grade[i0] * (1 - f) + this.grade[i1] * f, curv: this.curv[i0] * (1 - f) + this.curv[i1] * f };
      }
      const N = this.N, ds = this.ds; let fi = s / ds; const i0 = ((Math.floor(fi) % N) + N) % N, f = fi - Math.floor(fi), i1 = (i0 + 1) % N;
      return { y: this.hy[i0] * (1 - f) + this.hy[i1] * f, grade: this.grade[i0] * (1 - f) + this.grade[i1] * f, curv: this.curv[i0] * (1 - f) + this.curv[i1] * f };
    }

    _buildEdges() {
      const N = this.N, w = this.w, k = this.k, ds = this.ds;
      const bl = new Float32Array(N), br = new Float32Array(N);
      // outside runoff grows with curvature
      for (let i = 0; i < N; i++) {
        const ak = Math.abs(k[i]);
        const RO = this.def.runoff || 1;   // street circuits: walls close to the road
        const out = ak > 1 / 160 ? clamp((9 + 1100 * ak) * RO, 9 * RO, 21 * RO) : (this.def.side || 6.5);
        const inn = this.def.inner || 5.5;
        if (k[i] > 0) { bl[i] = w + out; br[i] = w + inn; } else { br[i] = w + out; bl[i] = w + inn; }
      }
      const open = this.open, W = open ? (i) => (i < 0 ? 0 : i >= N ? N - 1 : i) : (i) => (i + N) % N;   // neighbour index: clamped (open road) or wrapped
      const dilate = (arr, r) => { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let m = 0; for (let d = -r; d <= r; d++) m = Math.max(m, arr[W(i + d)]); o[i] = m; } return o; };
      const smooth = (arr, r, it) => { let a = arr; for (let n = 0; n < it; n++) { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let d = -r; d <= r; d++) s += a[W(i + d)]; o[i] = s / (2 * r + 1); } a = o; } return a; };
      let BL = smooth(dilate(bl, 14), 6, 3), BR = smooth(dilate(br, 14), 6, 3);
      // limit: inside of a curve cannot exceed 0.8 * radius, and not closer than w+4
      const limitInside = () => {
        for (let i = 0; i < N; i++) {
          const ak = Math.abs(k[i]);
          if (ak > 1e-4) {
            const lim = Math.max(w + 4, 0.82 / ak);
            if (k[i] > 0) BR[i] = Math.min(BR[i], lim); else BL[i] = Math.min(BL[i], lim);
          }
        }
      };
      // limit by proximity to other parts of the track (every other sample j within 80 m, found through an 80 m spatial hash: O(N))
      const px = this.px, pz = this.pz, nx = this.nx, nz = this.nz;
      const CELL = 80, hash = new Map(), hkey = (cx, cz) => cx * 131072 + cz;
      for (let j = 0; j < N; j += 2) { const key = hkey(Math.floor(px[j] / CELL), Math.floor(pz[j] / CELL)); let L = hash.get(key); if (!L) hash.set(key, L = []); L.push(j); }
      const limitNear = () => {
        for (let i = 0; i < N; i++) {
          const cx = Math.floor(px[i] / CELL), cz = Math.floor(pz[i] / CELL);
          for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gz = cz - 1; gz <= cz + 1; gz++) {
          const L = hash.get(hkey(gx, gz)); if (!L) continue;
          for (let n = 0; n < L.length; n++) {
            const j = L[n];
            let di = Math.abs(i - j); if (!open) di = Math.min(di, N - di);
            if (di * ds < 70) continue;
            const dx = px[j] - px[i], dz = pz[j] - pz[i];
            const d = Math.hypot(dx, dz);
            if (d > 80) continue;
            const side = dx * nx[i] + dz * nz[i];
            const lim = d * 0.5 - 1;
            if (side > 0) BR[i] = Math.min(BR[i], lim); else BL[i] = Math.min(BL[i], lim);
          }
          }
        }
      };
      limitInside(); limitNear();
      BL = smooth(BL, 3, 2); BR = smooth(BR, 3, 2);
      limitInside(); limitNear();
      const minB = Math.min(3.5, this.def.side || 3.5);
      for (let i = 0; i < N; i++) { BL[i] = Math.max(BL[i], w + minB); BR[i] = Math.max(BR[i], w + minB); }
      this.bl = BL; this.br = BR;
      // curbs where curvature is meaningful (both sides), dilated — but not on makadam (rally) roads
      const cb = new Uint8Array(N);
      if (this.def.roadSurface !== 'makadam' && !this.def.noCurbs) for (let i = 0; i < N; i++) if (Math.abs(k[i]) > 1 / 190) cb[i] = 1;
      const curb = new Uint8Array(N);
      for (let i = 0; i < N; i++) { let m = 0; for (let d = -5; d <= 5; d++) m |= cb[W(i + d)]; curb[i] = m; }
      if (this.def.roadSurface === 'makadam') curb.fill(0); // rally roads: no curbs
      if (this.def.roadSurface === 'makadam') curb.fill(0);   // dirt rally road: no kerbs
      this.curb = curb;
      this.curbW = 1.5;
      // gravel: side where barrier far away
      const gl = new Uint8Array(N), gr = new Uint8Array(N);
      for (let i = 0; i < N; i++) { gl[i] = BL[i] > w + 11 ? 1 : 0; gr[i] = BR[i] > w + 11 ? 1 : 0; }
      if (this.def.roadSurface === 'makadam' || this.def.noGravel) { gl.fill(0); gr.fill(0); } // rally stage: grass/forest verge, no gravel traps
      this.gravL = gl; this.gravR = gr;
    }

    _buildRacingLine() {
      const N = this.N, px = this.px, pz = this.pz, nx = this.nx, nz = this.nz;
      const off = new Float32Array(N);
      const lim = this.w - 1.7, open = this.open;
      const passes = [[14, 300], [7, 300], [3, 300]];
      for (const [K, iters] of passes) {
        for (let it = 0; it < iters; it++) {
          for (let i = 0; i < N; i++) {
            let a, b;
            if (open) { const K2 = Math.min(K, i, N - 1 - i); if (K2 < 1) continue; a = i - K2; b = i + K2; }   // symmetric window shrinking to the pinned ends
            else { a = (i - K + N) % N; b = (i + K) % N; }
            const ax = px[a] + nx[a] * off[a], az = pz[a] + nz[a] * off[a];
            const bx = px[b] + nx[b] * off[b], bz = pz[b] + nz[b] * off[b];
            const mx = (ax + bx) * 0.5, mz = (az + bz) * 0.5;
            const t = (mx - px[i]) * nx[i] + (mz - pz[i]) * nz[i];
            off[i] = clamp(off[i] + (t - off[i]) * 0.55, -lim, lim);
          }
        }
      }
      this.rl = off;
      // curvature of racing line
      const rx = new Float32Array(N), rz = new Float32Array(N);
      for (let i = 0; i < N; i++) { rx[i] = px[i] + nx[i] * off[i]; rz[i] = pz[i] + nz[i] * off[i]; }
      const rk = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        let a, b;
        if (open) { const K4 = Math.min(4, i, N - 1 - i); if (K4 < 1) { rk[i] = 0; continue; } a = i - K4; b = i + K4; }
        else { a = (i - 4 + N) % N; b = (i + 4) % N; }
        // circumcircle curvature
        const x1 = rx[a], z1 = rz[a], x2 = rx[i], z2 = rz[i], x3 = rx[b], z3 = rz[b];
        const A = Math.hypot(x2 - x1, z2 - z1), B = Math.hypot(x3 - x2, z3 - z2), C = Math.hypot(x3 - x1, z3 - z1);
        const cross = (x2 - x1) * (z3 - z1) - (z2 - z1) * (x3 - x1);
        rk[i] = 2 * cross / Math.max(1e-6, A * B * C);
      }
      this.rk = rk; this.rx = rx; this.rz = rz;
      // racing line segment lengths (for speed profile)
      const rds = new Float32Array(N);
      for (let i = 0; i < N; i++) { const b = (i + 1) % N; rds[i] = Math.hypot(rx[b] - rx[i], rz[b] - rz[i]); }
      if (open) rds[N - 1] = 0;
      this.rds = rds;
    }

    // speed profile for a given lateral accel limit (m/s^2) and braking decel
    speedProfile(latA, brakeA, vtop, wMax) {
      const N = this.N, rk = this.rk, rds = this.rds;
      const v = new Float32Array(N);
      for (let i = 0; i < N; i++) v[i] = Math.min(vtop, Math.sqrt(latA / Math.max(Math.abs(rk[i]), 1e-5)));
      if (this.bank) for (let i = 0; i < N; i++) { const b = this.bank[i]; if (b > 0) v[i] = Math.min(vtop, Math.sqrt((latA + G * b / Math.sqrt(1 + b * b)) / Math.max(Math.abs(rk[i]), 1e-5))); }   // a banked bend carries part of the cornering force
      if (wMax) for (let i = 0; i < N; i++) v[i] = Math.min(v[i], wMax / Math.max(Math.abs(rk[i]), 1e-5));   // cs: the car turns no faster than wMax (rad/s) along its path
      if (this.open) {   // open road: come to a stop at the far end of the road, nothing wraps
        v[N - 1] = 0;
        for (let i = N - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * brakeA * rds[i]));
        return v;
      }
      // closed circuit with gravity on the slopes (def.gradeForce): braking downhill takes longer, uphill shorter
      const gr = this.def.gradeForce && this.hasElev ? this.grade : null;
      for (let pass = 0; pass < 3; pass++) {
        if (gr) { for (let i = N - 1; i >= 0; i--) { const b = (i + 1) % N, a = Math.max(brakeA * 0.6, brakeA + G * gr[i]); v[i] = Math.min(v[i], Math.sqrt(v[b] * v[b] + 2 * a * rds[i])); } continue; }
        for (let i = N - 1; i >= 0; i--) { const b = (i + 1) % N; v[i] = Math.min(v[i], Math.sqrt(v[b] * v[b] + 2 * brakeA * rds[i])); }
      }
      return v;
    }

    _buildCorners() {
      // corner list for pace-note arrows: contiguous regions of centerline curvature
      const N = this.N, k = this.k, ds = this.ds;
      const corners = [];
      let i0 = -1;
      // find a start where curvature is low
      let start = 0; if (!this.open) for (let i = 0; i < N; i++) if (Math.abs(k[i]) < 1 / 400) { start = i; break; }
      let cur = null;
      for (let n = 0; n <= N; n++) {
        if (this.open && n === N) { if (cur && Math.abs(cur.sumk) > 0.35) corners.push(cur); break; }   // open road: a linear scan, no wrap
        const i = (start + n) % N;
        const on = Math.abs(k[i]) > 1 / 110;
        if (on && !cur) cur = { i0: i, i1: i, sumk: 0, maxk: 0, dir: 0 };
        if (on && cur) { cur.i1 = i; cur.sumk += k[i] * ds; if (Math.abs(k[i]) > cur.maxk) { cur.maxk = Math.abs(k[i]); cur.dir = Math.sign(k[i]); } }
        if ((!on || n === N) && cur) {
          if (Math.abs(cur.sumk) > 0.35) corners.push(cur);
          cur = null;
        }
      }
      for (const c of corners) {
        c.s0 = c.i0 * ds;
        c.minR = 1 / c.maxk;
        c.angle = Math.abs(c.sumk);
        c.sev = c.minR < 28 ? 3 : c.minR < 55 ? 2 : 1;
      }
      this.corners = corners;
    }

    idx(s) { const N = this.N; if (this.open) return clamp(Math.floor(s / this.ds), 0, N - 1); let i = Math.floor(s / this.ds) % N; if (i < 0) i += N; return i; }

    // pit lane (def.pit = [centre offset to the right, from, to, player's box] in metres from the start line): a lane beside the straight,
    // tapering in from the circuit edge at both ends. Returns null outside it. gap: the lane touches the circuit (no pit wall) - where you drive in and out.
    // inner: the player's limit on the pit-wall side: the rail, but where the teams' stands sit on the grass strip behind it (pitStands [d0, d1],
    // set by the world builder from its pit boxes) the lane's edge kerb, eased in and out over 25 m
    pitAt(s) {
      const P = this.def && this.def.pit; if (!P) return null;
      const L = this.len; let d = s - this.startS; d = ((d % L) + L) % L; if (d > L / 2) d -= L;
      if (d < P[1] || d > P[2]) return null;
      const f = (((s % L) + L) % L) / this.ds, i = Math.floor(f) % this.N, j = (i + 1) % this.N, br = lerp(this.br[i], this.br[j], f - Math.floor(f));
      const full = Math.max(P[0], br + 5), t = Math.min(sstep(P[1], P[1] + 60, d), sstep(P[2], P[2] - 30, d)), o = lerp(this.w + 3.6, full, t);   // a long, gentle way in
      const S = this.pitStands, e = S ? Math.min(sstep(S[0] - 26, S[0] - 1, d), sstep(S[1] + 26, S[1] + 1, d)) : 0, wall = br + 0.25, lin = o - 3.5;
      return { d, o, t, br, gap: o - 3.5 < br + 0.8, wall, lin, lout: o + 3.5, inner: wall + 0.12 + Math.max(0, lin - 0.3 - wall - 0.12) * e };
    }

    // nearest point search around hint index; returns object (reused)
    query(x, z, hint, out) {
      const N = this.N, px = this.px, pz = this.pz;
      out = out || {};
      let bi = -1, bd = 1e18;
      const open = this.open;
      if (hint >= 0) {
        for (let o = -10; o <= 10; o++) {
          const i = open ? hint + o : (hint + o + N) % N;
          if (open && (i < 0 || i >= N)) continue;
          const dx = x - px[i], dz = z - pz[i]; const d = dx * dx + dz * dz;
          if (d < bd) { bd = d; bi = i; }
        }
      }
      if (bi < 0 || bd > 60 * 60) {
        for (let i = 0; i < N; i++) { const dx = x - px[i], dz = z - pz[i]; const d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
      }
      // refine with neighbouring segment projection
      let i = bi;
      const tx = this.tx, tz = this.tz;
      let along = (x - px[i]) * tx[i] + (z - pz[i]) * tz[i];
      let j = i, t;
      if (along < 0) { j = open ? i - 1 : (i - 1 + N) % N; }
      if (open) j = clamp(j, 0, N - 2);   // open road: the end segments are 0-1 and N-2 - N-1 (no closing segment)
      const a = j, b = (j + 1) % N;
      const sx = px[b] - px[a], sz = pz[b] - pz[a], sl2 = sx * sx + sz * sz;
      const tu = ((x - px[a]) * sx + (z - pz[a]) * sz) / sl2;
      t = clamp(tu, 0, 1);
      // open road: how far the point lies beyond an end of the road along it (negative before sample 0, positive past sample N-1)
      if (open) out.over = a === 0 && tu < 0 ? tu * Math.sqrt(sl2) : b === N - 1 && tu > 1 ? (tu - 1) * Math.sqrt(sl2) : 0;
      const cx = px[a] + sx * t, cz = pz[a] + sz * t;
      const nxa = lerp(this.nx[a], this.nx[b], t), nza = lerp(this.nz[a], this.nz[b], t);
      out.i = bi; out.a = a; out.t = t; out.x = x; out.z = z;
      out.s = (a + t) * this.ds;
      out.d = (x - cx) * nxa + (z - cz) * nza;
      out.nx = nxa; out.nz = nza;
      out.tx = lerp(tx[a], tx[b], t); out.tz = lerp(tz[a], tz[b], t);
      out.bl = lerp(this.bl[a], this.bl[b], t); out.br = lerp(this.br[a], this.br[b], t);
      return out;
    }

    // surface at a query result: 0 asphalt, 1 curb, 2 grass, 3 gravel (def.runoffTarmac: the wide run-off areas are asphalt, 4 as paving;
    // def.gravelStrips: gravel just past the kerb)
    surface(q) {
      const d = q.d, ad = Math.abs(d), w = this.w;
      if (ad <= w) return this.def.roadSurface === 'makadam' ? 5 : 0;
      const i = q.a;
      if (this.curb[i] && ad <= w + this.curbW) return 1;
      if (this.gstrip) { const g = this.gstrip[d > 0 ? 1 : 0][i]; if (g > 0 && ad <= w + this.curbW + g) return 3; }
      const grav = d > 0 ? this.gravR[i] : this.gravL[i];
      return grav ? (this.def.runoffTarmac ? 4 : 3) : this.def.offSurface === 'paving' ? 4 : this.def.offSurface === 'gravel' ? 3 : 2;
    }
  }

  /* ---------------------------------------------------------------------
     CAR MODELS
     --------------------------------------------------------------------- */
  const MODELS = [
    { id: 'kaze', name: 'KAZE RS', drive: 'FR', desc: 'Zadnji pogon, rojen za drift',
      mass: 1240, a: 1.20, b: 1.30, hcg: 0.46, kI: 1.22, kw: 262, redline: 7800, idle: 950,
      gears: [3.20, 2.08, 1.50, 1.17, 0.95, 0.80], final: 4.1, rw: 0.31,
      gripF: 1.0, gripR: 1.075, cDrag: 0.42, down: 0.20, brake: 11.5, steerMax: 0.62,
      driftLoss: 0.3, len: 4.35, wid: 1.78, body: 'coupe', stats: { power: 7, grip: 6, weight: 6, drift: 9 } },
    { id: 'vortex', name: 'VORTEX 4WD', drive: 'AWD', desc: 'Štirikolesni pogon, stabilen in hiter',
      mass: 1400, a: 1.25, b: 1.35, hcg: 0.48, kI: 1.25, kw: 297, redline: 7300, idle: 900,
      gears: [3.35, 2.10, 1.52, 1.18, 0.96, 0.81], final: 4.0, rw: 0.32,
      gripF: 1.02, gripR: 1.10, cDrag: 0.44, down: 0.24, brake: 11.8, steerMax: 0.6,
      driftLoss: 0.34, len: 4.55, wid: 1.80, body: 'sedan', stats: { power: 8, grip: 9, weight: 4, drift: 5 } },
    { id: 'pico', name: 'PICO TURBO', drive: 'FF', desc: 'Lahek hatchback s prednjim pogonom',
      mass: 1040, a: 1.02, b: 1.40, hcg: 0.47, kI: 1.12, kw: 214, redline: 8200, idle: 1000,
      gears: [3.45, 2.20, 1.58, 1.22, 0.99, 0.84], final: 4.3, rw: 0.30,
      gripF: 1.04, gripR: 1.12, cDrag: 0.40, down: 0.16, brake: 12.0, steerMax: 0.64,
      driftLoss: 0.38, len: 3.95, wid: 1.70, body: 'hatch', stats: { power: 5, grip: 8, weight: 9, drift: 4 } },
    { id: 'strega', name: 'STREGA MR', drive: 'MR', desc: 'Motor na sredini, živahen in oster',
      mass: 1180, a: 1.34, b: 1.12, hcg: 0.44, kI: 1.12, kw: 283, redline: 8300, idle: 1000,
      gears: [3.10, 2.05, 1.50, 1.18, 0.97, 0.82], final: 4.1, rw: 0.31,
      gripF: 1.0, gripR: 1.07, cDrag: 0.38, down: 0.26, brake: 12.2, steerMax: 0.6,
      driftLoss: 0.27, len: 4.2, wid: 1.82, body: 'wedge', stats: { power: 8, grip: 7, weight: 7, drift: 7 } },
  ];
  // the player's rally car (from the user's reference image): 80s 4WD rally hatchback, number 7
  MODELS.push({ id: 'rally', name: 'BURJA R7', drive: 'AWD', driftDR: 1, desc: 'Relijski dirkač, pogon na vsa kolesa',
    mass: 1150, a: 1.15, b: 1.25, hcg: 0.47, kI: 1.12, kw: 290, redline: 8000, idle: 1000,
    gears: [3.1, 2.05, 1.5, 1.17, 0.95, 0.8], final: 4.2, rw: 0.31,
    gripF: 1.03, gripR: 1.1, cDrag: 0.44, down: 0.22, brake: 12.2, steerMax: 0.64,
    driftLoss: 0.3, len: 3.95, wid: 1.80, body: 'rally', num: 7, stats: { power: 9, grip: 8, weight: 8, drift: 9 } });
  // Peugeot 206 with a real 3D model ("Peugeot 206" by Alvier, CC BY 4.0) - player only, drawn from the embedded P206 mesh
  MODELS.push({ id: 'p206', name: 'PEUGEOT 206', drive: 'FF', desc: 'Francoski hot hatch s krilom',
    mass: 1080, a: 1.15, b: 1.32, hcg: 0.47, kI: 1.12, kw: 250, redline: 7600, idle: 950,
    gears: [3.40, 2.15, 1.55, 1.20, 0.98, 0.83], final: 4.2, rw: 0.32,
    gripF: 1.05, gripR: 1.12, cDrag: 0.40, down: 0.22, brake: 12.0, steerMax: 0.64,
    driftLoss: 0.36, len: 3.85, wid: 1.74, body: 'hatch', glb: 'p206', stats: { power: 7, grip: 8, weight: 8, drift: 5 },
    credit: 'Model: \u201ePeugeot 206\u201c, avtor Alvier (Sketchfab), licenca CC BY 4.0' });
  const tqShape = (u) => Math.max(0.3, 1 - 0.85 * (u - 0.7) * (u - 0.7)); // flat, arcade-strong mid-range (SWGP2 pulls hard to ~130 km/h)
  for (const M of MODELS) {
    const wr = M.redline * TAU / 60;
    M.Tmax = M.kw * 1000 / (wr * tqShape(1.0));
  }

  // assist presets
  const ASSISTS = [
    { cs: 0.35, spin: 1.1, tc: 1.6, yawD: 0.0, tcSlip: 0, tcGain: 0, bmax: 1.5, align: 3.2, bmul: 1.25, K: 4.5 },        // nizka
    { cs: 0.6, spin: 0.66, tc: 0.97, yawD: 0.25, tcSlip: 0.13, tcGain: 3.2, bmax: 1.3, align: 4.8, bmul: 1.0, K: 6 },  // srednja
    { cs: 0.8, spin: 0.55, tc: 0.86, yawD: 0.5, tcSlip: 0.09, tcGain: 4.5, bmax: 1.05, align: 6.0, bmul: 0.8, K: 7.5 },   // visoka
  ];

  // surfaces: mu multiplier, c0 (const decel m/s2), c1 (decel per m/s)
  const SURF = [
    { mu: 1.0, c0: 0, c1: 0 },         // asphalt
    { mu: 0.95, c0: 0.1, c1: 0.004 },  // curb
    { mu: 0.62, c0: 0.9, c1: 0.075 },  // grass
    { mu: 0.55, c0: 2.4, c1: 0.16 },   // gravel
    { mu: 0.86, c0: 0.35, c1: 0.03 },   // paving (street circuits)
    { mu: 0.82, c0: 0.6, c1: 0.05 },    // makadam (dirt rally road): decent accel/brake but lively, slidey
  ];
  // arcade (player) handling: yaw = max nose rotation (rad/s), mu = lateral grip (g), slide = grip kept while sliding
  // SWGP2-style tarmac handling, measured from gameplay video:
  //   amax  : lateral grip (g) - the video's cars corner at ~1.6-2.2 g
  //   kv    : how fast momentum swings toward the nose, per radian of slide (1/s)
  //   bscale: slide angle at full lock (video: ~33 deg slow, ~22 deg at 110 km/h, ~15 deg fast)
  //   rmin  : tightest low-speed turning radius (m)
  const ARC = {
    kaze: { amax: 1.72, kv: 2.0, bscale: 1.12, rmin: 4.2 },
    vortex: { amax: 1.82, kv: 2.1, bscale: 0.9, rmin: 4.4 },
    pico: { amax: 1.78, kv: 2.1, bscale: 0.86, rmin: 4.0 },
    strega: { amax: 1.76, kv: 2.0, bscale: 1.08, rmin: 4.2 },
    rally: { amax: 1.82, kv: 2.05, bscale: 1.1, rmin: 4.1 },
    p206: { amax: 1.8, kv: 2.1, bscale: 0.9, rmin: 4.1 },
  };
  const TRAC_G = 1.8, BRAKE_G = 2.6; // high-class SWGP2 cars brake at ~2.8-3.0 g peak (incl. slide), weak cars ~2.2 g

  // ---- car upgrades (free, chosen before a race): 4 levels each. upgMods(levels) -> multipliers, applied to a CLONE of the model ----
  const UPG = [
    { id: 'motor',  name: 'Motor',        lv: ['Serijski', 'Stopnja 1', 'Stopnja 2', 'Dirkalni'] },
    { id: 'gume',   name: 'Gume',         lv: ['Serijske', 'Športne', 'Polslick', 'Slick'] },
    { id: 'zavore', name: 'Zavore',       lv: ['Serijske', 'Športne', 'Dirkalne', 'Keramične'] },
    { id: 'aero',   name: 'Aerodinamika', lv: ['Serijska', 'Spojler', 'Krilo', 'Paket GT'] },
  ];
  const UPG_KW = [1, 1.08, 1.16, 1.25], UPG_GRIP = [1, 1.04, 1.08, 1.12], UPG_KV = [1, 1.02, 1.04, 1.06], UPG_BRAKE = [1, 1.08, 1.16, 1.25];
  const UPG_AEROK = [0, 0.00006, 0.00011, 0.00016], UPG_DRAG = [1, 1.03, 1.06, 1.10];
  const upgLv = (L, id) => { const x = L ? L[id] : 0, v = typeof x === 'string' && /^[0-3]$/.test(x) ? +x : x; return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0; };   // 0..3 (or '0'..'3'); missing / invalid -> 0
  // levels = {motor, gume, zavore, aero} (0..3) -> { kw, grip, trac, kv, brake, aeroK, drag }
  function upgMods(levels) {
    const m = upgLv(levels, 'motor'), g = upgLv(levels, 'gume'), z = upgLv(levels, 'zavore'), a = upgLv(levels, 'aero');
    return { kw: UPG_KW[m], grip: UPG_GRIP[g], trac: UPG_GRIP[g], kv: UPG_KV[g], brake: UPG_BRAKE[z], aeroK: UPG_AEROK[a], drag: UPG_DRAG[a] };
  }
  // stat bars (0..10, like model.stats) of a model with upgrades, plus the upgraded power in kW
  function upgStats(model, levels) {
    const b = model.stats || { power: 5, grip: 5, weight: 5, drift: 5 };
    const m = upgLv(levels, 'motor'), g = upgLv(levels, 'gume'), z = upgLv(levels, 'zavore'), a = upgLv(levels, 'aero');
    const r = (v) => Math.min(10, Math.round(v * 10) / 10);
    const up = (base, add) => { const h = 10 - base; return h > 0 ? 10 - h * Math.exp(-add / h) : base; };   // ~ +add, but it bends below 10, so every level still shows
    return {
      power: r(up(b.power, [0, 0.8, 1.6, 2.5][m])),
      grip: r(up(b.grip, [0, 0.5, 1.0, 1.5][g] + [0, 0.3, 0.6, 0.9][a] + [0, 0.2, 0.4, 0.6][z])),
      weight: r(b.weight),
      drift: r(b.drift),
      kw: model.kw * UPG_KW[m],
    };
  }
  // ---- 'cs' handling (Circuit Superstars, target-driven kinematic drift; see Car.stepCS) ----
  // Every constant is either a measured CS signature (times in s, angles in rad, rates in rad/s: scale-free) or relative to the
  // car's lateral limit aL (option 1: CS handling at our speeds; aL = CSK.aL x arc.amax, 2.24-2.37 g). Option 2 = CSK.aL 1.70.
  const CSK = {
    aL: 1.30,          // lateral limit (g) = aL x arc.amax: kaze 2.24 .. vortex/rally 2.37 g, flat with speed (B1a)
    comb: 1.08,        // friction ellipse: combined limit / lateral limit (B1c 1.0-1.15: at full brake ~0.85 aL lateral is left)
    brk: 0.62,         // brake cap = brk x brakeG: 1.61 g stock = 0.68-0.72 aL (B1b 0.67), no lock (cap < grip)
    dmgGrip: 0,        // CS damage costs top speed only (A11); the engine loses 22 %·dmg in the shared block
    wMax: 1.35,        // max path rate (rad/s) = 77 deg/s (B3a 75-80); R = v / wMax below the crossover (~60 km/h)
    rMin: 4.2,         // parking-speed turning radius (m), the kinematic regime (C8)
    tv0: 0.45, tvE: 0.4, tvLo: 0.35, tvHi: 0.60,   // tau_v(v) = tv0 (v / 100 km/h)^tvE: attitude = tau_v x path rate (B0)
    tvLoose: 0.8,      // tau_v x (1 + tvLoose (1 - lateral mu)): bigger, lazier slides on makadam / grass / sand (C11)
    ceil: 0.66,        // soft ceiling of the attitude target (38 deg; B2b 37-40)
    tIn: 0.15,         // attitude build-up time constant (s): turn-in yaw rise 0.27-0.29 s, r overshoot 1.5-2.0, slip rise 0.34-0.52 s with the key ramp (B4a/B4d/B4e); 0.09 gave 0.21 s / 2.2x and +20 % key ripple (judge)
    tOutK: 0.8,        // unwind time constant = tOutK x tau_v (B4h natural decay 0.35-0.45 s, B4i yaw dips ~-17 deg/s)
    tRev: 0.12,        // a demand to the other side (S-bend flick, counter-steer): quick swing, rate-limited (B4g, research: snap direction changes)
    rateN: 1.6, rateB: 2.3,     // attitude rate limit (rad/s): 92 deg/s, 132 deg/s under brakes (B4c ramp 50-110, B4g 62/112)
    rMax: 2.3,         // yaw-rate cap from the driver's inputs (rad/s) = 132 deg/s (A18: |r| p99.9 126 deg/s); contacts can exceed it
    tR: 0.03, rAcc: 8, rAccB: 11,   // yaw rate follows its target with 0.03 s lag, at most 460 / 630 deg/s^2 (B4j lower bounds 245-500)
    lead: 0.05,        // attitude lead on a rising demand (s): rotate first, settle 2-3 deg (B4e, B4f)
    leadOut: 0.2,      // attitude lead on a falling demand (s): the nose stops while the path still turns (B4i; beta leads omega by 0.1 s)
    kPath: 0.35,       // share of the FR/MR lift / power rotation that also tightens the line
    scrub: 0.6,        // slide scrub along the path = scrub x a_n x tan(attitude) (B1h: 0.2-0.35 aL coasting in a limit drift; A8)
    bxFull: 0.6,       // the brake excess is full from 60 % brake force (analogue brakes: AI, autopilot)
    bxOn: 0.10, bxOff: 0.18,   // brake excess builds / decays (s) (B5a: +4 deg at 0.2 s, +6.8 at 0.3 s, gone 0.5 s after release)
    coastT: 0.2,       // lift / coast detection (s) (B5b)
    liftT: 0.45, liftOn: 0.12, liftA: 0.5,   // FR/MR lift-off pulse: decay, attack (s), only above liftA x aL lateral (5.4)
    hbX: 0.17, hbBrk: 0.3,     // the drift button in cs: +10 deg rotation aid and a light 0.3 g brake (C9)
    kFR: 3.5, kLR: 0.8, kLt: 0.5, kickHp: 0.35, kickOn: 0.06, kickMax: 0.35, kickPath: 0.3,   // surface-edge kick (B8c, C11): axle grip step
                       // (outer wheels weighted by the lateral load, kLt), side drag step, high-passed over kickHp s, <= 20 deg
    tapT: 1.5, tapMax: 0.4, tapDecay: 0.25,   // car contacts: the rigid-body yaw impulse x tapT becomes an attitude kick (<= 23 deg) that decays
                       // in tapDecay s while the servo carries the car through it (B10b: +10-30 deg, +50-140 deg/s, back in 0.25-0.5 s)
    airYawT: 0.25,     // in the air the yaw rate dies away in 0.25 s (no steering there; the car lands close to its travel)
    engBrk: 0.5,       // engine braking when lifting (m/s^2; arcade 1.1): lifting costs little (B1f)
    brkUp: 10, brkDn: 12,      // brake force ramp (1/s): full in 0.10 s, off in 0.08 s (A6, C6)
    stOff: 0.14, stA: 0.06,    // steer shaping: digital back to centre in 0.14 s; analogue lag 0.06 s (C1)
    wallE: 0.05, wallMu: 0.25, wallYaw: 0.3,   // walls: restitution, scrape friction, share of the lever-arm yaw (B9)
    carE: 0.1,         // car contacts: restitution (B10a); the angular impulse becomes the attitude kick above
    aiLatA: 18.5, aiBrakeA: 12.5, aiWmax: 1.2, aiAssist: 2, aiBx: 0.45, aiKw: 0.3, aiSkCap: 1.06,   // AI (B11, §5.5)
  };
  // cs per-wheel surfaces (instead of SURF inside stepCS; SURF itself is unchanged for the arcade)
  const CSSURF = [   // lat: side grip share, tr: traction / brake share, c0 (m/s^2) + c1 (1/s) x speed: rolling drag
    { lat: 1.0, tr: 1.0, c0: 0, c1: 0 },            // asphalt
    { lat: 1.0, tr: 0.95, c0: 0.1, c1: 0.004 },     // kerb: grip = asphalt, cosmetic (B8d)
    { lat: 0.66, tr: 0.85, c0: 1.5, c1: 0.15 },     // grass: 2 wheels ~ -0.3 g of drive at 95 km/h (B8a), 2/3 of the side grip left
    { lat: 0.58, tr: 0.85, c0: 1.0, c1: 0.05 },     // gravel / sand: whole car ~ -0.4 g of drive (drive about halved, A32/B8a), side grip 0.58
    { lat: 0.88, tr: 0.86, c0: 0.35, c1: 0.03 },    // paving (= SURF)
    { lat: 0.8, tr: 0.82, c0: 0.6, c1: 0.05 },      // makadam: side grip 0.8, tau_v +16 % (C11); drive and drag = SURF (gora's pace unchanged)
  ];
  // cs per model (drive-type layer, targets §5.4): bx brake excess at full brake + full demand, coast / thr steady attitude
  // change at full demand, liftP / pwr FR/MR rotation, out = unwind factor, turn = turn-in speed factor, w = path-rate cap factor
  const CSP = {
    kaze:   { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.10, out: 1.3, turn: 1.0, w: 1.0 },       // FR: lift-off + power rotation, lazier exits
    vortex: { bx: 0.11, coast: -0.088, thr: -0.02, liftP: 0, pwr: 0.025, out: 0.9, turn: 0.95, w: 0.97 },  // AWD: steady, straightens fastest
    pico:   { bx: 0.16, coast: -0.099, thr: -0.035, liftP: 0, pwr: 0, out: 1.0, turn: 1.0, w: 1.03 },       // FF: pivots on the brakes, throttle pulls it straight
    strega: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.18, pwr: 0.08, out: 1.2, turn: 1.15, w: 1.02 },     // MR: quick turn-in, lift rotation
    rally:  { bx: 0.13, coast: -0.077, thr: -0.015, liftP: 0, pwr: 0.035, out: 0.95, turn: 1.05, w: 1.0 },  // AWD rally car: a bit livelier
    p206:   { bx: 0.15, coast: -0.099, thr: -0.03, liftP: 0, pwr: 0, out: 1.0, turn: 1.0, w: 1.02 },       // FF
  };
  // cs assists (index = ASSISTS level). visoka (2, the default) = the measured CS car; lower levels = more slide, lazier recovery
  // lock: full steer as a share of the path-rate cap (>1: can overdrive the grip), bx / layer / kick: pedal, drive-type and
  // surface-kick multipliers, out: unwind factor, hard: hard attitude limit (rad), stOn: digital steer ramp to full (s)
  const CSASSIST = [
    { lock: 1.06, bx: 1.25, layer: 1.4, kick: 1.3, out: 1.12, hard: 1.0, stOn: 0.30 },    // nizka
    { lock: 1.02, bx: 1.12, layer: 1.2, kick: 1.15, out: 1.05, hard: 0.87, stOn: 0.33 },  // srednja
    { lock: 1.0, bx: 1.0, layer: 1.0, kick: 1.0, out: 1.0, hard: 0.8, stOn: 0.36 },       // visoka
  ];
  const PWR_MULT = 1.75, SW_DRAG = 0.0013; // arcade power boost and drag (fit to SWGP2 acceleration curves)
  const DRS_DRAG = 0.8;   // the air drag with the rear wing's flap open (Car.drs, set by Race._drs)
  const JUMP_G = 14; // vertical gravity for jumps on hilly tracks (arcade-snappy, a bit above real g)
  const _bk = { dy: 0, sl: 0 };   // (Track.bankAt output)
  const MU_BASE = 1.32;
  const STEER_VREF = 21;
  const DRIFT_GRIP = 0.42; // extra lateral 'momentum follows the nose' accel (g) at full drift

  // normalized lateral force for slip angle a (rad): front falls off after peak (understeer), rear stays flat (drift-friendly)
  function tireF(a) { const f = Math.sin(1.62 * Math.atan(10 * Math.abs(a))); return a < 0 ? -f : f; }
  // player front tyre: keeps biting at full lock so more steering = more turning
  function tireFP(a) { const f = Math.sin(1.42 * Math.atan(9 * Math.abs(a))); return a < 0 ? -f : f; }
  function tireR(a) { const f = Math.sin(1.38 * Math.atan(7.5 * Math.abs(a))); return a < 0 ? -f : f; }
  const tire = tireR;

  /* ---------------------------------------------------------------------
     CAR
     --------------------------------------------------------------------- */
  class Car {
    constructor(model, opts) {
      // upgrades: the car drives a CLONE of the model (MODELS / ARC entries are shared by every car and the menus: never mutate them)
      const U = opts.upg ? upgMods(opts.upg) : null;
      if (U) {
        model = Object.assign({}, model, { kw: model.kw * U.kw, cDrag: model.cDrag * U.drag });
        model.Tmax = model.kw * 1000 / (model.redline * TAU / 60 * tqShape(1.0));
      }
      const arc0 = ARC[model.id] || ARC.kaze;
      this.arc = U ? Object.assign({}, arc0, { amax: arc0.amax * U.grip, kv: arc0.kv * U.kv }) : arc0;   // per-car arcade handling
      this.tracG = U ? TRAC_G * U.trac : TRAC_G; this.brakeG = U ? BRAKE_G * U.brake : BRAKE_G; this.aeroK = U ? U.aeroK : 0;
      this.upg = U ? { motor: upgLv(opts.upg, 'motor'), gume: upgLv(opts.upg, 'gume'), zavore: upgLv(opts.upg, 'zavore'), aero: upgLv(opts.upg, 'aero') } : null;
      this.upgGrip = U ? U.grip : 0;   // autopilot / AI corner-speed scale (0 = stock car)
      this.m = model;
      this.id = opts.id || 0;
      this.isPlayer = !!opts.isPlayer;
      if (opts.net) this.net = true;   // a friend's car in an online race: its own phone drives it, this one only shows it (Race.step leaves it alone)
      this.phys = opts.phys === 'cs' || opts.phys === 'rally' ? 'cs' : 'arcade';   // 'cs': Circuit Superstars kinematic drift (stepCS; the removed 'rally' maps to it); 'arcade': the SWGP2-style slide model
      this.arcade = this.phys === 'cs' ? false : !!opts.arcade;
      this.wMaxNow = 2;
      this.name = opts.name || model.name;
      this.color = opts.color;
      this.assist = ASSISTS[opts.assist == null ? 1 : opts.assist];
      this.x = 0; this.z = 0; this.h = 0; this.vx = 0; this.vz = 0; this.w = 0;
      this.px = 0; this.pz = 0; this.ph = 0; // previous (for interpolation)
      this.y = 0; this.py = 0; this.vy = 0; this.air = 0; this.airT = 0; this.landT = 0; this.impactVY = 0;
      this.roadY = 0; this.gradeNow = 0; this.curvNow = 0;
      this.dmg = 0; this.dz = [0, 0, 0, 0]; this.dents = []; this.dmgMode = 2;
      this.inPit = false; this.pitState = null; this.pitT = 0; this.pitDur = 0; this.pitDone = false; this.repairN = 0;   // pit lane: in it, stopping / repairing at the box
      this.cd = [0, 0, 0, 0]; this.lightOut = [0, 0, 0, 0]; this.lost = {}; this.detach = []; this.hitDebris = 0;
      this.winOut = [0, 0, 0, 0]; this.roofDmg = 0;   // broken windows (windscreen, rear, left, right); roof crumple 0..1   // corners FL/FR/RL/RR, broken lights, lost parts   // damage 0..1; zones front/rear/left/right; 0 off, 1 visual, 2 visual+handling
      this.inSteer = 0; this.inThr = 0; this.inBrk = 0; this.inHand = 0;
      this.steer = 0; this.delta = 0; this.drift = 0;
      this.vref = this.isPlayer ? STEER_VREF : 13; // player gets more steering at speed
      this.dState = 0; this.bT = 0; this.wPath = 0; this.vAngP = null; this.csS = 0; this.csWd = 0; this.csB = 0; this.csBx = 0; this.csCo = 0; this.csLt = 0; this.csLp = 0; this.csThrP = 0; this.csK = 0; this.csKc = 0; this.csKs = null; this.csAn = 0; this.csAT = 0; this.csWcap = 1;
      this.gear = 1; this.rpm = model.idle; this.shiftT = 0; this.revHold = 0;
      this.axF = 0;
      this.vl = 0; this.vt = 0; this.beta = 0;
      this.slipF = 0; this.slipR = 0; this.spin = 0; this.lock = 0;
      this.ws = [0, 0, 0, 0];
      this.onCurb = 0;
      this.q = { i: -1 }; this.wq = [{ i: -1 }, { i: -1 }, { i: -1 }, { i: -1 }];
      this.dist = 0; this.sPrev = 0; this.lap = 0; this.lapTimes = []; this.lapStart = 0;
      this.finished = false; this.finishTime = 0; this.finishPos = 0;
      this.cp = 0; this.splits = []; this.cpEv = 0;   // checkpoints passed, race time at each, event counter (bumped on every CP)
      this.noReverse = false;                          // true: holding the brake at a standstill does not engage reverse (set when a car finishes an open road)
      this.wrongT = 0; this.stuckT = 0;
      this.hitWall = 0; this.hitCar = 0; this.impact = 0;
      this.locked = true;
      // AI
      this.skill = opts.skill || 1; this.aiOff = 0; this.aiOffT = opts.laneBias || 0; this.laneBias = opts.laneBias || 0;
      this.aiT = 0; this.aiNoise = 0;
      const b = model;
      this.I = b.mass * b.kI * b.kI;
      this.tw = b.wid * 0.43; // half track width (wheels)
      this.corners = [[b.len * 0.5, -b.wid * 0.5], [b.len * 0.5, b.wid * 0.5], [-b.len * 0.5, -b.wid * 0.5], [-b.len * 0.5, b.wid * 0.5]];
      this.circles = [-b.len * 0.3, 0, b.len * 0.3];
      this.rad = b.wid * 0.5 + 0.02;
    }

    get speed() { return Math.hypot(this.vx, this.vz); }

    place(x, z, h) {
      this.x = this.px = x; this.z = this.pz = z; this.h = this.ph = h;
      this.y = this.py = 0; this.vy = 0; this.air = 0; this.airT = 0; this.landT = 0;
      this.vx = this.vz = this.w = 0; this.gear = 1; this.rpm = this.m.idle; this.q.i = -1;
      this.dState = 0; this.bT = 0; this.wPath = 0; this.vAngP = null; this.csS = 0; this.csWd = 0; this.csB = 0; this.csBx = 0; this.csCo = 0; this.csLt = 0; this.csLp = 0; this.csThrP = 0; this.csK = 0; this.csKc = 0; this.csKs = null; this.csAn = 0; this.csAT = 0; this.csWcap = 1;
      for (const q of this.wq) q.i = -1;
    }

    /* SWGP2-style handling (all cars). Steering chooses the SLIDE ANGLE (how far the nose points
       into the corner), not a spin rate; grip swings the car's momentum toward the nose in proportion
       to that angle (up to ~2 g), so the car always "drifts" a little through corners like in the game.
       Full lock gives ~35 deg at low speed down to ~20 deg at 150 km/h; hard braking lets the tail
       swing further. Release the steering and the car straightens within a few tenths of a second. */
    stepArcade(dt, trk) {
      const M = this.m, P = this.arc || ARC[M.id] || ARC.kaze, A = this.assist;
      this.px = this.x; this.pz = this.z; this.ph = this.h; this.py = this.y;
      if (trk.hasElev) { trk.query(this.x, this.z, this.q.i, this.q); const e = trk.elevAt(this.q.s); this.roadY = e.y; this.gradeNow = e.grade; this.curvNow = e.curv; }
      else { this.roadY = 0; this.gradeNow = 0; this.curvNow = 0; }
      if (trk.bank) { trk.bankAt(this.q.s, this.q.d, _bk); this.roadY += _bk.dy; this.bankSl = _bk.sl; }   // a banked corner (the Karussell)
      const ch = Math.cos(this.h), sh = Math.sin(this.h);
      const vl = this.vx * ch + this.vz * sh, vt = -this.vx * sh + this.vz * ch;
      const spd = Math.hypot(vl, vt), m = M.mass;
      // launch off crests: if the road curves away downward faster than gravity can hold the car, it takes off
      if (trk.hasElev && !this.air) {
        const accSurf = vl * vl * this.curvNow;   // vertical accel needed to keep following the surface (negative over a crest)
        if (spd > 6 && accSurf < -JUMP_G * 0.85) { this.air = 1; this.vy = this.gradeNow * vl; this.airT = 0; }
      }
      const grounded = !this.air;
      const tw = this.tw, wpos = [[M.a, -tw], [M.a, tw], [-M.b, -tw], [-M.b, tw]];
      let muSum = 0, curb = 0, dragC0 = 0, dragC1 = 0;
      for (let k = 0; k < 4; k++) {
        const wx = this.x + wpos[k][0] * ch - wpos[k][1] * sh, wz = this.z + wpos[k][0] * sh + wpos[k][1] * ch;
        const q = trk.query(wx, wz, this.wq[k].i >= 0 ? this.wq[k].i : this.q.i, this.wq[k]);
        const sf = trk.surface(q); this.ws[k] = sf; muSum += SURF[sf].mu; if (sf === 1) curb++;
        dragC0 += SURF[sf].c0 * 0.25; dragC1 += SURF[sf].c1 * 0.25;
      }
      this.onCurb = curb;
      const muSurf = muSum / 4;
      const fwd = vl > 0.5;
      const beta = spd > 1.5 && fwd ? Math.atan2(vt, vl) : 0;
      this.beta = beta;
      const ab = Math.abs(beta);
      const vAng = Math.atan2(this.vz, this.vx);
      const wp = spd > 2 && this.vAngP != null ? wrapPi(vAng - this.vAngP) / dt : 0;
      this.vAngP = vAng;
      this.wPath += (wp - this.wPath) * Math.min(1, dt * 18);
      const st = this.locked ? 0 : this.steer;
      let thr = this.locked ? 0 : this.inThr, brk = this.inBrk;
      const hb = this.locked ? 0 : this.inHand;
      const vAbs = Math.abs(vl);
      let bMaxV = (0.16 + 0.56 * Math.exp(-spd / 20)) * P.bscale * (A.bmul || 1);
      const pwrOS = (M.drive === 'FR' || M.drive === 'MR') ? 0.3 : M.drive === 'AWD' ? 0.12 : 0;
      bMaxV *= (0.85 + 0.25 * thr) * (1 + 2.0 * Math.min(1, brk) * sstep(10, 20, spd)) /* brake + steer swings the car sideways into hairpins (SWGP2: 45-90 deg, ~3.5 g) */ * (1 + 0.6 * hb) * (1 + pwrOS * Math.min(1, this.spin || 0));
      bMaxV *= 1 + 1.3 * (1 - Math.min(1, muSurf));             // loose surfaces (grass/gravel): much bigger slides, like SWGP2 rally
      bMaxV = Math.min(bMaxV, A.bmax * (1 + 0.3 * (1 - Math.min(1, muSurf))));
      this.bMaxNow = bMaxV;
      let wT;
      if (vl < -0.5) wT = -st * Math.min(vAbs / P.rmin, 1.6);
      else {
        const bT = -st * bMaxV;
        wT = this.wPath + (A.K || 6) * (beta - bT);
        const cap = spd / P.rmin + Math.abs(this.wPath);
        wT = clamp(wT, -cap, cap);
      }
      if (!grounded) wT = this.w; // no steering authority while airborne
      this.w += (wT - this.w) * Math.min(1, dt * 12);
      this.drift = sstep(0.1, 0.45, ab);
      // on a slope (gradeForce), a brake press that catches the car rolling backwards only stops it: reverse needs a fresh press
      if (trk.def.gradeForce) { if (this.inBrk <= 0.1) this.revNo = false; else if (vl < -0.3 && this.gear !== -1) this.revNo = true; }
      if (this.gear === -1) {
        const revThr = brk; brk = thr; thr = revThr;
        if (this.inThr > 0.1 && vl > -1.0) { this.gear = 1; thr = this.inThr; brk = 0; }
      } else if (this.inBrk > 0.1 && this.inThr < 0.1 && vl < 0.6 && !this.locked && !this.noReverse && !this.revNo) {
        this.revHold += dt; if (this.revHold > 0.3) { this.gear = -1; this.revHold = 0; }
      } else this.revHold = 0;
      let F = 0; const eff = 0.88;
      if (this.gear > 0) {
        const gr = M.gears[this.gear - 1] * M.final;
        const wr = Math.max(0, vl) / M.rw * gr * 9.5493;
        if (this.shiftT <= 0) {
          if (wr > M.redline * 0.95 && this.gear < M.gears.length) { this.gear++; this.shiftT = 0.1; }
          else if (this.gear > 1) {
            const wrLow = Math.max(0, vl) / M.rw * M.gears[this.gear - 2] * M.final * 9.5493;
            if (wrLow < M.redline * 0.78 && wr < M.redline * 0.55) { this.gear--; this.shiftT = 0.1; }
          }
        }
        const gr2 = M.gears[this.gear - 1] * M.final;
        const wr2 = Math.max(0, vl) / M.rw * gr2 * 9.5493;
        const rpm = Math.max(wr2, M.idle + (M.redline * 0.62 - M.idle) * thr);
        let T = M.Tmax * tqShape(rpm / M.redline); if (wr2 > M.redline * 1.01) T = 0;
        F = T * gr2 * eff / M.rw * thr; if (this.shiftT > 0) F *= 0.35;
        F -= (1 - thr) * M.Tmax * 0.22 * clamp(wr2 / M.redline, 0, 1) * gr2 / M.rw * Math.sign(vl);
        this.rpmTarget = rpm;
      } else {
        const gr = 3.3 * M.final;
        const wr = Math.max(0, -vl) / M.rw * gr * 9.5493;
        this.rpmTarget = Math.max(wr, M.idle + 2500 * thr);
        F = -M.Tmax * 0.8 * gr * eff / M.rw * thr * (vl < -8 ? 0 : 1);
      }
      if (this.shiftT > 0) this.shiftT -= dt;
      if (this.locked) this.rpmTarget = M.idle + (M.redline * 0.88 - M.idle) * this.inThr;
      const share = M.drive === 'AWD' ? 0.68 : M.drive === 'FF' ? 0.6 : 0.55;
      // launch: SWGP2 cars of every power class cover the first second at only ~16-18 km/h (wheelspin), then pull hard
      const Fdmax = this.tracG * G * m * share * muSurf * (0.42 + 0.58 * sstep(0.5, 9, Math.abs(vl)));
      if (this.gear > 0) {
        // measured SWGP2 curve: ~21 km/h after 1 s, strong pull to ~150 km/h, top ~220-235 km/h
        const Kp = PWR_MULT * M.kw * 1000 * 0.88 / m * (1 - 0.22 * (this.dmgMode === 2 ? this.dmg : 0));   // effective power per kg (damaged engine loses up to 22%)
        let Fsw = m * Kp / Math.max(Math.abs(vl), 4) * thr;
        if (this.shiftT > 0) Fsw *= 0.7;
        Fsw -= (1 - thr) * m * 1.1 * sstep(2, 20, vl);             // engine braking when lifting
        F = Fsw;
      }
      if (!grounded) F = 0; // wheels off the ground: no drive
      let spin = 0;
      if (Math.abs(F) > Fdmax) { spin = Math.abs(F) / Fdmax - 1; F = Math.sign(F) * Fdmax; }
      this.spin = thr > 0.2 && grounded ? spin : 0;
      let Fx = F, Fy = 0;
      const ux = spd > 0.05 ? vl / spd : 1, uy = spd > 0.05 ? vt / spd : 0;
      if (brk > 0 && spd > 0.05 && grounded) {
        const fb = Math.min(brk * this.brakeG * G * m * (0.55 + 0.45 * muSurf), spd * m / dt);
        Fx -= ux * fb; Fy -= uy * fb;
      }
      this.lock = grounded && (brk > 0.7 || hb > 0.5) && spd > 4 ? 1 : 0;
      if (fwd && spd > 1.5 && grounded) {
        let aMax = P.amax * G * muSurf * (1 - 0.4 * hb) * (1 - 0.08 * (this.dmgMode === 2 ? this.dmg : 0));
        // aero upgrade: downforce grip grows with speed^2 - both the limit and the turn per slide angle (so it is felt in every fast corner)
        const gA = this.aeroK ? 1 + this.aeroK * spd * spd : 1; aMax *= gA;
        const aTurn = Math.min(aMax, P.kv * gA * (1 - 0.4 * hb) * spd * Math.min(ab, 1.2), spd * spd / P.rmin + 2);
        const sgn = beta > 0 ? -1 : 1;
        Fx += m * aTurn * sgn * (-uy); Fy += m * aTurn * sgn * ux;
        const s2 = uy * uy;
        const drag = m * (0.45 * aTurn * Math.abs(uy) + G * 1.5 * s2 * s2);   // sideways scrub grows steeply from ~40 deg
        Fx -= ux * drag; Fy -= uy * drag;
      }
      const lowGrip = 1 - sstep(3, 8, spd);
      if ((lowGrip > 0 || !fwd) && grounded) Fy += clamp(-vt * m / dt, -G * m * 1.5, G * m * 1.5) * (fwd ? lowGrip : 1);
      const cdA = m * SW_DRAG * (M.cDrag / 0.42) * (this.drs ? DRS_DRAG : 1);
      Fx -= cdA * vl * spd + (grounded ? (0.015 * m * G) * Math.tanh(vl * 1.5) : 0);
      Fy -= cdA * 1.6 * vt * spd;
      if ((dragC0 > 0 || dragC1 > 0) && spd > 0.05 && grounded) {
        const dec = (dragC0 * Math.min(1, spd / 3) + dragC1 * spd) * m;
        Fx -= ux * dec; Fy -= uy * dec;
      }
      // gravity along the slope (def.gradeForce tracks only): gH > 0 = nose uphill. Not while locked on the grid; a car held on the
      // brake (or handbrake) at a crawl stays put instead of creeping backwards.
      if (trk.def.gradeForce && grounded && !this.locked) {
        const gH = this.gradeNow * (ch * this.q.tx + sh * this.q.tz);
        const hold = (brk > 0.05 || hb > 0.5) && thr < 0.05 && spd < 0.4;
        if (!hold) Fx -= m * G * gH / Math.sqrt(1 + gH * gH);
      }
      if (this.bankSl && grounded) { const a = -G * this.bankSl / Math.sqrt(1 + this.bankSl * this.bankSl), wx = this.q.nx * a, wz = this.q.nz * a; Fx += m * (wx * ch + wz * sh); Fy += m * (-wx * sh + wz * ch); }   // banked corner: gravity along the tilted surface pulls towards the inside
      const ax = (Fx * ch - Fy * sh) / m, az = (Fx * sh + Fy * ch) / m;
      this.vx += ax * dt; this.vz += az * dt;
      this.x += this.vx * dt; this.z += this.vz * dt; this.h += this.w * dt;
      // vertical motion (hilly tracks): fly off crests, arc, land
      if (trk.hasElev) {
        if (this.air) {
          this.airT += dt; this.vy -= JUMP_G * dt; this.y += this.vy * dt;
          if (this.y <= this.roadY) { this.impactVY = this.vy; if (this.vy < -11) applyDamage(this, (-this.vy - 11) * 0.01); this.y = this.roadY; this.vy = 0; this.air = 0; this.landT = clamp(-this.impactVY * 0.02 + 0.05, 0.05, 0.2); this.airT = 0; const sc = clamp(-this.impactVY * 0.016, 0, 0.13); this.vx *= (1 - sc); this.vz *= (1 - sc); }
        } else { this.y = this.roadY; this.vy = this.gradeNow * vl; if (this.landT > 0) this.landT -= dt; }
      } else { this.y = 0; }
      this.axF += (Fx / m - this.axF) * Math.min(1, dt * 7);
      if (spd < 0.08 && thr < 0.05 && Math.abs(F) < 1) { this.vx *= 0.8; this.vz *= 0.8; this.w *= 0.8; }
      this.vl = vl; this.vt = vt;
      this.latR = Math.abs(vt - this.w * M.b);
      this.slipR = Math.atan2(this.latR, Math.abs(vl) + 0.6);
      this.slipF = Math.atan2(Math.abs(vt + this.w * M.a), Math.abs(vl) + 0.6);
      this.delta = clamp(st * 0.35 * (vl >= -0.3 ? 1 : -1) + clamp(beta, -0.5, 0.5) * 0.8, -M.steerMax, M.steerMax);
      const rt = this.rpmTarget + (this.spin > 0.05 ? Math.min(2500, this.spin * 5000) : 0) + (this.drift > 0.3 && thr > 0.5 ? 500 * this.drift : 0);
      this.rpm += (Math.min(M.redline * 1.02, rt) - this.rpm) * Math.min(1, dt * 14);
    }

    /* 'cs' handling (Circuit Superstars), a target-driven kinematic drift:
       the steer is a demand for PATH RATE (a share of the lesser of the grip limit aL / v and 77 deg/s). The car wants the drift
       attitude tau_v x path rate (tau_v 0.35-0.6 s, rising with speed), plus pedal terms (trail-braking rotates it, lifting tidies
       it); the heading is servoed onto that attitude (a quick ramp in; it unwinds with ~0.8 tau_v, so on exit the nose stops and the
       car straightens itself), and the travel direction swings toward the nose at (attitude / tau_v), within a flat grip limit and
       a friction ellipse. Engine, gearbox, drag, slopes, bank, jumps and landing are the shared blocks. */
    stepCS(dt, trk) {
      const M = this.m, P = this.arc || ARC[M.id] || ARC.kaze, A = this.assist, K = CSK;
      const CA = CSASSIST[ASSISTS.indexOf(A)] || CSASSIST[2], CP = CSP[M.id] || CSP.kaze, ai = this.isPlayer ? 1 : K.aiBx;
      this.px = this.x; this.pz = this.z; this.ph = this.h; this.py = this.y;
      if (trk.hasElev) { trk.query(this.x, this.z, this.q.i, this.q); const e = trk.elevAt(this.q.s); this.roadY = e.y; this.gradeNow = e.grade; this.curvNow = e.curv; }
      else { this.roadY = 0; this.gradeNow = 0; this.curvNow = 0; }
      if (trk.bank) { trk.bankAt(this.q.s, this.q.d, _bk); this.roadY += _bk.dy; this.bankSl = _bk.sl; }   // a banked corner (the Karussell)
      const ch = Math.cos(this.h), sh = Math.sin(this.h);
      const vl = this.vx * ch + this.vz * sh, vt = -this.vx * sh + this.vz * ch;
      const spd = Math.hypot(vl, vt), m = M.mass, a = M.a, b = M.b;
      if (trk.hasElev && !this.air) {
        const accSurf = vl * vl * this.curvNow;
        if (spd > 6 && accSurf < -JUMP_G * 0.85) { this.air = 1; this.vy = this.gradeNow * vl; this.airT = 0; }
      }
      const grounded = !this.air;
      // ---- per-wheel surfaces: traction mu (SURF) of the driven wheels, cs side grip per axle, drag per side (edge kick) ----
      const tw = this.tw, wpos = [[a, -tw], [a, tw], [-b, -tw], [-b, tw]];
      const ldK = K.kLt * Math.min(1, Math.abs(this.csAn) / Math.max(1, K.aL * P.amax * G)), sgO = Math.sign(this.wPath);   // outer wheels carry more of the side load
      let muSum = 0, muF = 0, muR = 0, curb = 0, dragC0 = 0, dragC1 = 0, latF = 0, latB = 0, latFw = 0, latBw = 0, dragP = 0, dragN = 0;
      for (let k = 0; k < 4; k++) {
        const wx = this.x + wpos[k][0] * ch - wpos[k][1] * sh, wz = this.z + wpos[k][0] * sh + wpos[k][1] * ch;
        const q = trk.query(wx, wz, this.wq[k].i >= 0 ? this.wq[k].i : this.q.i, this.wq[k]);
        const sf = trk.surface(q); this.ws[k] = sf; const S = CSSURF[sf]; muSum += S.tr; if (k < 2) muF += S.tr * 0.5; else muR += S.tr * 0.5; if (sf === 1) curb++;
        const dk = (S.c0 * Math.min(1, spd / 3) + S.c1 * spd) * 0.25, lw = 0.5 * (1 + ldK * sgO * (k & 1 ? -1 : 1));   // (k odd: +lateral side = inner in a + turn)
        dragC0 += S.c0 * 0.25; dragC1 += S.c1 * 0.25;
        if (k < 2) { latF += S.lat * 0.5; latFw += S.lat * lw; } else { latB += S.lat * 0.5; latBw += S.lat * lw; }
        if (k & 1) dragP += dk; else dragN += dk;
      }
      this.onCurb = curb;
      const muSurf = muSum / 4, muLat = (latF + latB) * 0.5;
      const muDrv = M.drive === 'FF' ? muF : M.drive === 'AWD' ? muSurf : muR;   // one rear wheel on the grass costs a RWD car traction
      const fwd = vl > 0.5;
      const beta = spd > 1.5 && fwd ? Math.atan2(vt, vl) : 0;
      this.beta = beta;
      const ab = Math.abs(beta), att = -beta;   // attitude = heading - travel (+ = nose toward +w)
      const vAng = Math.atan2(this.vz, this.vx);
      const wp = spd > 2 && this.vAngP != null ? wrapPi(vAng - this.vAngP) / dt : 0;
      this.vAngP = vAng;
      this.wPath += (wp - this.wPath) * Math.min(1, dt * 18);
      const stIn = this.locked ? 0 : this.steer;
      let thr = this.locked ? 0 : this.inThr, brk = this.inBrk;
      const hb = this.locked ? 0 : this.inHand;
      // ---- steering shaping: keys / buttons ramp to full in CA.stOn s and back in 0.14 s; analogue (tilt, wheel, AI) a light lag ----
      let s = this.csS;
      if (this.isPlayer && this.digitalSteer) { const out = Math.abs(stIn) > Math.abs(s) && stIn * s >= 0, r = out ? 1 / CA.stOn : 1 / K.stOff; s += clamp(stIn - s, -r * dt, r * dt); }
      else s += (stIn - s) * Math.min(1, dt / K.stA);
      this.csS = s;
      // ---- gearbox + engine (shared block; only the engine braking is lighter) ----
      if (trk.def.gradeForce) { if (this.inBrk <= 0.1) this.revNo = false; else if (vl < -0.3 && this.gear !== -1) this.revNo = true; }
      if (this.gear === -1) {
        const revThr = brk; brk = thr; thr = revThr;
        if (this.inThr > 0.1 && vl > -1.0) { this.gear = 1; thr = this.inThr; brk = 0; }
      } else if (this.inBrk > 0.1 && this.inThr < 0.1 && vl < 0.6 && !this.locked && !this.noReverse && !this.revNo) {
        this.revHold += dt; if (this.revHold > 0.3) { this.gear = -1; this.revHold = 0; }
      } else this.revHold = 0;
      let F = 0; const eff = 0.88;
      if (this.gear > 0) {
        const gr = M.gears[this.gear - 1] * M.final;
        const wr = Math.max(0, vl) / M.rw * gr * 9.5493;
        if (this.shiftT <= 0) {
          if (wr > M.redline * 0.95 && this.gear < M.gears.length) { this.gear++; this.shiftT = 0.1; }
          else if (this.gear > 1) {
            const wrLow = Math.max(0, vl) / M.rw * M.gears[this.gear - 2] * M.final * 9.5493;
            if (wrLow < M.redline * 0.78 && wr < M.redline * 0.55) { this.gear--; this.shiftT = 0.1; }
          }
        }
        const gr2 = M.gears[this.gear - 1] * M.final;
        const wr2 = Math.max(0, vl) / M.rw * gr2 * 9.5493;
        this.rpmTarget = Math.max(wr2, M.idle + (M.redline * 0.62 - M.idle) * thr);
        const Kp = PWR_MULT * M.kw * 1000 * 0.88 / m * (1 - 0.22 * (this.dmgMode === 2 ? this.dmg : 0));
        let Fsw = m * Kp / Math.max(Math.abs(vl), 4) * thr;
        if (this.shiftT > 0) Fsw *= 0.7;
        Fsw -= (1 - thr) * m * K.engBrk * sstep(2, 20, vl);
        F = Fsw;
      } else {
        const gr = 3.3 * M.final;
        const wr = Math.max(0, -vl) / M.rw * gr * 9.5493;
        this.rpmTarget = Math.max(wr, M.idle + 2500 * thr);
        F = -M.Tmax * 0.8 * gr * eff / M.rw * thr * (vl < -8 ? 0 : 1);
      }
      if (this.shiftT > 0) this.shiftT -= dt;
      if (this.locked) this.rpmTarget = M.idle + (M.redline * 0.88 - M.idle) * this.inThr;
      if (!grounded) F = 0;
      const share = M.drive === 'AWD' ? 0.68 : M.drive === 'FF' ? 0.6 : 0.55;
      const Fdmax = this.tracG * G * m * share * muDrv * (0.42 + 0.58 * sstep(0.5, 9, Math.abs(vl)));
      let spin = 0;
      if (Math.abs(F) > Fdmax) { spin = Math.abs(F) / Fdmax - 1; F = Math.sign(F) * Fdmax; }
      this.spin = thr > 0.2 && grounded ? spin : 0;
      // ---- brakes: a quick ramp, capped below the grip (they never lock), along the travel ----
      this.csB += clamp(brk - this.csB, -K.brkDn * dt, K.brkUp * dt);
      const bF = this.csB;
      const fb = spd > 0.05 && grounded ? Math.min((bF * K.brk * this.brakeG + hb * K.hbBrk) * G * m * (0.55 + 0.45 * muSurf), spd * m / dt) : 0;
      this.lock = grounded && hb > 0.5 && spd > 4 ? 1 : 0;
      // ---- the demand: a path rate, and the drift attitude that goes with it ----
      const v = Math.max(spd, 0.5);
      const gA = this.aeroK ? 1 + this.aeroK * spd * spd : 1, dmgG = 1 - K.dmgGrip * (this.dmgMode === 2 ? this.dmg : 0);
      const aL = K.aL * P.amax * G * muLat * gA * dmgG;                                             // flat lateral limit (m/s^2)
      const tv = clamp(K.tv0 * Math.pow(v / 27.78, K.tvE), K.tvLo, K.tvHi) * (1 + K.tvLoose * (1 - Math.min(1, muLat)));
      const kvU = ARC[M.id] ? P.kv / ARC[M.id].kv : 1;                                            // tyre upgrade: a slightly tighter hairpin rate
      const wCap = Math.min(aL / v, K.wMax * CP.w * kvU, v / K.rMin) * CA.lock;                  // path rate at full steer
      this.csWcap = wCap;
      const lo = sstep(2.5, 8, spd);                                                               // 0: parking (kinematic), 1: drift law
      const wD = s * wCap;
      const dwD = (wD - this.csWd) / dt; this.csWd = wD;
      const dir = s > 0.01 ? 1 : s < -0.01 ? -1 : 0, sA = Math.min(1, Math.abs(s));
      const aSS = tv * wD * lo;                                                                    // B0: attitude = tau_v x path rate
      // pedal and drive-type terms (rad, + = more rotation into the turn); only while steering, never in a straight line
      const bxT = CP.bx * CA.bx * ai * Math.min(1, bF / K.bxFull) * sA * sstep(8, 16, spd) * dir;   // (full effect from 60 % brake)
      this.csBx += (bxT - this.csBx) * Math.min(1, dt / (Math.abs(bxT) > Math.abs(this.csBx) ? K.bxOn : K.bxOff));
      this.csCo += ((thr < 0.1 && bF < 0.05 ? 1 : 0) - this.csCo) * Math.min(1, dt / K.coastT);
      const lay = CA.layer * ai, turnSg = Math.sign(this.wPath) || dir;
      if (CP.liftP && this.csThrP > 0.5 && thr < 0.1 && Math.abs(this.csAn) > K.liftA * aL) this.csLt = turnSg;   // FR/MR: a sudden lift in a loaded corner
      this.csLt *= Math.exp(-dt / K.liftT);
      this.csLp += (this.csLt - this.csLp) * Math.min(1, dt / K.liftOn);
      this.csThrP = thr;
      const rotX = CP.pwr * lay * thr * Math.min(1, this.spin * 1.5) * sA * dir * (1 - sstep(22, 30, spd)) + CP.liftP * lay * this.csLp;
      const pathX = K.kPath * rotX;
      // lead: on a rising demand the nose rotates first and settles back 2-3 deg (attitude only, B4e/B4f); on a falling demand
      // the attitude, and with it the path, unwinds ahead of the steer: the nose stops while the path still turns (B4i)
      const leadIn = wD * dwD > 0 ? tv * K.lead * dwD * lo : 0;
      const leadOut = wD * dwD < 0 ? clamp(tv * K.leadOut * dwD, -0.8 * Math.abs(aSS), 0.8 * Math.abs(aSS)) * lo : 0;
      const attX = this.csBx + dir * sA * (CP.coast * this.csCo + CP.thr * thr) * lo + leadIn
        + (1 - K.kPath) * rotX + K.hbX * hb * clamp(2 * s, -1, 1);
      const aP = aSS + leadOut + pathX, aU = aP + attX, c7 = 0.7 * K.ceil, c3 = 0.3 * K.ceil;
      let aT = Math.abs(aU) < c7 ? aU : Math.sign(aU) * (c7 + c3 * Math.tanh((Math.abs(aU) - c7) / c3));   // soft ceiling 38 deg
      // ---- surface-edge kick: a grip step between the axles or a drag step between the sides gives one bounded yaw kick ----
      const dRaw = K.kFR * (latFw - latBw) * turnSg * Math.min(1, Math.abs(this.csAn) / Math.max(1, aL)) + K.kLR * (dragP - dragN) / G;
      if (this.csKs == null) this.csKs = dRaw;
      this.csKs += (dRaw - this.csKs) * Math.min(1, dt / K.kickHp);
      this.csK += (clamp((dRaw - this.csKs) * CA.kick, -K.kickMax, K.kickMax) - this.csK) * Math.min(1, dt / K.kickOn);
      this.csKc *= Math.exp(-dt / K.tapDecay);   // contact kick (set by carCollide)
      aT = clamp(aT + this.csK + this.csKc, -CA.hard, CA.hard);
      this.csAT = aT;
      // ---- attitude servo: a quick ramp in; unwinding at ~0.8 tau_v (the nose stops while the travel catches up) ----
      // (building: quick; unwinding toward a smaller demand: ~0.8 tau_v, the exit; a demand to the other side: a quick flick)
      const err = aT - att, building = aT * att >= 0 && Math.abs(aT) > Math.abs(att);
      const rate = (bF > 0.3 ? K.rateB : K.rateN) * CP.turn;
      const tOut = K.tOutK * CP.out * CA.out * tv, kRev = clamp(-aT * Math.sign(att) / 0.05, 0, 1);
      const dAtt = clamp(building ? err * CP.turn / K.tIn : err / (tOut + (K.tRev - tOut) * kRev), -rate, rate);
      // ---- path law: the travel swings toward the nose at (path share of the attitude) / tau_v, inside the friction ellipse ----
      const rho = Math.abs(aU) > 0.02 ? clamp(aP / aU, 0, 1.3) : 1;
      let wN = lo * rho * (att - (1 - K.kickPath) * (this.csK + this.csKc)) / tv + (1 - lo) * wD;
      if (!fwd || !grounded) wN = 0;
      const aC = K.comb * aL, aNeed = Math.min(aL, Math.abs(wN) * v);
      if (F > 0 && fwd) F = Math.min(F, m * Math.sqrt(Math.max(0, aC * aC - aNeed * aNeed)));   // power costs grip: the drive gets what the cornering leaves
      const aX = Math.max(Math.abs(F), fb) / m;                                                  // (brakes first: the cornering gets what they leave)
      const aN = Math.min(aL, Math.sqrt(Math.max(0, aC * aC - aX * aX)));
      wN = clamp(wN, -aN / v, aN / v);
      this.csAn = wN * spd;
      // ---- forces (body frame): drive along the body (its sideways part is inside the path law), brakes along the travel, slide scrub ----
      let Fx = 0, Fy = 0;
      const ux = spd > 0.05 ? vl / spd : 1, uy = spd > 0.05 ? vt / spd : 0;
      if (fwd && spd > 1) { const Fd = F * Math.cos(Math.min(1.2, ab)); Fx += ux * Fd; Fy += uy * Fd; } else Fx += F;
      if (fb > 0) { Fx -= ux * fb; Fy -= uy * fb; }
      if (fwd && grounded && spd > 1.5) { const sc = m * K.scrub * Math.abs(this.csAn) * Math.min(2, Math.tan(Math.min(1.1, ab))); Fx -= ux * sc; Fy -= uy * sc; }
      const lowGrip = 1 - sstep(3, 8, spd);
      if ((lowGrip > 0 || !fwd) && grounded) Fy += clamp(-vt * m / dt, -G * m * 1.5, G * m * 1.5) * (fwd ? lowGrip : 1);
      // ---- air + rolling + surface drag, slope, bank (shared blocks) ----
      const cdA = m * SW_DRAG * (M.cDrag / 0.42) * (this.drs ? DRS_DRAG : 1);
      Fx -= cdA * vl * spd + (grounded ? (0.015 * m * G) * Math.tanh(vl * 1.5) : 0);
      Fy -= cdA * 1.6 * vt * spd;
      if ((dragC0 > 0 || dragC1 > 0) && spd > 0.05 && grounded) {
        const dec = (dragC0 * Math.min(1, spd / 3) + dragC1 * spd) * m;
        Fx -= ux * dec; Fy -= uy * dec;
      }
      let Fgrav = 0;
      if (trk.def.gradeForce && grounded && !this.locked) {
        const gH = this.gradeNow * (ch * this.q.tx + sh * this.q.tz);
        const hold = (brk > 0.05 || hb > 0.5) && thr < 0.05 && spd < 0.4;
        if (!hold) { Fgrav = -m * G * gH / Math.sqrt(1 + gH * gH); Fx += Fgrav; }
      }
      if (this.bankSl && grounded) { const a2 = -G * this.bankSl / Math.sqrt(1 + this.bankSl * this.bankSl), wx = this.q.nx * a2, wz = this.q.nz * a2, fl = m * (wx * ch + wz * sh);
        Fx += fl; Fy += m * (-wx * sh + wz * ch); Fgrav += fl; }
      // ---- yaw: follow (path rate + attitude rate) with a short lag and a yaw-acceleration limit ----
      let rT = clamp(wN + dAtt, -K.rMax, K.rMax);
      if (!fwd) rT = (vl < -0.5 ? -stIn : 0) * Math.min(Math.abs(vl) / P.rmin, 1.6);   // reversing: kinematic (as the arcade)
      if (!grounded) rT = this.w * Math.exp(-dt / K.airYawT);                            // no steering in the air; the spin dies away
      const rA = bF > 0.3 ? K.rAccB : K.rAcc;
      if (grounded) this.w += clamp((rT - this.w) * Math.min(1, dt / K.tR), -rA * dt, rA * dt); else this.w = rT;
      // ---- integrate: forces, then the path turn as an exact rotation of the velocity (no speed gained or lost by turning) ----
      const ax = (Fx * ch - Fy * sh) / m, az = (Fx * sh + Fy * ch) / m;
      this.vx += ax * dt; this.vz += az * dt;
      if (wN !== 0) { const cr = Math.cos(wN * dt), sr = Math.sin(wN * dt), vx0 = this.vx; this.vx = vx0 * cr - this.vz * sr; this.vz = vx0 * sr + this.vz * cr; }
      this.x += this.vx * dt; this.z += this.vz * dt; this.h += this.w * dt;
      if (trk.hasElev) {
        if (this.air) {
          this.airT += dt; this.vy -= JUMP_G * dt; this.y += this.vy * dt;
          if (this.y <= this.roadY) { this.impactVY = this.vy; if (this.vy < -11) applyDamage(this, (-this.vy - 11) * 0.01); this.y = this.roadY; this.vy = 0; this.air = 0; this.landT = clamp(-this.impactVY * 0.02 + 0.05, 0.05, 0.2); this.airT = 0; const sc = clamp(-this.impactVY * 0.016, 0, 0.13); this.vx *= (1 - sc); this.vz *= (1 - sc); }
        } else { this.y = this.roadY; this.vy = this.gradeNow * vl; if (this.landT > 0) this.landT -= dt; }
      } else { this.y = 0; }
      this.axF += (((Fx - Fgrav) / m) - this.axF) * Math.min(1, dt * 7);
      if (spd < 0.08 && thr < 0.05 && Math.abs(F) < 1) { this.vx *= 0.8; this.vz *= 0.8; this.w *= 0.8; }
      this.vl = vl; this.vt = vt;
      this.drift = sstep(0.1, 0.45, ab);
      // effects (the renderer's non-arcade skid / squeal branches): marks in real drifts (> 7 deg), not in every bend
      this.latR = spd * Math.sin(fwd && grounded ? Math.min(1.2, Math.max(0, ab - 0.12)) : 0) * 0.5 + (this.lock ? 2.5 : 0);
      this.slipR = Math.atan2(this.latR, Math.abs(vl) + 0.6);
      this.slipF = Math.min(0.25, ab * 0.3);
      this.delta = vl >= -0.3 ? clamp(0.1 * s + 0.5 * (aT - att), -0.26, 0.26) : clamp(-0.35 * stIn, -M.steerMax, M.steerMax);   // small, into the turn (C2)
      const rt = this.rpmTarget + (this.spin > 0.05 ? Math.min(2500, this.spin * 5000) : 0) + (this.drift > 0.3 && thr > 0.5 ? 500 * this.drift : 0);
      this.rpm += (Math.min(M.redline * 1.02, rt) - this.rpm) * Math.min(1, dt * 14);
    }

    step(dt, trk) {
      if (this.phys === 'cs') return this.stepCS(dt, trk);
      if (this.arcade) return this.stepArcade(dt, trk);
      const M = this.m, A = this.assist;
      this.px = this.x; this.pz = this.z; this.ph = this.h;
      const ch = Math.cos(this.h), sh = Math.sin(this.h);
      let vl = this.vx * ch + this.vz * sh;
      let vt = -this.vx * sh + this.vz * ch;
      const spd = Math.hypot(vl, vt);
      const L = M.a + M.b, m = M.mass;

      // --- wheel surfaces ---
      const tw = this.tw;
      const wpos = [[M.a, -tw], [M.a, tw], [-M.b, -tw], [-M.b, tw]];
      let muW = [1, 1, 1, 1];
      const hint = this.q.i;
      let curb = 0;
      for (let k = 0; k < 4; k++) {
        const wx = this.x + wpos[k][0] * ch - wpos[k][1] * sh;
        const wz = this.z + wpos[k][0] * sh + wpos[k][1] * ch;
        const q = trk.query(wx, wz, this.wq[k].i >= 0 ? this.wq[k].i : hint, this.wq[k]);
        const s = trk.surface(q);
        this.ws[k] = s; muW[k] = SURF[s].mu;
        if (s === 1) curb++;
      }
      this.onCurb = curb;
      // --- arcade drift state (player only): once a slide is provoked, the rear stays loose
      //     while the driver keeps steering into the turn with throttle ---
      const betaNow = vl > 2 ? Math.atan2(vt, vl) : 0;
      if (this.isPlayer) {
        // every turn at speed becomes a slide: the harder you steer, the looser the rear
        const dv = Math.max(0, vl), st = Math.abs(this.steer);
        let want = sstep(0.12, 0.7, st) * sstep(7, 14, dv) * (1 - 0.35 * sstep(28, 46, dv));
        if (this.inHand > 0.5 && dv > 8) want = 1;
        const rate = want > this.drift ? 5 : 2.8;
        this.drift += (want - this.drift) * Math.min(1, dt * rate);
      }
      const muF = (muW[0] + muW[1]) * 0.5 * MU_BASE * M.gripF;
      const muR = (muW[2] + muW[3]) * 0.5 * MU_BASE * M.gripR * (1 - M.driftLoss * this.drift);

      // --- loads ---
      const Ntot = m * G + M.down * spd * spd;
      const wt = clamp(m * this.axF * M.hcg / L, -0.3 * Ntot, 0.3 * Ntot);
      const Nf = Ntot * M.b / L - wt, Nr = Ntot * M.a / L + wt;

      // --- steering ---
      const beta = betaNow;
      this.beta = beta;
      const steerLim = M.steerMax / (1 + Math.max(0, vl) / this.vref);
      const csGain = A.cs * clamp((vl - 3) / 8, 0, 1) * (1 - 0.35 * this.drift);
      let delta = this.steer * steerLim + csGain * clamp(beta, -0.8, 0.8);
      delta = clamp(delta, -M.steerMax, M.steerMax);
      this.delta = delta;

      // --- gearbox / engine ---
      let thr = this.inThr, brk = this.inBrk;
      if (this.locked) { thr = 0; }
      if (this.gear === -1) {
        const revThr = brk; brk = thr; thr = revThr;
        if (this.inThr > 0.1 && vl > -1.0) { this.gear = 1; thr = this.inThr; brk = 0; }
      } else if (this.inBrk > 0.1 && this.inThr < 0.1 && vl < 0.6 && !this.locked && !this.noReverse) {
        this.revHold += dt;
        if (this.revHold > 0.3) { this.gear = -1; this.revHold = 0; }
      } else this.revHold = 0;

      let F = 0;
      const eff = 0.88;
      if (this.gear > 0) {
        const gr = M.gears[this.gear - 1] * M.final;
        const wr = Math.max(0, vl) / M.rw * gr * 9.5493;
        // auto shift
        if (this.shiftT <= 0) {
          if (wr > M.redline * 0.95 && this.gear < M.gears.length) { this.gear++; this.shiftT = 0.14; }
          else if (this.gear > 1) {
            const lowR = M.gears[this.gear - 2] * M.final;
            const wrLow = Math.max(0, vl) / M.rw * lowR * 9.5493;
            if (wrLow < M.redline * 0.78 && wr < M.redline * 0.55) { this.gear--; this.shiftT = 0.1; }
          }
        }
        const gr2 = M.gears[this.gear - 1] * M.final;
        const wr2 = Math.max(0, vl) / M.rw * gr2 * 9.5493;
        const launch = M.idle + (M.redline * 0.62 - M.idle) * thr;
        const rpm = Math.max(wr2, launch);
        let T = M.Tmax * tqShape(rpm / M.redline);
        if (wr2 > M.redline * 1.01) T = 0;
        F = T * gr2 * eff / M.rw * thr;
        if (this.shiftT > 0) F *= 0.15;
        // engine braking
        F -= (1 - thr) * M.Tmax * 0.22 * clamp(wr2 / M.redline, 0, 1) * gr2 / M.rw * Math.sign(vl);
        this.rpmTarget = rpm;
      } else {
        const gr = 3.3 * M.final;
        const wr = Math.max(0, -vl) / M.rw * gr * 9.5493;
        const rpm = Math.max(wr, M.idle + 2500 * thr);
        F = -M.Tmax * 0.8 * gr * eff / M.rw * thr * (vl < -8 ? 0 : 1);
        this.rpmTarget = rpm;
      }
      if (this.shiftT > 0) this.shiftT -= dt;
      if (this.locked) this.rpmTarget = M.idle + (M.redline * 0.88 - M.idle) * this.inThr;

      // drive split
      let FxF = 0, FxR = 0;
      // slip-based traction control (assist): back off drive while the rear slides under power
      if (A.tcGain > 0 && F > 0 && vl > 4) {
        const ff = M.drive === 'FF';
        const ex = (ff ? this.slipF : this.slipR) - A.tcSlip - (ff ? 0.04 : 0.2) * this.drift;
        if (ex > 0) F *= clamp(1 - ex * A.tcGain, 0.3, 1);
      }
      if (M.drive === 'FF') FxF = F; else if (M.drive === 'AWD') { FxF = F * 0.4; FxR = F * 0.6; } else FxR = F;
      // traction control (assist): cap drive at tc * available
      const maxF = muF * Nf, maxR = muR * Nr;
      if (A.tc < 1.5) {
        if (Math.abs(FxR) > maxR * A.tc) FxR = Math.sign(FxR) * maxR * A.tc;
        if (Math.abs(FxF) > maxF * A.tc) FxF = Math.sign(FxF) * maxF * A.tc;
      }
      // brakes
      if (brk > 0 && Math.abs(vl) > 0.01) {
        const sgn = vl > 0 ? 1 : -1;
        const cap = Math.abs(vl) * m / dt;
        const fb = Math.min(brk * M.brake * m, cap);
        FxF -= sgn * fb * 0.64; FxR -= sgn * fb * 0.36;
      }
      // handbrake
      const hb = this.locked ? 1 : this.inHand;
      if (hb > 0 && Math.abs(vl) > 0.05) {
        const cap = Math.abs(vl) * m / dt * 0.5;
        FxR -= Math.sign(vl) * Math.min(maxR * 0.75 * hb, cap);
      }
      // traction limits
      let spinR = 0, spinF = 0;
      if (Math.abs(FxR) > maxR) { spinR = Math.abs(FxR) / maxR - 1; FxR = Math.sign(FxR) * maxR; }
      if (Math.abs(FxF) > maxF) { spinF = Math.abs(FxF) / maxF - 1; FxF = Math.sign(FxF) * maxF; }
      this.spin = Math.max(spinR, spinF) * (thr > 0.2 ? 1 : 0);
      this.lock = (brk > 0.7 || hb > 0.5) && Math.abs(vl) > 4 ? 1 : 0;

      // --- lateral tire forces ---
      const vtf = vt + this.w * M.a, vtr = vt - this.w * M.b;
      const cd = Math.cos(delta), sd = Math.sin(delta);
      const vfx = vl * cd + vtf * sd, vfy = -vl * sd + vtf * cd;
      const aF = Math.atan2(vfy, Math.abs(vfx) + 0.6);
      const aR = Math.atan2(vtr, Math.abs(vl) + 0.6);
      const kc = 0.7;
      let capF = Math.sqrt(Math.max(0.08 * maxF * maxF, maxF * maxF - kc * FxF * FxF));
      let capR = Math.sqrt(Math.max(0.08 * maxR * maxR, maxR * maxR - kc * FxR * FxR));
      if (spinR > 0) capR /= (1 + spinR * 1.2);
      if (spinF > 0) capF /= (1 + spinF * 1.2);
      if (hb > 0) capR *= (1 - 0.55 * hb);
      let FyF = -capF * (this.isPlayer ? tireFP(aF) : tireF(aF));
      let FyR = -capR * tireR(aR);
      const mf = m * M.b / L, mr = m * M.a / L;
      const cF = Math.abs(vfy) * mf / dt, cR = Math.abs(vtr) * mr / dt;
      FyF = clamp(FyF, -cF, cF); FyR = clamp(FyR, -cR, cR);
      this.slipF = Math.abs(aF); this.slipR = Math.abs(aR);
      this.latR = Math.abs(vtr);

      // --- body forces ---
      const FfxB = FxF * cd - FyF * sd, FfyB = FxF * sd + FyF * cd;
      let Fx = FfxB + FxR, Fy = FfyB + FyR;
      let Tz = M.a * FfyB - M.b * FyR;
      // aero + rolling
      Fx -= M.cDrag * vl * spd; Fy -= M.cDrag * 1.6 * vt * spd;
      Fx -= (0.013 * m * G) * Math.tanh(vl * 1.5) + 5 * vl;
      // surface drag per wheel
      for (let k = 0; k < 4; k++) {
        const S = SURF[this.ws[k]];
        if (S.c0 === 0 && S.c1 === 0) continue;
        const rx = wpos[k][0], rz = wpos[k][1];
        const wvx = vl - this.w * rz, wvz = vt + this.w * rx;
        const wv = Math.hypot(wvx, wvz);
        if (wv < 0.05) continue;
        const dec = (S.c0 * Math.min(1, wv / 3) + S.c1 * wv) * m * 0.25;
        const fx = -wvx / wv * dec, fz = -wvz / wv * dec;
        Fx += fx; Fy += fz; Tz += rx * fz - rz * fx;
      }
      // arcade drift grip: while sliding, the path bends toward where the nose points
      if (this.drift > 0.01 && spd > 4) {
        const sb = vt / spd, cb = vl / spd;
        const bAbs = Math.abs(Math.asin(clamp(sb, -1, 1)));
        const g = -Math.sign(sb) * Math.min(1, bAbs / 0.2);
        const aAl = DRIFT_GRIP * G * this.drift * (M.driftGrip || 1) * Math.min(1, spd / 12);
        Fx += m * aAl * g * (-sb);
        Fy += m * aAl * g * cb;
      }
      // yaw damping assist
      Tz -= A.yawD * this.I * this.w * 0.6;

      // --- integrate ---
      const ax = (Fx * ch - Fy * sh) / m, az = (Fx * sh + Fy * ch) / m;
      this.vx += ax * dt; this.vz += az * dt;
      this.w += Tz / this.I * dt;
      // spin guard
      if (spd > 5) {
        const ab = Math.abs(beta);
        if (ab > A.spin && this.w * beta < 0) {
          const ex = Math.min(1, (ab - A.spin) / 0.25);
          this.w *= Math.max(0, 1 - ex * 16 * dt);
        }
      }
      this.x += this.vx * dt; this.z += this.vz * dt; this.h += this.w * dt;
      this.axF += (Fx / m - this.axF) * Math.min(1, dt * 7);
      // standstill
      if (spd < 0.08 && thr < 0.05 && Math.abs(F) < 1) { this.vx *= 0.8; this.vz *= 0.8; this.w *= 0.8; }
      this.vl = vl; this.vt = vt;
      // rpm smoothing (for sound / HUD)
      const rt = this.rpmTarget + (this.spin > 0.05 ? Math.min(2500, this.spin * 5000) : 0);
      this.rpm += (Math.min(M.redline * 1.02, rt) - this.rpm) * Math.min(1, dt * 14);
    }
  }

  /* ---------------------------------------------------------------------
     COLLISIONS
     --------------------------------------------------------------------- */
  const _q = {};
  // Damage: overall 0..1 plus zones (0 front, 1 rear, 2 left = -z, 3 right = +z). lx/lz = local impact point
  // (x forward, z to the right); without a point the hit is spread over the whole car (hard landing).
  function applyDamage(c, amt, lx, lz) {
    if (!c.dmgMode || !(amt > 0)) return;
    c.dmg = Math.min(1, c.dmg + amt);
    if (lx == null) { for (let k = 0; k < 4; k++) c.dz[k] = Math.min(1, c.dz[k] + amt * 0.6); c.roofDmg = Math.max(c.roofDmg, clamp((c.dmg - 0.4) / 0.55, 0, 1)); return; }
    const hl = c.m.len * 0.5, hw = c.m.wid * 0.5;
    const zone = Math.abs(lx) / hl >= Math.abs(lz) / hw ? (lx >= 0 ? 0 : 1) : (lz < 0 ? 2 : 3);
    c.dz[zone] = Math.min(1, c.dz[zone] + amt * 1.7);
    if (c.dents.length < 24) c.dents.push({ lx, lz, amt });
    // corner damage (FL, FR, RL, RR): a solid hit on a corner breaks that corner's light
    const kx = [hl, hl, -hl, -hl], kz = [-hw, hw, -hw, hw];
    for (let k = 0; k < 4; k++) { const wg = Math.max(0, 1 - Math.hypot(lx - kx[k], lz - kz[k]) / 1.6); c.cd[k] = Math.min(1, c.cd[k] + amt * wg * 1.8); if (c.cd[k] >= 0.16) c.lightOut[k] = 1; }
    // windows shatter when their side of the car is badly hit (all of them in a total wreck); the roof sags as the car gets battered
    const WIN = [0.55, 0.55, 0.42, 0.42];
    for (let k = 0; k < 4; k++) if (!c.winOut[k] && (c.dz[k] >= WIN[k] || c.dmg >= 0.92)) c.winOut[k] = 1;
    c.roofDmg = Math.max(c.roofDmg, clamp((c.dmg - 0.4) / 0.55, 0, 1));
    // body parts come off once their area is damaged enough
    for (const name in PARTS) {
      if (c.lost[name]) continue;
      const P = PARTS[name];
      if (c.dz[P.z] >= P.th || (P.corner != null && c.cd[P.corner] >= 0.55)) { c.lost[name] = 1; c.detach.push(name); }
    }
  }
  // detachable parts: damage zone + threshold, mass (kg), collision radius, thickness, local position (fraction of half length/width), height
  const PARTS = {
    mirrorL: { z: 2, th: 0.35, m: 1, r: 0.2, h: 0.1, lx: 0.15, lz: -1.12, y: 0.95 },
    mirrorR: { z: 3, th: 0.35, m: 1, r: 0.2, h: 0.1, lx: 0.15, lz: 1.12, y: 0.95 },
    bumperF: { z: 0, th: 0.5, m: 7, r: 0.75, h: 0.16, lx: 1.0, lz: 0, y: 0.4 },
    bumperR: { z: 1, th: 0.5, m: 7, r: 0.75, h: 0.16, lx: -1.0, lz: 0, y: 0.4 },
    fenderL: { z: 2, th: 0.6, m: 5, r: 0.55, h: 0.06, lx: 0.55, lz: -1.0, y: 0.55, corner: 0 },
    fenderR: { z: 3, th: 0.6, m: 5, r: 0.55, h: 0.06, lx: 0.55, lz: 1.0, y: 0.55, corner: 1 },
    hood:    { z: 0, th: 0.78, m: 14, r: 0.8, h: 0.07, lx: 0.62, lz: 0, y: 0.9 },
    trunk:   { z: 1, th: 0.78, m: 11, r: 0.7, h: 0.07, lx: -0.7, lz: 0, y: 0.9 },
  };

  // ---- debris lying on the road: flies off, tumbles, slides, rests; cars hitting it knock it away ----
  const relaxAng = (a, dt) => { const t = Math.round(a / Math.PI) * Math.PI; return a + (t - a) * Math.min(1, dt * 8); };
  // open road: how far a point (radius r) is past the wall at an end of the road (0.5 m in from the last sample); _en = inward normal
  const _en = [0, 0];
  function endPen(T, q, r) {
    const sl = q.s + (q.over || 0);
    if (sl < 0.5 + r) { _en[0] = T.tx[0]; _en[1] = T.tz[0]; return 0.5 + r - sl; }
    const e = T.len - 0.5 - r;
    if (sl > e) { _en[0] = -T.tx[T.N - 1]; _en[1] = -T.tz[T.N - 1]; return sl - e; }
    return 0;
  }
  function stepDebris(d, T, dt) {
    if (d.rest) return;
    d.vy -= JUMP_G * dt;
    d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
    d.q = T.query(d.x, d.z, d.q ? d.q.i : -1, d.q || {});
    const gy = (T.hasElev ? T.elevAt(d.q.s).y : 0) + d.h * 0.5 + 0.02;
    const lim = (d.q.d > 0 ? d.q.br : d.q.bl) - d.r * 0.5;       // bounce off the barriers
    if (Math.abs(d.q.d) > lim) {
      const sg = Math.sign(d.q.d), nx = d.q.nx * sg, nz = d.q.nz * sg, pen = Math.abs(d.q.d) - lim;
      d.x -= nx * pen; d.z -= nz * pen;
      const vn = d.vx * nx + d.vz * nz; if (vn > 0) { d.vx -= 1.4 * vn * nx; d.vz -= 1.4 * vn * nz; }
    }
    if (T.open) { const pen = endPen(T, d.q, d.r * 0.5); if (pen > 0) { const nx = _en[0], nz = _en[1]; d.x += nx * pen; d.z += nz * pen; const vn = d.vx * nx + d.vz * nz; if (vn < 0) { d.vx -= 1.4 * vn * nx; d.vz -= 1.4 * vn * nz; } } }   // ... and the end walls
    if (d.y <= gy) {
      d.y = gy;
      if (d.vy < -2.5) { d.vy = -d.vy * 0.28; d.wx *= 0.6; d.wz *= 0.6; } else { d.vy = 0; d.ground = true; }
    } else d.ground = false;
    if (d.ground) {
      const sp = Math.hypot(d.vx, d.vz), dec = 6.5 * dt;          // sliding on the road (~0.65 g)
      if (sp <= dec) { d.vx = d.vz = 0; } else { d.vx -= d.vx / sp * dec; d.vz -= d.vz / sp * dec; }
      d.wy *= Math.max(0, 1 - 4 * dt); d.wx = d.wz = 0;
      d.rx = relaxAng(d.rx, dt); d.rz = relaxAng(d.rz, dt);        // settles flat (right way up or upside down)
      if (sp < 0.05 && Math.abs(d.wy) < 0.05) d.rest = true;
    } else { d.rx += d.wx * dt; d.rz += d.wz * dt; }
    d.yaw += d.wy * dt;
  }
  function debrisHit(c, d) {
    const dx = d.x - c.x, dz = d.z - c.z;
    if (dx * dx + dz * dz > 16 || d.y - (c.y || 0) > 1.3) return;
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    for (let i = 0; i < 3; i++) {
      const ax = c.x + ch * c.circles[i], az = c.z + sh * c.circles[i];
      const ex = d.x - ax, ez = d.z - az, r = c.rad + d.r * 0.7, e2 = ex * ex + ez * ez;
      if (e2 >= r * r) continue;
      const e = Math.sqrt(e2) || 0.01, nx = ex / e, nz = ez / e;
      d.x += nx * (r - e); d.z += nz * (r - e);
      const vrel = (c.vx - d.vx) * nx + (c.vz - d.vz) * nz;      // closing speed
      if (vrel > 0.3) {
        const kick = Math.min(24, 1.35 * vrel);
        d.vx += kick * nx; d.vz += kick * nz; d.vy = Math.max(d.vy, 1 + Math.min(4, vrel * 0.18));
        d.wy += (Math.random() - 0.5) * 10; d.wx += (Math.random() - 0.5) * 8; d.rest = false; d.ground = false;
        const k = Math.min(0.06, d.m * 0.004);                       // the car feels it: speed loss + twitch, more for big parts
        c.vx *= 1 - k; c.vz *= 1 - k; c.w += (Math.random() - 0.5) * d.m * 0.05;
        c.hitDebris = Math.max(c.hitDebris || 0, vrel * Math.min(1, d.m / 8));
      }
      break;
    }
  }

  /* ---- loose trackside props: traffic cones, striped marker pylons, spare-tyre stacks, straw bales, crates, roadside posts ----
     Little rigid bodies with point contacts. They sleep until a car (or another flying prop) knocks them, then fly,
     tumble, bounce off the barriers and settle wherever they land. Tyre and bale stacks burst into single tyres / bales. */
  const PROP_G = 13;
  const PIT_V = 22.2, _pq2 = {};   // pit lane speed limit: 80 km/h
  const PROPK = (() => {
    const cylPts = (r, y0, y1, n) => { const p = []; for (const y of [y0, y1]) for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; p.push([Math.cos(a) * r, y, Math.sin(a) * r]); } return p; };
    const boxPts = (x, y, z) => { const p = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) p.push([sx * x, sy * y, sz * z]); return p; };
    const conePts = cylPts(0.3, -0.17, -0.17, 6).slice(0, 6); conePts.push([0, 0.59, 0]);
    return {   // m mass (kg), rh horizontal radius, rb bounding radius, h0 centre height when standing, e bounce, mu friction, lift pop-up when hit, I inertia
      cone:   { m: 3,  rh: 0.28, rb: 0.42, h0: 0.17,  e: 0.3,  mu: 0.75, lift: 0.6,  I: 0.22, pts: conePts },
      pylon:  { m: 7,  rh: 0.36, rb: 0.7,  h0: 0.68,  e: 0.25, mu: 0.55, lift: 0.4,  I: 1.3,  pts: cylPts(0.36, -0.68, 0.68, 6) },
      tyre:   { m: 9,  rh: 0.43, rb: 0.45, h0: 0.13,  e: 0.45, mu: 0.7,  lift: 0.45, I: 0.7,  pts: cylPts(0.43, -0.13, 0.13, 8) },
      bale:   { m: 26, rh: 0.62, rb: 0.75, h0: 0.425, e: 0.12, mu: 0.9,  lift: 0.3,  I: 5.2,  pts: boxPts(0.65, 0.425, 0.45) },
      crate:  { m: 18, rh: 0.5,  rb: 0.62, h0: 0.4,   e: 0.2,  mu: 0.7,  lift: 0.35, I: 2.6,  pts: boxPts(0.5, 0.4, 0.4) },
      tstack: { m: 27, rh: 0.43, rb: 0.55, h0: 0.39,  breaks: 'tyre', parts: [[0, -0.26, 0], [0, 0, 0], [0, 0.26, 0]], pf: [[1.25, 1.0], [1.1, 2.2], [0.85, 3.4]] },
      bstack: { m: 78, rh: 0.9,  rb: 1.1,  h0: 0.85,  breaks: 'bale', parts: [[-0.66, -0.425, 0], [0.66, -0.425, 0], [0, 0.425, 0]], pf: [[1.1, 0.6], [1.0, 0.9], [0.8, 2.4]] },
      rbale:  { m: 26, rh: 0.62, rb: 0.75, h0: 0.43,  e: 0.15, mu: 0.8,  lift: 0.3,  I: 4.6,  pts: (() => { const p = []; for (const x of [-0.62, 0.62]) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; p.push([x, Math.cos(a) * 0.43, Math.sin(a) * 0.43]); } return p; })() },   // round straw bale lying on its side (Toskana)
      rbstack: { m: 78, rh: 0.9, rb: 1.1,  h0: 0.85,  breaks: 'rbale', parts: [[-0.66, -0.425, 0], [0.66, -0.425, 0], [0, 0.425, 0]], pf: [[1.1, 0.6], [1.0, 0.9], [0.8, 2.4]] },
      post:   { m: 4,  rh: 0.14, rb: 0.62, h0: 0.55,  e: 0.3,  mu: 0.6,  lift: 1.0,  I: 0.4,  pts: boxPts(0.07, 0.55, 0.07) },   // roadside post (stebriček): light, snaps over and cartwheels away
    };
  })();
  const _pq = {};
  const qRot = (b, px, py, pz, out) => {   // rotate a local point by the body's quaternion
    const tx = 2 * (b.qy * pz - b.qz * py), ty = 2 * (b.qz * px - b.qx * pz), tz = 2 * (b.qx * py - b.qy * px);
    out[0] = px + b.qw * tx + (b.qy * tz - b.qz * ty); out[1] = py + b.qw * ty + (b.qz * tx - b.qx * tz); out[2] = pz + b.qw * tz + (b.qx * ty - b.qy * tx); return out;
  };
  const _r3 = [0, 0, 0];
  function mkProp(kind, x, y, z, yaw) {
    const a = -(yaw || 0) / 2;   // local +x along the heading yaw (the car convention: forward = (cos h, sin h))
    return { kind, K: PROPK[kind], x, y, z, vx: 0, vy: 0, vz: 0, qx: 0, qy: Math.sin(a), qz: 0, qw: Math.cos(a), wx: 0, wy: 0, wz: 0,
      sleep: true, hidden: false, dead: false, dirty: true, slot: -1, qi: -1, bk: -1, t: 0, age: 0, col: 0, parts: null, fy: NaN };   // (fy: the floor under it last step)
  }
  function propImpulse(b, jx, jy, jz, rx, ry, rz) {
    const K = b.K; b.vx += jx / K.m; b.vy += jy / K.m; b.vz += jz / K.m;
    b.wx += (ry * jz - rz * jy) / K.I; b.wy += (rz * jx - rx * jz) / K.I; b.wz += (rx * jy - ry * jx) / K.I;
  }
  function propFeel(c, m, vrel, kind) {   // what the driver feels: a little speed and a twitch, a thump
    const k = Math.min(0.045, m * 0.0016) * Math.min(1, vrel / 8);
    c.vx *= 1 - k; c.vz *= 1 - k; c.w += (Math.random() - 0.5) * m * 0.012;
    c.hitDebris = Math.max(c.hitDebris || 0, vrel * clamp(m / 30, 0.12, 0.35));
    if (vrel > 4) { c.propKnock = kind; c.propKnockV = vrel; }
    if (vrel > 1.5 && (!c.propSnd || vrel > c.propSndV)) { c.propSnd = kind; c.propSndV = vrel; }
  }
  function propCarHit(race, c, b) {
    const K = b.K, dx = b.x - c.x, dz = b.z - c.z;
    if (dx * dx + dz * dz > 20) return;
    const cy = c.y || 0; if (b.y - K.rb > cy + 1.3 || b.y + K.rb < cy + 0.05) return;
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    for (let i = 0; i < 3; i++) {
      const ax = c.x + ch * c.circles[i], az = c.z + sh * c.circles[i], ex = b.x - ax, ez = b.z - az, r = c.rad + K.rh, e2 = ex * ex + ez * ez;
      if (e2 >= r * r) continue;
      const e = Math.sqrt(e2) || 0.01, nx = ex / e, nz = ez / e;
      const px = b.x - nx * K.rh, pz = b.z - nz * K.rh, rcx = px - c.x, rcz = pz - c.z;
      const vcx = c.vx - c.w * rcz, vcz = c.vz + c.w * rcx, vrel = (vcx - b.vx) * nx + (vcz - b.vz) * nz;   // closing speed at the contact
      b.x += nx * (r - e); b.z += nz * (r - e); b.dirty = true;                                          // the prop gives way
      if (vrel < 0.5) return;
      if (K.breaks) { race.breakProp(b, nx, nz, vrel, c.vx, c.vz); propFeel(c, K.m, vrel, b.kind); return; }
      const rx = -nx * K.rh, rz = -nz * K.rh, ry = clamp(cy + 0.42 - b.y, -K.rb * 0.8, K.rb * 0.8);          // hit at bumper height: it topples away
      const ax2 = ry * nz, ay2 = rz * nx - rx * nz, az2 = -ry * nx;
      const j = 1.35 * vrel / (1 / K.m + (ax2 * ax2 + ay2 * ay2 + az2 * az2) / K.I + 1 / c.m.mass);
      b.sleep = false; b.t = 0; b.age = 0;
      propImpulse(b, nx * j, 0, nz * j, rx, ry, rz);
      b.vy = Math.min(7.5, b.vy + Math.min(5, vrel * K.lift * 0.22)); b.wy += (Math.random() - 0.5) * Math.min(10, vrel * 0.5);
      const hs = Math.hypot(b.vx, b.vz), cap = Math.min(18, 0.72 * Math.hypot(c.vx, c.vz) + 2); if (hs > cap) { b.vx *= cap / hs; b.vz *= cap / hs; }
      race.propFx(b, vrel);
      const wl = Math.hypot(b.wx, b.wy, b.wz); if (wl > 14) { b.wx *= 14 / wl; b.wy *= 14 / wl; b.wz *= 14 / wl; }
      propFeel(c, K.m, vrel, b.kind);
      return;
    }
  }
  function propPair(race, a, b) {   // a is awake; b may be asleep (a flying tyre can knock over a cone or burst a stack)
    const Ka = a.K, Kb = b.K, dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, r = (Ka.rb + Kb.rb) * 0.68, d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= r * r) return;
    const d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d, nz = dz / d, pen = r - d;
    const vr = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny + (a.vz - b.vz) * nz;
    if (Kb.breaks && vr > 3) { race.breakProp(b, nx, nz, vr * 0.7, a.vx, a.vz); return; }
    const movable = !b.sleep || vr > 0.8, ia = 1 / Ka.m, ib = movable && !Kb.breaks ? 1 / Kb.m : 0, it = ia + ib;
    a.x -= nx * pen * ia / it; a.y -= ny * pen * ia / it; a.z -= nz * pen * ia / it;
    if (ib) { b.x += nx * pen * ib / it; b.y += ny * pen * ib / it; b.z += nz * pen * ib / it; b.dirty = true; }
    if (vr > 0) {
      const j = 1.15 * vr / it; a.vx -= j * nx * ia; a.vy -= j * ny * ia; a.vz -= j * nz * ia;
      if (ib) { b.vx += j * nx * ib; b.vy += j * ny * ib; b.vz += j * nz * ib; if (b.sleep) { b.sleep = false; b.t = 0; b.age = 0; b.wy += (Math.random() - 0.5) * 3; } }
    }
  }
  function propStep(race, b, T, dt) {
    const K = b.K;
    b.age += dt; b.vy -= PROP_G * dt;
    const x0 = b.x, z0 = b.z;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    const h = 0.5 * dt, qx = b.qx, qy = b.qy, qz = b.qz, qw = b.qw, wx = b.wx, wy = b.wy, wz = b.wz;   // orientation (world-frame angular velocity)
    b.qx = qx + h * (wx * qw + wy * qz - wz * qy); b.qy = qy + h * (wy * qw + wz * qx - wx * qz);
    b.qz = qz + h * (wz * qw + wx * qy - wy * qx); b.qw = qw - h * (wx * qx + wy * qy + wz * qz);
    const ql = Math.hypot(b.qx, b.qy, b.qz, b.qw) || 1; b.qx /= ql; b.qy /= ql; b.qz /= ql; b.qw /= ql;
    const F = race.propFloor; let q = T.query(b.x, b.z, b.qi, _pq), gy = (T.hasElev ? T.elevAt(q.s).y : 0) + (F ? F(q) : 0);   // (the verge may lie below the road)
    if (gy - b.fy > 0.45) {   // the floor rose by more than 0.45 m since the last step and the prop is that far below it: a face (a deck's end, a planter, the
      let lo = 1e9; for (const p of K.pts) { const r = qRot(b, p[0], p[1], p[2], _r3)[1]; if (r < lo) lo = r; }   // side of a pit), not a slope: it bounces off
      if (gy - (b.y + lo) > 0.45) { b.x = x0; b.z = z0; b.vx *= -0.3; b.vz *= -0.3; q = T.query(b.x, b.z, b.qi, _pq); gy = (T.hasElev ? T.elevAt(q.s).y : 0) + (F ? F(q) : 0); }
    }
    b.fy = gy; b.qi = q.i; race._bkMove(b);
    const lim = (q.d > 0 ? q.br : q.bl) - K.rh - (F && F.inset ? F.inset[q.i * 2 + (q.d > 0 ? 1 : 0)] : 0);   // barriers (with the catch fences above them; F.inset: solid scenery in front of them)
    if (Math.abs(q.d) > lim && b.y - gy < 3.2) {
      const sg = Math.sign(q.d), nx = q.nx * sg, nz = q.nz * sg, pen = Math.abs(q.d) - lim;
      b.x -= nx * pen; b.z -= nz * pen;
      const vn = b.vx * nx + b.vz * nz; if (vn > 0) { b.vx -= 1.35 * vn * nx; b.vz -= 1.35 * vn * nz; b.wy += (Math.random() - 0.5) * vn; }
    }
    if (T.open && b.y - gy < 3.2) { const pen = endPen(T, q, K.rh); if (pen > 0) { const nx = _en[0], nz = _en[1]; b.x += nx * pen; b.z += nz * pen; const vn = b.vx * nx + b.vz * nz; if (vn < 0) { b.vx -= 1.35 * vn * nx; b.vz -= 1.35 * vn * nz; } } }   // open road: the end walls
    let touch = false, maxPen = 0;                                                  // ground: impulses at every contact point below it
    for (const p of K.pts) {
      const rr = qRot(b, p[0], p[1], p[2], _r3), rx = rr[0], ry = rr[1], rz = rr[2], pen = gy - (b.y + ry);
      if (pen <= 0) continue;
      touch = true; if (pen > maxPen) maxPen = pen;
      const vpy = b.vy + b.wz * rx - b.wx * rz;
      if (vpy >= 0) continue;
      const j = -(1 + (vpy < -2 ? K.e : 0)) * vpy / (1 / K.m + (rx * rx + rz * rz) / K.I);
      propImpulse(b, 0, j, 0, rx, ry, rz);
      const vpx = b.vx + b.wy * rz - b.wz * ry, vpz = b.vz + b.wx * ry - b.wy * rx, vt = Math.hypot(vpx, vpz);
      if (vt > 1e-4) {
        const tx = vpx / vt, tz = vpz / vt, ax = ry * tz, ay = rz * tx - rx * tz, az = -ry * tx;
        const jt = Math.min(K.mu * j, vt / (1 / K.m + (ax * ax + ay * ay + az * az) / K.I));
        propImpulse(b, -tx * jt, 0, -tz * jt, rx, ry, rz);
      }
    }
    if (maxPen > 0) b.y += maxPen;
    if (b.vy > 8) b.vy = 8;                                                          // no trampoline bounces off a spinning edge
    if (touch) { const k = Math.max(0, 1 - 2.2 * dt), kv = Math.max(0, 1 - 1.4 * dt); b.wx *= k; b.wy *= k; b.wz *= k; b.vx *= kv; b.vz *= kv; }   // rolling resistance, scuffing
    else { const kv = Math.max(0, 1 - 0.25 * dt); b.vx *= kv; b.vz *= kv; }          // a little air drag
    const arr = race.propBk, nb = arr.length;
    for (let o = -1; o <= 1; o++) { const L = arr[(b.bk + o + nb) % nb]; for (let n = L.length - 1; n >= 0; n--) { const c = L[n]; if (c !== b && !c.dead) propPair(race, b, c); } }
    const v2 = b.vx * b.vx + b.vy * b.vy + b.vz * b.vz, w2 = b.wx * b.wx + b.wy * b.wy + b.wz * b.wz;
    if (touch && v2 < 0.05 && w2 < 0.2) b.t += dt; else b.t = 0;
    if (b.t > 0.35 || (b.age > 20 && v2 < 1)) { b.sleep = true; b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0; b.t = 0; }
    if (!Number.isFinite(b.x + b.y + b.z + b.qw + b.vx + b.vz) || b.y < gy - 6) {   // safety: put it back upright beside the road
      const i = q.i >= 0 ? q.i : 0; b.x = T.px[i]; b.z = T.pz[i]; b.y = gy + K.h0; b.qx = b.qz = 0; b.qy = 0; b.qw = 1; b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0; b.sleep = true;
    }
    b.dirty = true;
  }

  function wallCollide(c, trk) {
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    let hit = 0, hitK = 0, hnx = 0, hnz = 0;
    for (let k = 0; k < 4; k++) {
      const rx = c.corners[k][0], rz = c.corners[k][1];
      const wx = rx * ch - rz * sh, wz = rx * sh + rz * ch; // world offset
      const px = c.x + wx, pz = c.z + wz;
      const q = trk.query(px, pz, c.q.i, _q);
      let pen = 0, nx = 0, nz = 0, br = q.br, inner = -1e9;
      if (c.isPlayer && trk.def.pit) { const pz2 = trk.pitAt(q.s); if (pz2) { if (pz2.gap) br = Math.max(br, pz2.lout); else if (c.inPit) { inner = pz2.inner; br = pz2.lout; } } }   // in the pit lane: between the pit wall (the kerb in front of the stands) and the lane's outer edge
      if (q.d > br) { pen = q.d - br; nx = -q.nx; nz = -q.nz; }
      else if (q.d < inner) { pen = inner - q.d; nx = q.nx; nz = q.nz; }
      else if (q.d < -q.bl) { pen = -q.bl - q.d; nx = q.nx; nz = q.nz; }
      if (trk.open) {   // open road: the two ends of the road are walls 0.5 m in from the last samples
        const sl = q.s + (q.over || 0), N = trk.N;
        if (sl < 0.5 && 0.5 - sl > pen) { pen = 0.5 - sl; nx = trk.tx[0]; nz = trk.tz[0]; }
        else if (sl > trk.len - 0.5 && sl - (trk.len - 0.5) > pen) { pen = sl - (trk.len - 0.5); nx = -trk.tx[N - 1]; nz = -trk.tz[N - 1]; }
      }
      if (pen <= 0) continue;
      c.wallX = px; c.wallZ = pz;
      // positional correction
      c.x += nx * pen; c.z += nz * pen;
      // corner velocity
      const vcx = c.vx - c.w * wz, vcz = c.vz + c.w * wx;
      const vn = vcx * nx + vcz * nz;
      if (vn < 0) {
        const rn = wx * nz - wz * nx;
        const e = c.phys === 'cs' ? CSK.wallE : 0.25, wy = c.phys === 'cs' ? CSK.wallYaw : 1;
        const J = -(1 + e) * vn / (1 / c.m.mass + rn * rn / c.I * wy);
        c.vx += J * nx / c.m.mass; c.vz += J * nz / c.m.mass;
        c.w += rn * J / c.I * wy;
        // friction along wall
        const tx = -nz, tz = nx;
        const vtan = (c.vx - c.w * wz) * tx + (c.vz + c.w * wx) * tz;
        const rt = wx * tz - wz * tx;
        let Jt = -vtan / (1 / c.m.mass + rt * rt / c.I * wy);
        const mu = c.phys === 'cs' ? CSK.wallMu : 0.35;
        Jt = clamp(Jt, -mu * J, mu * J);
        c.vx += Jt * tx / c.m.mass; c.vz += Jt * tz / c.m.mass;
        c.w += rt * Jt / c.I * wy;
        if (-vn > hit) { hit = -vn; hitK = k; hnx = nx; hnz = nz; }
      }
    }
    if (hit > 0) { c.hitWall = Math.max(c.hitWall, hit); c.fxWall = Math.max(c.fxWall || 0, hit); }
    if (hit > 2.5) {   // 36 km/h into the wall ≈ 21 %; which face hit follows from the wall direction seen from the car
      const fx = -(hnx * ch + hnz * sh), fz = -(-hnx * sh + hnz * ch), cx = c.corners[hitK][0], cz = c.corners[hitK][1];
      const side = Math.abs(fz) > Math.abs(fx) * 0.9;
      applyDamage(c, (hit - 2.5) * 0.028, side ? cx * 0.45 : Math.sign(fx || cx) * Math.abs(cx) * 0.95, side ? Math.sign(fz) * Math.abs(cz) * 0.95 : cz * 0.6);
    }
    return hit;
  }

  function carCollide(a, b) {
    const dx0 = b.x - a.x, dz0 = b.z - a.z;
    if (dx0 * dx0 + dz0 * dz0 > 49) return 0;
    const cha = Math.cos(a.h), sha = Math.sin(a.h), chb = Math.cos(b.h), shb = Math.sin(b.h);
    let best = 0, bnx = 0, bnz = 0, bpx = 0, bpz = 0;
    for (let i = 0; i < 3; i++) {
      const ax = a.x + cha * a.circles[i], az = a.z + sha * a.circles[i];
      for (let j = 0; j < 3; j++) {
        const bx = b.x + chb * b.circles[j], bz = b.z + shb * b.circles[j];
        const dx = ax - bx, dz = az - bz; const d2 = dx * dx + dz * dz;
        const r = a.rad + b.rad;
        if (d2 < r * r) {
          const d = Math.sqrt(d2) || 0.001; const pen = r - d;
          if (pen > best) { best = pen; bnx = dx / d; bnz = dz / d; bpx = (ax + bx) * 0.5; bpz = (az + bz) * 0.5; }
        }
      }
    }
    if (best <= 0) return 0;
    const ma = a.m.mass, mb = b.m.mass, ia = 1 / ma, ib = 1 / mb;
    // separate. A friend's car in an online race (net) is not moved here (its own phone moves it): the local car takes the
    // whole separation and, below, only its own share of the impulse (the friend's phone gives the friend's car its share)
    const tot = ia + ib;
    if (b.net) { a.x += bnx * best; a.z += bnz * best; } else if (!a.net) { a.x += bnx * best * ia / tot; a.z += bnz * best * ia / tot; }
    if (a.net) { b.x -= bnx * best; b.z -= bnz * best; } else if (!b.net) { b.x -= bnx * best * ib / tot; b.z -= bnz * best * ib / tot; }
    // impulse (normal points from b to a)
    const rax = bpx - a.x, raz = bpz - a.z, rbx = bpx - b.x, rbz = bpz - b.z;
    const vax = a.vx - a.w * raz, vaz = a.vz + a.w * rax;
    const vbx = b.vx - b.w * rbz, vbz = b.vz + b.w * rbx;
    const vrel = (vax - vbx) * bnx + (vaz - vbz) * bnz;
    if (vrel >= 0) return 0;
    const rna = rax * bnz - raz * bnx, rnb = rbx * bnz - rbz * bnx;
    const csc = a.phys === 'cs' && b.phys === 'cs', e = csc ? CSK.carE : 0.3, ka = csc ? 0 : 0.6;
    // angular terms damped to keep contact spins moderate
    const J = -(1 + e) * vrel / (ia + ib + rna * rna / a.I * 0.6 + rnb * rnb / b.I * 0.6);
    if (!a.net) { a.vx += J * bnx * ia; a.vz += J * bnz * ia; a.w += rna * J / a.I * ka; }
    if (!b.net) { b.vx -= J * bnx * ib; b.vz -= J * bnz * ib; b.w -= rnb * J / b.I * ka; }
    if (csc) { if (!a.air && !a.net) a.csKc = clamp(a.csKc + rna * J / a.I * CSK.tapT, -CSK.tapMax, CSK.tapMax); if (!b.air && !b.net) b.csKc = clamp(b.csKc - rnb * J / b.I * CSK.tapT, -CSK.tapMax, CSK.tapMax); }   // cs: a tap swings the tail, the car catches itself
    const imp = -vrel;
    a.hitCar = Math.max(a.hitCar, imp); b.hitCar = Math.max(b.hitCar, imp);
    if (imp > 3.5) for (const c of [a, b]) { if (c.net) continue; const dx = bpx - c.x, dz = bpz - c.z, ch = Math.cos(c.h), sh = Math.sin(c.h); applyDamage(c, (imp - 3.5) * 0.016, dx * ch + dz * sh, -dx * sh + dz * ch); }
    a.fxCar = Math.max(a.fxCar || 0, imp); b.fxCar = Math.max(b.fxCar || 0, imp);
    a.contactX = b.contactX = bpx; a.contactZ = b.contactZ = bpz;
    return imp;
  }

  /* ---------------------------------------------------------------------
     AI
     --------------------------------------------------------------------- */
  function aiControl(c, race, dt) {
    const T = race.track, M = c.m, A = c.assist;
    const q = c.q;
    const v = Math.max(0, c.vl);
    const N = T.N;
    // --- avoidance / overtaking ---
    c.aiT -= dt;
    if (c.aiT <= 0) {
      c.aiT = 0.12 + Math.random() * 0.08;
      let target = c.laneBias;
      let threat = null, tgap = 1e9;
      for (const o of race.cars) {
        if (o === c) continue;
        let gap = o.dist - c.dist;
        if (gap < -4 || gap > 22) continue;
        const lat = o.q.d - q.d;
        const closing = v - Math.max(0, o.vl);
        if (gap > 0 && Math.abs(lat) < 3.2 && (closing > -1 || gap < 7) && gap < tgap) { threat = o; tgap = gap; }
      }
      c.aiThreat = threat; c.aiGap = tgap;
      if (threat) {
        const rlHere = T.rl[q.i];
        const oPos = threat.q.d;
        // choose side with more room
        const roomL = oPos - (-T.w + 1.2), roomR = (T.w - 1.2) - oPos;
        const side = roomR > roomL ? 1 : -1;
        const want = oPos + side * 3.3;
        target = clamp(want - rlHere, -2 * T.w, 2 * T.w);
        c.passing = 1;
      } else c.passing = 0;
      c.aiOffT = target;
    }
    c.aiOff += clamp(c.aiOffT - c.aiOff, -3.2 * dt, 3.2 * dt);

    // --- steering: pure pursuit on racing line + offset ---
    const look = 5.5 + v * 0.36;
    const sT = q.s + look;
    const fi = sT / T.ds;
    let i0, i1, ft;
    if (T.open) { const f = clamp(fi, 0, N - 1); i0 = Math.min(N - 2, Math.floor(f)); i1 = i0 + 1; ft = f - i0; }   // open road: the look-ahead stops at the end
    else { i0 = ((Math.floor(fi) % N) + N) % N; i1 = (i0 + 1) % N; ft = fi - Math.floor(fi); }
    const rlv = lerp(T.rl[i0], T.rl[i1], ft);
    const lim = T.w - 1.25;
    let off = clamp(rlv + c.aiOff, -lim, lim);
    if (c.pitWant && T.def.pit) { const pz = T.pitAt(sT); if (pz) off = pz.o; }   // (autopilot into the pits: follow the lane)
    const tx = lerp(T.px[i0], T.px[i1], ft) + lerp(T.nx[i0], T.nx[i1], ft) * off;
    const tz = lerp(T.pz[i0], T.pz[i1], ft) + lerp(T.nz[i0], T.nz[i1], ft) * off;
    const hA = c.phys === 'cs' && c.speed > 3 ? Math.atan2(c.vz, c.vx) : c.h;   // cs: the arc starts along the travel, not the nose
    const ch = Math.cos(hA), sh = Math.sin(hA);
    const dx = tx - c.x, dz = tz - c.z;
    const lx = dx * ch + dz * sh, ly = -dx * sh + dz * ch;
    const dist = Math.max(3, Math.hypot(lx, ly));
    const ang = Math.atan2(ly, lx);
    const kap = 2 * Math.sin(ang) / dist;
    let dW = Math.atan(kap * (M.a + M.b));
    // yaw-rate feedback for stability
    dW += 0.06 * (v * kap - c.w);
    const csGain = (c.phys === 'cs' ? 0.15 : A.cs) * clamp((c.vl - 3) / 8, 0, 1);   // ('cs' cars steer by path rate below; this is overridden)
    dW -= csGain * clamp(c.beta, -0.8, 0.8);
    const steerLim = M.steerMax / (1 + v / c.vref);
    c.inSteer = clamp(dW / steerLim, -1, 1);
    if (c.arcade) {
      // needed slide angle for the path curvature, as a fraction of full-lock slide
      const P = c.arc || ARC[M.id] || ARC.kaze;
      const bNeed = v * kap / (P.kv * (c.aeroK ? 1 + c.aeroK * v * v : 1));   // rad (positive = right turn); aero upgrade: less slide for the same turn
      c.inSteer = clamp(bNeed / Math.max(0.08, c.bMaxNow || 0.5) + 0.12 * (v * kap - c.w), -1, 1);
    }
    if (c.phys === 'cs') { const wNeed = v * kap; c.inSteer = clamp((wNeed + CSK.aiKw * (wNeed - c.wPath)) / Math.max(0.05, c.csWcap || 1), -1, 1); }   // steer = share of the path-rate cap

    // --- speed ---
    const sA = q.s + v * 0.22 + 3;
    const ia = T.idx(sA);
    // skill > 1 (hard): faster in the quicker corners and on the brakes, but no faster than the profile through the slowest hairpins,
    // where the cars would only slide wide (tested per car model at the limit)
    const vpA = (c.vprof || race.vprof)[ia], offErr = Math.abs(q.d - (T.rl[q.i] + c.aiOff)), offLine = Math.abs(c.aiOff) > 1.2 || offErr > 1.2;
    let sk = Math.min(c.skill * c.rubber, c.skCap || 1.14);
    if (sk > 1 && offLine) sk = 1 + (sk - 1) * 0.3;   // away from the ideal line (overtaking, defending, knocked aside) the extra pace is not there
    let vT = vpA * (sk <= 1 ? sk : 1 + (sk - 1) * sstep(11, 24, vpA));
    if (c.upgGrip) vT *= Math.pow(c.upgGrip * (1 + c.aeroK * vT * vT), 0.25);   // upgraded tyres / aero: carry more speed through the corners (half the grip gain: safe for every car)
    // if displaced from line, be a little more careful
    if (offErr > 2.5) vT *= 0.94;
    if (c.passing) vT *= 1.01;
    if (c.pitWant && T.def.pit) { const pz = T.pitAt(q.s + v * 0.8 + 6), pn = T.pitAt(q.s); if (pz || c.inPit) vT = Math.min(vT, (pz && pz.t < 0.98) || (pn && pn.t < 0.98) ? 15 : PIT_V * 0.97); }   // (easy through the S of the way in and out)
    { const o = c.aiThreat; if (o && c.aiGap < 9 && Math.abs(o.q.d - q.d) < 2.1) vT = Math.min(vT, Math.max(0, o.vl) + Math.max(0, c.aiGap - 3) * 0.8); }   // right behind someone with no gap yet: follow, don't ram
    let thr = 0, brk = 0;
    if (v < vT - 0.8) thr = 1;
    else if (v < vT + 0.6) thr = 0.45;
    else { thr = 0; brk = clamp((v - vT) / 4.5, 0.15, 1); }
    // don't stamp on the brakes while turning hard or sliding
    if (c.phys === 'cs') brk *= 1 - 0.3 * Math.min(1, Math.abs(c.inSteer));   // cs: trail-braking is stable (the slide is the design)
    else {
      brk *= 1 - 0.55 * Math.min(1, Math.abs(c.inSteer));
      if (Math.abs(c.beta) > 0.22) brk *= 0.55;
    }
    // traction management (tyre-model cars only; SWGP-style cars slide by design)
    const ab = Math.abs(c.beta);
    if (!c.arcade && c.phys !== 'cs' && ab > 0.1 && c.vl > 6) thr *= clamp(1 - (ab - 0.1) * 3.5, 0.25, 1);
    if (c.phys === 'cs' && c.vl > 6) { const ex = ab - Math.abs(c.csAT || 0) - 0.12; if (ex > 0) thr *= clamp(1 - ex * 4, 0.3, 1); }   // cs: ease off only when knocked past the planned slide
    if (c.spin > 0.05) thr *= 0.8;
    // off-track: slow down a bit & aim back
    if (T.open && T.len - q.s < 6 + v * v / 40) { thr = 0; brk = 1; }   // open road: stop (and stay stopped) well short of the wall at the top end
    c.inThr = thr; c.inBrk = brk; c.inHand = 0;
  }

  /* ---------------------------------------------------------------------
     RACE
     --------------------------------------------------------------------- */
  const DRIVER_NAMES = ['M. Kovač', 'T. Hayashi', 'L. Rossi', 'J. Novak', 'K. Weber', 'A. Silva', 'R. Horvat', 'S. Tanaka', 'P. Dubois', 'N. Petek', 'E. Lindqvist', 'G. Moretti', 'D. Zupan', 'H. Kimura'];
  const AI_COLORS = [0xe8e8ee, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xf07a1a, 0x9a2bd8, 0x19b7c7, 0xd81f45, 0xc9c3b0, 0x6b8e23, 0xff5fa2, 0x3b3fa8];
  // AI pace per difficulty: [slowest skill, fastest skill, rubber band: slow-down when far ahead of the player (max, from metres), speed-up when behind (max, from metres)]
  // (skill 1 = the racing-line speed profile; the cars' own limit on the autopilot is about 1.12, the little pico understeers past ~1.08)
  const DIFF = [
    [0.78, 0.86, 0.06, 60, 0.05, 40],    // lahka
    [0.88, 0.97, 0.04, 90, 0.05, 40],    // srednja
    [1.02, 1.12, 0.01, 200, 0.06, 30],   // težka: the front runners drive at the limit and hardly wait for anyone
  ];

  class Race {
    constructor(track, opts) {
      if (opts.phys === 'rally') opts = Object.assign({}, opts, { phys: 'cs' });   // the removed 'rally' physics maps to cs (as in Car)
      this.track = track;
      this.opts = opts;
      this.laps = opts.laps || 3;
      this.time = 0; this.state = 'grid'; this.countdown = 0;
      this.cars = []; this.debris = []; this.debrisId = 0; this.props = null; this.propBk = null; this.propSlots = null; this.propCap = null;
      this.finishOrder = [];
      // time trial (def.timeTrial, e.g. the Pikes Peak hill climb): the player alone, standing ON the start line; the clock is race.time
      this.timeTrial = !!(track.def.timeTrial && !opts.noPlayer);
      this._rq = [];   // open road + noPlayer (menu demo): cars that reached the top, waiting for a free spot at the start
      const nAI = this.timeTrial ? 0 : opts.numAI == null ? 12 : opts.numAI;
      const RM = opts.remote || null;   // online race: the friend's car { model, color, num, name, grid }, driven by the friend's phone
      const total = nAI + (opts.noPlayer ? 0 : 1) + (RM ? 1 : 0);
      this._gridN = total;
      const playerGrid = opts.noPlayer ? -1 : Math.min(total, opts.playerGrid || 12);
      const remoteGrid = RM ? Math.min(total, RM.grid || total) : -1;
      const R = rng(opts.seed || 7);
      // AI roster
      const diff = DIFF[opts.difficulty == null ? 1 : opts.difficulty]; this.diff = diff;
      const aiSpecs = [];
      for (let k = 0; k < nAI; k++) {
        const skill = lerp(diff[1], diff[0], k / Math.max(1, nAI - 1)) + (R() - 0.5) * 0.012;
        aiSpecs.push({ skill, model: MODELS[(k * 3 + 1) % 4], color: AI_COLORS[k % AI_COLORS.length], name: DRIVER_NAMES[k % DRIVER_NAMES.length] });
      }
      // grid: fastest first
      let ai = 0;
      for (let g = 1; g <= total; g++) {
        let c;
        if (g === playerGrid) {
          c = new Car(opts.playerModel || MODELS[0], { id: g, isPlayer: true, arcade: opts.arcade !== false, phys: opts.phys, name: 'TI', color: opts.playerColor, assist: opts.assist, upg: opts.playerUpg });
          this.player = c;
        } else if (g === remoteGrid) {
          c = new Car(RM.model || MODELS[0], { id: g, net: true, arcade: true, phys: opts.phys, name: RM.name || 'Prijatelj', color: RM.color });
          this.remote = c;
        } else {
          const s = aiSpecs[ai++];
          c = new Car(s.model, { id: g, name: s.name, color: s.color, skill: s.skill, assist: opts.phys === 'cs' ? CSK.aiAssist : 1, arcade: true, phys: opts.phys, laneBias: (R() - 0.5) * 1.6 });
          c.skCap = s.model.id === 'pico' ? 1.0 : opts.phys === 'cs' ? CSK.aiSkCap : 1.14;   // no point pushing a car past what it can hold (the light pico understeers into the walls beyond the line's own pace)
        }
        c.grid = g; c.num = [7, 3, 11, 21, 5, 44, 9, 16, 27, 8, 12, 33, 2, 55][(g - 1) % 14];
        c.rubber = 1;
        c.dmgMode = opts.damage == null ? 2 : opts.damage;
        this.cars.push(c);
        this._placeOnGrid(c, g);
      }
      if (this.player) this.player.num = opts.playerNum || 1;
      if (this.remote) this.remote.num = RM.num || 2;
      if (track.drs) this.drsLast = track.drs.map(() => null);   // (per DRS zone: who crossed its detection line last, and when)
      this._prof();
    }

    // online race: a finish time on the clock both phones share, and the order by it. The friend's comes from its phone (once);
    // mine replaces the local one (measured on that clock, see game.js)
    netFinish(c, t) {
      if (c.net && c.finished) return;
      if (!c.finished) { c.finished = true; c.lap = this.laps + 1; this.finishOrder.push(c); }
      c.finishTime = t;
      this.finishOrder.sort((a, b) => a.finishTime - b.finishTime);
      this.finishOrder.forEach((f, i) => { f.finishPos = i + 1; });
    }

    // speed profile for the AI (on the racing line), per physics; an upgraded player's autopilot brakes later with better brakes (its own profile)
    _prof() {
      const opts = this.opts, track = this.track;
      const csP = opts.phys === 'cs', latA0 = opts.aiLatA || (csP ? CSK.aiLatA : 16.5), brA0 = opts.aiBrakeA || (csP ? CSK.aiBrakeA : 13.0), wM0 = csP ? CSK.aiWmax : 0;
      this.vprof = track.speedProfile(latA0, brA0, 85, wM0);
      if (this.player && this.player.upg && this.player.brakeG !== BRAKE_G) this.player.vprof = track.speedProfile(latA0, brA0 * this.player.brakeG / BRAKE_G, 85, wM0);
    }

    // switch the driving physics of a running race at once ('cs' | 'arcade'): every car, the AI set-up and the AI speed profile
    setPhys(ph) {
      ph = ph === 'arcade' ? 'arcade' : 'cs'; this.opts.phys = ph; const cs = ph === 'cs';
      for (const c of this.cars) {
        c.phys = ph; c.arcade = !cs; c.vAngP = null;
        c.csS = c.csWd = c.csB = c.csBx = c.csCo = c.csLt = c.csLp = c.csThrP = c.csK = c.csKc = c.csAn = c.csAT = 0; c.csKs = null; c.csWcap = 1;
        if (!c.isPlayer) { c.assist = ASSISTS[cs ? CSK.aiAssist : 1]; c.skCap = c.m.id === 'pico' ? 1.0 : cs ? CSK.aiSkCap : 1.14; }
      }
      this._prof();
    }

    _gridBack(g) {   // metres behind the start line of grid slot g
      const T = this.track;
      if (this.timeTrial) return 0;
      if (this.opts.remote) return 9;   // online: the two of them side by side on the front row (the same distance to the line)
      if (!T.open) return 9 + (g - 1) * 7.5;
      // open road: the grid has to fit between the bottom end of the road and the start line (two abreast, staggered)
      const sp = clamp((T.startS - 9) / Math.max(1, this._gridN - 1), 2.4, 3.6);
      return Math.min(3 + (g - 1) * sp, T.startS - 4);
    }
    _placeOnGrid(c, g) {
      const T = this.track;
      const back = this._gridBack(g);
      const s = T.startS - back;
      const i = this.timeTrial ? T.startIdx : T.idx(s);
      const lat = this.timeTrial ? 0 : (g % 2 === 1 ? -1 : 1) * 3.4;
      const x = T.px[i] + T.nx[i] * lat, z = T.pz[i] + T.nz[i] * lat;
      c.place(x, z, T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; if (T.open) c.roadY = c.y; }   // (open road: the camera starts at the right height)
      c.dist = -back; c.lap = 0;
      c.cp = 0; c.splits = [];
      c.q = T.query(x, z, i, {});
      c.sPrev = c.q.s;
      c.locked = true;
    }

    spawnDebris(c, name) {
      const P = PARTS[name], hl = c.m.len * 0.5, hw = c.m.wid * 0.5, ch = Math.cos(c.h), sh = Math.sin(c.h);
      const ox = P.lx * hl, oz = P.lz * hw, x = c.x + ox * ch - oz * sh, z = c.z + ox * sh + oz * ch;
      const ol = Math.hypot(ox, oz) || 1, ux = (ox * ch - oz * sh) / ol, uz = (ox * sh + oz * ch) / ol, out = 2 + Math.random() * 3;
      const d = { id: ++this.debrisId, car: c.id, part: name, x, z, y: (c.y || 0) + P.y, vx: c.vx * 0.7 + ux * out, vz: c.vz * 0.7 + uz * out, vy: 2.5 + Math.random() * 2.5,
        yaw: c.h, rx: 0, rz: 0, wx: (Math.random() - 0.5) * 16, wy: (Math.random() - 0.5) * 12, wz: (Math.random() - 0.5) * 16, r: P.r, m: P.m, h: P.h, rest: false, ground: false, q: null, dead: false };
      this.debris.push(d);
      if (this.debris.length > 40) { const old = this.debris.shift(); old.dead = true; }   // keep the road readable
    }
    start() {
      this.state = 'racing'; this.time = 0; for (const c of this.cars) { c.locked = false; c.lapStart = 0; }
      // open-road demo: the grid is packed tight between the bottom end and the start line, so the cars set off one by one, 0.5 s apart
      if (this.track.open && this.opts.noPlayer) for (const c of this.cars) { c.relT = (c.grid - 1) * 0.5; if (c.relT > 0) c.locked = true; }
    }

    // trackside props from the scenery builder: [{ kind, x, z, yaw, col }]; stacks get their tyres / bales ready (hidden) for when they burst.
    // floor(q): the verge's height relative to the road there (from the world builder; worlds whose verge drops away from the road edge)
    setProps(list, floor) {
      const T = this.track, props = [], slots = {}, cap = {};
      this.propFloor = floor || null;
      for (const it of list) {
        const K = PROPK[it.kind]; if (!K) continue;
        const q = T.query(it.x, it.z, it.i >= 0 && it.i < T.N ? it.i : -1, {}), gy = (T.hasElev ? T.elevAt(q.s).y : 0) + (floor ? floor(q, true) : 0);   // (it.i: the builder's sample index, a hint that saves a full scan; the floor row of the nearest sample, as the builder's placement test saw it)
        const b = mkProp(it.kind, it.x, gy + K.h0, it.z, it.yaw); b.col = it.col || 0; b.qi = q.i;
        b.slot = slots[it.kind] = (slots[it.kind] || 0); slots[it.kind]++; cap[it.kind] = (cap[it.kind] || 0) + 1; props.push(b);
        if (K.breaks) b.parts = K.parts.map(() => { const pb = mkProp(K.breaks, it.x, gy, it.z, 0); pb.hidden = true; pb.dead = true; pb.col = b.col; cap[K.breaks] = (cap[K.breaks] || 0) + 1; props.push(pb); return pb; });
      }
      for (const k in cap) if (!slots[k]) slots[k] = 0;
      this.props = props; this.propSlots = slots; this.propCap = cap;
      const nb = Math.max(1, Math.ceil(T.N / 6)); this.propBk = []; for (let k = 0; k < nb; k++) this.propBk.push([]);
      for (const b of props) if (!b.dead) this._bkPut(b);
    }
    _bkPut(b) { const k = Math.max(0, Math.floor(b.qi / 6)) % this.propBk.length; b.bk = k; this.propBk[k].push(b); }
    _bkDel(b) { const L = this.propBk[b.bk]; if (L) { const i = L.indexOf(b); if (i >= 0) L.splice(i, 1); } b.bk = -1; }
    _bkMove(b) { const k = Math.max(0, Math.floor(b.qi / 6)) % this.propBk.length; if (k !== b.bk) { this._bkDel(b); b.bk = k; this.propBk[k].push(b); } }
    breakProp(b, nx, nz, vn, svx, svz) {   // a stack bursts: its tyres / bales fly off (the bottom ones hardest, the top one pops up)
      if (b.dead) return;
      b.dead = true; b.hidden = true; b.sleep = true; b.dirty = true; this._bkDel(b); this.propFx(b, vn);
      const K = b.K, tx = -nz, tz = nx; if (!b.parts) return;
      b.parts.forEach((p, k) => {
        const o = qRot(b, K.parts[k][0], K.parts[k][1], K.parts[k][2], _r3), f = K.pf[k];
        p.x = b.x + o[0]; p.y = b.y + o[1]; p.z = b.z + o[2]; p.qx = b.qx; p.qy = b.qy; p.qz = b.qz; p.qw = b.qw;
        const side = (Math.random() - 0.5) * 2.4, vv = b.kind === 'bstack' || b.kind === 'rbstack' ? Math.min(11, vn * 0.62) : Math.min(14, vn * 0.78);
        p.vx = svx * 0.2 + nx * vv * f[0] + tx * side; p.vz = svz * 0.2 + nz * vv * f[0] + tz * side; p.vy = f[1] + vv * 0.05 * (k + 1);
        p.wx = (Math.random() - 0.5) * 9; p.wy = (Math.random() - 0.5) * 7; p.wz = (Math.random() - 0.5) * 9;
        p.dead = false; p.hidden = false; p.sleep = false; p.dirty = true; p.t = 0; p.age = 0; p.qi = b.qi;
        if (p.slot < 0) { p.slot = this.propSlots[p.kind]; this.propSlots[p.kind]++; }
        this._bkPut(p);
      });
    }
    propFx(b, v) { if (v < 3) return; const E = this.propEvents || (this.propEvents = []); if (E.length < 24) E.push({ x: b.x, y: b.y, z: b.z, kind: b.kind, v }); }   // for the renderer: dust / straw puffs
    stepProps(dt) {
      if (!this.props) return;
      const T = this.track, bk = this.propBk, nb = bk.length;
      for (const c of this.cars) {
        if (!(c.q.i >= 0)) continue; const k0 = Math.floor(c.q.i / 6);
        for (let o = -1; o <= 1; o++) { const L = bk[(k0 + o + nb) % nb]; for (let n = L.length - 1; n >= 0; n--) { const b = L[n]; if (b && !b.dead) propCarHit(this, c, b); } }
      }
      for (const b of this.props) if (!b.sleep && !b.dead) propStep(this, b, T, dt);
    }

    step(dt) {
      const T = this.track, cars = this.cars;
      if (this.state === 'racing' || this.state === 'done') this.time += dt;
      for (const c of cars) if (!(c.q.i >= 0)) c.q = T.query(c.x, c.z, -1, c.q);   // a car placed without a track lookup finds itself first
      // rubber band vs player
      const P = this.player;
      for (const c of cars) {
        if (c.isPlayer || c.net) continue;
        if (c.relT > 0 && this.state === 'racing') { c.relT -= dt; if (c.relT <= 0) c.locked = false; }   // (open-road demo: staggered start)
        if (P && !c.finished) {
          const gap = c.dist - P.dist; // + ahead of player
          const D = this.diff || DIFF[1], target = gap > D[3] ? 1 - clamp((gap - D[3]) / 500, 0, D[2]) : gap < -D[5] ? 1 + clamp((-gap - D[5]) / 400, 0, D[4]) : 1;
          c.rubber += (target - c.rubber) * dt * 0.5;
        }
        if (!c.locked) {
          aiControl(c, this, dt);
          if (c.finished) { c.inThr *= 0.5; }
        } else { c.inThr = 0; c.inBrk = c.parkQ ? 1 : 0; c.inSteer = 0; }
      }
      for (const c of cars) {
        if (c.net) continue;   // (the friend's car: placed from the network, see game.js)
        if (c.pitState === 'repair') { c.inThr = 0; c.inBrk = 0; c.inSteer = 0; c.inHand = 0; }   // on the jacks: the mechanics are working (held in place below; no brake, so the gearbox stays in first)
        // steering smoothing
        const target = c.inSteer;
        const rate = c.isPlayer ? (c.digitalSteer ? (Math.abs(target) < Math.abs(c.steer) || target * c.steer < 0 ? 10 : 6) : 16) : 10;
        c.steer += clamp(target - c.steer, -rate * dt, rate * dt);
        c.step(dt, T);
      }
      // collisions
      for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) carCollide(cars[i], cars[j]);
      }
      if (T.def.pit) for (const c of cars) if (c.isPlayer) this.pitStep(c, dt, true);   // which side of the pit wall the car is on (before the walls push it)
      for (const c of cars) if (!c.net) wallCollide(c, T);
      if (T.def.pit) for (const c of cars) if (c.isPlayer) this.pitStep(c, dt, false);  // speed limiter, stopping at the box, repair
      for (const c of cars) if (c.detach.length) { for (const name of c.detach) this.spawnDebris(c, name); c.detach.length = 0; }
      for (const c of cars) if (!c.net && !Number.isFinite(c.x + c.z + c.vx + c.vz + c.h + c.w + (c.y || 0))) { c.x = c.z = c.vx = c.vz = c.w = c.h = 0; c.y = 0; c.vy = 0; c.air = 0; c.q.s = c.goodS || 0; c.q.i = -1; this.rescue(c); }
      if (this.debris.length) { for (const d of this.debris) stepDebris(d, T, dt); for (const c of cars) if (!c.net) for (const d of this.debris) debrisHit(c, d); }
      // progress
      for (const c of cars) {
        const q = T.query(c.x, c.z, c.q.i, c.q);
        if (c.net) { c.sPrev = q.s; continue; }   // (distance, laps and the finish of the friend's car come from its phone)
        let ds = q.s - c.sPrev;
        if (!T.open) { if (ds > T.len * 0.5) ds -= T.len; else if (ds < -T.len * 0.5) ds += T.len; }
        ds = clamp(ds, -3, 3);
        c.sPrev = q.s; if (Number.isFinite(q.s)) c.goodS = q.s;
        c.dist += ds;
        if (T.open) this._progressOpen(c, q, ds, dt);
        const lapsDone = Math.floor(c.dist / T.len);
        if (this.state !== 'grid' && !T.open) {
          while (c.lap <= lapsDone && c.lap <= this.laps) {
            if (c.lap >= 1) { c.lapTimes.push(this.time - c.lapStart); }
            c.lapStart = this.time;
            c.lap++;
            if (c.lap > this.laps && !c.finished) {
              c.finished = true; c.finishTime = this.time; this.finishOrder.push(c); c.finishPos = this.finishOrder.length;
            }
          }
        }
        if (this.drsLast) this._drs(c, ds, dt);
        // wrong way
        const fwd = Math.cos(c.h) * q.tx + Math.sin(c.h) * q.tz;
        if (fwd < -0.2 && c.speed > 3) c.wrongT += dt; else c.wrongT = Math.max(0, c.wrongT - dt * 2);
        // stuck detection (AI auto-rescue)
        if (!c.locked && !c.pitState && c.speed < 1.2 && (this.state === 'racing' || this.state === 'done')) c.stuckT += dt; else c.stuckT = Math.max(0, c.stuckT - dt);
        if (!c.isPlayer && (c.stuckT > 3.5 || c.wrongT > 3)) this.rescue(c);
      }
      if (this._rq.length) this._serveRespawn();
      this.stepProps(dt);
      // order
      this.order = cars.slice().sort((a, b) => {
        if (a.finished && b.finished) return a.finishPos - b.finishPos;
        if (a.finished) return -1; if (b.finished) return 1;
        return b.dist - a.dist;
      });
      for (let i = 0; i < this.order.length; i++) this.order[i].pos = i + 1;
    }

    // ---- pit lane: 60 km/h limit, the car pulls up at its box, the crew repairs it (time depends on the damage), then off you go ----
    pitStep(c, dt, pre) {
      const T = this.track, P = T.def.pit, q = T.query(c.x, c.z, c.q.i, _pq2), pz = T.pitAt(q.s);
      if (pre) {
        if (!pz) { if (c.inPit) { c.inPit = false; c.pitEv = 'exit'; } c.pitDone = false; c.pitState = null; return; }
        if (pz.gap) { const was = c.inPit; c.inPit = q.d > pz.wall; if (c.inPit && !was) c.pitEv = 'enter'; else if (!c.inPit && was) { c.pitEv = 'exit'; c.pitDone = false; c.pitState = null; } }
        return;
      }
      if (!c.inPit || !pz) return;
      const sp = Math.hypot(c.vx, c.vz), lim = PIT_V;
      if (c.pitState === 'repair') {
        c.vx = c.vz = 0; c.w = 0; c.pitT += dt; c.stuckT = 0;
        if (c.pitT >= c.pitDur) { this.repairCar(c); c.pitState = 'done'; c.pitDone = true; c.pitEv = 'done'; }
        return;
      }
      let vmax = lim;
      if (!c.pitDone && P[3] != null) {   // pull up at the box: a braking curve that ends right at it
        const L = T.len; let ds = (T.startS + P[3]) - q.s; ds = ((ds % L) + L) % L; if (ds > L / 2) ds -= L;
        if (ds < 40 && ds > -5) {
          vmax = Math.min(vmax, Math.sqrt(2 * 6.5 * Math.max(0, ds - 0.2)));
          if (!c.pitState) { c.pitState = 'stop'; c.pitEv = 'box'; }
          if (sp < (c.phys === 'cs' ? 1.5 : 0.8) && Math.abs(ds) < 4) {   // (cs: its drive holds ~0.9 m/s against the stop curve at part throttle)
            let lost = 0; for (const k in c.lost) lost++;
            c.pitState = 'repair'; c.pitT = 0; c.pitDur = Math.min(5, 1.2 + 3.3 * c.dmg + lost * 0.15); c.vx = c.vz = 0; c.w = 0; c.pitEv = 'repair';
          }
        }
      }
      if (sp > vmax) { const k = Math.max(vmax / sp, 1 - 4 * dt); c.vx *= k; c.vz *= k; if (vmax < 1) c.w *= k; }   // the limiter (and the stop) take over smoothly
    }
    // DRS (Track.drs): a car that crosses a zone's detection line less than 1 s after the car before it may open the flap of its rear wing
    // in that zone (from the second lap on, not in the pit lane): open from the activation line (c.drs = zone + 1, less air drag, see Car)
    // to the end of the zone, closed at once when the driver brakes. c.drsA: the zones it may open in (bits); the player's c.drsEv 'open'
    // for the HUD. (These fields appear only on a circuit with DRS, so every other circuit's race state stays as it was.)
    _drs(c, ds, dt) {
      const Z = this.track.drs, L = this.track.len, d1 = c.dist, d0 = d1 - ds, racing = this.state === 'racing' || this.state === 'done';
      if (c.drsA == null) { c.drsA = 0; c.drs = 0; }
      if (c.drs && (c.inBrk > 0.2 || c.inPit || c.finished || !racing)) c.drs = 0;
      if (!(ds > 0) || !racing) return;
      for (let k = 0; k < Z.length; k++) {
        const z = Z[k], lapAt = (at) => Math.floor((d1 - at) / L), crossed = (at) => lapAt(at) > Math.floor((d0 - at) / L), bit = 1 << k;
        if (crossed(z.det)) {
          const t = this.time - dt * clamp((d1 - (z.det + lapAt(z.det) * L)) / ds, 0, 1), prev = this.drsLast[k];
          if (c.lap >= 2 && !c.finished && !c.inPit && prev && prev.car !== c && t - prev.t <= 1) c.drsA |= bit; else c.drsA &= ~bit;
          this.drsLast[k] = { car: c, t };
        }
        if ((c.drsA & bit) && crossed(z.act)) { c.drsA &= ~bit; if (!c.inPit && !c.finished) { c.drs = k + 1; if (c.isPlayer) c.drsEv = 'open'; } }
        if (c.drs === k + 1 && crossed(z.end)) c.drs = 0;
      }
    }
    repairCar(c) {   // good as new: body, panels, lamps, glass; the renderer rebuilds the car when repairN changes
      c.dmg = 0; c.dz = [0, 0, 0, 0]; c.dents = []; c.cd = [0, 0, 0, 0]; c.lightOut = [0, 0, 0, 0]; c.lost = {}; c.detach = []; c.winOut = [0, 0, 0, 0]; c.roofDmg = 0;
      c.repairN = (c.repairN || 0) + 1;
    }

    // open road: checkpoints (split times), the finish at T.finishS; in the menu demo (noPlayer) cars that reach the top start again at the bottom.
    // Crossing times are interpolated inside the step from the distance covered in it.
    _progressOpen(c, q, ds, dt) {
      const T = this.track;
      if (this.state === 'grid' || c.finished || c.parkQ) return;
      const tAt = (target) => this.time - dt * (ds > 1e-9 ? clamp((c.dist - target) / ds, 0, 1) : 0);
      if (c.lap === 0 && c.dist >= 0) { c.lap = 1; if (c.dist - ds < 0) c.lapStart = tAt(0); }
      // (the projected position must agree - within 30 m - so a lookup snapped to another leg of the road can not trigger anything)
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp] && q.s >= T.cpS[c.cp] - 30) { c.splits.push(tAt(T.cpDist[c.cp])); c.cp++; c.cpEv++; }
      const atFinish = c.cp >= T.cpS.length && c.dist >= T.raceLen && q.s >= T.finishS - 30;
      if (this.opts.noPlayer) { if (atFinish || q.s >= T.finishS + 5) this._queueRespawn(c); return; }
      if (atFinish) {
        const ft = tAt(T.raceLen);
        c.finished = true; c.finishTime = ft; c.lapTimes = [ft]; c.lap = this.laps + 1;
        this.finishOrder.push(c); c.finishPos = this.finishOrder.length;
        c.noReverse = true;   // (the UI holds the brake after the finish: the car must stop, not back down the hill)
      }
    }
    _queueRespawn(c) { c.parkQ = true; c.locked = true; c.inThr = 0; c.inBrk = 1; c.inSteer = 0; this._rq.push(c); }
    // put the first waiting car on the first free spot behind the start line (no car within 9 m of it)
    _serveRespawn() {
      const T = this.track, c = this._rq[0];
      for (let g = 1; g <= 4; g++) {
        const i = T.idx(T.startS - this._gridBack(g)), lat = (g % 2 === 1 ? -1 : 1) * 3.4;
        const x = T.px[i] + T.nx[i] * lat, z = T.pz[i] + T.nz[i] * lat;
        let free = true;
        for (const o of this.cars) if (o !== c && (o.x - x) * (o.x - x) + (o.z - z) * (o.z - z) < 81) { free = false; break; }
        if (!free) continue;
        this._rq.shift();
        this._placeOnGrid(c, g);
        c.parkQ = false; c.locked = false; c.stuckT = 0; c.wrongT = 0; c.aiOff = 0; c.aiT = 0; c.steer = 0;
        return;
      }
    }

    rescue(c) {
      const T = this.track;
      const s = c.q.s;
      let i = T.idx(s);
      if (T.open) i = clamp(i, 3, T.N - 4);   // not into the wall at an end of the road
      const off = T.rl[i] * 0.5;
      c.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; if (T.open) c.roadY = c.y; }
      c.locked = false;
      c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s;
      if (T.open && Number.isFinite(s) && Number.isFinite(c.dist)) c.dist += c.q.s - s;   // open road: the distance follows the car back to the sample (checkpoints / finish stay exact)
      c.stuckT = 0; c.wrongT = 0; c.rescued = 1.2; c.inPit = false; c.pitState = null; c.pitDone = false;   // (back on the circuit, not in the pit lane)
      const v = T.open && T.len - c.q.s < 25 ? 0 : 8;   // (near the top end of an open road: standing, not off into the end wall)
      c.vx = Math.cos(c.h) * v; c.vz = Math.sin(c.h) * v;
    }

    // estimated finish times for unfinished cars (for results)
    estimateResults() {
      const T = this.track, res = [];
      const done = this.finishOrder.slice();
      const rest = this.cars.filter(c => !c.finished).sort((a, b) => b.dist - a.dist);
      for (const c of done) res.push({ car: c, time: c.finishTime, est: false });
      for (const c of rest) {
        const remain = Math.max(0, (T.open ? T.raceLen : this.laps * T.len) - c.dist);
        const avg = c.dist > 50 ? c.dist / Math.max(1, this.time) : 30;
        const t = this.time + remain / Math.max(15, avg);
        res.push({ car: c, time: t, est: true });
      }
      res.sort((a, b) => a.time - b.time);
      return res;
    }
  }

  return { G, clamp, lerp, wrapPi, sstep, rng, Track, TRACK_DEF, PIKES_DEF, TRACKS, MODELS, ASSISTS, SURF, Car, Race, wallCollide, carCollide, aiControl, tire, DRIVER_NAMES, UPG, upgMods, upgStats, CSK, CSP, CSASSIST, CSSURF };
})();



if (typeof module !== 'undefined') module.exports = Core;
