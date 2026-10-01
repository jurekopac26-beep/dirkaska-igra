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
      this._findCrossings();
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
      // named places (def.names = [[name, x, z, lines?], ...] snapped to the centre line, or { n, d, say?, hud? } with d = metres after the
      // start line, for scaled roads): { n, d, say, hud } in lap order (HUD label, commentator lines or null; hud false: a place the
      // commentator names but the HUD does not show, e.g. one of an invented section). Open roads keep only the run.
      this.names = (def.names || []).map((e) => {
        const arr = Array.isArray(e), n = arr ? e[0] : e.n, say = arr ? e[3] : e.say;
        let d = !arr && e.d != null ? +e.d : this.nearestIdx(arr ? e[1] : e.x, arr ? e[2] : e.z) * ds - this.startS;
        if (!open) d = ((d % len) + len) % len;
        return { n, d, say: Array.isArray(say) && say.length ? say : null, hud: arr || e.hud !== false };
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
      // more run-off where a track asks for it (def.wide = [[from, to, side (-1 left, 1 right), metres], ...], metres after the start line;
      // closed circuits): the barrier on that side moves out, eased in and out over 30 m
      if (def.wide && !open) for (const [a, b, sd, m] of def.wide) for (let d = a - 30; d <= b + 30; d += ds) {
        const i = this.idx(this.startS + d), f = Math.min(sstep(a - 30, a, d), sstep(b + 30, b, d)); if (sd < 0) this.bl[i] += m * f; else this.br[i] += m * f;
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
      // TV sectors (def.sectors = [where sector 2 starts, where sector 3 starts], metres after the start line; closed circuits): the lap in
      // three, the lines at 0, def.sectors[0] and def.sectors[1] (see Race._sectors)
      this.sectors = def.sectors && !open ? [0, def.sectors[0], def.sectors[1]] : null;
      // a gravel stage with puddles in the rain (def.rain = { seed, puddles }; open roads): [s, d (m across, + right), half length,
      // half width]; pudAt: per sample, the puddle there (-1: none). inRain: the race driving on it has rain (Race.step); only then are the
      // puddles a surface (6)
      this.puddles = []; this.pudAt = null; this.inRain = false;
      if (def.rain && open) this._buildPuddles(def.rain);
      // cobbled stretches (def.setts = [[from, to], ...], metres after the start line; open roads: the granite setts in the hairpins of
      // Vršič): a surface of their own (7, 8 in the rain), less grip than asphalt and much less when wet. settAt: per sample, 1 on the setts
      this.settAt = null;
      if (def.setts && open) {
        const a = this.settAt = new Uint8Array(N);
        for (const [s0, s1] of def.setts) for (let d = s0; d <= s1; d += ds / 2) { const i = Math.floor((this.startS + d) / ds); if (i >= 0 && i < N) a[i] = 1; }
      }
      // sidewalks (def.walks = [[from, to, side (-1 left, 1 right, 0 both), width], ...], metres after the start line; open roads: Kranjska
      // Gora and Jasna on Vršič): part of the road, drivable with the grip of asphalt (surface 0), eased in and out over 10 m; the barriers
      // stand 1.8 m past them. walk: per side ([0] left, [1] right) the sidewalk's width at every sample (0: none)
      this.walk = null;
      if (def.walks && open) {
        const W = this.walk = [new Float32Array(N), new Float32Array(N)];
        for (const [a, b, sd, wd] of def.walks) for (let d = a - 10; d <= b + 10; d += ds / 2) {
          const i = Math.floor((this.startS + d) / ds); if (i < 0 || i >= N) continue;
          const f = Math.min(sstep(a - 10, a, d), sstep(b + 10, b, d)) * wd;
          if (sd <= 0) W[0][i] = Math.max(W[0][i], f); if (sd >= 0) W[1][i] = Math.max(W[1][i], f);
        }
        for (let i = 0; i < N; i++) { this.bl[i] = Math.max(this.bl[i], this.w + W[0][i] + 1.8); this.br[i] = Math.max(this.br[i], this.w + W[1][i] + 1.8); }
      }
    }

    // the puddles: in the dips of the profile first (the water runs down into them), then spread along the rest of the run, some on the
    // racing line, 30 m apart at least, and none from a jump's approach to its landing (the jumps fly as tuned)
    _buildPuddles(rain) {
      const N = this.N, ds = this.ds, hy = this.hy, R = rng(rain.seed || 31), P = this.puddles, n = rain.puddles || 40, s0 = this.startS + 40, s1 = this.finishS - 40;
      const jumps = (this.def.bumps || []).map(b => [clamp(b.at, 0, 1) * this.len, b.w || 8]);
      const free = (s) => jumps.every(([c, w]) => s < c - 2.2 * w - 25 || s > c + 1.6 * w + 10) && P.every(p => Math.abs(p[0] - s) > 30);
      const put = (s, onLine) => {
        if (s < s0 || s > s1 || !free(s)) return;
        const i = this.idx(s), hl = 1.6 + R() * 2.6, hw = Math.min(this.w - 1, 0.8 + R() * 1.4), lim = this.w - hw - 0.3;
        P.push([s, clamp(onLine ? this.rl[i] + (R() - 0.5) * 2.4 : (R() - 0.5) * 2 * lim, -lim, lim), hl, hw]); };
      const r = Math.round(30 / ds);   // a dip: the lowest sample within 30 m either way, 0.25 m below both ends
      for (let i = r; i < N - r && P.length < n; i++) { const h = hy[i]; let lo = hy[i - r] - h > 0.25 && hy[i + r] - h > 0.25; for (let k = -r; k <= r && lo; k++) if (hy[i + k] < h) lo = false; if (lo) put(i * ds, R() < 0.6); }
      for (let t = 0; t < 600 && P.length < n; t++) put(lerp(s0, s1, R()), R() < 0.5);
      P.sort((a, b) => a[0] - b[0]);
      const at = this.pudAt = new Int16Array(N).fill(-1);
      P.forEach((p, k) => { for (let s = p[0] - p[2]; s <= p[0] + p[2] + ds; s += ds / 2) { const i = Math.floor(s / ds); if (i >= 0 && i < N) at[i] = k; } });
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

    // where the centre line crosses itself on two levels (a figure of eight: one leg on a bridge over the other). A crossing counts only
    // where the two legs are at least 4 m apart in height. cross = [{ lo, up, x, z, sin, dy, loZ, upZ }]: the sample positions (fractional
    // indices) of the lower and the upper leg at the crossing point, the point, the sine of the angle between the legs, the height gap,
    // and how far along each leg (m) the underpass walls / the bridge parapets reach (_buildEdges narrows the barriers there)
    _findCrossings() {
      const N = this.N, px = this.px, pz = this.pz, hy = this.hy, cross = this.cross = [];
      if (this.open || !this.hasElev) return;
      const C = 16, hash = new Map(), key = (a, b) => a * 65536 + b, cell = (i) => { const j = (i + 1) % N; return [Math.floor((px[i] + px[j]) / 2 / C), Math.floor((pz[i] + pz[j]) / 2 / C)]; };
      for (let i = 0; i < N; i++) { const [a, b] = cell(i), k = key(a, b); let L = hash.get(k); if (!L) hash.set(k, L = []); L.push(i); }
      for (let i = 0; i < N; i++) {
        const [ca, cb] = cell(i), i1 = (i + 1) % N;
        for (let a = ca - 1; a <= ca + 1; a++) for (let b = cb - 1; b <= cb + 1; b++) {
          const L = hash.get(key(a, b)); if (!L) continue;
          for (const m of L) {
            if (m <= i || Math.min(m - i, N - m + i) < 40) continue;
            const m1 = (m + 1) % N, ax = px[i1] - px[i], az = pz[i1] - pz[i], bx = px[m1] - px[m], bz = pz[m1] - pz[m], den = ax * bz - az * bx;
            if (Math.abs(den) < 1e-9) continue;
            const ex = px[m] - px[i], ez = pz[m] - pz[i], t = (ex * bz - ez * bx) / den, u = (ex * az - ez * ax) / den;
            if (t < 0 || t >= 1 || u < 0 || u >= 1) continue;
            const hi = hy[i] + (hy[i1] - hy[i]) * t, hm = hy[m] + (hy[m1] - hy[m]) * u; if (Math.abs(hi - hm) < 4) continue;
            cross.push({ lo: hi < hm ? i + t : m + u, up: hi < hm ? m + u : i + t, x: px[i] + ax * t, z: pz[i] + az * t,
              sin: Math.abs(den) / (Math.hypot(ax, az) * Math.hypot(bx, bz)), dy: Math.abs(hi - hm), loZ: 16, upZ: 40 });
          }
        }
      }
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
      // a crossing on two levels: around it the two legs do not limit each other's barriers (one passes over the other)
      const X = this.cross || [], cdist = (i, f) => { const d = Math.abs(i - f); return Math.min(d, N - d) * ds; };
      const crossPair = (i, j) => { for (const c of X) if ((cdist(i, c.lo) < 90 && cdist(j, c.up) < 90) || (cdist(i, c.up) < 90 && cdist(j, c.lo) < 90)) return true; return false; };
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
            if (X.length && crossPair(i, j)) continue;
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
      // ... and there the upper leg runs between the parapets of its bridge (3 m from the road), the lower one between the walls of the
      // underpass (3.4 m), each narrowing in over the next 30 / 24 m
      for (const c of X) for (let i = 0; i < N; i++) {
        const fu = sstep(c.upZ + 30, c.upZ, cdist(i, c.up)), fl = sstep(c.loZ + 24, c.loZ, cdist(i, c.lo));
        for (const [f, t] of [[fu, w + 3], [fl, w + 3.4]]) if (f > 0) { if (BL[i] > t) BL[i] = lerp(BL[i], t, f); if (BR[i] > t) BR[i] = lerp(BR[i], t, f); }
      }
      // walls the track sets itself (def.walls = [[from, to, side (-1 left, 1 right), metres past the road edge], ...], metres after the start
      // line, closed circuits): a pit wall right by the road, eased in and out over 20 m
      if (this.def.walls && !open) {
        const i0 = this.def.start ? this.nearestIdx(this.def.start[0], this.def.start[1]) : 0;
        for (const [a, b, side, off] of this.def.walls) { const arr = side > 0 ? BR : BL;
          for (let d = a - 20; d <= b + 20; d += ds) { const i = ((i0 + Math.round(d / ds)) % N + N) % N, f = Math.min(sstep(a - 20, a, d), sstep(b + 20, b, d)); arr[i] = lerp(arr[i], w + off, f); } }
      }
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
    // aero: grip that grows with speed, latA (1 + aero v^2) (the formula's wings): v^2 (curvature - latA aero) = latA (no limit once the wings hold any bend);
    // settMu: the share of the grip left on the cobbles (def.setts)
    speedProfile(latA, brakeA, vtop, wMax, aero, settMu) {
      const N = this.N, rk = this.rk, rds = this.rds, la = latA * (aero || 0);
      const v = new Float32Array(N);
      for (let i = 0; i < N; i++) { const kk = Math.max(Math.abs(rk[i]), 1e-5) - la; v[i] = kk > 1e-6 ? Math.min(vtop, Math.sqrt(latA / kk)) : vtop; }
      if (this.settAt && settMu) for (let i = 0; i < N; i++) if (this.settAt[i]) { const kk = Math.max(Math.abs(rk[i]), 1e-5) - la * settMu; if (kk > 1e-6) v[i] = Math.min(v[i], Math.sqrt(latA * settMu / kk)); }
      if (this.bank) for (let i = 0; i < N; i++) { const b = this.bank[i], kk = Math.max(Math.abs(rk[i]), 1e-5) - la; if (b > 0) v[i] = kk > 1e-6 ? Math.min(vtop, Math.sqrt((latA + G * b / Math.sqrt(1 + b * b)) / kk)) : vtop; }   // a banked bend carries part of the cornering force
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

    // qualifying (closed circuits): a flying lap from a standing start this far behind the start line, from the exit of the last corner
    // before it (the whole straight to build up speed), 120-400 m
    qualiBack() {
      const N = this.N; let best = N;
      for (const c of this.corners) { const d = (this.startIdx - c.i1 + N) % N; if (d > 0 && d < best) best = d; }
      return clamp(best * this.ds, 120, 400);
    }

    // pace notes of a rally stage (open roads), as a co-driver reads them (game.js speaks each call ahead of the car): the bends graded by
    // their tightest radius from one (the slowest) to six, 'flat' for a gentle one, hairpins and square junctions; long, tightens, opens;
    // the jumps and crests (def.bumps by height; one inside a bend is read with it: 'over crest'). Calls: what follows within 30 m is
    // joined with 'into', within 70 m with 'and' (three notes at most), a longer straight ends the call with its length (to 50 m).
    // [{ s, e, text }]: the call's first and last point (m along the road from sample 0)
    paceNotes() {
      if (this._notes) return this._notes;
      const N = this.N, ds = this.ds, k = this.k, ev = [], NUM = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
      const bend = (c) => {
        if (c.sum < 0.3) return;
        const R = 1 / c.mk, side = c.dir > 0 ? 'right' : 'left', len = (c.i1 - c.i0) * ds, f = (c.im - c.i0) / Math.max(1, c.i1 - c.i0);
        const hair = c.sum > 2.2 && R < 22, square = !hair && c.sum > 1.25 && c.sum < 1.9 && R < 22, g = R < 16 ? 1 : R < 26 ? 2 : R < 38 ? 3 : R < 55 ? 4 : R < 80 ? 5 : R < 120 ? 6 : 0;
        let txt = hair ? 'hairpin ' + side : square ? 'square ' + side : g ? side + ' ' + NUM[g] : 'flat ' + side;
        if (!hair && !square && c.sum > 1.7) txt += ' long';
        if (!hair && len > 30 && f > 0.7) txt += ' tightens'; else if (!hair && g && len > 30 && f < 0.3) txt += ' opens';
        ev.push({ s: c.i0 * ds, e: c.i1 * ds, txt, bend: true });
      };
      let cur = null;   // bends: runs of curvature over 1/220 m^-1 one way
      for (let i = 0; i < N; i++) {
        const ki = k[i], on = Math.abs(ki) > 1 / 220, dir = Math.sign(ki);
        if (cur && (!on || dir !== cur.dir)) { bend(cur); cur = null; }
        if (on) { if (!cur) cur = { i0: i, i1: i, dir, sum: 0, mk: 0, im: i }; cur.i1 = i; cur.sum += Math.abs(ki) * ds; if (Math.abs(ki) > cur.mk) { cur.mk = Math.abs(ki); cur.im = i; } }
      }
      if (cur) bend(cur);
      for (const b of this.def.bumps || []) {
        const c = (this.open ? clamp(b.at, 0, 1) : ((b.at % 1) + 1) % 1) * this.len, w = b.w || 8, h = b.h || 1, word = h >= 1.5 ? 'big jump' : h >= 1 ? 'jump' : 'crest';
        const on = ev.find(e => e.bend && e.s - 15 <= c && c <= e.e + 10);
        if (on) on.txt += ' over ' + word; else ev.push({ s: c - w * 0.8, e: c + w, txt: word });
      }
      const from = this.open ? this.startS : 0, to = this.open ? this.finishS : this.len;
      const E = ev.filter(e => e.s >= from && e.s < to).sort((a, b) => a.s - b.s), out = this._notes = [];
      const dist = (m) => { const r = clamp(Math.round(m / 50) * 50, 100, 500); return ['one hundred', 'one fifty', 'two hundred', 'two fifty', 'three hundred', 'three fifty', 'four hundred', 'four fifty', 'five hundred'][r / 50 - 2]; };
      for (let n = 0; n < E.length;) {
        const first = E[n]; let last = first, text = first.txt; n++;
        for (let m = 1; n < E.length && m < 3; m++, n++) { const gap = E[n].s - last.e; if (gap >= 70) break; text += (gap < 30 ? ' into ' : ' and ') + E[n].txt; last = E[n]; }
        const next = E[n], gap = next ? next.s - last.e : Infinity, fin = this.open ? this.finishS - last.e : Infinity;
        if (next && gap >= 70 && gap <= 520) text += ', ' + dist(gap);
        else if (!next && fin > 60 && fin <= 520) text += ', ' + dist(fin) + ' to finish';
        out.push({ s: first.s, e: last.e, text });
      }
      return out;
    }

    // pit lane (def.pit = [centre offset to the right, from, to, player's box, entry length (default 60 m)] in metres from the start line): a lane
    // beside the straight, tapering in from the circuit edge at both ends. Returns null outside it. gap: the lane touches the circuit (no pit wall) -
    // where you drive in and out.
    // inner: the player's limit on the pit-wall side: the rail, but where the teams' stands sit on the grass strip behind it (pitStands [d0, d1],
    // set by the world builder from its pit boxes) the lane's edge kerb, eased in and out over 25 m
    pitAt(s) {
      const P = this.def && this.def.pit; if (!P) return null;
      const L = this.len; let d = s - this.startS; d = ((d % L) + L) % L; if (d > L / 2) d -= L;
      if (d < P[1] || d > P[2]) return null;
      const f = (((s % L) + L) % L) / this.ds, i = Math.floor(f) % this.N, j = (i + 1) % this.N, br = lerp(this.br[i], this.br[j], f - Math.floor(f));
      const full = Math.max(P[0], br + 5), t = Math.min(sstep(P[1], P[1] + (P[4] || 60), d), sstep(P[2], P[2] - 30, d)), o = lerp(this.w + 3.6, full, t);   // a long, gentle way in
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
    // def.gravelStrips: gravel just past the kerb), 5 makadam; 6 a puddle on it (in the rain, inRain: def.rain's puddles); 7 cobbles
    // (def.setts), 8 cobbles in the rain
    surface(q) {
      const d = q.d, ad = Math.abs(d), w = this.w;
      if (ad <= w || (this.walk && ad <= w + this.walk[d > 0 ? 1 : 0][q.a])) {   // (a sidewalk: part of the road)
        if (this.settAt && this.settAt[q.a]) return this.inRain ? 8 : 7;
        if (this.def.roadSurface !== 'makadam') return 0;
        const p = this.inRain && this.pudAt ? this.pudAt[q.a] : -1;
        if (p >= 0) { const u = this.puddles[p], a = (q.s - u[0]) / u[2], b = (d - u[1]) / u[3]; if (a * a + b * b < 1) return 6; }
        return 5;
      }
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
  // open-wheel formula car (every track): light, 1000 KM, high revs. Its wings press it onto the road harder the faster it goes (aero:
  // the downforce of the aero upgrade, on top of it); carbon brakes (brakeK) and more traction (tracK) than the road cars; slicks: little
  // grip on grass, gravel and makadam (loose). A wing knocked off costs downforce until the pit repair (applyDamage). engHz: its engine
  // note is that much higher (Sfx). spinK: only that share of the drive beyond the tyres' grip spins them (its 1000 KM would light them
  // up to 180 km/h: smoke and black lines down every straight). oneMake: a race with it is a formula race, every rival drives one too
  // (Race); aiGap / aiPass / aiEdge: the AI in it follows further back, passes wider and keeps further from the road's edge (a longer,
  // wider, much faster car).
  MODELS.push({ id: 'formula', name: 'FORMULA ORKAN', drive: 'MR', desc: 'Dirkalnik formule z odprtimi kolesi in krili',
    mass: 798, a: 1.8, b: 1.7, hcg: 0.3, kI: 1.3, kw: 735, redline: 12000, idle: 4200,
    gears: [4.3, 3.55, 2.95, 2.48, 2.1, 1.78, 1.5, 1.25], final: 4.2, rw: 0.36,
    gripF: 1.22, gripR: 1.28, cDrag: 0.95, down: 1.2, brake: 16, steerMax: 0.46,
    driftLoss: 0.2, len: 5.2, wid: 1.96, body: 'formula', aero: 0.00014, brakeK: 1.3, tracK: 1.4, loose: 0.7, engHz: 1.6, spinK: 0.08, oneMake: true, aiGap: 5, aiPass: 3.8, aiEdge: 1.6,
    stats: { power: 10, grip: 10, weight: 10, drift: 2 } });
  // Le Mans prototype (closed cockpit, every track): long, low and wide, a big rear wing. Like the formula it races its own class (oneMake:
  // every rival in one too) on wings (aero), carbon brakes and slicks, with less downforce but far less drag: quicker down the straights,
  // slower through the fast bends. Its front splitter and rear wing are the parts that take the downforce with them when knocked off
  MODELS.push({ id: 'lm', name: 'TAIFUN LM', drive: 'MR', desc: 'Prototip za vzdržljivostne dirke z zaprto kabino',
    mass: 960, a: 1.55, b: 1.45, hcg: 0.34, kI: 1.3, kw: 560, redline: 9500, idle: 2200,
    gears: [3.3, 2.5, 2.0, 1.66, 1.42, 1.24, 1.1], final: 3.9, rw: 0.36,
    gripF: 1.18, gripR: 1.24, cDrag: 0.52, down: 1.0, brake: 15, steerMax: 0.5,
    driftLoss: 0.22, len: 4.95, wid: 2.0, body: 'lm', aero: 0.00012, brakeK: 1.22, tracK: 1.3, loose: 0.66, engHz: 1.3, spinK: 0.12, oneMake: true, aiGap: 5, aiPass: 3.9, aiEdge: 1.6,
    stats: { power: 10, grip: 10, weight: 9, drift: 3 } });
  // 1970 fastback muscle car: a big V8 (engHz lower, snd 'v8': the burble), heavy and long, the least grip of the road cars. spinK > 1:
  // its wheelspin shows (and swings the tail: the power rotation) to a higher speed than the others': the drift car of the lot
  MODELS.push({ id: 'muscle', name: 'VIHAR V8', drive: 'FR', desc: 'Ameriški muscle car z velikim V8',
    mass: 1540, a: 1.30, b: 1.33, hcg: 0.52, kI: 1.3, kw: 380, redline: 6400, idle: 750,
    gears: [2.78, 1.93, 1.36, 1.0, 0.84], final: 3.7, rw: 0.34,
    gripF: 0.96, gripR: 1.02, cDrag: 0.41, down: 0.12, brake: 10.8, steerMax: 0.6,
    driftLoss: 0.34, len: 4.72, wid: 1.88, body: 'muscle', engHz: 0.78, snd: 'v8', spinK: 1.35, chrome: true,
    stats: { power: 9, grip: 5, weight: 3, drift: 10 } });
  // electric hypercar: a motor at every wheel (AWD), one gear, a heavy battery down in the floor. Instant torque with traction control:
  // the best launch of the road cars (tracK) and hardly any wheelspin (spinK); ev: no engine note but the motors' whine (Sfx), no revving
  // on the grid, D on the gear display
  MODELS.push({ id: 'ev', name: 'STRELA EV', drive: 'AWD', desc: 'Električni hiperšportnik s štirimi motorji',
    mass: 1720, a: 1.42, b: 1.38, hcg: 0.4, kI: 1.28, kw: 440, redline: 16000, idle: 0,
    gears: [1.0], final: 7.4, rw: 0.35,
    gripF: 1.06, gripR: 1.12, cDrag: 0.36, down: 0.3, brake: 12.6, steerMax: 0.6,
    driftLoss: 0.3, len: 4.62, wid: 2.0, body: 'ev', ev: true, tracK: 1.14, spinK: 0.35, loose: 0.92,
    stats: { power: 10, grip: 9, weight: 3, drift: 4 } });
  // off-road trophy truck: long-travel suspension and big knobbly tyres, four-wheel drive. Slow on tarmac (little grip, a brick in the wind),
  // at home off it: more grip on makadam, grass and gravel than the road cars have there (loose > 1), the loose ground holds it back far less
  // (looseDrag), and it lands jumps softly (landV: damage only from a harder landing, landK: less speed lost). sway: its body rolls more
  MODELS.push({ id: 'truck', name: 'SAMUM 4x4', drive: 'AWD', desc: 'Terenski dirkalni tovornjak za makadam in puščavo',
    mass: 1850, a: 1.6, b: 1.5, hcg: 0.72, kI: 1.3, kw: 420, redline: 6200, idle: 800,
    gears: [3.1, 2.1, 1.55, 1.22, 1.0, 0.86], final: 5.6, rw: 0.46,
    gripF: 0.94, gripR: 1.0, cDrag: 0.62, down: 0.1, brake: 10.5, steerMax: 0.62,
    driftLoss: 0.36, len: 5.2, wid: 2.15, body: 'truck', loose: 1.25, looseDrag: 0.35, landV: 17, landK: 0.4, engHz: 0.72, snd: 'v8', sway: 1.8,
    stats: { power: 8, grip: 4, weight: 1, drift: 8 } });
  const tqShape = (u) => Math.max(0.3, 1 - 0.85 * (u - 0.7) * (u - 0.7)); // flat, strong mid-range (SWGP2 pulls hard to ~130 km/h)
  for (const M of MODELS) {
    const wr = M.redline * TAU / 60;
    M.Tmax = M.kw * 1000 / (wr * tqShape(1.0));
  }
  // vehicle categories (CATS, in display order: car screen, garage, championship, online; within one: career price, then id). The 11
  // vehicles above get theirs here; every registered vehicle (js/cars/<id>.js, see registerVehicles) names its own
  const CATS = [
    { id: 'mali', name: 'Mali avti' }, { id: 'sportni', name: 'Športni' }, { id: 'super', name: 'Superšportni' }, { id: 'klasika', name: 'Klasika' },
    { id: 'reli', name: 'Reli' }, { id: 'teren', name: 'Terenski' }, { id: 'dirkalni', name: 'Dirkalni' }, { id: 'tovornjaki', name: 'Tovornjaki' },
    { id: 'elektricni', name: 'Električni' }, { id: 'posebni', name: 'Posebni' },
  ];
  { const C0 = { pico: 'mali', p206: 'mali', kaze: 'sportni', vortex: 'sportni', strega: 'super', rally: 'reli', formula: 'dirkalni', lm: 'dirkalni', muscle: 'klasika', ev: 'elektricni', truck: 'teren' };
    for (const M of MODELS) M.cat = C0[M.id]; }   // (not a Car field: the golden digests never see a model's own keys)
  // the engine sound presets a vehicle may name (def.snd.kind; Sfx implements every one): straight 2-6, flat 4 / 6, rotary, V8 (cross-plane),
  // v8fp flat-plane, v8hi 1960s high-revving, v8s supercharged methanol (blower whine), V10, V12, i8s 1930s supercharged straight-8, diesel,
  // kart2t two-stroke kart, hybrid (V8 + motor whine), ev (motors only)
  const SND_KINDS = ['i2', 'i3', 'i4', 'i5', 'i6', 'flat4', 'flat6', 'rotary', 'v8', 'v8fp', 'v8hi', 'v8s', 'v10', 'v12', 'i8s', 'diesel', 'kart2t', 'hybrid', 'ev'];

  // assist presets
  const ASSISTS = [
    { cs: 0.35, spin: 1.1, tc: 1.6, yawD: 0.0, tcSlip: 0, tcGain: 0, bmax: 1.5, align: 3.2, bmul: 1.25, K: 4.5 },        // nizka
    { cs: 0.6, spin: 0.66, tc: 0.97, yawD: 0.25, tcSlip: 0.13, tcGain: 3.2, bmax: 1.3, align: 4.8, bmul: 1.0, K: 6 },  // srednja
    { cs: 0.8, spin: 0.55, tc: 0.86, yawD: 0.5, tcSlip: 0.09, tcGain: 4.5, bmax: 1.05, align: 6.0, bmul: 0.8, K: 7.5 },   // visoka
  ];

  const FLAT = { tr: 0.6, c0: 2.6, c1: 0.03 };   // a flat tyre (Car.flat, bit k: wheel k; the police's spike strips): its share of the grip, the drag of the rim on the road
  // a wheel knocked off (a kit vehicle, Car.wreck.wl bit k): like a flat tyre, a little worse (the hub on the road), through the same
  // per-wheel share and drag; any two gone still leave every vehicle >= 40 km/h on flat asphalt (fleet.test), so it limps to the pits
  const LOSTW = { tr: 0.55, c0: 2.0, c1: 0.03 };
  const LOOSE = [0, 0, 1, 1, 0, 1];     // grass, gravel, makadam: where a car on slicks (model.loose) has only that share of its grip
  // rain: the grip left on a wet track (x every surface's grip: cornering and traction; the brakes keep 0.55 + 0.45 x of theirs).
  // Less grip also means bigger, lazier slides (as on the loose surfaces)
  const WET = 0.8;
  // tyres (Race opts tyres): slicks and rain tyres, their grip on a road with water w (0 dry .. 1 wet): slicks lose most of theirs in the wet,
  // rain tyres have less on a dry road (and wear fast there); the right ones give the old grip (1 dry, WET in the rain). Worn out: 10 % less
  const TYRE_GRIP = { dry: (w) => 1 - 0.38 * w, wet: (w) => 0.9 - (0.9 - WET) * w };
  const tyreFor = (w) => w > 0.3 ? 'wet' : 'dry';   // the tyres to fit for a road with this much water
  // compounds of the slicks (Race opts compounds): g x their grip, wr x their wear, loss: the grip lost when worn out (the medium is the
  // slick above; the soft quicker and short-lived, the hard slower and lasting); col: the band on a formula's sidewalls (the renderer)
  const TYRE_CMP = { S: { g: 1.035, wr: 2.2, loss: 0.22, col: 0xe03027 }, M: { g: 1, wr: 1, loss: 0.1, col: 0xf2c616 }, H: { g: 0.97, wr: 0.55, loss: 0.07, col: 0xeeeeee } };
  const cmpFor = (left) => left < 8000 ? 'S' : left < 16000 ? 'M' : 'H';   // the slicks for so much racing (m) still to do
  const cmpAI = (D, g) => D < 8000 ? (g % 4 === 3 ? 'M' : 'S') : D < 16000 ? 'SMMH'[g % 4] : (g % 3 ? 'M' : 'H');   // an AI car's at the start: by the race's length, a mix over the grid
  const tyreK = (ty) => ty.k === 'dry' && ty.c ? TYRE_CMP[ty.c] : null;   // (a slick's compound, if the race has them)
  // every car's grip and turn (first measured from SWGP2 gameplay video for the old slide model; stepCS builds on amax, kv and rmin):
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
    formula: { amax: 1.98, kv: 3.3, bscale: 0.78, rmin: 5.0 },   // slicks: grip, the travel follows the nose quickly (small slides); a wide turning circle
    lm: { amax: 1.94, kv: 3.0, bscale: 0.82, rmin: 5.2 },        // the prototype: nearly the formula's grip and bite, a longer car
    muscle: { amax: 1.63, kv: 1.9, bscale: 1.2, rmin: 4.6 },     // heavy on narrow period tyres: the least grip, big lazy slides
    ev: { amax: 1.86, kv: 2.15, bscale: 0.86, rmin: 4.4 },       // wide tyres, the battery low down: the most grip of the road cars
    truck: { amax: 1.58, kv: 1.85, bscale: 1.15, rmin: 5.0 },    // knobbly tyres on tarmac: little grip, wide slides, a wide turning circle
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
  const SETUP_AEROK = [-0.00003, 0, 0.00007], SETUP_DRAG = [0.93, 1, 1.08], SETUP_FINAL = [1.12, 1, 0.9];   // the track set-up: wing (low / standard / high), gears (short / standard / long)
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
    engBrk: 0.5,       // engine braking when lifting (m/s^2): lifting costs little (B1f)
    brkUp: 10, brkDn: 12,      // brake force ramp (1/s): full in 0.10 s, off in 0.08 s (A6, C6)
    stOff: 0.14, stA: 0.06,    // steer shaping: digital back to centre in 0.14 s; analogue lag 0.06 s (C1)
    wallE: 0.05, wallMu: 0.25, wallYaw: 0.3,   // walls: restitution, scrape friction, share of the lever-arm yaw (B9)
    carE: 0.1,         // car contacts: restitution (B10a); the angular impulse becomes the attitude kick above
    aiLatA: 18.5, aiBrakeA: 12.5, aiWmax: 1.2, aiAssist: 2, aiBx: 0.45, aiKw: 0.3, aiSkCap: 1.06,   // AI (B11, §5.5)
  };
  // per-wheel surfaces (stepCS): lat side grip, tr drive and brake grip, c0 (const decel m/s2), c1 (decel per m/s)
  const CSSURF = [   // lat: side grip share, tr: traction / brake share, c0 (m/s^2) + c1 (1/s) x speed: rolling drag
    { lat: 1.0, tr: 1.0, c0: 0, c1: 0 },            // asphalt
    { lat: 1.0, tr: 0.95, c0: 0.1, c1: 0.004 },     // kerb: grip = asphalt, cosmetic (B8d)
    { lat: 0.66, tr: 0.85, c0: 1.5, c1: 0.15 },     // grass: 2 wheels ~ -0.3 g of drive at 95 km/h (B8a), 2/3 of the side grip left
    { lat: 0.58, tr: 0.85, c0: 1.0, c1: 0.05 },     // gravel / sand: whole car ~ -0.4 g of drive (drive about halved, A32/B8a), side grip 0.58
    { lat: 0.88, tr: 0.86, c0: 0.35, c1: 0.03 },    // paving (street circuits)
    { lat: 0.8, tr: 0.82, c0: 0.6, c1: 0.05 },      // makadam: side grip 0.8, tau_v +16 % (C11); drive and drag as the old slide model's (gora's pace unchanged)
    { lat: 0.7, tr: 0.72, c0: 2.6, c1: 0.12 },      // a puddle (in the rain, on top of WET): the water drags at the wheel (one side in it: a tug towards it)
    { lat: 0.9, tr: 0.9, c0: 0.12, c1: 0.008 },     // cobbles (granite setts): a little less grip than asphalt, a little drag from the bumps
    { lat: 0.78, tr: 0.8, c0: 0.12, c1: 0.008 },    // cobbles in the rain (on top of WET)
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
    formula: { bx: 0.09, coast: -0.03, thr: -0.01, liftP: 0.08, pwr: 0.05, out: 0.85, turn: 1.25, w: 0.96, tv: 0.5 },   // on rails: sharp turn-in,
             // a smaller drift attitude for the same turn (tv: tau_v factor) that settles quickly; a little slower in the hairpins
    lm:     { bx: 0.1, coast: -0.035, thr: -0.012, liftP: 0.1, pwr: 0.06, out: 0.9, turn: 1.18, w: 0.96, tv: 0.62 },   // the prototype: nearly as tidy
    muscle: { bx: 0.15, coast: -0.035, thr: 0, liftP: 0.16, pwr: 0.14, out: 1.4, turn: 0.92, w: 0.97, tv: 1.12 },      // FR, lots of power: big slides,
             // swung wide by the throttle and lazy to straighten; a heavy nose, slower to turn in
    ev:     { bx: 0.11, coast: -0.08, thr: -0.02, liftP: 0, pwr: 0.02, out: 0.9, turn: 1.05, w: 1.0 },            // AWD with torque vectoring: steady, sharp
    truck:  { bx: 0.14, coast: -0.066, thr: -0.01, liftP: 0.04, pwr: 0.05, out: 1.15, turn: 0.85, w: 0.95, tv: 1.15 },   // tall and soft: a slow turn-in,
             // wide slides that take their time to settle
  };
  // cs assists (index = ASSISTS level). visoka (2, the default) = the measured CS car; lower levels = more slide, lazier recovery
  // lock: full steer as a share of the path-rate cap (>1: can overdrive the grip), bx / layer / kick: pedal, drive-type and
  // surface-kick multipliers, out: unwind factor, hard: hard attitude limit (rad), stOn: digital steer ramp to full (s)
  const CSASSIST = [
    { lock: 1.06, bx: 1.25, layer: 1.4, kick: 1.3, out: 1.12, hard: 1.0, stOn: 0.30 },    // nizka
    { lock: 1.02, bx: 1.12, layer: 1.2, kick: 1.15, out: 1.05, hard: 0.87, stOn: 0.33 },  // srednja
    { lock: 1.0, bx: 1.0, layer: 1.0, kick: 1.0, out: 1.0, hard: 0.8, stOn: 0.36 },       // visoka
  ];
  const PWR_MULT = 1.75, SW_DRAG = 0.0013; // power boost and drag (fit to SWGP2 acceleration curves)
  const DRS_DRAG = 0.8;   // the air drag with the rear wing's flap open (Car.drs, set by Race._drs)
  const JUMP_G = 14; // vertical gravity for jumps on hilly tracks (snappy, a bit above real g)
  const _bk = { dy: 0, sl: 0 };   // (Track.bankAt output)

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
      // the set-up for the track (opts.setup: wing and gears 0 / 1 / 2, 1 the standard one): less wing = less drag but less grip at speed,
      // more wing the other way round; short gears pull harder and top out lower, long ones the other way round
      const SU = opts.setup, sw = SU ? clamp(Math.round(+SU.wing) || 0, 0, 2) : 1, sg = SU ? clamp(Math.round(+SU.gear) || 0, 0, 2) : 1;
      if (SU && (sw !== 1 || sg !== 1)) model = Object.assign({}, model, { cDrag: model.cDrag * SETUP_DRAG[sw], final: model.final * SETUP_FINAL[sg] });
      this.setup = { wing: SU ? sw : 1, gear: SU ? sg : 1 };
      const arc0 = ARC[model.id] || ARC.kaze;
      this.arc = U ? Object.assign({}, arc0, { amax: arc0.amax * U.grip, kv: arc0.kv * U.kv }) : arc0;   // per-car grip and turn (ARC)
      this.tracG = U ? TRAC_G * U.trac : TRAC_G; this.brakeG = U ? BRAKE_G * U.brake : BRAKE_G; this.aeroK = (U ? U.aeroK : 0) + (SU ? SETUP_AEROK[sw] : 0);
      if (model.tracK) this.tracG *= model.tracK; if (model.brakeK) this.brakeG *= model.brakeK;   // (the formula, the prototype, the electric car's launch)
      if (model.aero) { this.aeroK += model.aero; this.aeroK0 = this.aeroK; }   // the formula, the prototype (aeroK0: with both wings)
      this.upg = U ? { motor: upgLv(opts.upg, 'motor'), gume: upgLv(opts.upg, 'gume'), zavore: upgLv(opts.upg, 'zavore'), aero: upgLv(opts.upg, 'aero') } : null;
      this.upgGrip = U ? U.grip : 0;   // autopilot / AI corner-speed scale (0 = stock car)
      this.m = model;
      this.id = opts.id || 0;
      this.isPlayer = !!opts.isPlayer;
      if (opts.net) this.net = true;   // a friend's car in an online race: its own phone drives it, this one only shows it (Race.step leaves it alone)
      this.phys = 'cs';   // Circuit Superstars kinematic drift (stepCS; the old 'rally' and 'arcade' physics were removed)
      this.name = opts.name || model.name;
      this.color = opts.color;
      this.assist = ASSISTS[opts.assist == null ? 1 : opts.assist];
      this.x = 0; this.z = 0; this.h = 0; this.vx = 0; this.vz = 0; this.w = 0;
      this.px = 0; this.pz = 0; this.ph = 0; // previous (for interpolation)
      this.y = 0; this.py = 0; this.vy = 0; this.air = 0; this.airT = 0; this.landT = 0; this.impactVY = 0;
      this.roadY = 0; this.gradeNow = 0; this.curvNow = 0;
      this.dmg = 0; this.dz = [0, 0, 0, 0]; this.dents = []; this.dmgMode = 2;
      this.wet = 1;   // grip left in the rain (Race.setRain): 1 dry
      this.inPit = false; this.pitState = null; this.pitT = 0; this.pitDur = 0; this.pitDone = false; this.repairN = 0;   // pit lane: in it, stopping / repairing at the box
      this.cd = [0, 0, 0, 0]; this.lightOut = [0, 0, 0, 0]; this.lost = {}; this.detach = []; this.hitDebris = 0;
      this.winOut = [0, 0, 0, 0]; this.roofDmg = 0;   // broken windows (windscreen, rear, left, right); roof crumple 0..1   // corners FL/FR/RL/RR, broken lights, lost parts   // damage 0..1; zones front/rear/left/right; 0 off, 1 visual, 2 visual+handling
      this.inSteer = 0; this.inThr = 0; this.inBrk = 0; this.inHand = 0;
      this.steer = 0; this.delta = 0; this.drift = 0;
      this.wPath = 0; this.vAngP = null; this.csS = 0; this.csWd = 0; this.csB = 0; this.csBx = 0; this.csCo = 0; this.csLt = 0; this.csLp = 0; this.csThrP = 0; this.csK = 0; this.csKc = 0; this.csKs = null; this.csAn = 0; this.csAT = 0; this.csWcap = 1;
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
      // a registered vehicle (model.kit): its contact circles end at its bumpers, n of them evenly spaced (no more than 0.9 rad apart, so
      // the waist between two is >= 0.8 rad; model.circ: a count of its own)
      if (b.kit) {
        const r = this.rad, sp = Math.max(0, b.len - 2 * r), n = b.circ || Math.max(3, Math.ceil(sp / (0.9 * r)) + 1);
        this.circles = []; for (let i = 0; i < n; i++) this.circles.push(-sp / 2 + sp * i / (n - 1));
      }
      // a vehicle that breaks apart (kitParts: a part table with wheels, every registered one; one of the 11 once a patch def gives it one):
      // its destruction state, nested (golden digests hash only plain fields): wl lost wheels (bit k = wheel k), nL their count, fix a
      // counter bumped by every marshals' refit of lost wheels (a partial repair: the renderer and the commentator drop their lost-wheel
      // latches when it changes; a full repair bumps repairN), seq the wreck's parts still to shed (st: s to the next one, at: the race
      // time it began), dnf retired (dnfT when, side: the run-off it pulls onto, stop: standing there, cr: s spent short of it, crawling or
      // knocked back onto the asphalt: the marshals move it after 8; fin: [x, z] where the marshals left it for want of a better spot, null
      // otherwise), hold: s left waiting for the marshals to refit its wheels, lt: s since a wheel came off
      if (kitParts(b)) this.wreck = wreck0({});
    }

    get speed() { return Math.hypot(this.vx, this.vz); }

    place(x, z, h) {
      this.x = this.px = x; this.z = this.pz = z; this.h = this.ph = h;
      this.y = this.py = 0; this.vy = 0; this.air = 0; this.airT = 0; this.landT = 0;
      this.vx = this.vz = this.w = 0; this.gear = 1; this.rpm = this.m.idle; this.q.i = -1;
      this.wPath = 0; this.vAngP = null; this.csS = 0; this.csWd = 0; this.csB = 0; this.csBx = 0; this.csCo = 0; this.csLt = 0; this.csLp = 0; this.csThrP = 0; this.csK = 0; this.csKc = 0; this.csKs = null; this.csAn = 0; this.csAT = 0; this.csWcap = 1;
      for (const q of this.wq) q.i = -1;
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
      // ---- per-wheel surfaces (CSSURF): traction of the driven wheels, side grip per axle, drag per side (edge kick) ----
      const tw = this.tw, wpos = [[a, -tw], [a, tw], [-b, -tw], [-b, tw]];
      const ldK = K.kLt * Math.min(1, Math.abs(this.csAn) / Math.max(1, K.aL * P.amax * G)), sgO = Math.sign(this.wPath);   // outer wheels carry more of the side load
      let muSum = 0, muF = 0, muR = 0, curb = 0, dragC0 = 0, dragC1 = 0, latF = 0, latB = 0, latFw = 0, latBw = 0, dragP = 0, dragN = 0;
      for (let k = 0; k < 4; k++) {
        const wx = this.x + wpos[k][0] * ch - wpos[k][1] * sh, wz = this.z + wpos[k][0] * sh + wpos[k][1] * ch;
        const q = trk.query(wx, wz, this.wq[k].i >= 0 ? this.wq[k].i : this.q.i, this.wq[k]);
        const sf = trk.surface(q), off = LOOSE[sf] && !(this.inPit && M.loose > 1), fl = this.flat & (1 << k), wl = this.wreck ? this.wreck.wl & (1 << k) : 0; this.ws[k] = sf;
        const S = CSSURF[sf], lk = (M.loose && off ? M.loose : 1) * (wl ? LOSTW.tr : fl ? FLAT.tr : 1), tr = S.tr * lk, lt = S.lat * lk;   // (slicks on loose ground; a flat tyre; a wheel knocked off: the hub)
        muSum += tr; if (k < 2) muF += tr * 0.5; else muR += tr * 0.5; if (sf === 1) curb++;
        const ld = M.looseDrag && off ? M.looseDrag : 1;   // (the truck: the loose ground holds it back less. Its pit lane is paved, not loose ground: there it is as every car)
        const c0 = wl ? S.c0 * ld + LOSTW.c0 : fl ? S.c0 * ld + FLAT.c0 : S.c0 * ld, c1 = wl ? S.c1 * ld + LOSTW.c1 : fl ? S.c1 * ld + FLAT.c1 : S.c1 * ld;   // (a flat tyre's drag: the tyre's, not the ground's)
        const dk = (c0 * Math.min(1, spd / 3) + c1 * spd) * 0.25, lw = 0.5 * (1 + ldK * sgO * (k & 1 ? -1 : 1));   // (k odd: +lateral side = inner in a + turn)
        dragC0 += c0 * 0.25; dragC1 += c1 * 0.25;
        const ltw = wl ? lt / LOSTW.tr : lt;   // (a wheel knocked off costs grip, but it is no surface edge: no edge kick from it)
        if (k < 2) { latF += lt * 0.5; latFw += ltw * lw; } else { latB += lt * 0.5; latBw += ltw * lw; }
        if (k & 1) dragP += dk; else dragN += dk;
      }
      this.onCurb = curb;
      const wg = this.wet, muSurf = muSum / 4 * wg, muLat = (latF + latB) * 0.5 * wg;   // (rain: less grip)
      const muDrv = M.drive === 'FF' ? muF * wg : M.drive === 'AWD' ? muSurf : muR * wg;   // one rear wheel on the grass costs a RWD car traction
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
      if (M.vLim && this.gear > 0) thr *= clamp((M.vLim / 3.6 - vl) / 0.6, 0, 1);   // a speed limiter (model.vLim, km/h: the racing truck's 160): the throttle fades over the last 0.6 m/s
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
        this.rpmTarget = M.ev ? wr2 : Math.max(wr2, M.idle + (M.redline * 0.62 - M.idle) * thr);   // (an electric motor turns with the wheels only)
        const Kp = PWR_MULT * M.kw * 1000 * 0.88 / m * (1 - 0.22 * (this.dmgMode === 2 ? this.dmg : 0));
        let Fsw = m * Kp / Math.max(Math.abs(vl), 4) * thr;
        if (this.shiftT > 0) Fsw *= 0.7;
        Fsw -= (1 - thr) * m * K.engBrk * sstep(2, 20, vl);
        F = Fsw;
      } else {
        const gr = 3.3 * M.final;
        const wr = Math.max(0, -vl) / M.rw * gr * 9.5493;
        this.rpmTarget = M.ev ? wr : Math.max(wr, M.idle + 2500 * thr);
        F = -M.Tmax * 0.8 * gr * eff / M.rw * thr * (vl < -8 ? 0 : 1);
      }
      if (this.shiftT > 0) this.shiftT -= dt;
      if (this.locked) this.rpmTarget = M.ev ? 0 : M.idle + (M.redline * 0.88 - M.idle) * this.inThr;   // (on the grid: revving, but not an electric motor)
      if (!grounded) F = 0;
      const share = M.drive === 'AWD' ? 0.68 : M.drive === 'FF' ? 0.6 : M.drive === 'RR' ? 0.62 : 0.55;   // (RR: the engine over the driven wheels)
      const Fdmax = this.tracG * G * m * share * muDrv * (0.42 + 0.58 * sstep(0.5, 9, Math.abs(vl))) * (M.aero ? 1 + this.aeroK * spd * spd : 1);   // (the formula's wings press the driven wheels down too)
      let spin = 0;
      if (Math.abs(F) > Fdmax) { spin = Math.abs(F) / Fdmax - 1; F = Math.sign(F) * Fdmax; }
      this.spin = thr > 0.2 && grounded ? spin * (M.spinK || 1) : 0;
      // ---- brakes: a quick ramp, capped below the grip (they never lock), along the travel ----
      this.csB += clamp(brk - this.csB, -K.brkDn * dt, K.brkUp * dt);
      const bF = this.csB;
      const fb = spd > 0.05 && grounded ? Math.min((bF * K.brk * this.brakeG + hb * K.hbBrk) * G * m * (0.55 + 0.45 * muSurf), spd * m / dt) : 0;
      this.lock = grounded && hb > 0.5 && spd > 4 ? 1 : 0;
      // ---- the demand: a path rate, and the drift attitude that goes with it ----
      const v = Math.max(spd, 0.5);
      const gA = this.aeroK ? 1 + this.aeroK * spd * spd : 1, dmgG = 1 - K.dmgGrip * (this.dmgMode === 2 ? this.dmg : 0);
      const aL = K.aL * P.amax * G * muLat * gA * dmgG;                                             // flat lateral limit (m/s^2)
      const tv = clamp(K.tv0 * Math.pow(v / 27.78, K.tvE), K.tvLo, K.tvHi) * (1 + K.tvLoose * (1 - Math.min(1, muLat))) * (CP.tv || 1);   // (CP.tv: the formula's tidier slides)
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
      let wN = lo * rho * (att - (1 - K.kickPath * (CP.tv || 1)) * (this.csK + this.csKc)) / tv + (1 - lo) * wD;   // (CP.tv: the same path swing from a kick as the road cars)
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
      if (!fwd) rT = (vl < -0.5 ? -stIn : 0) * Math.min(Math.abs(vl) / P.rmin, 1.6);   // reversing: kinematic
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
          if (this.y <= this.roadY) { const lv = M.landV || 11, lk = M.landK || 1;   // (the truck: a harder landing before it breaks, less speed lost)
            this.impactVY = this.vy; if (this.vy < -lv) applyDamage(this, (-this.vy - lv) * 0.01); this.y = this.roadY; this.vy = 0; this.air = 0; this.landT = clamp(-this.impactVY * 0.02 + 0.05, 0.05, 0.2); this.airT = 0; const sc = clamp(-this.impactVY * 0.016 * lk, 0, 0.13 * lk); this.vx *= (1 - sc); this.vz *= (1 - sc); }
        } else { this.y = this.roadY; this.vy = this.gradeNow * vl; if (this.landT > 0) this.landT -= dt; }
      } else { this.y = 0; }
      this.axF += (((Fx - Fgrav) / m) - this.axF) * Math.min(1, dt * 7);
      if (spd < 0.08 && thr < 0.05 && Math.abs(F) < 1) { this.vx *= 0.8; this.vz *= 0.8; this.w *= 0.8; }
      this.vl = vl; this.vt = vt;
      this.drift = sstep(0.1, 0.45, ab);
      // effects (the renderer's skid marks, the squeal): marks in real drifts (> 7 deg), not in every bend
      this.latR = spd * Math.sin(fwd && grounded ? Math.min(1.2, Math.max(0, ab - 0.12)) : 0) * 0.5 + (this.lock ? 2.5 : 0);
      this.slipR = Math.atan2(this.latR, Math.abs(vl) + 0.6);
      this.slipF = Math.min(0.25, ab * 0.3);
      this.delta = vl >= -0.3 ? clamp(0.1 * s + 0.5 * (aT - att), -0.26, 0.26) : clamp(-0.35 * stIn, -M.steerMax, M.steerMax);   // small, into the turn (C2)
      const rt = this.rpmTarget + (this.spin > 0.05 ? Math.min(2500, this.spin * 5000) : 0) + (this.drift > 0.3 && thr > 0.5 ? 500 * this.drift : 0);
      this.rpm += (Math.min(M.redline * 1.02, rt) - this.rpm) * Math.min(1, dt * 14);
    }

    step(dt, trk) { return this.stepCS(dt, trk); }
  }
  // a breakable vehicle's destruction state as new (Car.wreck; repairCar: all but the retirement and the refit counter)
  const wreck0 = (W) => Object.assign(W, { wl: 0, nL: 0, fix: W.fix || 0, seq: null, st: 0, at: null, hold: 0, lt: 0, dnf: !!W.dnf, dnfT: W.dnfT != null ? W.dnfT : null, side: W.side || 0,
    stop: !!W.stop, cr: W.cr || 0, fin: W.fin || null });
  const dnf = (c) => !!(c.wreck && c.wreck.dnf);   // out of the race (Odstop, see Race.retire)
  // a model whose part table has wheels (model.parts: every registered vehicle's; one of the 11 only once a patch def gives it a table):
  // its wheels come off and it drives on the hub, a wreck sheds what still hangs on, an AI one retires (the 11 without one: as always)
  const kitParts = (M) => !!(M && M.parts && M.parts.wheelFL);

  /* ---------------------------------------------------------------------
     COLLISIONS
     --------------------------------------------------------------------- */
  const _q = {};
  // Damage: overall 0..1 plus zones (0 front, 1 rear, 2 left = -z, 3 right = +z). lx/lz = local impact point
  // (x forward, z to the right); without a point the hit is spread over the whole car (hard landing).
  function applyDamage(c, amt, lx, lz) {
    if (!c.dmgMode || !(amt > 0)) return;
    if (c.dmgK) amt *= c.dmgK;   // (the run from the police: the patrol cars' reinforced bumpers, the player's car a little tougher)
    if (c.m.dmgK) amt *= c.m.dmgK;   // (a vehicle's own toughness, model.dmgK: a truck's frame, a kart's tubes)
    c.dmg = Math.min(1, c.dmg + amt);
    if (lx == null) { for (let k = 0; k < 4; k++) c.dz[k] = Math.min(1, c.dz[k] + amt * 0.6); c.roofDmg = Math.max(c.roofDmg, clamp((c.dmg - 0.4) / 0.55, 0, 1)); if (c.wreck) wreckCheck(c); return; }
    const M = c.m, hl = M.len * 0.5, hw = M.wid * 0.5;
    const zone = Math.abs(lx) / hl >= Math.abs(lz) / hw ? (lx >= 0 ? 0 : 1) : (lz < 0 ? 2 : 3);
    c.dz[zone] = Math.min(1, c.dz[zone] + amt * 1.7);
    if (c.dents.length < 24) c.dents.push({ lx, lz, amt });
    // corner damage (FL, FR, RL, RR): a solid hit on a corner breaks that corner's light (a breakable vehicle, kitParts: the reach of a
    // hit grows with its length, so the wheels of a long one, far in from its corners, still feel it)
    const kx = [hl, hl, -hl, -hl], kz = [-hw, hw, -hw, hw], fo = kitParts(M) ? 1.6 * clamp(M.len / 4.4, 1, 1.5) : 1.6;
    for (let k = 0; k < 4; k++) { const wg = Math.max(0, 1 - Math.hypot(lx - kx[k], lz - kz[k]) / fo); c.cd[k] = Math.min(1, c.cd[k] + amt * wg * 1.8); if (c.cd[k] >= 0.16) c.lightOut[k] = 1; }
    // windows shatter when their side of the car is badly hit (all of them in a total wreck); the roof sags as the car gets battered
    const WIN = [0.55, 0.55, 0.42, 0.42];
    for (let k = 0; k < 4; k++) if (!c.winOut[k] && (c.dz[k] >= WIN[k] || c.dmg >= 0.92)) c.winOut[k] = 1;
    c.roofDmg = Math.max(c.roofDmg, clamp((c.dmg - 0.4) / 0.55, 0, 1));
    // body parts come off once their area is damaged enough (a corner part also from its corner); a wheel (a part table with wheels,
    // kitParts) only in a heavy crash with damage on (dmgMode 2): its corner crushed (cd >= 0.7) and the car three quarters destroyed
    const PT = partsOf(M);
    for (const name in PT) {
      if (c.lost[name]) continue;
      const P = PT[name];
      if (P.wh != null ? c.dmgMode === 2 && c.cd[P.wh] >= 0.7 && c.dmg >= 0.75 : c.dz[P.z] >= P.th || (P.corner != null && c.cd[P.corner] >= (P.cth || 0.55))) detachPart(c, name, P);
    }
    if (c.wreck) wreckCheck(c);
  }
  // a part comes off: lost, onto the race's debris list (Race.step), its share of the downforce with it (P.df; a model with the 8 old
  // parts: the WING table, the formula's wings are its bumper parts), a wheel into the wheel bits (stepCS: the hub on the road)
  function detachPart(c, name, P) {
    P = P || partsOf(c.m)[name];
    c.lost[name] = 1; c.detach.push(name);
    const df = P.df != null ? P.df : c.m.parts ? 0 : WING[name];
    if (c.aeroK0 != null && df) c.aeroK = Math.max(0, c.aeroK - c.m.aero * df);   // the formula: a wing gone, its downforce with it
    if (P.wh != null && c.wreck) { c.wreck.wl |= 1 << P.wh; c.wreck.nL++; c.wreck.lt = 0; }
  }
  // the wreck (breakable vehicles, kitParts; from both of applyDamage's paths): from dmg 0.96 the car sheds what still hangs on, one part every 0.4 s
  // (Race._wreckStep): the bonnet (or its cover), the boot (tailgate), both bumpers and the wing, whatever their zone, the most battered
  // zone's first (ties: in that order), and the wheel at the most damaged corner when that corner is crushed (cd >= 0.4; dmgMode 2)
  const WRECK_SEQ = [['hood', 'cover'], ['trunk', 'tailgate'], ['bumperF'], ['bumperR'], ['wing']];
  function wreckCheck(c) {
    const W = c.wreck;
    if (W.seq || c.dmg < 0.96 || !kitParts(c.m)) return;
    const PT = partsOf(c.m), L = [];
    for (const alt of WRECK_SEQ) { const n = alt.find(a => PT[a]); if (n && !c.lost[n]) L.push(n); }
    if (c.dmgMode === 2) { let k = 0; for (let j = 1; j < 4; j++) if (c.cd[j] > c.cd[k]) k = j; const n = WHEELS[k]; if (c.cd[k] >= 0.4 && PT[n] && !c.lost[n]) L.push(n); }
    const dzOf = (n) => c.dz[PT[n].z];
    W.seq = L.map((n, i) => [n, i]).sort((a, b) => dzOf(b[0]) - dzOf(a[0]) || a[1] - b[1]).map(e => e[0]);
    W.st = 0;
  }
  const WING = { bumperF: 0.5, bumperR: 0.4 };   // (the formula's front and rear wings are its bumper parts: their share of the downforce)
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
  const partsOf = (M) => M.parts || PARTS;   // a model's part table: a registered vehicle's own (model.parts), else the 8 above
  // ---- a registered vehicle's parts (model.parts), expanded from its def's parts = { set, ht, y0, drop, over, extra } ----
  // set: 'car' (bumpers, bonnet, boot, front fenders, rear quarters, doors, mirrors, the four wheels), 'race' (the car's and a rear
  // wing), 'open' (the car's: a roadster, no roof to lose), 'truck' (bumpers, doors, mirrors, wheels: a cab; its other panels are
  // extras), 'none' (the wheels only: karts, open-wheelers, buggies, a monster truck's shell; everything else extras). drop: standard
  // ids taken out of the set; extra: { id: entry } more parts (a standard id: its standard entry, the given keys over it; another id,
  // /^[a-z][A-Za-z0-9]{1,15}$/: every key of an entry); over: { id: keys } changes to any of them. An entry:
  //   z  zone (0 front, 1 rear, 2 left, 3 right), th: off when the zone's damage reaches it; corner / cth: also when that corner's
  //      (FL FR RL RR) damage reaches cth
  //   m  a gameplay mass (<= 14, not kg: how hard a car running over it is knocked, debrisHit), r its radius lying on the road (rW: r =
  //      rW x the vehicle's width), h its thickness
  //   lx / lz where it sits (a fraction of the half length / half width; 'a' / 'b': over the front / rear axle): the debris starts
  //      there, y = y0 + f (ht - y0) up (y0 the sill or ride height, ht the body's height; or y in metres)
  //   df the share of model.aero it takes with it (0 unless set; an aero vehicle's wing .55 and front bumper / splitter .3 by default)
  // The standard entries:
  //   id          z    th    corner cth   m    r         h     lx       lz      f
  //   bumperF     0    .50   -      -     7    .42 wid   .16   1.0      0       .12
  //   bumperR     1    .50   -      -     7    .42 wid   .16   -1.0     0       .12
  //   hood        0    .78   -      -     14   .45 wid   .07   .58      0       .55
  //   trunk       1    .78   -      -     11   .39 wid   .07   -.70     0       .55
  //   fenderL/R   2/3  .60   FL/FR  .55   5    .55       .06   a        -1/+1   .32
  //   quarterL/R  2/3  .62   RL/RR  .58   5    .55       .06   b        -1/+1   .32
  //   doorL/R     2/3  .72   -      -     9    .6        .08   .04      -1/+1   .38
  //   mirrorL/R   2/3  .35   -      -     1    .2        .1    .2       -1.1/+1.1 .62
  //   wing        1    .55   -      -     6    .33 wid   .08   -.92     0       .82
  //   wheelFL..RR 0/1  (wh)  -      -     20 rw (4..14)  rw (radius)  .75 rw (.12-.6)  a / b  -/+.86  y = rw
  // A wheel (wh: its index, 0 FL 1 FR 2 RL 3 RR) comes off only with damage on (dmgMode 2), its corner crushed (cd >= 0.7) and the car
  // three quarters destroyed (dmg >= 0.75), or as the last of a wreck's parts (wreckCheck); then it drives on the hub (LOSTW)
  const PART_STD = {
    bumperF: { z: 0, th: 0.5, m: 7, rW: 0.42, h: 0.16, lx: 1.0, lz: 0, f: 0.12 },
    bumperR: { z: 1, th: 0.5, m: 7, rW: 0.42, h: 0.16, lx: -1.0, lz: 0, f: 0.12 },
    hood: { z: 0, th: 0.78, m: 14, rW: 0.45, h: 0.07, lx: 0.58, lz: 0, f: 0.55 },
    trunk: { z: 1, th: 0.78, m: 11, rW: 0.39, h: 0.07, lx: -0.7, lz: 0, f: 0.55 },
    fenderL: { z: 2, th: 0.6, corner: 0, cth: 0.55, m: 5, r: 0.55, h: 0.06, lx: 'a', lz: -1, f: 0.32 },
    fenderR: { z: 3, th: 0.6, corner: 1, cth: 0.55, m: 5, r: 0.55, h: 0.06, lx: 'a', lz: 1, f: 0.32 },
    quarterL: { z: 2, th: 0.62, corner: 2, cth: 0.58, m: 5, r: 0.55, h: 0.06, lx: 'b', lz: -1, f: 0.32 },
    quarterR: { z: 3, th: 0.62, corner: 3, cth: 0.58, m: 5, r: 0.55, h: 0.06, lx: 'b', lz: 1, f: 0.32 },
    doorL: { z: 2, th: 0.72, m: 9, r: 0.6, h: 0.08, lx: 0.04, lz: -1, f: 0.38 },
    doorR: { z: 3, th: 0.72, m: 9, r: 0.6, h: 0.08, lx: 0.04, lz: 1, f: 0.38 },
    mirrorL: { z: 2, th: 0.35, m: 1, r: 0.2, h: 0.1, lx: 0.2, lz: -1.1, f: 0.62 },
    mirrorR: { z: 3, th: 0.35, m: 1, r: 0.2, h: 0.1, lx: 0.2, lz: 1.1, f: 0.62 },
    wing: { z: 1, th: 0.55, m: 6, rW: 0.33, h: 0.08, lx: -0.92, lz: 0, f: 0.82 },
    wheelFL: { wh: 0 }, wheelFR: { wh: 1 }, wheelRL: { wh: 2 }, wheelRR: { wh: 3 },
  };
  const WHEELS = ['wheelFL', 'wheelFR', 'wheelRL', 'wheelRR'];
  const PART_SETS = { car: ['bumperF', 'bumperR', 'hood', 'trunk', 'fenderL', 'fenderR', 'quarterL', 'quarterR', 'doorL', 'doorR', 'mirrorL', 'mirrorR'], truck: ['bumperF', 'bumperR', 'doorL', 'doorR', 'mirrorL', 'mirrorR'], none: [] };
  PART_SETS.race = PART_SETS.car.concat(['wing']); PART_SETS.open = PART_SETS.car.slice();
  for (const k in PART_SETS) PART_SETS[k] = PART_SETS[k].concat(WHEELS);
  const PART_KEYS = ['z', 'th', 'corner', 'cth', 'm', 'r', 'rW', 'h', 'lx', 'lz', 'f', 'y', 'df'];
  // an entry's problems ('' when fine); full: every key a part needs is there (an extra that is not a standard id)
  function partBad(e, full) {
    if (!e || typeof e !== 'object') return 'not an object';
    for (const k in e) if (PART_KEYS.indexOf(k) < 0) return 'unknown key ' + k; else if (!(Number.isFinite(e[k]) || ((k === 'lx') && (e[k] === 'a' || e[k] === 'b')))) return k + ' not a number';
    const has = (k) => e[k] != null;
    if (full) for (const k of ['z', 'th', 'm', 'h', 'lx', 'lz']) if (!has(k)) return 'missing ' + k;
    if (full && !has('r') && !has('rW')) return 'missing r';
    if (full && !has('f') && !has('y')) return 'missing f (or y)';
    if (has('z') && [0, 1, 2, 3].indexOf(e.z) < 0) return 'z not 0..3';
    if (has('corner') && [0, 1, 2, 3].indexOf(e.corner) < 0) return 'corner not 0..3';
    for (const [k, lo, hi] of [['th', 0.05, 1], ['cth', 0.05, 1], ['m', 0.1, 14], ['r', 0.05, 2], ['rW', 0.02, 0.8], ['h', 0.01, 1.5], ['f', 0, 1.3], ['y', 0, 4], ['df', 0, 1]]) if (has(k) && !(e[k] >= lo && e[k] <= hi)) return k + ' not ' + lo + '..' + hi;
    for (const k of ['lx', 'lz']) if (has(k) && typeof e[k] === 'number' && Math.abs(e[k]) > 1.4) return k + ' beyond 1.4';
    if (full && has('cth') && !has('corner')) return 'cth without a corner';
    return '';
  }
  // the def's part spec -> its entries before they are resolved (id -> keys): the set less drop, the extras (a standard id: its standard
  // entry with the given keys over it), then over; a key given takes the place of its alternative (r / rW, f / y)
  function mergeParts(sp) {
    const raw = {}, put = (e, o) => { if (o.r != null) delete e.rW; if (o.rW != null) delete e.r; if (o.f != null) delete e.y; if (o.y != null) delete e.f; return Object.assign(e, o); };
    for (const id of PART_SETS[sp.set]) if (!(sp.drop || []).includes(id)) raw[id] = Object.assign({}, PART_STD[id]);
    for (const id in sp.extra || {}) raw[id] = put(Object.assign({}, PART_STD[id] || {}), sp.extra[id] === true ? {} : sp.extra[id]);
    for (const id in sp.over || {}) put(raw[id], sp.over[id]);
    return raw;
  }
  // the def's part spec -> the table (name -> { z, th, corner?, cth?, m, r, h, lx, lz, y, df?, wh? }); ph: the vehicle's physics
  function expandParts(sp, ph) {
    const hl = ph.len / 2, out = {}, res = (e) => {
      const o = { z: e.z, th: e.th }; if (e.corner != null) { o.corner = e.corner; o.cth = e.cth || 0.55; }
      o.m = e.m; o.r = e.r != null ? e.r : e.rW * ph.wid; o.h = e.h; o.lx = e.lx === 'a' ? ph.a / hl : e.lx === 'b' ? -ph.b / hl : e.lx; o.lz = e.lz;
      o.y = e.y != null ? e.y : sp.y0 + e.f * (sp.ht - sp.y0); if (e.df != null) o.df = e.df; return o;
    };
    const wheel = (k) => ({ wh: k, z: k < 2 ? 0 : 1, th: 1, m: clamp(Math.round(20 * ph.rw), 4, 14), r: ph.rw, h: clamp(0.75 * ph.rw, 0.12, 0.6), lx: (k < 2 ? ph.a : -ph.b) / hl, lz: k & 1 ? 0.86 : -0.86, y: ph.rw });
    const raw = mergeParts(sp);
    for (const id in raw) { const e = raw[id]; if (e.wh != null) { out[id] = wheel(e.wh); if (e.m != null) out[id].m = e.m; } else out[id] = res(e); }
    if (ph.aero) { if (out.wing && out.wing.df == null) out.wing.df = 0.55; if (out.bumperF && out.bumperF.df == null) out.bumperF.df = 0.3; }
    return out;
  }
  // the problems of a def's part spec ('' when fine)
  function partsBad(sp) {
    if (!sp || typeof sp !== 'object') return 'parts missing';
    for (const k in sp) if (['set', 'ht', 'y0', 'drop', 'over', 'extra'].indexOf(k) < 0) return 'parts: unknown key ' + k;
    if (!PART_SETS[sp.set]) return 'parts.set not one of ' + Object.keys(PART_SETS).join(' ');
    if (!(sp.ht > 0.4 && sp.ht <= 4)) return 'parts.ht not 0.4..4';
    if (!(sp.y0 >= 0 && sp.y0 < sp.ht)) return 'parts.y0 not 0..ht';
    const ids = PART_SETS[sp.set].slice();
    if (sp.drop != null) { if (!Array.isArray(sp.drop)) return 'parts.drop not a list'; for (const id of sp.drop) if (ids.indexOf(id) < 0 || WHEELS.indexOf(id) >= 0) return 'parts.drop: ' + id + ' not a (non-wheel) part of the set'; }
    const live = ids.filter(id => (sp.drop || []).indexOf(id) < 0);
    if (sp.extra != null) for (const id in sp.extra) {
      if (!/^[a-z][A-Za-z0-9]{1,15}$/.test(id)) return 'parts.extra: bad id ' + id;
      if (live.indexOf(id) >= 0) return 'parts.extra: ' + id + ' already in the set';
      if (PART_STD[id] && PART_STD[id].wh != null) return 'parts.extra: ' + id + ' (the wheels are in every set)';
      if (sp.extra[id] === true && !PART_STD[id]) return 'parts.extra.' + id + ': true only for a standard part (another needs its entry)';
      const why = sp.extra[id] === true ? '' : partBad(sp.extra[id], !PART_STD[id]); if (why) return 'parts.extra.' + id + ': ' + why;
      live.push(id);
    }
    if (sp.over != null) for (const id in sp.over) {
      if (live.indexOf(id) < 0) return 'parts.over: ' + id + ' not a part';
      const why = partBad(sp.over[id], false); if (why) return 'parts.over.' + id + ': ' + why;
      if (WHEELS.indexOf(id) >= 0 && sp.over[id] && Object.keys(sp.over[id]).some(k => k !== 'm')) return 'parts.over.' + id + ': a wheel takes only m (its place and size are the physics\' a / b / rw)';
    }
    // every entry as it will be used: complete and sound (nothing the expansion would drop or guess)
    const raw = mergeParts(sp);
    for (const id in raw) if (raw[id].wh == null) { const why = partBad(raw[id], true); if (why) return 'parts.' + id + ': ' + why; }
    return '';
  }

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
    const dx = d.x - c.x, dz = d.z - c.z, R = c.circles[c.circles.length - 1] + c.rad + d.r * 0.7 + 0.1;   // (beyond the car's reach: nothing to touch)
    if (dx * dx + dz * dz > R * R || d.y - (c.y || 0) > 1.3) return;
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    for (let i = 0; i < c.circles.length; i++) {
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
    const K = b.K, dx = b.x - c.x, dz = b.z - c.z, R = c.circles[c.circles.length - 1] + c.rad + K.rh + 0.1;   // (beyond the car's reach)
    if (dx * dx + dz * dz > R * R) return;
    const cy = c.y || 0; if (b.y - K.rb > cy + 1.3 || b.y + K.rb < cy + 0.05) return;
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    for (let i = 0; i < c.circles.length; i++) {
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
      if ((c.isPlayer || c.pitWant || c.inPit) && trk.def.pit) { const pz2 = trk.pitAt(q.s); if (pz2) { if (pz2.gap) br = Math.max(br, pz2.lout); else if (c.inPit) { inner = pz2.inner; br = pz2.lout; } } }   // in the pit lane: between the pit wall (the kerb in front of the stands) and the lane's outer edge
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
        const e = CSK.wallE, wy = CSK.wallYaw;
        const J = -(1 + e) * vn / (1 / c.m.mass + rn * rn / c.I * wy);
        c.vx += J * nx / c.m.mass; c.vz += J * nz / c.m.mass;
        c.w += rn * J / c.I * wy;
        // friction along wall
        const tx = -nz, tz = nx;
        const vtan = (c.vx - c.w * wz) * tx + (c.vz + c.w * wx) * tz;
        const rt = wx * tz - wz * tx;
        let Jt = -vtan / (1 / c.m.mass + rt * rt / c.I * wy);
        const mu = CSK.wallMu;
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
    const dx0 = b.x - a.x, dz0 = b.z - a.z, R = a.circles[a.circles.length - 1] + a.rad + b.circles[b.circles.length - 1] + b.rad + 0.1;   // (the two cars' reach)
    if (dx0 * dx0 + dz0 * dz0 > R * R) return 0;
    const cha = Math.cos(a.h), sha = Math.sin(a.h), chb = Math.cos(b.h), shb = Math.sin(b.h);
    let best = 0, bnx = 0, bnz = 0, bpx = 0, bpz = 0;
    for (let i = 0; i < a.circles.length; i++) {
      const ax = a.x + cha * a.circles[i], az = a.z + sha * a.circles[i];
      for (let j = 0; j < b.circles.length; j++) {
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
    const e = CSK.carE;
    // angular terms damped to keep contact spins moderate; the push goes to the travel, the turn to the tap below (not the yaw rate)
    const J = -(1 + e) * vrel / (ia + ib + rna * rna / a.I * 0.6 + rnb * rnb / b.I * 0.6);
    if (!a.net) { a.vx += J * bnx * ia; a.vz += J * bnz * ia; }
    if (!b.net) { b.vx -= J * bnx * ib; b.vz -= J * bnz * ib; }
    { if (!a.air && !a.net) a.csKc = clamp(a.csKc + rna * J / a.I * CSK.tapT, -CSK.tapMax, CSK.tapMax); if (!b.air && !b.net) b.csKc = clamp(b.csKc - rnb * J / b.I * CSK.tapT, -CSK.tapMax, CSK.tapMax); }   // cs: a tap swings the tail, the car catches itself
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
  const _tfv = {};
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
        if (gap > 0 && Math.abs(lat) < (M.aiLat || 3.2) && (closing > -1 || gap < 7) && gap < tgap) { threat = o; tgap = gap; }   // (M.aiLat: a wide vehicle sees a car further to its side as in its way)
      }
      c.aiThreat = threat; c.aiGap = tgap;
      if (race.tf) { const P = race.tf.aiPlan(c, v, _tfv); c.tfLo = P.lo; c.tfHi = P.hi; c.tfFol = P.fol; c.tfEdge = P.edge; }   // the open road: the corridor between the traffic, or behind it
      if (threat && race.fl && !(threat.fl && threat.fl.stopT > 0) && (c.sc || race._noPass(c))) { target = c.laneBias; c.passing = 0; }   // (a yellow flag or the safety car: no overtaking, stay in line; a stopped car is passed)
      else if (threat) {
        const rlHere = T.rl[q.i];
        const oPos = threat.q.d;
        // choose side with more room
        const roomL = oPos - (-T.w + 1.2), roomR = (T.w - 1.2) - oPos;
        const side = roomR > roomL ? 1 : -1;
        const want = oPos + side * (M.aiPass || 3.3);   // (aiPass: the formula passes wider)
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
    const lim = T.w - (M.aiEdge || 1.25);   // (M.aiEdge: the formula keeps further in)
    let off = clamp(rlv + c.aiOff, -lim, lim);
    if (race.tf && c.tfLo != null) { const E = Math.max(lim + 0.4, c.tfEdge || 0); off = clamp(off, Math.max(-E, c.tfLo), Math.min(E, c.tfHi)); }   // (the open road: within the corridor the traffic leaves; round a roadblock over the verge)
    if (c.pitWant && T.def.pit) {   // (autopilot into the pits: follow the lane)
      const pz = T.pitAt(sT); if (pz) off = pz.o;
      if (pz && c.ty && !c.isPlayer && !pz.gap) {   // (an AI car in for tyres: the fast lane beside the boxes, over to its own box to stop)
        const L = T.len; let db = T.startS + race._aiBox(c) - sT; db = ((db % L) + L) % L; if (db > L / 2) db -= L;
        off += !c.pitDone && db > -8 && db < 16 ? -2 : 1.5;
      } else if (!c.isPlayer) { const P = T.def.pit, L = T.len; let d = sT - T.startS; d = ((d % L) + L) % L; if (d > L / 2) d -= L; if (d > P[1] - 220 && d < P[1]) off = lim; }   // (an AI car in for tyres: over to the lane's side of the road first)
    }
    if (c.parkS != null) off = lerp(off, c.parkD, sstep(c.parkS - 90, c.parkS - 30, sT));   // (past the finish of a race up the road: over to its slot, see Race._progressOpen)
    const tx = lerp(T.px[i0], T.px[i1], ft) + lerp(T.nx[i0], T.nx[i1], ft) * off;
    const tz = lerp(T.pz[i0], T.pz[i1], ft) + lerp(T.nz[i0], T.nz[i1], ft) * off;
    const hA = c.speed > 3 ? Math.atan2(c.vz, c.vx) : c.h;   // the arc starts along the travel, not the nose
    const ch = Math.cos(hA), sh = Math.sin(hA);
    const dx = tx - c.x, dz = tz - c.z;
    const lx = dx * ch + dz * sh, ly = -dx * sh + dz * ch;
    const dist = Math.max(3, Math.hypot(lx, ly));
    const ang = Math.atan2(ly, lx);
    const kap = 2 * Math.sin(ang) / dist;
    { const wNeed = v * kap; c.inSteer = clamp((wNeed + CSK.aiKw * (wNeed - c.wPath)) / Math.max(0.05, c.csWcap || 1), -1, 1); }   // steer = share of the path-rate cap

    // --- speed ---
    const sA = q.s + v * 0.22 + 3;
    const ia = T.idx(sA);
    // skill > 1 (hard): faster in the quicker corners and on the brakes, but no faster than the profile through the slowest hairpins,
    // where the cars would only slide wide (tested per car model at the limit)
    const vpA = (c.vprof || race.vprof)[ia], offErr = Math.abs(q.d - (T.rl[q.i] + c.aiOff)), offLine = Math.abs(c.aiOff) > 1.2 || offErr > 1.2;
    let sk = Math.min(c.skill * c.rubber, c.skCap || 1.14) * (c.isPlayer || !T.def.aiPace ? 1 : T.def.aiPace[c.phys] || 1);   // (def.aiPace: quicker rivals on a track with room for them, skill and cap; never the player's autopilot)
    if (sk > 1 && offLine) sk = 1 + (sk - 1) * 0.3;   // away from the ideal line (overtaking, defending, knocked aside) the extra pace is not there
    let vT = vpA * (sk <= 1 ? sk : 1 + (sk - 1) * sstep(11, 24, vpA));
    if (c.upgGrip) vT *= Math.pow(c.upgGrip * (1 + c.aeroK * vT * vT), 0.25);   // upgraded tyres / aero: carry more speed through the corners (half the grip gain: safe for every car)
    if (race.wst && race.wst.tyres && c.ty) vT *= Math.sqrt(clamp(c.wet / race.wst.profW, 0.5, 1.4));   // its own tyres (and their wear) against the grip the profile assumes
    if (c.aeroK0 != null && c.aeroK < c.aeroK0) vT *= Math.sqrt((1 + c.aeroK * vT * vT) / (1 + c.aeroK0 * vT * vT));   // the formula with a wing knocked off: less grip at speed
    if (c.wreck && c.wreck.nL) vT *= Math.sqrt(1 - 0.175 * c.wreck.nL);   // a kit vehicle on a hub or two (LOSTW): each wheel gone costs ~17.5 % of its grip
    // if displaced from line, be a little more careful
    if (offErr > 2.5) vT *= 0.94;
    if (c.passing) vT *= 1.01;
    if (c.pitWant && T.def.pit) { const pz = T.pitAt(q.s + v * 0.8 + 6), pn = T.pitAt(q.s); if (pz || c.inPit) vT = Math.min(vT, (pz && pz.t < 0.98) || (pn && pn.t < 0.98) ? 15 : PIT_V * 0.97); }   // (easy through the S of the way in and out)
    { const o = c.aiThreat, g0 = M.aiGap || 3; if (o && c.aiGap < g0 + 6 && Math.abs(o.q.d - q.d) < (M.aiFol || 2.1)) vT = Math.min(vT, Math.max(0, o.vl) + Math.max(0, c.aiGap - g0) * 0.8); }   // (M.aiFol: a wide vehicle follows one further to its side)
    if (c.tfFol) { const F = c.tfFol, g = (F.o.m ? F.o.q.s : F.o.s) - q.s - M.len / 2 - F.len / 2; vT = Math.min(vT, Math.sqrt(F.vs * F.vs + 10 * Math.max(0, g - 8))); }   // (the open road: no way past yet, behind it)   // right behind someone with no gap yet: follow, don't ram (M.aiGap: the formula keeps a longer gap)
    if (race.fl) {   // flags: the safety car's steady pace; slower through a yellow; the queue behind the safety car, 15 m apart
      const F = race.fl, S = F.sc;
      if (c.sc) { if (!(S && S.state === 'in' && !S.pit)) vT = Math.min(vT * 0.75, 36); }   // (speeding off: at full pace)
      else if (!c.finished) {
        if (F.yel.length && race._yelAt(q.s)) vT *= 0.8;
        if (S && S.car && !c.inPit && !c.pitWant) {
          let gap = 1e9, a = null;
          for (const o of race.cars) { if (o === c || o.finished || o.inPit || o.pitWant || dnf(o)) continue; const g = o.dist - c.dist; if (g > 0 && g < gap) { gap = g; a = o; } }   // (not behind a retired car)
          const off = S.state === 'in' && !S.pit;   // (speeding off up the road: the field lets it go, at a steady pace)
          const gS = S.car.dist - c.dist; if (gS > 0 && gS < gap && !off && !(S.car.pitWant && T.pitAt(S.car.q.s))) { gap = gS; a = S.car; }   // (the safety car turning into the pit lane: not any more)
          if (off) vT = Math.min(vT, 0.7 * vpA);
          if (a && gap < 400) vT = Math.min(vT, Math.max(0, a.vl) + (gap - 15) * 0.45);
          vT = Math.min(vT, 46);
        }
      }
    }
    if (c.ty && !c.isPlayer && (c.inPit || c.pitWant)) { const o = c.aiThreat; if (o && Math.abs(o.q.d - q.d) < (M.aiFol ? M.aiFol + 0.3 : 2.4)) vT = Math.min(vT, Math.sqrt(Math.max(0, o.vl) ** 2 + 10 * Math.max(0, c.aiGap - 6))); }   // (the pit lane: wait behind a car stopping at its box or pulling out)
    let thr = 0, brk = 0;
    if (v < vT - 0.8) thr = 1;
    else if (v < vT + 0.6) thr = 0.45;
    else { thr = 0; brk = clamp((v - vT) / 4.5, 0.15, 1); }
    // don't stamp on the brakes while turning hard (trail-braking is stable: the slide is the design)
    brk *= 1 - 0.3 * Math.min(1, Math.abs(c.inSteer));
    // traction: ease off only when knocked past the planned slide
    const ab = Math.abs(c.beta);
    if (c.vl > 6) { const ex = ab - Math.abs(c.csAT || 0) - 0.12; if (ex > 0) thr *= clamp(1 - ex * 4, 0.3, 1); }
    if (c.spin > 0.05) thr *= 0.8;
    if (race.tf && v > 3 && race.tf.aeb(c)) { thr = 0; brk = 1; }   // (the open road: about to touch something ahead: stop)
    // off-track: slow down a bit & aim back
    if (c.parkS != null) {   // the race up the road is over for this car: roll up to its slot at the side of the road and stay there
      const togo = c.parkS - q.s, vP = togo > 0 ? Math.min(16, Math.sqrt(6.4 * togo)) : 0;
      thr = v < vP - 1 ? 0.6 : 0; brk = v > vP + 0.5 ? clamp((v - vP) / 3, 0.2, 1) : 0;
      if (togo < 2 && v < 0.5) c.parked = true;
      if (c.parked) { thr = 0; brk = 1; }
    }
    if (T.open && T.len - q.s < 6 + v * v / 40) { thr = 0; brk = 1; }   // open road: stop (and stay stopped) well short of the wall at the top end
    c.inThr = thr; c.inBrk = brk; c.inHand = 0;
  }

  /* ---------------------------------------------------------------------
     THE OPEN ROAD: TRAFFIC AND PEOPLE (Race opts.traffic: the duel with one rival on the open road; opts.police: the run from the
     police; an open road, Vršič). race.tf; every other race never sees any of it.
     --------------------------------------------------------------------- */
  // Vehicles: cars, vans, buses and motorbikes both ways (uphill on the right half of the road, downhill on the left, as in Slovenia),
  // cyclists at the edge of their side. Each follows the road on a lane (s along it from sample 0, d across it, + to the right looking
  // uphill) and keeps its distance to whatever is ahead of it (the intelligent driver model: the vehicles, the race cars, people on the
  // road, a zebra crossing someone waits at or walks over), slows for the bends (a speed profile of its own; 50 km/h where there are
  // sidewalks, 80 elsewhere), a bus stops at its bus stops; a race car coming up fast behind makes it pull over a little, one coming at it on
  // its side of the road makes it brake, dodge to its edge and sound the horn; it drives round something standing in its lane when the
  // other side is clear. A hard knock turns a vehicle into a loose body that slides and spins to a stop (hazard lights), then it drives on
  // if it can; a cyclist (or a motorcyclist) knocked off is thrown onto the road and the bicycle skids on. Vehicles leaving the top of the
  // road come back at the bottom and the other way round, out of sight of the race, so the traffic stays as dense.
  // People: walkers on the sidewalks of Kranjska Gora and Jasna (up and down, now and then over a zebra crossing when it is safe; the traffic
  // stops for them, the race cars do not), people waiting at the bus stops, hikers at the road's edge by the huts, crossing now and then.
  // Someone who sees a car coming at them runs (or dives, when it is close) out of its path, square to it; someone hit is thrown, lands,
  // lies for a while and gets up again (nothing more is shown). Only the people within 420 m of a race car move.
  const TFK = [   // len, wid (m), mass (kg), desired speed (m/s: min, max), side grip in the bends (m/s^2), accel, braking (m/s^2), lane (x half width), sideways speed
    { len: 4.3, wid: 1.8, mass: 1300, v0: [15, 20], lat: 2.6, acc: 1.9, dec: 3.2, lane: 0.46, dl: 1.3 },     // 0 car
    { len: 5.3, wid: 2.0, mass: 2400, v0: [13, 17], lat: 2.2, acc: 1.3, dec: 2.8, lane: 0.48, dl: 1.1 },     // 1 van
    { len: 11.8, wid: 2.5, mass: 12500, v0: [11, 13], lat: 1.7, acc: 0.8, dec: 2.2, lane: 0.52, dl: 0.7 },  // 2 bus
    { len: 2.1, wid: 0.8, mass: 290, v0: [17, 22], lat: 3.4, acc: 3.2, dec: 4.5, lane: 0.42, dl: 1.6 },      // 3 motorbike
    { len: 1.8, wid: 0.6, mass: 90, v0: [4.2, 6.2], lat: 2.6, acc: 0.6, dec: 3.0, lane: 0, dl: 0.8 },        // 4 bicycle (uphill; downhill 2.1 x as fast; at the road's edge)
  ];
  const TF_PED = 75;   // kg: a person
  const TF_HIT_PEN = 5;   // s: the time penalty in the duel for knocking down someone on foot or on a bicycle
  class Traffic {
    constructor(race, dens) {
      const T = race.track;
      this.race = race; this.T = T; this.R = rng(((race.opts.seed || 7) * 7919 + 101) >>> 0);
      this.veh = []; this.ped = []; this.t = 0; this.nid = 0;
      this.zeb = (T.def.zebras || []).map(z => ({ s: T.startS + z, want: 0, busy: 0 }));
      this.stops = (T.def.stops || []).map(([d, side]) => ({ s: T.startS + d, side }));
      this.s0 = T.startS + 30; this.s1 = T.len - 20;   // the stretch the vehicles use: from just past the start line to the far end over the pass
      this.ev = 0; this.evK = ''; this.evCar = null; this.evX = 0; this.evZ = 0;   // the last event for the game ('ped', 'bike', 'crash'), its car and place
      this.cl = []; this.up = []; this.dn = []; this.hz = []; this.onRoad = [];   // (per step: the race cars; the moving vehicles of each way in order; things standing in the way; people on the road)
      this._prof(); this._populate(dens || 1);
    }

    // the vehicles' speed along the road, both ways (a car's; a kind's own side grip scales it): the bends at 2.6 m/s^2 of side grip (2.1 on
    // the cobbles), 50 km/h where there are sidewalks, 80 km/h elsewhere, braking at 2 m/s^2 into every slower bit ahead
    _prof() {
      const T = this.T, N = T.N, ds = T.ds, up = new Float32Array(N), dn = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const ak = Math.max(Math.abs(T.k[i]), 1e-4), town = T.walk && (T.walk[0][i] > 0.5 || T.walk[1][i] > 0.5);
        up[i] = dn[i] = Math.min(town ? 13.9 : 22.2, Math.sqrt((T.settAt && T.settAt[i] ? 2.1 : 2.6) / ak));
      }
      for (let i = N - 2; i >= 0; i--) up[i] = Math.min(up[i], Math.sqrt(up[i + 1] * up[i + 1] + 4 * ds));
      for (let i = 1; i < N; i++) dn[i] = Math.min(dn[i], Math.sqrt(dn[i - 1] * dn[i - 1] + 4 * ds));
      this.vp = [dn, up];
    }
    _vpAt(v) { return this.vp[v.dir > 0 ? 1 : 0][this.T.idx(v.s)] * Math.sqrt(TFK[v.kind].lat / 2.6) * (v.kind === 4 && v.dir < 0 ? 0.8 : 1); }
    _lane(v) { const w = this.T.w; return v.kind === 4 ? v.dir * (w - 0.7) : v.dir * w * TFK[v.kind].lane; }

    // the vehicles (uphill one every ~290 m, downhill one every ~250 m; one in 14 a bus, one in 6 a van, one in 12 a motorbike; a cyclist every
    // ~650 m each way; the first 180 m past the start line clear of uphill traffic) and the people
    _populate(dens) {
      const T = this.T, R = this.R;
      for (const dir of [1, -1]) {
        const a = dir > 0 ? T.startS + 180 : this.s0 + 60, L = this.s1 - 30 - a, n = Math.max(1, Math.round(L / (dir > 0 ? 290 : 250) * dens)), nb = Math.max(1, Math.round(L / 650 * dens));
        for (let k = 0; k < n; k++) { const u = R(); this._veh(dir, u < 0.07 ? 2 : u < 0.24 ? 1 : u < 0.32 ? 3 : 0, a + (k + 0.15 + 0.7 * R()) * L / n); }
        for (let k = 0; k < nb; k++) this._veh(dir, 4, a + (k + 0.1 + 0.8 * R()) * L / nb);
      }
      // walkers on the sidewalks (one every ~30 m of each side), walking their stretch up and down
      if (T.walk) for (const [a, b, sd] of T.def.walks || []) for (const side of sd ? [sd] : [-1, 1]) {
        const a0 = T.startS + a + 6, a1 = T.startS + b - 6;
        for (let s = a0 + R() * 20; s < a1; s += 18 + R() * 26) { const p = this._ped(R() < 0.12 ? 2 : 0, s, side, 'walk'); p.a0 = a0; p.a1 = a1; }
      }
      // people waiting at the bus stops
      for (const st of this.stops) { const n = 1 + Math.floor(R() * 2.6); for (let k = 0; k < n; k++) { const p = this._ped(R() < 0.45 ? 1 : 0, st.s + (R() - 0.5) * 5, st.side, 'stop'); p.a0 = p.a1 = p.s; } }
      // hikers at the road's edge by the huts and the chapel (their stretch 250 m around it; they cross now and then), a few on the long stretches
      const huts = T.names.filter(q => /dom|koča|kapelica|Vršič|Jasna|deklica/i.test(q.n)).map(q => T.startS + q.d);
      for (const s0 of huts) for (let k = 0; k < 4; k++) { const s = s0 + (R() - 0.5) * 220, p = this._ped(1, s, R() < 0.5 ? 1 : -1, 'walk'); p.a0 = s0 - 125; p.a1 = s0 + 125; p.hike = 1; }
      for (let s = T.startS + 2300; s < T.finishS - 200; s += 700 + R() * 700) { const p = this._ped(1, s, R() < 0.6 ? 1 : -1, 'walk'); p.a0 = s - 400; p.a1 = s + 400; p.hike = 1; }
    }
    _veh(dir, kind, s) {
      const K = TFK[kind], R = this.R;
      const v = { id: ++this.nid, kind, dir, s, d: 0, dT: 0, v: 0, v0: lerp(K.v0[0], K.v0[1], R()) * (kind === 4 && dir < 0 ? 2.1 : 1), len: K.len, wid: K.wid, mass: K.mass,
        col: R(), st: 0, t: 0, x: 0, y: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, i: 0, k: 0, brake: false, horn: 0, off: false, q: { i: -1 }, stopT: 0, stopS: -1, wait: 0, pass: null, rider: null, lean: 0 };
      v.d = v.dT = this._lane(v); v.v = Math.min(v.v0, this._vpAt(v)) * 0.85; this._pose(v, 0);
      this.veh.push(v); return v;
    }
    _ped(kind, s, side, st) {   // kind: 0 a local, 1 a hiker, 2 a child, 3 a rider thrown off a bicycle or a motorbike
      const R = this.R, p = { id: ++this.nid, kind, s, d: 0, side, pdir: R() < 0.5 ? 1 : -1, v: (kind === 1 ? 1.1 : kind === 2 ? 0.95 : 1.2) + R() * 0.3, st, t: R() * 5,
        x: 0, y: 0, z: 0, h: 0, vx: 0, vz: 0, vy: 0, look: R(), re: 0.14 + R() * 0.26, fear: 0, fx: 0, fz: 0, fsd: 0, ft: 0, dive: 0, dd: 0, a0: s, a1: s, zi: -1, zc: -1, dT: 0,
        roll: 0, spin: 0, q: { i: -1 }, hike: 0, off: false, xT: 0 };
      p.d = p.dT = this._pedLane(p); this._pedPose(p); this.ped.push(p); return p;
    }
    // where a person walks across the road: in the middle of the sidewalk (a little to one side), else on the shoulder just off the asphalt
    _pedLane(p) { const T = this.T, wk = T.walk ? T.walk[p.side > 0 ? 1 : 0][T.idx(p.s)] : 0; return p.side * (T.w + (wk > 0.6 ? wk * (0.35 + 0.3 * p.look) : 0.45 + p.look * 0.5)); }
    _pedPose(p) {   // on its lane: x, z, y and heading from s and d
      const T = this.T, N = T.N, f = clamp(p.s / T.ds, 0, N - 1.001), i = Math.floor(f), j = i + 1, t = f - i;
      const nx = T.nx[i] + (T.nx[j] - T.nx[i]) * t, nz = T.nz[i] + (T.nz[j] - T.nz[i]) * t;
      p.x = T.px[i] + (T.px[j] - T.px[i]) * t + nx * p.d; p.z = T.pz[i] + (T.pz[j] - T.pz[i]) * t + nz * p.d; p.y = T.hy ? T.hy[i] + (T.hy[j] - T.hy[i]) * t : 0;
    }
    // a vehicle on its lane: x, z, y, heading and velocity from s, d, its speed and dd (its sideways speed this step)
    _pose(v, dd) {
      const T = this.T, N = T.N, f = clamp(v.s / T.ds, 0, N - 1.001), i = Math.floor(f), j = i + 1, t = f - i;
      const nx = T.nx[i] + (T.nx[j] - T.nx[i]) * t, nz = T.nz[i] + (T.nz[j] - T.nz[i]) * t, tx = T.tx[i] + (T.tx[j] - T.tx[i]) * t, tz = T.tz[i] + (T.tz[j] - T.tz[i]) * t;
      v.x = T.px[i] + (T.px[j] - T.px[i]) * t + nx * v.d; v.z = T.pz[i] + (T.pz[j] - T.pz[i]) * t + nz * v.d; v.y = T.hy ? T.hy[i] + (T.hy[j] - T.hy[i]) * t : 0;
      v.vx = tx * v.v * v.dir + nx * dd; v.vz = tz * v.v * v.dir + nz * dd; v.i = i;
      v.h = v.v > 0.4 ? Math.atan2(v.vz, v.vx) : Math.atan2(tz * v.dir, tx * v.dir);
    }
    _event(k, c, x, z) { this.ev++; this.evK = k; this.evCar = c; this.evX = x; this.evZ = z; }

    step(dt) {
      const race = this.race, cl = this.cl; cl.length = 0;
      for (const c of race.cars) if (!c.net) cl.push(c);
      if (race.pol) for (const c of race.pol.cars) cl.push(c);
      this.t += dt;
      this._order();
      for (const v of this.veh) { if (v.off) this._recycle(v); else if (v.st === 0) this._drive(v, dt); else this._loose(v, dt); if (v.horn > 0) v.horn -= dt; }
      for (const v of this.veh) if (!v.off && v.st === 1) for (const o of this.veh) if (o !== v && !o.off) this._bump(v, o);   // (a loose body against the others)
      this._people(dt);
      for (const c of cl) { for (const v of this.veh) if (!v.off) this._hitVeh(c, v); }
      this._hitPeds();
    }
    // the moving vehicles of each way in order along the road, and the things standing in the way (wrecks, people on the road)
    _order() {
      const up = this.up, dn = this.dn, hz = this.hz, T = this.T; up.length = dn.length = hz.length = 0;
      for (const v of this.veh) { if (v.off) continue; if (v.st === 0) (v.dir > 0 ? up : dn).push(v); else hz.push(v); }
      up.sort((a, b) => a.s - b.s); dn.sort((a, b) => b.s - a.s);
      for (let k = 0; k < up.length; k++) up[k].k = k; for (let k = 0; k < dn.length; k++) dn[k].k = k;
      const R = this.onRoad; R.length = 0;
      for (const p of this.ped) if (!p.off && Math.abs(p.d) < T.w + 0.4 && p.st !== 'walk' && p.st !== 'stop') R.push(p);
    }

    // one vehicle on its lane: what is ahead of it, its speed (IDM), its place across the road (lane, pulling over, dodging, going round)
    _drive(a, dt) {
      const T = this.T, K = TFK[a.kind], dir = a.dir, L = dir > 0 ? this.up : this.dn, k = L[a.k] === a ? a.k : L.indexOf(a), hw = a.wid / 2;
      let gap = 1e9, lv = 0, lead = null, still = false;
      const cand = (g, vs, o, st) => { if (g < gap) { gap = g; lv = vs; lead = o; still = st; } };
      const over = (d, w) => Math.abs(d - a.d) < (w + a.wid) / 2 + 0.25;
      for (let j = k + 1; j < L.length; j++) { const b = L[j], g = (b.s - a.s) * dir - (a.len + b.len) / 2; if (g > 160) break; if (over(b.d, b.wid)) { cand(g, b.v, b, false); break; } }
      for (const b of this.hz) { const g = (b.s - a.s) * dir - (a.len + b.len) / 2; if (g > -1 && g < 160 && over(b.d, b.wid)) cand(g, 0, b, true); }
      if (this.race.pol) for (const pc of this.race.pol.cars) if (pc.pol.block && pc.pol.mode === 'park') { const g = (pc.q.s - a.s) * dir - a.len / 2 - 80; if (g > -6 && g < 160) cand(Math.max(0, g), 0, pc, false); }   // (a roadblock ahead: the police hold the traffic ~80 m before it, both ways: room to drive round it)
      for (const p of this.onRoad) { const g = (p.s - a.s) * dir - a.len / 2 - 0.5; if (g > -0.5 && g < 60 && over(p.d, 0.8)) cand(g, 0, p, p.st !== 'cross' && p.st !== 'xcross' && p.st !== 'flee'); }
      let dT = this._lane(a), fromBehind = false, horn = false, side = 0, siren = false;
      for (const c of this.cl) {
        const g = (c.q.s - a.s) * dir, cw = c.m.wid, vs = (c.vx * T.tx[c.q.i] + c.vz * T.tz[c.q.i]) * dir;
        if (g - (a.len + c.m.len) / 2 > -0.5 && g < 160 && over(c.q.d, cw)) cand(g - (a.len + c.m.len) / 2, vs, c, Math.abs(vs) < 0.5 && c.speed < 0.5);
        else if (Math.abs(g) < (a.len + c.m.len) / 2 + 1 && Math.abs(c.q.d - a.d) < (cw + a.wid) / 2 + 0.8) side = a.d > c.q.d ? 1 : -1;   // (one alongside: away from it)
        if (g > 0 && g < 70 && vs < -3 && Math.abs(c.q.d - a.d) < 2.6) { dT = dir * (T.w - hw - 0.15); horn = true; }   // coming at it on its side: to its edge, the horn
        if (g < 0 && g > -40 && vs > a.v + 3 && Math.abs(c.q.d - a.d) < 2.4 && a.kind !== 4) fromBehind = true;   // racing up behind it: pull over a little
        if (c.police && c.pol.mode === 'chase' && !c.locked && Math.abs(g) < 70) siren = true;   // (a patrol car with its siren: over to the edge, slower)
      }
      if (fromBehind && !horn) dT += dir * 0.75;
      if (siren && a.kind !== 4) dT = dir * (T.w - hw - 0.25);
      if (side) dT = a.d + side * 1.2;
      // a zebra crossing someone waits at or walks over: stop before it; a bus: its bus stops (2 m past, at the edge, 6 s)
      for (const z of this.zeb) { if (!(z.want + z.busy)) continue; const g = (z.s - a.s) * dir - 3.5 - a.len / 2; if (g > -0.5 && g < 50) cand(g, 0, z, false); }
      if (a.kind === 2) for (const st of this.stops) if (st.side === dir && st.s !== a.stopS) { const g = (st.s - a.s) * dir - a.len / 2; if (g > -1 && g < 70) { cand(Math.max(0, g), 0, st, false); dT = dir * (T.w - hw - 0.2);
        if (g < 4 && a.v < 0.4) { a.stopT += dt; if (a.stopT > 6) { a.stopS = st.s; a.stopT = 0; } } } }
      // going round something standing in its lane (a wreck, a car pulled up): when it has waited 2 s and the other half is clear 90 m ahead
      if (a.pass) { const o = a.pass, os = o.m ? o.q.s : o.s, od = o.m ? o.q.d : o.d, ow = o.m ? o.m.wid : o.wid || 0.8, ol = o.m ? o.m.len : o.len || 0.6;
        if ((a.s - os) * dir > (a.len + ol) / 2 + 3 || o.off || (a.t += dt) > 20) { a.pass = null; a.t = 0; } else dT = od - dir * (ow / 2 + hw + 0.6); }
      else if ((still || (lead && lead.kind === 2 && lead.stopT > 0)) && lead && gap < 12 && a.v < 0.5 && (a.wait += dt) > 2) {   // (a wreck, a race car standing, a bus at its stop)
        let clear = true; const other = dir > 0 ? this.dn : this.up;
        for (const b of other) { const g = (b.s - a.s) * dir; if (g > -10 && g < 90) { clear = false; break; } }
        for (const c of this.cl) if (c !== lead) { const g = (c.q.s - a.s) * dir; if (g > -10 && g < 60 && c.q.d * dir < 0.5) { clear = false; break; } }
        if (clear) { a.pass = lead; a.wait = 0; a.t = 0; }
      } else if (!still) a.wait = 0;
      if (a.pass && lead === a.pass) { gap = 1e9; lv = 0; }
      // speed: the intelligent driver model toward the road's speed and its own
      const vDes = Math.max(0.5, Math.min(a.v0, this._vpAt(a)) * (siren ? 0.6 : 1));
      let acc = K.acc * (1 - Math.pow(a.v / vDes, 4));
      if (gap < 1e8) { const dv = a.v - lv, ss = 2.5 + Math.max(0, a.v * 1.1 + a.v * dv / (2 * Math.sqrt(K.acc * K.dec))); acc -= K.acc * (ss / Math.max(0.3, gap)) ** 2; }
      acc = clamp(acc, -9, K.acc);
      a.v = Math.max(0, a.v + acc * dt); a.brake = acc < -0.8 || a.v < 0.3; a.s += dir * a.v * dt;
      if (horn && a.horn <= 0 && a.kind !== 4) a.horn = 1.2;
      a.dT = clamp(dT, -T.w + hw + 0.1, T.w - hw - 0.1);
      const dd = clamp(a.dT - a.d, -K.dl * dt, K.dl * dt); a.d += dd;
      a.lean += ((a.kind >= 3 ? -clamp(a.v * a.v * T.k[a.i] * dir / 9.8, -0.6, 0.6) : 0) - a.lean) * Math.min(1, dt * 4);   // (two wheels lean into the bends)
      this._pose(a, dd / dt);
      if (a.s > this.s1 || a.s < this.s0) this._recycle(a);
    }
    // a knocked vehicle: slides and spins to a stop (the tyres scrub, a bicycle lies on its side), off the barriers; then, if it faces the
    // right way, it drives on after 6 s (a bicycle and a vehicle turned round stay, hazard lights on, until the race is far away)
    _loose(v, dt) {
      const T = this.T;
      if (v.st === 1) {
        const ch = Math.cos(v.h), sh = Math.sin(v.h); let vl = v.vx * ch + v.vz * sh, vt = -v.vx * sh + v.vz * ch;
        const fl = (v.kind >= 3 ? 7 : 4.5) * dt, ft = 8 * dt;
        vl = Math.abs(vl) <= fl ? 0 : vl - Math.sign(vl) * fl; vt = Math.abs(vt) <= ft ? 0 : vt - Math.sign(vt) * ft;
        v.vx = vl * ch - vt * sh; v.vz = vl * sh + vt * ch; v.w *= Math.exp(-2.2 * dt);
        v.x += v.vx * dt; v.z += v.vz * dt; v.h += v.w * dt;
        const q = T.query(v.x, v.z, v.q.i, v.q), hw = v.wid / 2;
        if (q.d > q.br - hw || q.d < -q.bl + hw) {   // the barrier: back inside, the speed into it gone
          const pen = q.d > 0 ? q.d - (q.br - hw) : -q.bl + hw - q.d, sg = q.d > 0 ? -1 : 1;
          v.x += q.nx * pen * sg; v.z += q.nz * pen * sg; const vn = v.vx * q.nx + v.vz * q.nz; if (vn * sg < 0) { v.vx -= q.nx * vn * 1.3; v.vz -= q.nz * vn * 1.3; }
        }
        v.s = q.s; v.d = q.d; v.i = q.a; v.y = T.hy ? T.elevAt(q.s).y : 0; v.v = 0; v.brake = true;
        if (Math.hypot(v.vx, v.vz) < 0.25 && Math.abs(v.w) < 0.25) { v.st = 2; v.t = 0; v.vx = v.vz = v.w = 0; }
      } else if (v.st === 2) {
        v.t += dt;
        const f = Math.cos(v.h - Math.atan2(T.tz[v.i] * v.dir, T.tx[v.i] * v.dir));
        if (v.t > 6 && v.kind !== 4 && f > 0.6 && Math.abs(v.d) < T.w) { v.st = 0; v.v = 0; v.dT = this._lane(v); v.wait = 0; v.pass = null; }
        else if (v.t > 20) { let far = true; for (const c of this.cl) if (Math.abs(c.q.s - v.s) < 350) { far = false; break; } if (far) { v.off = true; this._recycle(v); } }
      }
    }
    // off the far end (or a wreck left far behind): back at the other end, when it is clear there and out of sight of the race cars
    _recycle(v) {
      const s = v.dir > 0 ? this.s0 : this.s1;
      v.off = true;
      for (const c of this.cl) if (Math.abs(c.q.s - s) < 170) return;
      for (const o of this.veh) if (o !== v && !o.off && o.dir === v.dir && Math.abs(o.s - s) < 45) return;
      if (v.rider) { const k = this.ped.indexOf(v.rider); if (k >= 0) this.ped.splice(k, 1); v.rider = null; }
      v.off = false; v.st = 0; v.s = s; v.d = v.dT = this._lane(v); v.v = Math.min(v.v0, this._vpAt(v)) * 0.7; v.w = 0; v.t = 0; v.wait = 0; v.pass = null; v.stopS = -1; v.stopT = 0; v.lean = 0;
      this._pose(v, 0);
    }
    // two vehicles touching (a loose one against another): pushed apart, an impulse between them; a driving one knocked hard enough comes loose
    _bump(a, b) {
      const dx = b.x - a.x, dz = b.z - a.z, rr = (a.len + b.len) / 2; if (dx * dx + dz * dz > rr * rr) return;
      const hit = this._circles(a, b); if (!hit) return;
      const [pen, nx, nz] = hit, ia = 1 / a.mass, ib = 1 / b.mass, tot = ia + ib;
      a.x += nx * pen * ia / tot; a.z += nz * pen * ia / tot;
      const vrel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz; if (vrel >= 0) return;
      const J = -1.3 * vrel / tot;
      a.vx += J * nx * ia; a.vz += J * nz * ia;
      if (b.st === 0 && J * ib > 1.2) { b.st = 1; b.t = 0; b.vx += -J * nx * ib; b.vz += -J * nz * ib; b.w += (this.R() - 0.5) * 1.2; if (b.kind >= 3) this._throwRider(b, a.vx, a.vz); }
      else if (b.st === 1) { b.vx -= J * nx * ib; b.vz -= J * nz * ib; b.x -= nx * pen * ib / tot; b.z -= nz * pen * ib / tot; }
    }
    _circles(a, b) {   // deepest overlap of the circles along two vehicles (a pointing from b to a): [depth, nx, nz, x, z] or null
      const ca = Math.cos(a.h), sa = Math.sin(a.h), cb = Math.cos(b.h), sb = Math.sin(b.h), na = Math.max(2, Math.round(a.len / a.wid)), nb = Math.max(2, Math.round(b.len / b.wid));
      let best = 0, r = null;
      for (let i = 0; i < na; i++) { const oa = -(a.len - a.wid) / 2 + i * (a.len - a.wid) / (na - 1), ax = a.x + ca * oa, az = a.z + sa * oa;
        for (let j = 0; j < nb; j++) { const ob = -(b.len - b.wid) / 2 + j * (b.len - b.wid) / (nb - 1), bx = b.x + cb * ob, bz = b.z + sb * ob, ex = ax - bx, ez = az - bz, d2 = ex * ex + ez * ez, rs = (a.wid + b.wid) / 2;
          if (d2 < rs * rs) { const d = Math.sqrt(d2) || 1e-3; if (rs - d > best) { best = rs - d; r = [best, ex / d, ez / d, (ax + bx) / 2, (az + bz) / 2]; } } } }
      return r;
    }

    // a race car against a vehicle: the circles along the car (as carCollide) against those along the vehicle, an impulse between the two
    // bodies. A vehicle knocked by more than ~1.4 m/s (a bicycle or a motorbike by any real knock) comes loose; the car takes damage as
    // from another car (more from a bus, less from a bicycle)
    _hitVeh(c, v) {
      const dx0 = v.x - c.x, dz0 = v.z - c.z, rr = (c.m.len + v.len) / 2 + 0.5; if (dx0 * dx0 + dz0 * dz0 > rr * rr) return 0;
      const cha = Math.cos(c.h), sha = Math.sin(c.h), chb = Math.cos(v.h), shb = Math.sin(v.h), nb = Math.max(2, Math.round(v.len / v.wid)), rb = v.wid / 2;
      let best = 0, bnx = 0, bnz = 0, bpx = 0, bpz = 0;
      for (let i = 0; i < c.circles.length; i++) { const ax = c.x + cha * c.circles[i], az = c.z + sha * c.circles[i];
        for (let j = 0; j < nb; j++) { const o = -(v.len - v.wid) / 2 + j * (v.len - v.wid) / (nb - 1), bx = v.x + chb * o, bz = v.z + shb * o, dx = ax - bx, dz = az - bz, d2 = dx * dx + dz * dz, r = c.rad + rb;
          if (d2 < r * r) { const d = Math.sqrt(d2) || 1e-3, pen = r - d; if (pen > best) { best = pen; bnx = dx / d; bnz = dz / d; bpx = (ax + bx) / 2; bpz = (az + bz) / 2; } } } }
      if (best <= 0) return 0;
      const ma = c.m.mass, mb = v.mass, ia = 1 / ma, ib = 1 / mb, tot = ia + ib;
      c.x += bnx * best * ia / tot; c.z += bnz * best * ia / tot;
      if (v.st !== 0) { v.x -= bnx * best * ib / tot; v.z -= bnz * best * ib / tot; }
      else { const f = best * ib / tot; v.s -= (bnx * this.T.tx[v.i] + bnz * this.T.tz[v.i]) * f; v.d -= (bnx * this.T.nx[v.i] + bnz * this.T.nz[v.i]) * f; }
      const rax = bpx - c.x, raz = bpz - c.z, rbx = bpx - v.x, rbz = bpz - v.z;
      const vax = c.vx - c.w * raz, vaz = c.vz + c.w * rax, vbx = v.vx - v.w * rbz, vbz = v.vz + v.w * rbx;
      const vrel = (vax - vbx) * bnx + (vaz - vbz) * bnz; if (vrel >= 0) return 0;
      const Ib = mb * (v.len * v.len + v.wid * v.wid) / 12, rna = rax * bnz - raz * bnx, rnb = rbx * bnz - rbz * bnx;
      const J = -1.25 * vrel / (ia + ib + rna * rna / c.I * 0.6 + rnb * rnb / Ib);
      c.vx += J * bnx * ia; c.vz += J * bnz * ia;
      if (!c.air) c.csKc = clamp(c.csKc + rna * J / c.I * CSK.tapT, -CSK.tapMax, CSK.tapMax);
      const imp = -vrel, dvb = J * ib;
      if (v.st === 0 && (dvb > 1.4 || (v.kind >= 3 && dvb > 0.6))) { v.st = 1; v.t = 0; v.w = 0; if (v.kind >= 3) this._throwRider(v, c.vx, c.vz, c); }
      if (v.st === 1) { v.vx -= J * bnx * ib; v.vz -= J * bnz * ib; v.w -= rnb * J / Ib; }
      else { const tx = this.T.tx[v.i], tz = this.T.tz[v.i]; v.v = Math.max(0, v.v - (J * bnx * ib * tx + J * bnz * ib * tz) * v.dir); }
      c.hitCar = Math.max(c.hitCar, imp); c.fxCar = Math.max(c.fxCar || 0, imp); c.contactX = bpx; c.contactZ = bpz;
      if (imp > 3.5 && v.kind < 4) { const dx = bpx - c.x, dz = bpz - c.z; applyDamage(c, (imp - 3.5) * 0.016 * clamp(mb / 1300, 0.4, 1.8), dx * cha + dz * sha, -dx * sha + dz * cha); }
      if (imp > 3 && v.kind < 3) this._event('crash', c, bpx, bpz);
      v.horn = Math.max(v.horn, v.kind < 4 ? 1.5 : 0);
      return imp;
    }
    // the rider comes off (a bicycle or a motorbike knocked): thrown as a person hit, from the saddle
    _throwRider(v, vx, vz, c) {
      if (v.rider) return;
      const p = this._ped(3, v.s, v.d > 0 ? 1 : -1, 'walk'); p.moto = v.kind === 3 ? 1 : 0; p.x = v.x; p.z = v.z; p.y = v.y + 0.9; p.look = v.col;
      v.rider = p; p.bike = v;
      this._throw(p, vx, vz, 0);
      if (c) { this._event(v.kind === 4 ? 'bike' : 'crash', c, v.x, v.z); this._penalty(c); }
    }

    // the people
    _people(dt) {
      const T = this.T, cl = this.cl;
      for (const p of this.ped) {
        if (p.off) continue;
        let near = false; for (const c of cl) if (Math.abs(c.q.s - p.s) < 420) { near = true; break; }
        if (!near) { if (p.st !== 'walk' && p.st !== 'stop' && p.st !== 'stand2') this._home(p); continue; }   // (out of sight: back to what they were doing)
        p.t += dt; p.dd = 0;
        this._fear(p, dt);
        switch (p.st) {
          case 'walk': {   // along its stretch, turning at the ends; at a zebra crossing, now and then over it
            p.s += p.pdir * p.v * dt;
            if (p.s > p.a1) { p.s = p.a1; p.pdir = -1; } else if (p.s < p.a0) { p.s = p.a0; p.pdir = 1; }
            const dl = this._pedLane(p); p.d += clamp(dl - p.d, -0.8 * dt, 0.8 * dt);
            for (let k = 0; k < this.zeb.length; k++) { const z = this.zeb[k]; if (k !== p.zc && Math.abs(p.s - z.s) < 0.6 && p.kind !== 3) { p.zc = k; if (this.R() < 0.45) { p.st = 'zwait'; p.zi = k; z.want++; p.s = z.s + (p.look - 0.5) * 1.6; p.t = 0; } } }
            if (p.hike && p.t > 25 && this.R() < dt * 0.02) { p.st = 'xwait'; p.t = 0; }   // (a hiker: over the road to the path on the other side)
            this._pedPose(p); p.h = Math.atan2(T.tz[T.idx(p.s)] * p.pdir, T.tx[T.idx(p.s)] * p.pdir); p.v2 = p.v;
            break;
          }
          case 'zwait': case 'xwait': {   // at the kerb, facing the road: over when it is safe
            const i = T.idx(p.s); p.d += clamp(p.side * (T.w + 0.35) - p.d, -0.8 * dt, 0.8 * dt); this._pedPose(p); p.h = Math.atan2(-T.nz[i] * p.side, -T.nx[i] * p.side); p.v2 = 0;
            if (p.t > 1 && this._safe(p)) { p.st = p.st === 'zwait' ? 'cross' : 'xcross'; p.t = 0; p.dT = this._pedLane({ side: -p.side, s: p.s, look: p.look }); if (p.zi >= 0) { this.zeb[p.zi].want--; this.zeb[p.zi].busy++; } }
            break;
          }
          case 'cross': case 'xcross': {   // over the road at 1.4 m/s, then on along the other side
            const i = T.idx(p.s), tgt = p.dT; p.d += clamp(tgt - p.d, -1.4 * dt, 1.4 * dt); this._pedPose(p); p.h = Math.atan2(-T.nz[i] * p.side, -T.nx[i] * p.side); p.v2 = 1.4; p.dd = Math.sign(tgt - p.d) * 1.4;
            if (Math.abs(tgt - p.d) < 0.05) { this._leaveZebra(p); p.side = -p.side; p.st = 'walk'; p.t = 0; }
            break;
          }
          case 'stop': { const i = T.idx(p.s); this._pedPose(p); p.h = Math.atan2(-T.nz[i] * p.side, -T.nx[i] * p.side) + Math.sin(p.t * 0.3 + p.look * 9) * 0.5; p.v2 = 0; break; }
          case 'flee': {   // running out of the car's path (a dive at first when it was close), then catching breath
            const sp = p.dive > 0 ? 7 : p.kind === 2 ? 4.4 : p.kind === 1 ? 4.8 : 5.4; p.dive -= dt; p.ft -= dt;
            const q = T.query(p.x, p.z, p.q.i, p.q), bar = (q.d > 0 ? q.br : q.bl) + 4;
            if (Math.abs(q.d) < bar || (p.fx * q.nx + p.fz * q.nz) * Math.sign(q.d) < 0) { p.x += p.fx * sp * dt; p.z += p.fz * sp * dt; p.dd = p.fsd * sp; }
            p.h = Math.atan2(p.fz, p.fx); p.v2 = sp; this._track(p);
            if (p.ft <= 0) { p.st = 'stand'; p.t = 0; }
            break;
          }
          case 'stand': { p.v2 = 0; if (p.t > 1.2 + p.look * 2) { p.st = 'back'; p.t = 0; } break; }   // (looking after the car)
          case 'back': case 'limp': {   // back to its lane (limping at first after a fall)
            const q = T.query(p.x, p.z, p.q.i, p.q); p.side = q.d >= 0 ? 1 : -1; p.s = clamp(q.s, p.a0, p.a1);
            const dl = this._pedLane(p), i = q.a, tx = T.px[i] + T.nx[i] * dl, tz = T.pz[i] + T.nz[i] * dl, dx = tx - p.x, dz = tz - p.z, l = Math.hypot(dx, dz), sp = p.st === 'limp' ? 0.6 : 1.2;
            if (l < 0.3) { p.d = dl; p.st = 'walk'; p.t = 0; this._pedPose(p); break; }
            p.x += dx / l * sp * dt; p.z += dz / l * sp * dt; p.h = Math.atan2(dz, dx); p.v2 = sp; this._track(p);
            if (p.st === 'limp' && p.t > 5) p.st = 'back';
            break;
          }
          case 'fly': {   // thrown: through the air, then sliding to a stop on the ground
            p.vy -= 9.8 * dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt; p.roll += p.spin * dt;
            const q = this._track(p), gy = T.hy ? T.elevAt(q.s).y : 0;
            if (p.y <= gy) { p.y = gy; p.vy = 0; const sp = Math.hypot(p.vx, p.vz), f = Math.max(0, sp - 7 * dt) / (sp || 1); p.vx *= f; p.vz *= f; p.spin *= 0.9;
              if (sp < 0.3) { p.st = 'down'; p.t = 0; p.vx = p.vz = 0; } }
            p.v2 = 0; break;
          }
          case 'down': { p.v2 = 0; if (p.t > 3 + p.look * 1.5) { p.st = 'up'; p.t = 0; } break; }   // lying there
          case 'up': { p.v2 = 0; if (p.t > 1.3) { p.st = p.kind === 3 ? 'stand2' : 'limp'; p.t = 0; p.roll = 0; } break; }   // getting up
          case 'stand2': { p.v2 = 0; break; }   // (a rider thrown off: stays by the bicycle)
        }
      }
    }
    _track(p) { const q = this.T.query(p.x, p.z, p.q.i, p.q); p.s = q.s; p.d = q.d; return q; }
    _home(p) {   // far from the race: whatever they were in the middle of is over (over the road, or back from a fright), walking their stretch again
      if (p.st === 'cross' || p.st === 'xcross') p.side = -p.side; else if (Math.abs(p.d) > 0.5) p.side = p.d > 0 ? 1 : -1;
      this._leaveZebra(p); p.s = clamp(p.s, p.a0, p.a1); p.st = p.kind === 3 ? 'stand2' : p.a0 === p.a1 ? 'stop' : 'walk'; p.t = 0; p.roll = 0; p.y = 0; p.d = this._pedLane(p); this._pedPose(p);
    }
    _leaveZebra(p) { if (p.zi >= 0) { const z = this.zeb[p.zi]; if (p.st === 'zwait') z.want = Math.max(0, z.want - 1); else if (p.st === 'cross') z.busy = Math.max(0, z.busy - 1); p.zi = -1; } }
    // safe to step onto the road: no race car due in 4 s (one standing below, on the grid, is taken as coming at 90 km/h), no vehicle due in
    // 3 s unless it is stopping for the crossing
    _safe(p) {
      const T = this.T;
      for (const c of this.cl) { const g = p.s - c.q.s, vs = c.vx * T.tx[c.q.i] + c.vz * T.tz[c.q.i]; if ((g > -6 && vs > -1 && g < Math.max(25, vs) * 4 + 18) || (g < 6 && vs < -1 && -g < -vs * 4 + 18) || (Math.abs(g) < 8 && c.speed < 1)) return false; }
      for (const v of this.veh) { if (v.off) continue; const g = (p.s - v.s) * v.dir; if (g > -4 && g < v.v * 3 + 12 && (v.v > 2.5 || g < 6)) return false; }
      return true;
    }
    // a car coming at someone (along the road: due within ~1.9 s, where it will be across the road then within ~1.5 m of them): after a
    // moment to react they run out of its way, square to the road, to their side of its line; off the asphalt (a sidewalk, the verge) always
    // away from the road, unless the car itself comes along out there (a dive at first when it is close); they keep running while it comes on
    _fear(p, dt) {
      if (p.st === 'fly' || p.st === 'down' || p.st === 'up') return;
      const T = this.T; let best = null, bt = 1e9, bdc = 0;
      for (const c of this.cl) {
        const sp = c.speed; if (sp < 3.5) continue;
        const rx = p.x - c.x, rz = p.z - c.z; if (rx * rx + rz * rz > 3600) continue;
        const i = c.q.i, vs = c.vx * T.tx[i] + c.vz * T.tz[i], vd = c.vx * T.nx[i] + c.vz * T.nz[i], va = Math.abs(vs); if (va < 2) continue;
        const g = (p.s - c.q.s) * Math.sign(vs) - c.m.len / 2, t = Math.max(0, g) / va; if (g < -c.m.len || g > Math.max(12, va * 1.9)) continue;
        const lm = Math.max(T.w - 0.9, Math.abs(c.q.d)), dc = clamp(c.q.d + vd * Math.min(t, 0.6), -lm, lm);   // (where it will be across the road: drifting as it does now for a moment, off the asphalt only when it is already out there)
        if (Math.abs(p.d - dc) - c.m.wid / 2 < 1.1 + sp * 0.015 && t < bt) { best = c; bt = t; bdc = dc; }
      }
      if (!best) { p.fear = 0; return; }
      p.fear += dt;
      if (p.st !== 'flee' && p.fear < p.re) return;   // (the moment it takes to see it)
      const off = Math.abs(p.d) > this.T.w - 0.2; let sd = p.d >= bdc ? 1 : -1;
      if (off && sd !== Math.sign(p.d) && Math.abs(bdc) < T.w + 0.3) sd = Math.sign(p.d);
      if (p.st !== 'flee') { this._leaveZebra(p); p.fsd = sd; p.dive = bt * best.speed < 7 && Math.abs(p.d - bdc) < 1.8 ? 0.45 : 0; p.st = 'flee'; p.t = 0; }
      else if (off) p.fsd = sd;   // (on the road they keep to the way they chose; off it they stay off it)
      const i = T.idx(p.s); p.fx = T.nx[i] * p.fsd; p.fz = T.nz[i] * p.fsd; p.ft = 0.8;
    }
    _throw(p, vx, vz, sp) {   // thrown by a car going (vx, vz): up and along, spinning
      const R = this.R, s = Math.hypot(vx, vz) || sp || 1;
      this._leaveZebra(p);
      p.vx = vx * (0.75 + 0.15 * R()) + (R() - 0.5) * 1.5; p.vz = vz * (0.75 + 0.15 * R()) + (R() - 0.5) * 1.5; p.vy = 1.6 + Math.min(5, s * 0.12); p.y += 0.3;
      p.spin = (R() < 0.5 ? -1 : 1) * (3 + s * 0.3); p.roll = 0; p.st = 'fly'; p.t = 0; p.h = Math.atan2(vz, vx);
    }
    _penalty(c) { if (this.race.opts.traffic && !this.race.pol && c && !c.police) c.tfPen = (c.tfPen || 0) + TF_HIT_PEN; }   // (the duel: a time penalty for knocking someone down)
    // the race cars against the people: someone inside a car's outline (a little margin) is thrown by it; below 2 m/s just pushed aside.
    // The car loses a little speed (a person's momentum), the game hears of it (tf.ev)
    _hitPeds() {
      for (const p of this.ped) {
        if (p.off || p.st === 'fly' || p.st === 'down') continue;
        for (const c of this.cl) {
          const rx = p.x - c.x, rz = p.z - c.z; if (rx * rx + rz * rz > 16) continue;
          const ch = Math.cos(c.h), sh = Math.sin(c.h), lx = rx * ch + rz * sh, lz = -rx * sh + rz * ch, hl = c.m.len / 2 + 0.22, hw = c.m.wid / 2 + 0.22;
          if (Math.abs(lx) > hl || Math.abs(lz) > hw) continue;
          if (c.speed < 2) { const ox = hl - Math.abs(lx), oz = hw - Math.abs(lz); if (oz < ox) { p.x += -sh * Math.sign(lz || 1) * oz; p.z += ch * Math.sign(lz || 1) * oz; } else { p.x += ch * Math.sign(lx) * ox; p.z += sh * Math.sign(lx) * ox; } continue; }
          const k = TF_PED / (c.m.mass + TF_PED); c.vx -= c.vx * k; c.vz -= c.vz * k;
          this._throw(p, c.vx, c.vz, c.speed);
          c.fxCar = Math.max(c.fxCar || 0, 2.5);
          this._event(p.kind === 3 ? 'bike' : 'ped', c, p.x, p.z); if (p.kind !== 3) this._penalty(c);
          break;
        }
      }
      for (const v of this.veh) {   // a loose vehicle (or one still driving) sweeping someone off their feet
        if (v.off || Math.hypot(v.vx, v.vz) < 3) continue;
        for (const p of this.ped) {
          if (p.off || p.st === 'fly' || p.st === 'down' || p === v.rider) continue;
          const rx = p.x - v.x, rz = p.z - v.z; if (rx * rx + rz * rz > 49) continue;
          const ch = Math.cos(v.h), sh = Math.sin(v.h), lx = rx * ch + rz * sh, lz = -rx * sh + rz * ch;
          if (Math.abs(lx) < v.len / 2 + 0.2 && Math.abs(lz) < v.wid / 2 + 0.2) this._throw(p, v.vx, v.vz, 0);
        }
      }
    }

    // for the AI (and the autopilot): the corridor across the road it may drive in over the next stretch, from the vehicles and the people near
    // its way: one coming down at it keeps it to their right; a slower one going the same way is passed on their left, in the room left beside
    // the oncoming ones or with the other half clear far enough, else it stays behind; something standing (a wreck, someone on the road) is
    // passed on the side with more room. More room in the hairpins (the bodies turn across the road) and at speed. out = { lo, hi: the corridor (m across the
    // road), fol: what it must stay behind ({ o, len, vs }: the thing, its length, its speed along the road) or null }
    aiPlan(c, v, out) {
      const T = this.T, s = c.q.s, hw = c.m.wid / 2, cl2 = c.m.len / 2, edge = T.w - 0.3;
      c.tfStk = v < 1.5 && c.tfFol ? (c.tfStk || 0) + 0.15 : 0;   // (held up for a while: it squeezes by with less room)
      const sq = c.tfStk > 2.5 ? 0.3 : 1, mg = (os) => (0.9 + 0.9 * Math.min(1, Math.abs(T.k[T.idx(os)]) * 18) + 0.022 * v * 0.7) * sq;
      let lo = -1e9, hi = 1e9, fg = 1e9, clearL = 1e9, ng = 1e9, nO = null, nLen = 0, nVs = 0;
      out.fol = null;
      for (const o of this.veh) {   // the ones coming down: to their right
        if (o.off || o.st !== 0 || o.dir > 0 || o.v < 1) continue;   // (one standing still: below, with the other things standing)
        const g = o.s - s - cl2 - o.len / 2; if (g < -o.len - 2 || g > 260) continue;
        if (o.d < 1.2 && g > 0 && g < clearL) clearL = g;
        if (g < 20 + (v + o.v) * 2.2) lo = Math.max(lo, o.d + o.wid / 2 + hw + mg(o.s));
      }
      const block = (g, o, len, vs) => { if (g < fg) { fg = g; out.fol = { o, len, vs }; } };
      const one = (o, os, od, ow, olen, vs) => {
        const g = os - s - cl2 - olen / 2, cls = v - Math.max(0, vs);
        if (g < -olen - c.m.len - 1 || g > 20 + Math.max(0, cls) * 4.5 || (vs > 1 && cls < 1 && g > 10)) return;
        if (g < 0) { const m = 0.5 + 0.02 * v; if (c.q.d < od) hi = Math.min(hi, od - ow / 2 - hw - m); else lo = Math.max(lo, od + ow / 2 + hw + m); return; }   // (alongside: keep to its side)
        if (g < ng) { ng = g; nO = o; nLen = olen; nVs = vs; }
        const m = mg(os), pL = od - ow / 2 - hw - m, pR = od + ow / 2 + hw + m, lo2 = Math.max(lo, -edge + hw), rL = pL - lo2, rR = Math.min(hi, edge - hw) - pR;
        if (vs > 1) { if (rL >= 0.3 || (pL > -edge + hw && clearL > g + 45 + v * 2)) hi = Math.min(hi, pL); else block(g, o, olen, vs); return; }   // same way, slower
        if (rL >= 0 && rL >= rR) hi = Math.min(hi, pL); else if (rR >= 0) lo = Math.max(lo, pR); else block(g, o, olen, 0);   // standing
      };
      for (const o of this.veh) { if (o.off || (o.st === 0 && o.dir < 0 && o.v >= 1)) continue; const g = o.s - s; if (g < -20 || g > 220) continue; one(o, o.s, o.d, o.wid, o.len, o.st === 0 ? o.v * o.dir : 0); }
      for (const p of this.onRoad) { const t = Math.min(1.5, Math.max(0, p.s - s) / Math.max(5, v)), dP = clamp(p.d + (p.dd || 0) * t, -T.w - 1, T.w + 1); one(p, p.s, (p.d + dP) / 2, Math.abs(dP - p.d) + 0.7, 0.5, 0); }   // (someone on the road: from where they are to where they will be as it gets there)
      let vE = 0, sLo = -1e9, sHi = 1e9;   // (past a patrol car parked across the road the verge will do: how far out; a roadblock's or a spike strip's gap: a hard limit)
      if (this.race.pol) {
        let u0 = 1e9, u1 = -1e9, ub = null, ug = 1e9, uL = 0, ui = -1;   // (the roadblock: its cars together, from one edge across the road)
        for (const pc of this.race.pol.cars) if (pc !== c && pc.pol.mode !== 'chase') {   // (a patrol car parked: a roadblock, at a strip)
          const rel = pc.h - Math.atan2(T.tz[pc.q.i], T.tx[pc.q.i]), cs = Math.abs(Math.cos(rel)), sn = Math.abs(Math.sin(rel)), W = pc.m.len * sn + pc.m.wid * cs, L = pc.m.len * cs + pc.m.wid * sn;
          const g = pc.q.s - s - cl2 - L / 2; if (g < -L - c.m.len - 1 || g > 25 + v * 3) continue;
          if (pc.pol.block) { u0 = Math.min(u0, pc.q.d - W / 2); u1 = Math.max(u1, pc.q.d + W / 2); if (g < ug) { ug = g; ub = pc; uL = L; ui = pc.q.i; } continue; }
          const i = pc.q.i, eL = T.bl[i] - 0.7, eR = T.br[i] - 0.7, pL = pc.q.d - W / 2 - hw - 0.5, pR = pc.q.d + W / 2 + hw + 0.5, rL = pL - Math.max(lo, -eL + hw), rR = Math.min(hi, eR - hw) - pR;
          if (g < 0) { if (c.q.d < pc.q.d) { hi = Math.min(hi, pL); vE = Math.max(vE, -pL + hw); } else { lo = Math.max(lo, pR); vE = Math.max(vE, pR + hw); } continue; }
          if (rL >= 0 && rL >= rR) { hi = Math.min(hi, pL); vE = Math.max(vE, -pL + hw); } else if (rR >= 0) { lo = Math.max(lo, pR); vE = Math.max(vE, pR + hw); } else block(g, pc, L, 0);
        }
        if (ub) {   // through the gap beside the roadblock (the side with more room; once alongside it, the side it is on)
          const eL = T.bl[ui] - 0.7, eR = T.br[ui] - 0.7, pL = u0 - hw - 0.5, pR = u1 + hw + 0.5, rL = pL - (-eL + hw), rR = (eR - hw) - pR;
          const toL = ug < 0 ? c.q.d < (u0 + u1) / 2 : rL >= rR;
          if ((toL ? rL : rR) < 0 && ug >= 0) block(ug, ub, uL, 0);
          else if (toL) { sHi = Math.min(sHi, pL); vE = Math.max(vE, -pL + hw); } else { sLo = Math.max(sLo, pR); vE = Math.max(vE, pR + hw); }
        }
      }
      if (this.race.pol) for (const sp of this.race.pol.spikes) { const g = sp.s - s - cl2; if (!sp.on || g < -cl2 * 2 || g > 20 + v * 3) continue;   // (a spike strip ahead: through its gap, whatever else is there)
        if (sp.side > 0) sHi = Math.min(sHi, sp.d0 - hw - 0.35); else sLo = Math.max(sLo, sp.d1 + hw + 0.35); }
      const E = Math.max(edge, vE);
      if (sLo > lo || sHi < hi) {   // the gap: a hard limit; with no room in it beside the rest, behind the nearest thing, in the gap
        const a = Math.max(lo, sLo), b = Math.min(hi, sHi);
        if (a <= b - 0.2) { lo = a; hi = b; } else { if (nO) block(ng, nO, nLen, Math.max(0, nVs)); lo = sLo > -1e8 ? sLo : -E + hw; hi = sHi < 1e8 ? sHi : E - hw; if (lo > hi) lo = hi = sLo > -1e8 ? sLo : sHi; }
      } else if (lo > hi - 0.2 || lo > E - hw || hi < -E + hw) { if (nO) block(ng, nO, nLen, Math.max(0, nVs)); lo = Math.min(lo, E - hw); hi = Math.max(hi, -E + hw); if (lo > hi) lo = hi = (lo + hi) / 2; }
      out.lo = lo; out.hi = hi; out.edge = vE > edge ? vE - hw : 0;
      return out;
    }
    // the last resort, every step: something the car would touch soon at the present speeds (0.8 s, up to 1.3 s when closing fast), ahead of it
    // -> brake hard
    aeb(c) {
      const hw = c.m.wid / 2 + 0.2, hl = c.m.len / 2 + 0.3, ch = Math.cos(c.h), sh = Math.sin(c.h);
      const test = (dx, dz, rvx, rvz, oh, ol, ow) => {
        const rel = Math.abs(Math.cos(oh - c.h)), ex = ol * rel + ow * (1 - rel), ez = ow * rel + ol * (1 - rel), hor = clamp(-(rvx * ch + rvz * sh) / 10, 0.8, 1.3);
        for (let k = 1; k <= 4; k++) { const t = k * hor / 4, px = dx + rvx * t, pz = dz + rvz * t, lx = px * ch + pz * sh, lz = -px * sh + pz * ch;
          if (lx > 0 && lx < hl + ex && Math.abs(lz) < hw + ez) return true; }
        return false;
      };
      for (const o of this.veh) { if (o.off) continue; const dx = o.x - c.x, dz = o.z - c.z; if (dx * dx + dz * dz > 900) continue; if (test(dx, dz, o.vx - c.vx, o.vz - c.vz, o.h, o.len / 2, o.wid / 2)) return true; }
      for (const p of this.onRoad) { const dx = p.x - c.x, dz = p.z - c.z; if (dx * dx + dz * dz > 900) continue; if (test(dx, dz, -c.vx, -c.vz, 0, 0.35, 0.35)) return true; }
      return false;
    }
  }

  /* ---------------------------------------------------------------------
     THE RUN FROM THE POLICE (Race opts.police; an open road, Vršič): race.pol, the player alone up the road open to traffic (race.tf)
     --------------------------------------------------------------------- */
  // The police are after the player: one patrol car behind them at the start with its lights on (it sets off 2 s after them), more joining
  // from behind, out of sight, as the heat rises (the distance, people knocked down, patrol cars wrecked), up to four at once. A patrol car
  // (a VORTEX with a tuned engine) drives the road like the AI, its own corridor through the
  // traffic, faster the farther behind it is, until it is within ~55 m of the player; then it goes for them: at their place a moment ahead,
  // from behind into the bumper, alongside into the rear quarter (the PIT); once the player has stood still for a second it pulls up close
  // behind them and stops there (one alongside or ahead stops where it is). Ahead of the player, out of sight, the police lay spike strips across most of the road (a gap at one edge; the patrol
  // car that brought it parked at the side; laid when the player is 160 m away, pulled in once they are past) and block the road with two
  // cars across it (a gap at one edge; they join the chase once the player is through). A tyre over a strip goes flat (Car.flat; less grip,
  // more drag). A patrol car badly damaged, stuck or on flat tyres is out. Busted: nearly stopped (under 10 km/h) with a patrol car within
  // 9 m for 3 s (a meter that fills and drains; all of it by the difficulty: POL_DIFF). Escaped: over the pass.
  const POL_UPG = { motor: 3, gume: 2, zavore: 2, aero: 1 };
  // by the game's difficulty (easy, normal, hard): how many go for the player at once, the pause after a knock (s, + a random share), how much
  // faster a patrol car far behind drives, how many patrol cars at most, every how many seconds one more joins, the seconds stopped by one to be busted
  const POL_DIFF = [{ atk: 1, cool: 2.8, coolR: 1.6, rub: 0.2, max: 3, join: 34, bust: 4 }, { atk: 2, cool: 1.8, coolR: 1.2, rub: 0.3, max: 4, join: 26, bust: 3 }, { atk: 2, cool: 1.1, coolR: 0.8, rub: 0.4, max: 4, join: 20, bust: 2.5 }];
  class Police {
    constructor(race) {
      const T = race.track;
      this.race = race; this.T = T; this.R = rng(((race.opts.seed || 7) * 104729 + 7) >>> 0); this.RD = rng(((race.opts.seed || 7) * 7919 + 13) >>> 0);   // (RD: the patrol cars' loose panels, Race.step)
      this.D = POL_DIFF[clamp(race.opts.difficulty == null ? 1 : race.opts.difficulty, 0, 2)];
      this.cars = []; this.spikes = []; this.nid = 0;
      this.heat = 1; this.bust = 0; this.busted = false; this.escaped = false; this.joinT = 0; this.slowT = 0;
      this.wrecked = 0; this.flats = 0; this.hitPeople = 0; this.rams = 0; this._tfEv = 0;
      this.ev = 0; this.evK = ''; this.evX = 0; this.evZ = 0;   // the last event for the game: 'join', 'spikes', 'block', 'flat', 'ram', 'wreck', 'busted', 'escaped'
      // where the spike strips and the roadblocks go: straight stretches past the village (no bend tighter than a 200 m radius within 60 m), 1.4 km
      // apart at least: two strips, then a roadblock and a strip in turn
      const straight = (s) => { for (let d = -60; d <= 60; d += 4) if (Math.abs(T.k[T.idx(s + d)]) > 1 / 200) return false; return true; };
      this.plan = []; let last = -1e9;
      for (let s = T.startS + 3300; s < T.finishS - 200; s += 20) if (straight(s) && s - last > 1400) { const n = this.plan.length; this.plan.push({ s, kind: n < 2 || n % 2 ? 'spike' : 'block', done: false }); last = s; }
      this._car(T.startS - 38, 2.3, 0, 'chase', 2);   // (the first one, on the grid behind the player)
      if (race.player) race.player.dmgK = 0.6;
    }
    // a patrol car at s (m along the road), d across it, turned by rot from the road's direction; mode 'chase' or 'park'; off `delay` s after the start
    _car(s, d, rot, mode, delay) {
      const T = this.T, race = this.race, i = T.idx(s), o = race.opts, M = MODELS.find(m => m.id === 'vortex');
      const c = new Car(M, { id: 100 + (++this.nid), name: 'POLICIJA', color: 0xf2f4f6, skill: 1.05, assist: CSK.aiAssist, phys: o.phys, upg: POL_UPG });
      c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i] + rot); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.police = true; c.pol = { mode, t: 0, delay: delay || 0, spike: null }; c.skCap = 1.14; c.rubber = 1; c.dmgMode = o.damage == null ? 2 : o.damage; c.dmgK = 0.3; c.wet = race.cars[0] ? race.cars[0].wet : 1;
      c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.dist = c.q.s - T.startS; c.locked = mode !== 'chase' || race.state !== 'racing' || delay > 0;
      c.num = 0; this.cars.push(c); return c;
    }
    _event(k, x, z) { this.ev++; this.evK = k; this.evX = x; this.evZ = z; }

    // before the cars move: the plan ahead (strips, roadblocks), new patrol cars, every patrol car's driving
    pre(dt) {
      const race = this.race, P = race.player, T = this.T;
      if (!P) return;
      const run = race.state === 'racing' && !P.finished;
      if (run) {
        for (const e of this.plan) if (!e.done && P.q.s > e.s - 500) { e.done = true; if (e.kind === 'spike') this._spike(e.s); else this._block(e.s); }
        let n = 0; for (const c of this.cars) if (c.pol.mode === 'chase') n++;
        const want = Math.min(this.D.max, 1 + Math.floor(this.heat));
        if (n < want && (this.joinT += dt) > this.D.join && P.q.s - T.startS > 350) {   // one more from behind, out of sight
          this.joinT = 0; const c = this._car(P.q.s - 260, 2.3, 0, 'chase', 0); const v = Math.min(30, P.speed + 6); c.vx = Math.cos(c.h) * v; c.vz = Math.sin(c.h) * v; c.locked = false; this._event('join', c.x, c.z);
        }
      }
      // the two nearest patrol cars go for the player, the others keep their distance behind them
      const near = this.cars.filter(c => c.pol.mode === 'chase' && !c.locked && P.q.s - c.q.s < 55 && P.q.s - c.q.s > -20).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));
      for (const c of this.cars) c.pol.atk = near.indexOf(c) >= 0 && near.indexOf(c) < this.D.atk;
      for (const c of this.cars) {
        const pc = c.pol; pc.t += dt; if (pc.cool > 0) pc.cool -= dt;
        if (c.locked && pc.mode === 'chase' && race.state === 'racing' && race.time >= pc.delay) c.locked = false;
        polControl(c, race, dt);
        c.steer += clamp(c.inSteer - c.steer, -10 * dt, 10 * dt);
        c.step(dt, T);
      }
    }
    // the patrol cars against the race's car(s), each other and the barriers
    collide() {
      const T = this.T, cars = this.race.cars, pc = this.cars;
      for (let i = 0; i < pc.length; i++) {
        for (const c of cars) { const imp = carCollide(pc[i], c); if (imp > 2 && c.isPlayer && pc[i].pol.mode === 'chase') { this.rams++; if (!(pc[i].pol.cool > 0) && imp > 4) this._event('ram', c.contactX, c.contactZ); pc[i].pol.cool = this.D.cool + this.R() * this.D.coolR; } }   // (after a knock it keeps its distance for a moment)
        for (let j = i + 1; j < pc.length; j++) carCollide(pc[i], pc[j]);
        wallCollide(pc[i], T);
      }
    }
    // after the cars moved: where the patrol cars are, the strips (flat tyres), the ones out of it, the heat, busted or escaped
    post(dt) {
      const race = this.race, P = race.player, T = this.T;
      if (!P) return;
      for (const c of this.cars) {
        const q = T.query(c.x, c.z, c.q.i, c.q); c.sPrev = q.s; c.dist = q.s - T.startS; c.wet = P.wet;
        if (!Number.isFinite(c.x + c.z + c.vx + c.vz)) { c.pol.mode = 'out'; c.x = c.px; c.z = c.pz; c.vx = c.vz = c.w = 0; }
        if (c.pol.mode === 'chase' && !c.locked) {
          if (c.speed < 1.2) c.stuckT += dt; else c.stuckT = Math.max(0, c.stuckT - dt);
          const nFlat = ((c.flat || 0) & 1) + ((c.flat >> 1) & 1) + ((c.flat >> 2) & 1) + ((c.flat >> 3) & 1);
          if (c.dmg >= 0.95 || nFlat >= 3 || (c.stuckT > 6 && Math.abs(P.q.s - c.q.s) < 150)) { c.pol.mode = 'out'; this.wrecked++; this._event('wreck', c.x, c.z); }
          else if (c.stuckT > 6) c.pol.mode = 'gone';   // (stuck out of sight: taken off, another will come)
        }
      }
      // lost far behind: gone
      for (let k = this.cars.length - 1; k >= 0; k--) { const c = this.cars[k]; if (P.q.s - c.q.s > 1100 || c.pol.mode === 'gone' || (c.pol.mode === 'out' && P.q.s - c.q.s > 400)) this.cars.splice(k, 1); }
      // the strips: laid when the player is 160 m away, pulled in 8 s after they are past (the patrol car then joins the chase); a wheel over one: flat
      for (let k = this.spikes.length - 1; k >= 0; k--) {
        const sp = this.spikes[k];
        if (!sp.on && !sp.gone && P.q.s > sp.s - 160) { sp.on = true; this._event('spikes', sp.x, sp.z); }
        if (sp.on && P.q.s > sp.s + 12) { sp.t += dt; if (sp.t > 8) { sp.on = false; sp.gone = true; if (sp.car && sp.car.pol.mode === 'park') { sp.car.pol.mode = 'chase'; sp.car.pol.delay = race.time; } } }
        if (sp.gone && P.q.s - sp.s > 600) this.spikes.splice(k, 1);
        if (!sp.on) continue;
        for (let n = -1; n < this.cars.length; n++) { const c = n < 0 ? P : this.cars[n];
          if (!c.wq || c.police && c.pol.mode !== 'chase') continue;
          for (let w = 0; w < 4; w++) { const q = c.wq[w]; if (q.i >= 0 && !((c.flat || 0) & (1 << w)) && Math.abs(q.s - sp.s) < 0.5 && q.d > sp.d0 && q.d < sp.d1) {
            c.flat = (c.flat || 0) | (1 << w); if (c.isPlayer) { this.flats++; this._event('flat', c.x, c.z); } } }
        }
      }
      // the roadblocks: once the player is through, their cars join the chase
      for (const c of this.cars) if (c.pol.mode === 'park' && c.pol.block && P.q.s > c.q.s + 14) { c.pol.mode = 'chase'; c.pol.delay = race.time + 0.8; c.locked = true; }
      // the heat: the distance, people knocked down, patrol cars wrecked
      const tf = race.tf; if (tf && tf.ev !== this._tfEv) { this._tfEv = tf.ev; if (tf.evCar === P && (tf.evK === 'ped' || tf.evK === 'bike')) this.hitPeople++; }
      this.heat = clamp(1 + (P.q.s - T.startS) / 3500 + this.hitPeople * 0.4 + this.wrecked * 0.15, 1, 5); this.heatMax = Math.max(this.heatMax || 1, this.heat);
      // busted: nearly stopped with a patrol car close by for 3 s (the meter drains at half that pace)
      if (race.state === 'racing' && !P.finished) {
        let near = 1e9; for (const c of this.cars) if (c.pol.mode !== 'out') near = Math.min(near, Math.hypot(c.x - P.x, c.z - P.z));
        if (P.speed < 2.8 && near < 9) this.bust = Math.min(1, this.bust + dt / this.D.bust); else this.bust = Math.max(0, this.bust - dt / (2 * this.D.bust));
        this.slowT = P.speed < 2.8 ? this.slowT + dt : 0;
        if (this.bust >= 1) { this.busted = true; P.finished = true; P.busted = true; P.finishTime = race.time; P.finishPos = 0; P.noReverse = true; this._event('busted', P.x, P.z); }
      } else if (P.finished && !this.busted && !this.escaped) { this.escaped = true; this._event('escaped', P.x, P.z); }
    }
    // a spike strip across the road at s: from the edge on its side over all but the last 2.8 m at the other edge; the patrol car that brought it
    // parked just off the road before it, on the strip's side
    _spike(s) {
      const T = this.T, w = T.w, side = this.R() < 0.5 ? -1 : 1, i = T.idx(s), wk = T.walk ? T.walk[side > 0 ? 1 : 0][i] : 0;
      const d0 = side > 0 ? -w + 2.8 : -w - 0.6 - wk, d1 = side > 0 ? w + 0.6 + wk : w - 2.8;
      const sp = { s, d0, d1, side, on: false, gone: false, t: 0, x: T.px[i], z: T.pz[i], car: null };
      sp.car = this._car(s - 7, side * (w + wk + 1.6), 0, 'park', 0);
      this.spikes.push(sp);
    }
    // a roadblock at s: two patrol cars across the road in a V (each ~4.7 m across it), from one edge to a 3 m gap at the other, on any width
    _block(s) {
      const T = this.T, w = T.w, g = this.R() < 0.5 ? -1 : 1;
      const a = this._car(s, -g * (w - 2.3), -g * 1.2, 'park', 0), b = this._car(s + 3.5, g * (w - 5.5), g * 1.25, 'park', 0);
      a.pol.block = b.pol.block = true;
      const tf = this.race.tf; if (tf) for (const v of tf.veh) if (!v.off && Math.abs(v.s - s) < 150) tf._recycle(v);   // (the road closed there: the traffic by it gone, out of the player's sight 500 m below)
      this._event('block', a.x, a.z);
    }
  }
  // a patrol car's driving: parked (a strip, a roadblock) or out: brakes on. Chasing: the AI's (aiControl: the road, the corridor through the
  // traffic, faster the farther behind), and within ~55 m of the player it goes for them (see Police)
  function polControl(c, race, dt) {
    const P = race.player, T = race.track, pc = c.pol;
    if (pc.mode !== 'chase' || c.locked || !P) { c.inThr = 0; c.inBrk = 1; c.inSteer = 0; c.inHand = 0; return; }
    const gap = P.q.s - c.q.s;
    if (gap < -25 && !P.finished) { aiControl(c, race, dt); c.inThr = 0; c.inBrk = 1; return; }   // (got ahead of them: stops and waits for them to come by)
    c.rubber = 1 + clamp((gap - 50) / 350, 0, race.pol.D.rub);
    aiControl(c, race, dt);
    if (P.finished || gap > 55 || gap < -20 || P.busted) return;
    const sp = c.speed, t = clamp((gap - 1) / Math.max(6, sp - P.speed + 5), 0.05, 0.6);
    let tx = P.x + P.vx * t, tz = P.z + P.vz * t;
    if (race.pol.slowT > 1 && gap < 45) {   // (the player stopped for a second: up close behind them, a little to its side, and stop there: the arrest; one alongside or ahead stops where it is)
      if (gap < 3) { c.inThr = 0; c.inBrk = 1; c.inHand = 0; return; }
      const ch = Math.cos(P.h), sh = Math.sin(P.h), lat = (c.x - P.x) * -sh + (c.z - P.z) * ch, sd = lat > 0 ? 1 : -1;
      tx = P.x - ch * 5.2 - sh * sd * 1.1; tz = P.z - sh * 5.2 + ch * sd * 1.1;
      const dd = Math.hypot(tx - c.x, tz - c.z); steerAt(c, tx, tz);
      c.inThr = dd > 2.5 && sp < Math.min(14, dd * 0.8) ? clamp(dd / 15, 0.25, 1) : 0; c.inBrk = dd < 2.5 || sp > dd * 0.9 + 1 ? 0.7 : 0; c.inHand = 0; return;
    }
    if (!pc.atk || pc.cool > 0) {   // (not its turn, or just knocked them: on their tail, 12 m back)
      const ch = Math.cos(P.h), sh = Math.sin(P.h), back = pc.atk ? 9 : 14; tx = P.x - ch * back + P.vx * 0.3; tz = P.z - sh * back + P.vz * 0.3;
      steerAt(c, tx, tz); const g2 = gap - back; c.inThr = g2 > 4 ? 1 : g2 > 0 ? 0.4 : 0; c.inBrk = g2 < -2 ? 0.5 : 0; c.inHand = 0; return;
    }
    if (Math.abs(gap) < 4.5) { const ch = Math.cos(P.h), sh = Math.sin(P.h), lat = (c.x - P.x) * -sh + (c.z - P.z) * ch, sd = lat > 0 ? 1 : -1;   // alongside: into the rear quarter
      tx = P.x - ch * 1.4 - sh * sd * 0.2; tz = P.z - sh * 1.4 + ch * sd * 0.2; }
    steerAt(c, tx, tz);
    const close = sp - P.speed;
    c.inThr = gap > 10 || close < 7 ? 1 : 0.35; c.inBrk = gap < 3 && close > 12 ? 0.4 : 0; c.inHand = 0;
  }
  // a retired car (Race.retire) on its way off the line: it steers for its side's run-off (its centre 1.6 m past where its inner edge
  // clears the asphalt, nearer where the barrier is), eases off to a crawl on the way (7 m/s: no hard stop on the racing line) and drives
  // on at that pace once slower (one that retired standing, or spun, too; facing the wrong way: to the run-off ahead of its nose); there
  // (retiredOff) it stops and stands (wreck.stop). W.cr: seconds spent at a crawl short of it (the marshals take over, see Race._wreckStep)
  function retireControl(c, race, dt) {
    const T = race.track, q = c.q, W = c.wreck, v = Math.max(0, c.vl), hw = c.m.wid * 0.5;
    c.inHand = 0;
    if (retiredOff(T, c, 0.3)) {   // there: brake to a stop, then stand
      if (v <= 0.8) { parkBrake(c); W.stop = true; W.cr = 0; } else { c.inThr = 0; c.inBrk = 0.5; c.inSteer = 0; }
      return;
    }
    const lim = (W.side > 0 ? q.br : q.bl) - hw - 0.4, out = W.side * Math.max(T.w * 0.4, Math.min(T.w + hw + 1.6, lim));
    const back = Math.cos(c.h) * q.tx + Math.sin(c.h) * q.tz < 0, la = 4 + v * 0.7, i = T.idx(q.s + (back ? -la : la));
    steerAt(c, T.px[i] + T.nx[i] * out, T.pz[i] + T.nz[i] * out);
    if (v > 9) { c.inThr = 0; c.inBrk = clamp((v - 7) / 40, 0.12, 0.3); }
    else if (v < 6) { c.inThr = clamp(0.3 + (7 - v) * 0.04, 0.3, 0.6); c.inBrk = 0; }
    else { c.inThr = 0.15; c.inBrk = 0; }
    if (v < 2.5) W.cr += dt;
  }
  // where a retired car may stand (tol: how far its inner edge must be past the asphalt's edge): off the asphalt, or as far out as the
  // barrier lets it where the run-off is a little narrower than the car (0.7 m of it on the asphalt at most: GOLJAT's 3.2 m in Monaco),
  // and not in the way into or out of the pit lane (its side of the road)
  function retiredOff(T, c, tol) {
    const q = c.q, W = c.wreck, hw = c.m.wid * 0.5, ld = W.side * q.d, lim = (W.side > 0 ? q.br : q.bl) - hw - 0.4, pz = W.side > 0 && T.def.pit ? T.pitAt(q.s) : null;
    if (pz && pz.gap) return false;
    return ld - hw >= T.w + tol || (ld >= lim - 0.3 + Math.min(0, tol) && ld - hw >= T.w - 0.7);
  }
  // how a retired car of half width hw could stand at s (sample i) on side sd, its centre as far out as retireControl steers it and the
  // marshals put it (T.w + hw + 1.6 m, or 0.4 m short of the barrier): 2 clear of the asphalt (its inner edge 0.3 m past the edge or
  // more), 1 at the barrier with at most 0.7 m of it on the asphalt (retiredOff, tol -0.2: a run-off narrower than the car), 0 not (more
  // of it on the asphalt, or in the way into the pits)
  function standQ(T, s, i, sd, hw) {
    const lim = (sd > 0 ? T.br[i] : T.bl[i]) - hw - 0.4, pz = sd > 0 && T.def.pit ? T.pitAt(s) : null;
    if (pz && pz.gap) return 0;
    return lim >= T.w + hw + 0.3 ? 2 : lim >= T.w + hw - 0.7 ? 1 : 0;
  }
  // standing still on purpose (retired, waiting for the marshals): a light brake and the handbrake (a held brake pedal at a standstill
  // would engage reverse)
  function parkBrake(c) { c.inThr = 0; c.inBrk = 0.1; c.inHand = 1; c.inSteer = 0; }
  // steer a car at a point (the AI's pure pursuit, as in aiControl)
  function steerAt(c, tx, tz) {
    const v = Math.max(0, c.vl);
    const hA = c.speed > 3 ? Math.atan2(c.vz, c.vx) : c.h, ch = Math.cos(hA), sh = Math.sin(hA);
    const dx = tx - c.x, dz = tz - c.z, lx = dx * ch + dz * sh, ly = -dx * sh + dz * ch, dist = Math.max(3, Math.hypot(lx, ly)), kap = 2 * Math.sin(Math.atan2(ly, lx)) / dist;
    const wNeed = v * kap; c.inSteer = clamp((wNeed + CSK.aiKw * (wNeed - c.wPath)) / Math.max(0.05, c.csWcap || 1), -1, 1);   // (share of the path-rate cap)
  }

  /* ---------------------------------------------------------------------
     RACE
     --------------------------------------------------------------------- */
  const DRIVER_NAMES = ['M. Kovač', 'T. Hayashi', 'L. Rossi', 'J. Novak', 'K. Weber', 'A. Silva', 'R. Horvat', 'S. Tanaka', 'P. Dubois', 'N. Petek', 'E. Lindqvist', 'G. Moretti', 'D. Zupan', 'H. Kimura', 'F. Keller', 'O. Nieminen', 'B. Kranjc', 'C. Duarte', 'I. Kowalski', 'V. Andersen'];
  const AI_COLORS = [0xe8e8ee, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xf07a1a, 0x9a2bd8, 0x19b7c7, 0xd81f45, 0xc9c3b0, 0x6b8e23, 0xff5fa2, 0x3b3fa8, 0x8a1c2b, 0x0f5e4e, 0x8ec9e8, 0xb87333, 0x6b737c, 0xb4dc2c, 0xc2187a];
  const CAR_NUMS = [7, 3, 11, 21, 5, 44, 9, 16, 27, 8, 12, 33, 2, 55, 14, 23, 31, 46, 63, 77, 88];   // by grid slot (the player's own number replaces the one of its slot)
  // the AI drivers in grid order (the fastest first): name, car and colour are the same in every race (a championship's standings follow them).
  // Their cars (aiModel, the one place that picks them): the field of the player's vehicle (pm.field: ids; left out: a retired model, and
  // one with a glb player-only skin and no render look of its own for the AI's cars (def.look: the PEUGEOT 206 once its loft is there);
  // a field left empty: none), driver k in field[k % n]; without a vehicle or a field, the four road cars in turn (MODELS[(k * 3 + 1) % 4],
  // the same objects as always)
  const aiBody = (M) => !M.glb || !!(M.def && M.def.look);
  function fieldOf(pm) {
    if (!pm || !pm.field) return null;
    const L = []; for (const id of pm.field) { const M = MODELS.find(m => m.id === id); if (M && aiBody(M) && !M.retired) L.push(M); }
    return L.length ? L : null;
  }
  function aiModel(k, pm) { const F = fieldOf(pm); return F ? F[k % F.length] : MODELS[(k * 3 + 1) % 4]; }
  // how many AI cars a race of this vehicle has when n are asked for: model.fieldN at most when its field races (not a one-make class:
  // the formula's rivals are formulas); the qualifying sim sizes itself by it
  const fieldSize = (pm, n) => { const F = pm && !pm.oneMake ? fieldOf(pm) : null; return F && pm.fieldN ? Math.min(n, pm.fieldN) : n; };
  const aiDriver = (k, pm) => ({ name: DRIVER_NAMES[k % DRIVER_NAMES.length], model: aiModel(k, pm), color: AI_COLORS[k % AI_COLORS.length] });
  // AI pace per difficulty: [slowest skill, fastest skill, rubber band: slow-down when far ahead of the player (max, from metres), speed-up when behind (max, from metres)]
  // (skill 1 = the racing-line speed profile; the cars' own limit on the autopilot is about 1.12, the little pico understeers past ~1.08)
  const DIFF = [
    [0.78, 0.86, 0.06, 60, 0.05, 40],    // lahka
    [0.88, 0.97, 0.04, 90, 0.05, 40],    // srednja
    [1.02, 1.12, 0.01, 200, 0.06, 30],   // težka: the front runners drive at the limit and hardly wait for anyone
  ];

  class Race {
    constructor(track, opts) {
      if (opts.phys !== 'cs') opts = Object.assign({}, opts, { phys: 'cs' });   // one driving physics, Circuit Superstars (the old 'rally' and 'arcade' map to it, as in Car)
      if (track.def.rivals && opts.numAI > 0 && !opts.noPlayer && !opts.remote && !opts.champ) opts = Object.assign({}, opts, { numAI: track.def.rivals });   // a track's own field size (def.rivals) in a normal race; not the title-screen demo, a time trial, an online race or a championship round (its own drivers in every round)
      this.track = track;
      this.opts = opts;
      this.laps = opts.laps || 3;
      this.time = 0; this.state = 'grid'; this.countdown = 0;
      this.cars = []; this.debris = []; this.debrisId = 0; this.props = null; this.propBk = null; this.propSlots = null; this.propCap = null;
      this.finishOrder = [];
      // time trial (def.timeTrial, e.g. the Pikes Peak hill climb; a track with both ways to drive it, def.modes, driven as one when
      // opts.tt): the player alone, standing ON the start line; the clock is race.time
      this.timeTrial = !!((track.def.timeTrial || (opts.tt && !opts.remote && (track.def.modes || []).indexOf('tt') >= 0)) && !opts.noPlayer);
      this._rq = [];   // open road + noPlayer (menu demo): cars that reached the top, waiting for a free spot at the start
      // a field race: the AI drive the field of the player's vehicle (or of opts.fieldModel: a championship's car, the title demo's
      // category; see aiModel), at most model.fieldN of them (the big vehicles); this.field: its models, null in any other race
      const oneMake = opts.playerModel && opts.playerModel.oneMake ? opts.playerModel : null;   // the player in the formula: every rival in one too
      const FM = oneMake ? null : opts.fieldModel || opts.playerModel || null, field = fieldOf(FM);
      this.field = field;
      const nAI = fieldSize(FM, this.timeTrial ? 0 : opts.numAI == null ? 12 : opts.numAI);
      const RM = opts.remote || null;   // online race: the friend's car { model, color, num, name, grid }, driven by the friend's phone
      // opts.aiOrder: which AI drivers (their roster indices, 0 the fastest) stand on the grid and in what order (after qualifying; one
      // of them alone for its qualifying lap), each with its own skill as in the full roster; default: all of them, the fastest first
      const order = Array.isArray(opts.aiOrder) ? opts.aiOrder.filter((k, j, a) => k >= 0 && k < nAI && a.indexOf(k) === j) : null;
      const total = (order ? order.length : nAI) + (opts.noPlayer ? 0 : 1) + (RM ? 1 : 0);
      this._gridN = total;
      const playerGrid = opts.noPlayer ? -1 : Math.min(total, opts.playerGrid || 12);
      const remoteGrid = RM ? Math.min(total, RM.grid || total) : -1;
      const R = rng(opts.seed || 7);
      // AI roster
      const diff = DIFF[opts.difficulty == null ? 1 : opts.difficulty]; this.diff = diff;
      if (oneMake) this.oneMake = oneMake;
      const aiSpecs = [];
      for (let k = 0; k < nAI; k++) {
        const skill = lerp(diff[1], diff[0], k / Math.max(1, nAI - 1)) + (R() - 0.5) * 0.012;
        aiSpecs.push(Object.assign({ skill }, aiDriver(k, field ? FM : null), oneMake ? { model: oneMake } : null));   // (a formula race: the same drivers, in formulas)
      }
      // grid: fastest first
      let ai = 0;
      for (let g = 1; g <= total; g++) {
        let c;
        if (g === playerGrid) {
          c = new Car(opts.playerModel || MODELS[0], { id: g, isPlayer: true, phys: opts.phys, name: 'TI', color: opts.playerColor, assist: opts.assist, upg: opts.playerUpg, setup: opts.playerSetup });
          this.player = c;
        } else if (g === remoteGrid) {
          c = new Car(RM.model || MODELS[0], { id: g, net: true, phys: opts.phys, name: RM.name || 'Prijatelj', color: RM.color });
          this.remote = c;
        } else {
          const s = aiSpecs[order ? order[ai++] : ai++];
          c = new Car(s.model, { id: g, name: s.name, color: s.color, skill: s.skill, assist: CSK.aiAssist, phys: opts.phys, laneBias: (R() - 0.5) * 1.6 });
          c.skCap = s.model.id === 'pico' ? 1.0 : CSK.aiSkCap;   // no point pushing a car past what it can hold (the light pico understeers into the walls beyond the line's own pace)
        }
        c.grid = g; c.num = CAR_NUMS[(g - 1) % CAR_NUMS.length]; if (playerGrid > 0 && !c.isPlayer && c.num === opts.playerNum) c.num = CAR_NUMS[(playerGrid - 1) % CAR_NUMS.length];   // (not the player's own number: that car takes the one of the player's slot)
        c.rubber = 1;
        c.dmgMode = opts.damage == null ? 2 : opts.damage;
        this.cars.push(c);
        this._placeOnGrid(c, g);
      }
      if (this.player) this.player.num = opts.playerNum || 1;
      if (this.remote) this.remote.num = RM.num || 2;
      // winter (opts.winter): cold tarmac grips a little less (x0.94), a gravel road packed with snow much less (x0.74): on every car's grip and the AI's profile
      this.cold = { gk: opts.winter ? (track.def.roadSurface === 'makadam' ? 0.74 : 0.94) : 1 };   // (in an object: the golden references digest only the plain fields)
      this.rain = 0; this._wet(opts.rain);
      // tyres and a changing weather (opts.tyres; opts.weather = { at, dur, to }: the rain goes from opts.rain to `to` over dur s from race time
      // at). The water on the road follows the rain (wet in about a minute, dry in about four, the racing line twice as fast); a car's grip
      // follows its tyres (c.ty = { k: 'dry' | 'wet', wear }), the water where it drives (on the line or off it) and the wear (see _weather).
      // wst.ev / evK: 'rain' when it starts to rain, 'dry' when it stops
      const WX = opts.weather && !opts.remote ? opts.weather : null;
      this.wst = { on: !!(opts.tyres || WX), tyres: !!opts.tyres, water: this.rain, line: this.rain, profW: (this.rain ? 1 - (1 - WET) * this.rain : 1) * this.cold.gk, ev: 0, evK: '',
        wx: WX ? { at: Math.max(0, +WX.at || 0), dur: Math.max(1, +WX.dur || 60), r0: this.rain, r1: clamp(+WX.to || 0, 0, 1) } : null };
      if (opts.tyres) for (const c of this.cars) c.ty = { k: c.isPlayer && (opts.playerTyre === 'dry' || opts.playerTyre === 'wet') ? opts.playerTyre : tyreFor(this.rain), wear: 0 };
      // compounds (opts.compounds): every car's slicks one of TYRE_CMP (the rain tyres have none): the player's choice (opts.playerCmp, else by
      // the race's length), the AI's by the race's length and the grid slot (no random draw); new ones at a stop as the car asks (c.pitCmp) or
      // for what is left of the race
      if (opts.tyres && opts.compounds) { const D = this.laps * track.len; for (const c of this.cars) if (c.ty) c.ty.c = c.isPlayer ? (TYRE_CMP[opts.playerCmp] ? opts.playerCmp : cmpFor(D)) : cmpAI(D, c.grid); }
      if (track.drs) this.drsLast = track.drs.map(() => null);   // (per DRS zone: who crossed its detection line last, and when)
      this.sec = { best: [Infinity, Infinity, Infinity] };   // sector times on a circuit without TV sectors (thirds of the lap, see _thirds): the fastest of anyone in this race
      // flags (opts.flags, a closed circuit with rivals): a yellow flag where a car has stopped on the track, the safety car after a heavy
      // crash (see _flags). ev / evK: 'yellow', 'sc' (out), 'scIn' (in this lap), 'scGone' (in the pits: no overtaking until the leader is
      // at the line), 'green'; pev / pevK, the player: 'passWarn' (overtook under a flag: give the place back), 'passOk', 'pen' (+5 s)
      this.fl = opts.flags && !track.open && total > 1 ? { yel: [], ev: 0, evK: '', sc: null, scUsed: false, pev: 0, pevK: '' } : null;
      if (track.sectors) this.secBest = [Infinity, Infinity, Infinity];   // (the best time in each sector of the race so far)
      this._prof();
      // the open road (Vršič): its traffic and its people (opts.traffic: the duel with one rival; opts.police: the run from the police)
      if (track.open && (opts.traffic || opts.police) && !opts.noPlayer && !this.timeTrial) this.tf = new Traffic(this, opts.police ? 0.85 : 1);
      if (track.open && opts.police && !opts.noPlayer && !this.timeTrial) this.pol = new Police(this);   // (the run from the police: race.pol)
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

    // rain (0 dry .. 1 wet, opts.rain): the grip of every car; the renderer follows race.rain (streaks, spray, a wet road)
    _wet(r) { r = clamp(+r || 0, 0, 1); this.rain = r; const w = (1 - (1 - WET) * r) * this.cold.gk; for (const c of this.cars) c.wet = w; }
    setRain(r) { this._wet(r); const W = this.wst; if (W) { W.water = W.line = this.rain; W.profW = (1 - (1 - WET) * this.rain) * this.cold.gk; } this._prof(); }   // (title demo: the weather setting at once)
    get water() { return this.wst ? this.wst.water : this.rain; }       // the water on the road (0..1; the renderer's wet road)
    get lineWater() { return this.wst ? this.wst.line : this.rain; }    // ... on the racing line (it dries first)
    // the rain on its schedule, the water on the road, every car's grip (with tyres); the AI's speed profile follows the grip on the line
    _weather(dt) {
      const W = this.wst, X = W.wx, T = this.track;
      if (X && this.state === 'racing') {
        const r = X.r0 + (X.r1 - X.r0) * clamp((this.time - X.at) / X.dur, 0, 1);
        if (this.rain === 0 && r > 0) { W.ev++; W.evK = 'rain'; } else if (this.rain > 0 && r === 0) { W.ev++; W.evK = 'dry'; }
        this.rain = r;
      }
      const r = this.rain;
      if (W.water < r) { W.water = Math.min(r, W.water + dt / 45 * (0.3 + r)); W.line = W.water; }
      else { W.water = Math.max(r, W.water - dt / 240); W.line = Math.min(W.water, Math.max(r, W.line - dt / 120)); }
      for (const c of this.cars) { if (c.net) continue;   // (the water where it drives: the racing line dries first)
        const w = c.q && c.q.i >= 0 && T.rl && Math.abs(c.q.d - T.rl[c.q.i]) < 2.2 ? W.line : W.water;
        const K = W.tyres && c.ty ? tyreK(c.ty) : null;   // (a compound: its grip, and what wear takes from it)
        c.wet = (W.tyres && c.ty ? TYRE_GRIP[c.ty.k](w) * (K ? K.g * (1 - K.loss * c.ty.wear) : 1 - 0.1 * c.ty.wear) : 1 - (1 - WET) * w) * this.cold.gk; }
      const pw = (W.tyres ? TYRE_GRIP[tyreFor(W.line)](W.line) : 1 - (1 - WET) * W.water) * this.cold.gk;
      if (Math.abs(pw - W.profW) > 0.012) { W.profW = pw; this._prof(); }
    }
    // an AI car's box in the pit lane (metres from the start line): along the crews' row (def.pitRow), by its grid slot, clear of the player's
    _aiBox(c) {
      const P = this.track.def.pit, R = this.track.def.pitRow || [P[1] + 60, P[2] - 40], k = (c.grid - 1) % 13;
      let d = R[0] + (R[1] - R[0]) * k / 12; if (Math.abs(d - P[3]) < 9) d += d < P[3] ? -9 : 9;
      return d;
    }

    // speed profile for the AI (on the racing line); an upgraded player's autopilot brakes later with better brakes (its own profile).
    // Rain: the corners as much slower as the grip is lower, the braking as the brakes (see Car). A formula race: the formula's profile (its
    // grip against the road cars' ~1.8, the wings' grip growing with speed, its brakes, its path-rate cap)
    _prof() {
      const opts = this.opts, track = this.track, w = this.wst && this.wst.on ? this.wst.profW : (this.rain ? 1 - (1 - WET) * this.rain : 1) * this.cold.gk, F = this.oneMake;
      const wM0 = CSK.aiWmax;
      let latA0 = opts.aiLatA || CSK.aiLatA, brA0 = opts.aiBrakeA || CSK.aiBrakeA;
      if (w < 1) { latA0 *= w; brA0 *= 0.55 + 0.45 * w; }
      const lat = latA0 * (F ? ARC[F.id].amax / 1.8 : 1), fb = F ? (F.brakeK || 1) : 1, br = brA0 * fb, wM = wM0 * (F ? CSP[F.id].w : 1), aero = F ? F.aero : 0, bG = BRAKE_G * fb;
      const sM = (this.wst && this.wst.on ? this.wst.water : this.rain) > 0 ? 0.78 : 0.9;   // the cobbles' grip (CSSURF 7 / 8, relative: the rain is already in w)
      this.vprof = track.speedProfile(lat, br, 85, wM, aero, sM);
      if (this.field) {   // a field race: every model's own profile (its grip, brakes, path-rate cap, wings), for each AI car and the player's autopilot
        const own = new Map(), of = (M) => {
          let v = own.get(M.id);
          if (!v) { v = track.speedProfile(latA0 * (ARC[M.id] || ARC.kaze).amax / 1.8, brA0 * (M.brakeK || 1), 85, wM0 * (CSP[M.id] || CSP.kaze).w, M.aero || 0, sM); own.set(M.id, v); }
          return v;
        };
        for (const c of this.cars) if (!c.net && !c.isPlayer) c.vprof = of(c.m);
        const P = this.player;   // (upgraded brakes: its own model's profile, braking later by as much)
        if (P) { const Mp = P.m, bP = BRAKE_G * (Mp.brakeK || 1); P.vprof = P.upg && P.brakeG !== bP ? track.speedProfile(latA0 * (ARC[Mp.id] || ARC.kaze).amax / 1.8, brA0 * (Mp.brakeK || 1) * P.brakeG / bP, 85, wM0 * (CSP[Mp.id] || CSP.kaze).w, Mp.aero || 0, sM) : of(Mp); }
      } else if (this.player && this.player.upg && this.player.brakeG !== bG) this.player.vprof = track.speedProfile(lat, br * this.player.brakeG / bG, 85, wM, aero, sM);
    }

    _gridBack(g) {   // metres behind the start line of grid slot g
      const T = this.track;
      if (this.timeTrial) return 0;
      if (this.opts.qualiBack > 0 && !T.open) return this.opts.qualiBack;   // qualifying: one car, its run-up to a flying lap
      if (this.opts.remote) return 9;   // online: the two of them side by side on the front row (the same distance to the line)
      if (!T.open) return 9 + (g - 1) * 7.5;
      // a race up an open road (Vršič): the circuits' grid, where the road below the start line leaves room for it
      if (!this.opts.noPlayer && T.startS >= 13 + (this._gridN - 1) * 7.5) return 9 + (g - 1) * 7.5;
      // open road: the grid has to fit between the bottom end of the road and the start line (two abreast, staggered)
      const sp = clamp((T.startS - 9) / Math.max(1, this._gridN - 1), 2.4, 3.6);
      return Math.min(3 + (g - 1) * sp, T.startS - 4);
    }
    _placeOnGrid(c, g) {
      const T = this.track;
      const back = this._gridBack(g);
      const s = T.startS - back;
      const i = this.timeTrial ? T.startIdx : T.idx(s);
      const lat = this.timeTrial ? 0 : this.opts.qualiBack > 0 && !T.open ? T.rl[i] : (g % 2 === 1 ? -1 : 1) * Math.min(3.4, T.w - 1.6);   // (qualifying: on the racing line; a narrow road: the two columns closer together)
      const x = T.px[i] + T.nx[i] * lat, z = T.pz[i] + T.nz[i] * lat;
      c.place(x, z, T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; if (T.open) c.roadY = c.y; }   // (open road: the camera starts at the right height)
      c.dist = -back; c.lap = 0;
      c.cp = 0; c.splits = [];
      c.q = T.query(x, z, i, {});
      c.sPrev = c.q.s;
      c.locked = true;
    }

    spawnDebris(c, name, R) {   // (R: the random numbers for its throw, default Math.random; a patrol car's: the police's own, see step)
      const rnd = R || Math.random;
      const P = partsOf(c.m)[name], hl = c.m.len * 0.5, hw = c.m.wid * 0.5, ch = Math.cos(c.h), sh = Math.sin(c.h);
      const ox = P.lx * hl, oz = P.lz * hw, x = c.x + ox * ch - oz * sh, z = c.z + ox * sh + oz * ch;
      const ol = Math.hypot(ox, oz) || 1, ux = (ox * ch - oz * sh) / ol, uz = (ox * sh + oz * ch) / ol, out = 2 + rnd() * 3;
      const d = { id: ++this.debrisId, car: c.id, part: name, x, z, y: (c.y || 0) + P.y, vx: c.vx * 0.7 + ux * out, vz: c.vz * 0.7 + uz * out, vy: 2.5 + rnd() * 2.5,
        yaw: c.h, rx: 0, rz: 0, wx: (rnd() - 0.5) * 16, wy: (rnd() - 0.5) * 12, wz: (rnd() - 0.5) * 16, r: P.r, m: P.m, h: P.h, rest: false, ground: false,
        q: this.track.cross.length && c.q.i >= 0 ? { i: c.q.i } : null, dead: false };   // (a figure of eight: the part starts on its car's level, not on the nearest leg)
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
    propFx(b, v) { if (v < 3) return; const E = this.propEvents || (this.propEvents = []); if (E.length < 24) E.push({ x: b.x, y: b.y, z: b.z, kind: b.kind, v, i: b.qi }); }   // for the renderer: dust / straw puffs (i: the prop's sample, where the puff lands)
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
      if (this.wst && this.wst.on) this._weather(dt);
      T.inRain = (this.wst && this.wst.on ? this.wst.water : this.rain) > 0;   // (the puddles; the track is shared with the title screen's race: the weather of the race being stepped)
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
          if (!dnf(c)) aiControl(c, this, dt);
          if (c.finished) { c.inThr *= 0.5; }
        } else { c.inThr = 0; c.inBrk = c.parkQ ? 1 : 0; c.inSteer = 0; }
      }
      for (const c of cars) if (c.wreck && !c.net) this._wreckStep(c, dt);   // kit vehicles: a wreck sheds its parts, a destroyed one retires (see _wreckStep)
      for (const c of cars) {
        if (c.net) continue;   // (the friend's car: placed from the network, see game.js)
        if (c.pitState === 'repair') { c.inThr = 0; c.inBrk = 0; c.inSteer = 0; c.inHand = 0; }   // on the jacks: the mechanics are working (held in place below; no brake, so the gearbox stays in first)
        // steering smoothing
        const target = c.inSteer;
        const rate = c.isPlayer ? (c.digitalSteer ? (Math.abs(target) < Math.abs(c.steer) || target * c.steer < 0 ? 10 : 6) : 16) : 10;
        c.steer += clamp(target - c.steer, -rate * dt, rate * dt);
        c.step(dt, T);
      }
      const SC = this.fl && this.fl.sc && this.fl.sc.car;   // (the safety car, when it is out: driven here, not one of the race's cars)
      if (SC) { aiControl(SC, this, dt); SC.steer += clamp(SC.inSteer - SC.steer, -10 * dt, 10 * dt); SC.step(dt, T); }
      if (this.pol) this.pol.pre(dt);   // the run from the police: the patrol cars drive
      if (this.tf) this.tf.step(dt);   // the open road: the traffic and the people move, the race cars run into them
      // collisions (a figure of eight: a car on the bridge and one under it do not touch)
      const lv = T.cross.length > 0;
      const pk = T.open && !this.timeTrial;   // (a race up an open road: the cars past the finish pull up in their slots and do not push each other about)
      for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) if ((!lv || Math.abs((cars[i].y || 0) - (cars[j].y || 0)) < 3) && !(pk && cars[i].finished && cars[j].finished)) carCollide(cars[i], cars[j]);
      }
      if (SC) { for (const c of cars) if (!c.net && (!lv || Math.abs((c.y || 0) - (SC.y || 0)) < 3)) carCollide(SC, c); wallCollide(SC, T); }
      if (this.pol) this.pol.collide();
      if (T.def.pit) for (const c of cars) if (c.isPlayer || c.pitWant || c.inPit) this.pitStep(c, dt, true);   // which side of the pit wall the car is on (before the walls push it; AI: on the way in for tyres)
      for (const c of cars) if (!c.net) wallCollide(c, T);
      if (T.def.pit) for (const c of cars) if (c.isPlayer || c.pitWant || c.inPit) this.pitStep(c, dt, false);  // speed limiter, stopping at the box, repair
      for (const c of cars) if (c.detach.length) { for (const name of c.detach) this.spawnDebris(c, name); c.detach.length = 0; }
      if (this.pol) for (const c of this.pol.cars) if (c.detach.length) { for (const name of c.detach) this.spawnDebris(c, name, this.pol.RD); c.detach.length = 0; }   // (the run from the police: a battered patrol car's panels on the road too, thrown with the police's own random numbers: the race's draws stay as they were)
      for (const c of cars) if (!c.net && !Number.isFinite(c.x + c.z + c.vx + c.vz + c.h + c.w + (c.y || 0))) { c.x = c.z = c.vx = c.vz = c.w = c.h = 0; c.y = 0; c.vy = 0; c.air = 0; c.q.s = c.goodS || 0; c.q.i = -1; this.rescue(c); }
      if (this.debris.length) { for (const d of this.debris) stepDebris(d, T, dt); for (const c of cars) if (!c.net) for (const d of this.debris) if (!lv || Math.abs(d.y - (c.y || 0)) < 4) debrisHit(c, d); }
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
        if (this.state !== 'grid' && !T.open && !dnf(c)) {   // (a retired car rolling over the line: no lap, never a finish)
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
        if (this.secBest) this._sectors(c, ds, dt);   // (TV sectors: the Red Bull Ring's)
        else if (!T.open && this.state !== 'grid') this._thirds(c);   // (elsewhere: the thirds of the lap)
        if (c.ty && ds > 0 && this.state === 'racing') {   // tyre wear: 0.8 % a km, up to 4 % more a km in a full slide; rain tyres on a drying road 2.5 times as fast
          const W = this.wst, sl = Math.min(1, Math.abs(c.beta || 0) / 0.35);
          const K = tyreK(c.ty);
          c.ty.wear = Math.min(1, c.ty.wear + ds * (0.000008 + 0.00004 * sl) * (c.ty.k === 'wet' && W.line < 0.25 ? 2.5 : 1) * (K ? K.wr : 1));
          // a breakable vehicle with a wheel knocked off: in for a new one first (a track with pits; not in the last 40 % of a lap; the stop
          // gives it the tyres for the water too), by the rules of the tyre stops below
          if (c.wreck && c.wreck.wl && !c.wreck.dnf) {
            if (T.def.pit && !c.isPlayer && !c.net && !c.finished && !c.pitWant && !c.inPit && !T.pitAt(q.s) && this.laps * T.len - c.dist > T.len * 0.4) {
              let n = 0; for (const o of cars) if (!o.isPlayer && (o.pitWant || o.inPit)) n++;
              if (n < 3) c.pitWant = true;
            }
          }
          // an AI car on the wrong tyres goes in for the right ones (a track with pits; not in the last 40 % of a lap)
          // (not in the pit zone: from before its way in; each driver with a threshold of its own, not all on the same lap; at most three on
          // their way in or in the lane at a time, the others wait a lap)
          else if (T.def.pit && !c.isPlayer && !c.net && !c.finished && !c.pitWant && !c.inPit && c.ty.k !== tyreFor(W.line) && !T.pitAt(q.s)) {
            const j = ((c.grid * 7) % 13) / 12;
            if ((c.ty.k === 'dry' ? W.line > 0.35 + 0.35 * j : W.line < 0.04 + 0.16 * j && this.rain < 0.05) && this.laps * T.len - c.dist > T.len * 0.4) {
              let n = 0; for (const o of cars) if (!o.isPlayer && (o.pitWant || o.inPit)) n++;
              if (n < 3) c.pitWant = true;
            }
          }
          // (compounds: worn-out slicks, with more than a lap still to go: in for a fresh set, by the same rules)
          else if (K && T.def.pit && !c.isPlayer && !c.net && !c.finished && !c.pitWant && !c.inPit && c.ty.wear > 0.72 + 0.1 * (((c.grid * 7) % 13) / 12) && !T.pitAt(q.s) && this.laps * T.len - c.dist > T.len * 1.05) {
            let n = 0; for (const o of cars) if (!o.isPlayer && (o.pitWant || o.inPit)) n++;
            if (n < 3) c.pitWant = true;
          }
        }
        // wrong way
        const fwd = Math.cos(c.h) * q.tx + Math.sin(c.h) * q.tz;
        if (fwd < -0.2 && c.speed > 3) c.wrongT += dt; else c.wrongT = Math.max(0, c.wrongT - dt * 2);
        // stuck detection (AI auto-rescue)
        if (!c.locked && (!c.pitState || (c.ty && !c.isPlayer && c.pitState === 'done')) && c.speed < 1.2 && (this.state === 'racing' || this.state === 'done') && !(T.open && c.finished)) c.stuckT += dt; else c.stuckT = Math.max(0, c.stuckT - dt);   // (an AI car that came in for tyres: also when stuck on its way out; pulled up past the finish of an open road: not stuck)
        if (!c.isPlayer && (c.stuckT > (c.ty && c.inPit ? 12 : 3.5) || c.wrongT > 3) && !(T.open && c.finished) && !(c.wreck && (c.wreck.dnf || c.wreck.hold > 0))) this.rescue(c);   // (in for tyres: waiting in the pit lane behind a car at its box is no reason; not a car pulled up past the finish of an open road, nor a retired one or one the marshals are fixing)
      }
      if (this._rq.length) this._serveRespawn();
      if (this.pol) this.pol.post(dt);
      this.stepProps(dt);
      // order
      this.order = cars.slice().sort((a, b) => {
        if (a.finished && b.finished) return a.finishPos - b.finishPos;
        if (a.finished) return -1; if (b.finished) return 1;
        const ra = dnf(a), rb = dnf(b); if (ra !== rb) return ra ? 1 : -1;   // (a retired car: behind everyone still racing)
        return b.dist - a.dist;
      });
      for (let i = 0; i < this.order.length; i++) this.order[i].pos = i + 1;
      if (this.fl) this._flags(dt);
    }

    // ---- pit lane: 60 km/h limit, the car pulls up at its box, the crew repairs it (time depends on the damage), then off you go ----
    pitStep(c, dt, pre) {
      const T = this.track, P = T.def.pit, q = T.query(c.x, c.z, c.q.i, _pq2), pz = T.pitAt(q.s);
      if (pre) {
        if (!pz) { if (c.inPit) { c.inPit = false; c.pitEv = 'exit'; if (!c.isPlayer) c.pitWant = false; } c.pitDone = false; c.pitState = null; return; }
        if (pz.gap) { const was = c.inPit; c.inPit = q.d > pz.wall; if (c.inPit && !was) c.pitEv = 'enter'; else if (!c.inPit && was) { c.pitEv = 'exit'; c.pitDone = false; c.pitState = null; if (!c.isPlayer) c.pitWant = false; } }   // (an AI car out of the lane: on with the race)
        else if (!c.isPlayer && !c.inPit && pz.d < 0) c.pitWant = false;   // (an AI car that missed the way in: the next lap)
        return;
      }
      if (!c.inPit || !pz) return;
      const sp = Math.hypot(c.vx, c.vz), lim = PIT_V;
      if (c.pitState === 'repair') {
        c.vx = c.vz = 0; c.w = 0; c.pitT += dt; c.stuckT = 0;
        if (c.pitT >= c.pitDur) {   // (tyres: a new set, the ones for the water on the line; slicks of the compound asked for, or for what is left)
          this.repairCar(c);
          if (c.ty) { c.ty.k = tyreFor(this.wst.line); c.ty.wear = 0; if (c.ty.c) c.ty.c = c.isPlayer && TYRE_CMP[c.pitCmp] ? c.pitCmp : cmpFor(this.laps * T.len - c.dist); }
          c.pitState = 'done'; c.pitDone = true; c.pitEv = 'done';
        }
        return;
      }
      let vmax = lim;
      if (!c.pitDone && P[3] != null) {   // pull up at the box: a braking curve that ends right at it (the player's box, or the AI car's own)
        const L = T.len; let ds = (T.startS + (c.isPlayer ? P[3] : this._aiBox(c))) - q.s; ds = ((ds % L) + L) % L; if (ds > L / 2) ds -= L;
        if (ds < 40 && ds > -5) {
          vmax = Math.min(vmax, Math.sqrt(2 * 6.5 * Math.max(0, ds - 0.2)));
          if (!c.pitState) { c.pitState = 'stop'; c.pitEv = 'box'; }
          if (sp < 1.5 && Math.abs(ds) < 4) {   // (its drive holds ~0.9 m/s against the stop curve at part throttle)
            let lost = 0; for (const k in c.lost) lost++;
            c.pitState = 'repair'; c.pitT = 0; c.pitDur = Math.min(5, 1.2 + 3.3 * c.dmg + lost * 0.15); if (c.ty) c.pitDur = Math.max(c.pitDur, 2.6); c.vx = c.vz = 0; c.w = 0; c.pitEv = 'repair';   // (tyres: 2.6 s at least)
            if (c.wreck) c.pitDur += c.wreck.nL;   // (a kit vehicle: a second more for every wheel knocked off)
          }
        }
      }
      if (sp > vmax) { const k = Math.max(vmax / sp, 1 - 4 * dt); c.vx *= k; c.vz *= k; if (vmax < 1) c.w *= k; }   // the limiter (and the stop) take over smoothly
    }
    // ---- flags (opts.flags) ----
    // a yellow flag: a car stopped on the track (not in the pit lane, from its first lap on) for more than a second; the section from 250 m
    // before it to 30 m past it, until 5 s after the car is moving again. The AI slows down there and does not overtake (except the stopped
    // car). The safety car: once a race, after a heavy crash (a car stopped for 2.5 s badly damaged, or two stopped together, or one for 6 s),
    // when the leader has more than a lap and a quarter to go. It comes out 90-350 m ahead of the leader, the field queues up behind it
    // (15 m apart, no overtaking); after 25 s, with the queue formed (or after 40 s), it goes in (into the pit lane when that is less than
    // half a lap ahead, else it speeds off up the road), and nobody overtakes until the leader is back at the line. The player: overtaking under a flag (not a stopped car,
    // not one in the pit lane, not a retired one) has to be given back within 10 s, else +5 s on the race time (c.fl.pen)
    _yelAt(s) {
      const L = this.track.len;
      for (const y of this.fl.yel) { let d = y.s - s; d = ((d % L) + L) % L; if (d > L / 2) d -= L; if (d > -30 && d < 250) return y; }
      return null;
    }
    _noPass(c) { const F = this.fl; return !!(F && (F.sc || (F.yel.length && this._yelAt(c.q.s)))); }
    _flags(dt) {
      const F = this.fl, T = this.track, L = T.len, cars = this.cars;
      if (this.state !== 'racing') return;
      let lead = null; for (const c of this.order) if (!c.finished && !dnf(c)) { lead = c; break; }
      // incidents: cars stopped on the track
      const stop = [];
      for (const c of cars) {
        const f = c.fl || (c.fl = { stopT: 0, v: 30, yel: null, pen: 0, owe: null, ah: null });
        if (c.net || c.finished || (dnf(c) && this.time - c.wreck.dnfT > 30 && retiredOff(T, c, -0.2))) { f.stopT = 0; continue; }   // (a retired car: an incident for 30 s and until it stands where it may: off the asphalt, or at the barrier)
        f.v += (c.speed - f.v) * Math.min(1, dt * 2);   // (the speed over about half a second: a knock from another car does not end a stop)
        const onTrack = !c.inPit && !c.pitWant && !c.pitState, stopped = onTrack && c.lap >= 1 && f.v < 3;
        f.stopT = stopped ? f.stopT + dt : 0;
        if (f.stopT > 1) {
          if (!f.yel) { f.yel = { s: c.q.s, t: 5, car: c }; F.yel.push(f.yel); F.ev++; F.evK = 'yellow'; }
          f.yel.s = c.q.s; f.yel.t = 5;
          if (f.stopT > 2.5) stop.push(c);
        }
      }
      for (const y of F.yel) if (!(y.car.fl.stopT > 0)) y.t -= dt;
      if (F.yel.some(y => y.t <= 0)) { for (const y of F.yel) if (y.t <= 0) y.car.fl.yel = null; F.yel = F.yel.filter(y => y.t > 0); }
      // the safety car: out
      if (!F.scUsed && lead && lead.lap >= 1 && this.laps * L - lead.dist > L * 1.25) {
        const heavy = stop.some(c => c.dmg > 0.5 || c.fl.stopT > 6 || stop.some(o => o !== c && Math.abs(o.dist - c.dist) < 60));
        if (heavy) this._scOut(lead);
      }
      const S = F.sc;
      if (S && S.car) {
        const X = S.car, q = T.query(X.x, X.z, X.q.i, X.q); let ds = q.s - X.sPrev; if (ds > L / 2) ds -= L; else if (ds < -L / 2) ds += L;
        X.sPrev = q.s; X.dist += clamp(ds, -3, 3); S.t += dt;
        X.wet = 1 - (1 - WET) * (this.wst ? this.wst.water : this.rain);
        const gl = lead ? X.dist - lead.dist : 1e9;
        if (S.state === 'out' && S.t > 25 && gl < 45) {   // in this lap: once the field has closed up behind it (or after 80 s)
          let formed = true, prev = lead.dist;
          for (const c of this.order) { if (c === lead || c.finished || c.inPit || c.pitWant || (c.fl && c.fl.stopT > 0) || dnf(c) || lead.dist - c.dist > L / 2) continue; if (prev - c.dist > 40) { formed = false; break; } prev = c.dist; }
          if (formed || S.t > 40) {   // (into the pit lane when its way in is less than half a lap ahead; else it speeds off up the road)
            let dp = T.def.pit ? T.startS + T.def.pit[1] - q.s : 0; dp = ((dp % L) + L) % L;
            S.state = 'in'; S.pit = !!T.def.pit && dp < L / 2; F.ev++; F.evK = 'scIn'; if (S.pit) X.pitWant = true;
          }
        }
        if (S.state === 'in') {   // into the pit lane (through the gap in the pit wall), or away up the road; then gone
          const pz = T.def.pit ? T.pitAt(q.s) : null;
          if ((pz && pz.gap && q.d > pz.wall + 2) || (!S.pit && gl > 260) || gl > 900) { S.state = 'gone'; S.car = null; F.ev++; F.evK = 'scGone'; }
        }
      }
      if (S) {
        if (S.state === 'gone' && lead && lead.lap > S.lap0) { F.sc = null; F.ev++; F.evK = 'green'; }   // (the leader at the line: racing again)
        if (F.sc && (!lead || lead.finished)) F.sc = null;
        if (S.state !== 'gone' && lead) S.lap0 = lead.lap;
      }
      // the player overtaking under a flag
      const P = this.player;
      if (P && P.fl && !P.finished && !P.net) {
        const f = P.fl, ban = this._noPass(P);
        if (!f.ah) f.ah = new Map();
        for (const o of cars) {   // (clearly ahead: 1 m, clearly past it: 3 m; side by side changes nothing)
          if (o === P) continue;
          const d = o.dist - P.dist, was = f.ah.get(o), ahead = d > 1 ? true : d < -3 ? false : was;
          if (ban && was === true && ahead === false && !o.finished && !o.inPit && !o.pitWant && !dnf(o) && o.speed > 8 && !P.inPit && !f.owe) { f.owe = { car: o, t: 10 }; F.pev++; F.pevK = 'passWarn'; }   // (not a retired car, still rolling off the line)
          f.ah.set(o, ahead);
        }
        if (f.owe) {
          if (f.owe.car.dist > P.dist + 1 || f.owe.car.finished || dnf(f.owe.car)) { f.owe = null; F.pev++; F.pevK = 'passOk'; }   // (the car passed retired since: nothing to give back)
          else if ((f.owe.t -= dt) <= 0) { f.owe = null; f.pen += 5; F.pev++; F.pevK = 'pen'; }
        }
      }
    }
    // the safety car out: ahead of the leader, on the racing line where the road is clear (90-350 m on)
    _scOut(lead) {
      const F = this.fl, T = this.track;
      let s0 = lead.q.s + 90;
      for (let k = 0; k < 13; k++, s0 += 20) { const i = T.idx(s0); let clear = true; for (const c of this.cars) { const dx = c.x - T.px[i], dz = c.z - T.pz[i]; if (dx * dx + dz * dz < 30 * 30) { clear = false; break; } } if (clear) break; }
      const i = T.idx(s0), off = T.rl[i], X = new Car(MODELS[1], { id: 0, name: 'Varnostni avto', color: 0xdfe3e8, skill: 1, assist: CSK.aiAssist, phys: this.opts.phys, laneBias: 0 });
      X.sc = true; X.num = 0; X.grid = 0; X.rubber = 1; X.dmgMode = 0; X.locked = false;
      X.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) X.y = X.py = T.hy[i];
      X.q = T.query(X.x, X.z, i, X.q); X.sPrev = X.q.s;
      let d = X.q.s - lead.q.s; d = ((d % T.len) + T.len) % T.len; X.dist = lead.dist + d;
      const v = Math.min(30, Math.max(12, lead.speed)); X.vx = Math.cos(X.h) * v; X.vz = Math.sin(X.h) * v;
      F.sc = { car: X, state: 'out', t: 0, lap0: lead.lap }; F.scUsed = true; F.ev++; F.evK = 'sc';
    }

    // sector times on a circuit without TV sectors (Track.sectors): the lap in thirds by distance from the line; c.sec = { lap, n (sectors done this lap), t0 (when the
    // current one began), cur [3] (this lap), prev [3] (the lap before), best [3] (the car's best), ev (a counter, bumped with every sector done), evK, evT, evOb (the
    // fastest of anyone so far: this.sec.best) }. Sector 3 ends at the line (the lap's own start time); none after the finish
    _thirds(c) {
      const L = this.track.len, S = c.sec || (c.sec = { lap: 0, n: 0, t0: 0, cur: [NaN, NaN, NaN], prev: [NaN, NaN, NaN], best: [Infinity, Infinity, Infinity], ev: 0, evK: -1, evT: 0, evOb: false });
      if (c.lap !== S.lap) {
        if (S.lap >= 1 && S.n === 2 && c.lapStart > S.t0) this._secDone(c, S, 2, c.lapStart - S.t0);
        S.prev = S.cur; S.lap = c.lap; S.n = 0; S.t0 = c.lapStart; S.cur = [NaN, NaN, NaN];
      }
      if (c.lap < 1 || c.finished || c.net) return;
      const d = c.dist - (c.lap - 1) * L;
      while (S.n < 2 && d >= (S.n + 1) * L / 3) { this._secDone(c, S, S.n, this.time - S.t0); S.t0 = this.time; S.n++; }
    }
    _secDone(c, S, k, t) {
      S.cur[k] = t; if (t < S.best[k]) S.best[k] = t;
      const B = this.sec.best, ob = t < B[k]; if (ob) B[k] = t;
      S.ev++; S.evK = k; S.evT = t; S.evOb = ob;
    }

    // DRS (Track.drs): a car that crosses a zone's detection line less than 1 s after the car before it may open the flap of its rear wing
    // in that zone (from the second lap on, not in the pit lane): open from the activation line (c.drs = zone + 1, less air drag, see Car)
    // to the end of the zone, closed at once when the driver brakes. c.drsA: the zones it may open in (bits); the player's c.drsEv 'open'
    // for the HUD. (These fields appear only on a circuit with DRS, so every other circuit's race state stays as it was.)
    _drs(c, ds, dt) {
      const Z = this.track.drs, L = this.track.len, d1 = c.dist, d0 = d1 - ds, racing = this.state === 'racing' || this.state === 'done';
      if (c.drsA == null) { c.drsA = 0; c.drs = 0; }
      const flag = this.fl && (this.fl.sc || (this.fl.yel.length && this._yelAt(c.q.s)));   // (flags: no DRS under a yellow or the safety car)
      if (c.drs && (c.inBrk > 0.2 || c.inPit || c.finished || !racing || flag)) c.drs = 0;
      if (!(ds > 0) || !racing) return;
      for (let k = 0; k < Z.length; k++) {
        const z = Z[k], lapAt = (at) => Math.floor((d1 - at) / L), crossed = (at) => lapAt(at) > Math.floor((d0 - at) / L), bit = 1 << k;
        if (crossed(z.det)) {
          const t = this.time - dt * clamp((d1 - (z.det + lapAt(z.det) * L)) / ds, 0, 1), prev = this.drsLast[k];
          if (c.lap >= 2 && !c.finished && !c.inPit && prev && prev.car !== c && t - prev.t <= 1) c.drsA |= bit; else c.drsA &= ~bit;
          this.drsLast[k] = { car: c, t };
        }
        if ((c.drsA & bit) && crossed(z.act)) { c.drsA &= ~bit; if (!c.inPit && !c.finished && !flag) { c.drs = k + 1; if (c.isPlayer) c.drsEv = 'open'; } }
        if (c.drs === k + 1 && crossed(z.end)) c.drs = 0;
      }
    }
    // TV sectors (Track.sectors): every car's time through each third of the lap, as on the timing screens. A sector is purple ('p': the best
    // of the race so far), green ('g': the car's own best) or yellow ('y': slower). c.secN: the sectors done; c.secS: when the current one
    // began (the first at the start line, c.lapStart, as the lap: the three add up to the lap time); c.secT / c.secPB: the car's last and
    // best time in each; the player's c.secEv [sector, time, colour] for the HUD. (These fields appear only on a circuit with sectors.)
    _sectors(c, ds, dt) {
      const S = this.track.sectors, L = this.track.len;
      if (c.secN == null) { c.secN = 0; c.secS = 0; c.secT = [NaN, NaN, NaN]; c.secPB = [Infinity, Infinity, Infinity]; }
      if (!(ds > 0) || this.state === 'grid') return;
      if (c.secN === 0) c.secS = c.lapStart;
      const k = c.secN % 3, lap = Math.floor(c.secN / 3), at = (k === 2 ? L : S[k + 1]) + lap * L, d1 = c.dist;   // the line that ends sector k
      if (lap >= this.laps || d1 < at || d1 - ds >= at) return;
      const t = this.time - dt * clamp((d1 - at) / ds, 0, 1), st = t - c.secS, col = st < this.secBest[k] ? 'p' : st < c.secPB[k] ? 'g' : 'y';
      c.secS = t; c.secN++; c.secT[k] = st;
      if (st < c.secPB[k]) c.secPB[k] = st;
      if (st < this.secBest[k]) this.secBest[k] = st;
      if (c.isPlayer) c.secEv = [k, st, col];
    }
    repairCar(c) {   // good as new: body, panels, lamps, glass; the renderer rebuilds the car when repairN changes
      c.dmg = 0; c.dz = [0, 0, 0, 0]; c.dents = []; c.cd = [0, 0, 0, 0]; c.lightOut = [0, 0, 0, 0]; c.lost = {}; c.detach = []; c.winOut = [0, 0, 0, 0]; c.roofDmg = 0;
      if (c.aeroK0 != null) c.aeroK = c.aeroK0;   // (new wings)
      if (c.wreck) wreck0(c.wreck);   // (a kit vehicle: its wheels back on, no wreck to shed; a retirement stays)
      c.repairN = (c.repairN || 0) + 1;
    }

    // open road: checkpoints (split times), the finish at T.finishS; in the menu demo (noPlayer) cars that reach the top start again at the bottom.
    // Crossing times are interpolated inside the step from the distance covered in it.
    _progressOpen(c, q, ds, dt) {
      const T = this.track;
      if (this.state === 'grid' || c.finished || c.parkQ || dnf(c)) return;
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
        // a race up the road: past the line every car pulls up in a slot of its own at the side of the road (by its place, both sides
        // in turn, 9 m apart), clear of the ones still coming up the middle (aiControl drives it there: c.parkS, c.parkD)
        if (!this.timeTrial) { const k = c.finishPos - 1; c.parkS = Math.min(T.len - 20, T.finishS + 70 + 9 * k); c.parkD = (k % 2 ? -1 : 1) * (this.tf ? T.w + 1.4 : T.w - 1.5); }   // (the open road: off the asphalt, clear of the traffic)
      }
    }
    _queueRespawn(c) { c.parkQ = true; c.locked = true; c.inThr = 0; c.inBrk = 1; c.inSteer = 0; this._rq.push(c); }
    // put the first waiting car on the first free spot behind the start line (no car within 9 m of it)
    _serveRespawn() {
      const T = this.track, c = this._rq[0];
      for (let g = 1; g <= 4; g++) {
        const i = T.idx(T.startS - this._gridBack(g)), lat = (g % 2 === 1 ? -1 : 1) * Math.min(3.4, T.w - 1.6);
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
      if (c.ty && !c.isPlayer) c.pitWant = false;   // (an AI car in for tyres: it tries again from the next lap)
      const s = c.q.s, s0d = c.q.d || 0;
      let i = T.idx(s);
      if (T.open) i = clamp(i, 3, T.N - 4);   // not into the wall at an end of the road
      const off = T.rl[i] * 0.5;
      c.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; if (T.open) c.roadY = c.y; }
      c.locked = false;
      c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s;
      if (T.open && Number.isFinite(s) && Number.isFinite(c.dist)) c.dist += c.q.s - s;   // open road: the distance follows the car back to the sample (checkpoints / finish stay exact)
      c.stuckT = 0; c.wrongT = 0; c.rescued = 1.2; c.inPit = false; c.pitState = null; c.pitDone = false;   // (back on the circuit, not in the pit lane)
      // a breakable vehicle on a track without pits: the marshals put its lost wheels back on, beside the road (off its side's edge, clear of
      // the barrier); it stands for the 6 s that takes (Race._wreckStep), then drives back on. W.fix counts the refits (a partial repair:
      // repairN stays, the renderer's and the commentator's lost-wheel latches follow W.fix)
      const W = c.wreck, fix = !!(W && W.wl && !W.dnf && (!T.def.pit || this.opts.noPlayer));   // (the demo: with pits too)
      if (fix) {
        for (const n of WHEELS) delete c.lost[n]; W.wl = 0; W.nL = 0; W.lt = 0; W.hold = 6; W.fix++;
        const sd = s0d >= 0 ? 1 : -1, room = (sd > 0 ? c.q.br : c.q.bl) - c.m.wid * 0.5 - 0.4, d = sd * clamp(T.w + 2, T.w * 0.6, Math.max(T.w * 0.6, room)) - off;
        c.x += T.nx[i] * d; c.z += T.nz[i] * d; c.px = c.x; c.pz = c.z; c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s;
      }
      const v = fix || (T.open && T.len - c.q.s < 25) ? 0 : 8;   // (near the top end of an open road: standing, not off into the end wall)
      c.vx = Math.cos(c.h) * v; c.vz = Math.sin(c.h) * v;
    }
    // a car out of the race (Odstop): an AI car that can not race on (see _wreckStep), or the player pressing Odstopi (game.js; any car).
    // It pulls off onto a run-off (_retireSide) and stops there (retireControl); it never finishes: behind every running car in the order,
    // a DNF at the end of the results (estimateResults: dnf); the flags see it as a stopped car for 30 s and until it stands where it may
    // (retiredOff; the marshals see to that, see _wreckStep)
    retire(c) {
      const W = c.wreck || (c.wreck = wreck0({}));
      if (W.dnf || c.finished || c.net) return;
      W.dnf = true; W.dnfT = this.time; W.side = this._retireSide(c); W.stop = false; W.hold = 0; W.cr = 0; W.fin = null;
      if (c.pitWant) c.pitWant = false;
    }
    // the run-off a retired car pulls onto, by the room over its next 150 m (along its nose; from where it can be over: 1.5 s at its speed,
    // 30 m at most): on each side the first spot where it could stand (standQ) and how well. Its own side (the one it is on, 1.5 m or more
    // from the middle) unless the other side's spot is better (clear of the asphalt where its own is at the barrier, or none on its own) or
    // as good and over 60 m nearer; from the middle of the road the better one (a tie: the side with more room here). Spa's Kemmel straight:
    // 1.5 m to the barrier on the right for 500 m, so a car retiring on the right crosses to the left
    _retireSide(c) {
      const T = this.track, q = c.q, hw = c.m.wid * 0.5;
      if (!q || !(q.i >= 0) || !Number.isFinite(q.s + q.d)) return 1;
      const dir = Math.cos(c.h) * q.tx + Math.sin(c.h) * q.tz < 0 ? -1 : 1, m0 = Math.min(30, Math.max(0, c.vl) * 1.5), L = T.len;
      const spot = (sd) => {   // [how well, how far]
        for (let x = m0; x <= 150; x += 3) {
          let s = q.s + dir * x; if (T.open) { if (s < 0 || s > L) break; } else s = ((s % L) + L) % L;
          const k = standQ(T, s, T.idx(s), sd, hw); if (k) return [k, x];
        }
        return [0, Infinity];
      };
      const R = spot(1), Lf = spot(-1), better = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] < b[1] - 60);
      const own = Math.abs(q.d) > 1.5 ? Math.sign(q.d) : 0;
      if (own) return better(own > 0 ? Lf : R, own > 0 ? R : Lf) ? -own : own;
      return better(R, Lf) ? 1 : better(Lf, R) ? -1 : q.br >= q.bl ? 1 : -1;
    }
    isOut(c) { return c.finished || dnf(c); }   // (a race is over when every car is: finished or retired)
    // a breakable vehicle every step (before the cars move): a wreck sheds its next part every 0.4 s (wreckCheck); an AI car with two wheels
    // gone at once can not race on: it retires (not on its way into the pits or in the lane: the crew puts them back on), then pulls off
    // (retireControl). Destroyed at dmg 1 it limps on, as every car does (retiring each one the AI's contacts take to 100 % emptied a
    // one-make field: 3-8 cars a lap on the Nordschleife; tests/fleet.test.js keeps count). One waiting for the marshals stands (hold);
    // an AI car with a wheel off on a track without pits is rescued after 1.5 s (rescue: the marshals refit it; with pits and tyres it goes
    // in for a new one, see step). A retired car the marshals move (_parkRetired) when it has crawled 8 s short of the run-off, stood 8 s
    // where it may not (knocked back onto the asphalt, in the way into the pits; not where they put it for want of a better spot, wreck.fin,
    // unless knocked off it), or not got off the line 30 s after retiring. A race with no player (the title screen's demo, never over) has
    // no retirements: the marshals refit the wheels wherever it runs
    _wreckStep(c, dt) {
      const W = c.wreck, T = this.track;
      if (W.seq) {
        if (W.at == null) W.at = this.time;
        while (W.seq.length && c.lost[W.seq[0]]) W.seq.shift();   // (knocked off meanwhile)
        if ((W.st -= dt) <= 0 && W.seq.length) { const n = W.seq.shift(); detachPart(c, n); W.st = 0.4; }
      }
      if (W.nL) W.lt += dt;
      const racing = this.state === 'racing';
      if (!W.dnf && !c.isPlayer && kitParts(c.m) && !c.finished && racing && W.nL >= 2 && !c.pitWant && !c.inPit && !this.opts.noPlayer) this.retire(c);
      if (W.dnf) {
        if (!W.stop) retireControl(c, this, dt);
        else {
          parkBrake(c); if (W.fin && Math.hypot(c.x - W.fin[0], c.z - W.fin[1]) > 1) W.fin = null;
          W.cr = W.fin || retiredOff(T, c, -0.2) ? 0 : W.cr + dt;
        }
        if (W.cr > 8 || (!W.stop && this.time - W.dnfT > 30)) this._parkRetired(c);
        return;
      }
      if (W.hold > 0) { W.hold -= dt; parkBrake(c); c.stuckT = 0; return; }
      if (W.nL && !c.isPlayer && (!T.def.pit || this.opts.noPlayer) && !c.finished && racing && W.lt > 1.5) this.rescue(c);
    }
    // the marshals put a retired car where it may stand (standQ; retiredOff holds there), as retireControl parks it (its centre T.w + hw +
    // 1.6 m out, or 0.4 m short of the barrier): the nearest spot from where it is, on along the road (3 m at a time, up to 1 km), on
    // either side, clear of the other retired cars on that side and of the way into the pits; its own side and clear of the asphalt
    // preferred (a spot on the other side counts as 100 m further, one at the barrier with some of the car on the asphalt as 150 m). No
    // such spot: the free one with the most room, and there it stays (wreck.fin: where they put it; not moved again unless knocked off
    // it). It stands there (wreck.stop) on the side used (wreck.side)
    _parkRetired(c) {
      const T = this.track, W = c.wreck, own = W.side || 1, hw = c.m.wid * 0.5, L = T.len;
      const gap = (a, b) => { let d = a - b; if (!T.open) { d = ((d % L) + L) % L; if (d > L / 2) d -= L; } return Math.abs(d); };
      const free = (s, sd) => { for (const o of this.cars) if (o !== c && dnf(o) && o.wreck.side === sd && gap(s, o.q.s) < (c.m.len + o.m.len) / 2 + 1.5) return false; return true; };
      let best = null, bestC = Infinity, fb = null, fbR = -Infinity;
      for (let k = 0; k <= 333 && 3 * k < bestC; k++) {
        let s = c.q.s + 3 * k; if (T.open) { if (s > T.len - 30) break; } else s = ((s % L) + L) % L;
        const i = T.idx(s);
        for (const sd of [own, -own]) {
          if (!free(s, sd)) continue;
          const g = standQ(T, s, i, sd, hw), cost = 3 * k + (sd === own ? 0 : 100) + (g === 2 ? 0 : 150), pz = sd > 0 && T.def.pit ? T.pitAt(s) : null;
          if (g && cost < bestC) { bestC = cost; best = [s, sd]; }
          else if (!g && !(pz && pz.gap) && (sd > 0 ? T.br[i] : T.bl[i]) > fbR) { fbR = sd > 0 ? T.br[i] : T.bl[i]; fb = [s, sd]; }
        }
      }
      const [s, sd] = best || fb || [c.q.s, own], i = T.idx(s), d = sd * Math.max(T.w * 0.4, Math.min(T.w + hw + 1.6, (sd > 0 ? T.br[i] : T.bl[i]) - hw - 0.4));
      W.side = sd;
      c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); if (T.hasElev) c.y = c.py = T.hy[i];
      c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s;
      W.stop = true; W.cr = 0; parkBrake(c);
      W.fin = retiredOff(T, c, -0.2) ? null : [c.x, c.z];
    }

    // estimated finish times for unfinished cars (for results)
    estimateResults() {
      const T = this.track, res = [];
      const done = this.finishOrder.slice();
      const rest = this.cars.filter(c => !c.finished && !dnf(c)).sort((a, b) => b.dist - a.dist);
      const pen = (c) => ((c.fl && c.fl.pen) || 0) + (c.tfPen || 0);   // (flags, the open road's duel: time penalties)
      for (const c of done) res.push({ car: c, time: c.finishTime + pen(c), est: false, pen: pen(c) });
      for (const c of rest) {
        const remain = Math.max(0, (T.open ? T.raceLen : this.laps * T.len) - c.dist);
        const avg = c.dist > 50 ? c.dist / Math.max(1, this.time) : 30;
        const t = this.time + remain / Math.max(15, avg) + pen(c);
        res.push({ car: c, time: t, est: true, pen: pen(c) });
      }
      res.sort((a, b) => a.time - b.time);
      for (const c of this.cars.filter(dnf).sort((a, b) => b.dist - a.dist)) res.push({ car: c, time: Infinity, est: true, pen: pen(c), dnf: true });   // (retired: Odstop, the furthest first)
      return res;
    }
  }

  /* ---------------------------------------------------------------------
     CHAMPIONSHIP (prvenstvo): a series of races on several circuits. Points by the finishing order (25, 18, 15, 12, 10, 8, 6, 4, 2, 1
     for the first ten, as in Formula 1); the standings by points, a tie by more wins, then more second places and so on. The
     AI drivers are the same in every round (aiDriver). A round = { track, order: [driver key, ...] (the winner first) }; the
     player's key is PLAYER_KEY, an AI driver's key its name. The game keeps the rounds driven so far (and the difficulty).
     --------------------------------------------------------------------- */
  const CHAMP_PTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], PLAYER_KEY = 'TI';
  const CHAMPS = [
    { id: 'domaci', name: 'Domači pokal', desc: 'Štiri kratke proge za začetek: jezero, mesto in makadam.', tracks: ['jezero', 'ljubljana', 'gora', 'riviera'] },
    { id: 'superstars', name: 'Superstars', desc: 'Proge v slogu Circuit Superstars z boksi in Monako.', tracks: ['gozd', 'toskana', 'grom', 'monaco'] },
    { id: 'legende', name: 'Legende', desc: 'Pet slavnih prog v pravem merilu: Monako, Spa, Red Bull Ring, Suzuka in Zeleni pekel.', tracks: ['monaco', 'spa', 'rbring', 'suzuka', 'nring'] },
    { id: 'veliko', name: 'Veliko prvenstvo', desc: 'Vse krožne proge igre, ena za drugo.', tracks: TRACKS.filter(d => !d.timeTrial && !d.open).map(d => d.id) },
  ];
  const champPoints = (pos) => CHAMP_PTS[pos - 1] || 0;   // (pos 1 = the winner)
  // the standings after the given rounds: [{ key, pts, wins, places: [firsts, seconds, ...], last: the place in the latest round }], leader first
  function champTable(keys, rounds) {
    const n = keys.length, row = new Map(keys.map(k => [k, { key: k, pts: 0, wins: 0, places: new Array(n).fill(0), last: 0 }]));
    for (const r of rounds) r.order.forEach((k, i) => { const e = row.get(k); if (!e) return; e.pts += champPoints(i + 1); if (i === 0) e.wins++; if (i < n) e.places[i]++; e.last = i + 1; });
    const t = [...row.values()];
    t.sort((a, b) => { if (b.pts !== a.pts) return b.pts - a.pts; for (let i = 0; i < n; i++) if (b.places[i] !== a.places[i]) return b.places[i] - a.places[i]; return keys.indexOf(a.key) - keys.indexOf(b.key); });
    return t;
  }
  // every driver of a championship: the player first, then the AI drivers of a race with nAI of them (in grid order)
  const champKeys = (nAI) => [PLAYER_KEY].concat(Array.from({ length: nAI }, (_, k) => aiDriver(k).name));

  /* ---------------------------------------------------------------------
     CAREER (kariera): prize money from races buys cars and upgrades. Start with 10 000 EUR and the PICO TURBO; the prize by the finishing
     place (the winner 6000 EUR, the last of 13 300 EUR), more for a longer race (by the distance: a 2 km race 0.6x, 8 km 1x, up to 2.5x)
     and a harder field (0.7x easy, 1.4x hard); the fastest lap of the race 500 EUR more, pole in qualifying 1000 EUR; the championship:
     20 000 EUR for the title, 10 000 / 6000 EUR for second / third (x the difficulty); a time trial: a medal (gold 5000, silver 3000,
     bronze 1500 EUR) or a personal best (2000 EUR), else 500 EUR for getting there. Prices: the cars below, an upgrade level 4000,
     7000 or 12 000 EUR (the level after the one bought; the stock parts are free)
     --------------------------------------------------------------------- */
  const CAREER = {
    start: 10000, car0: 'pico',
    car: { pico: 0, p206: 20000, kaze: 30000, muscle: 40000, strega: 45000, vortex: 50000, truck: 55000, rally: 60000, ev: 75000, formula: 90000, lm: 110000 },
    upg: [0, 4000, 7000, 12000],
    place: [6000, 4500, 3500, 2800, 2300, 1900, 1600, 1300, 1100, 900, 700, 500, 300],
    diff: [0.7, 1, 1.4], champ: [20000, 10000, 6000], medal: { gold: 5000, silver: 3000, bronze: 1500 }, pb: 2000, finishTT: 500, fastest: 500, pole: 1000,
  };
  // prize money for a race: pos (1 = the winner), n cars, the race distance in m, the difficulty (0..2); rounded to 50 EUR
  function careerPrize(pos, n, dist, diff) {
    const k = clamp(dist / 8000, 0.6, 2.5) * (CAREER.diff[diff] || 1), P = CAREER.place, i = Math.round((pos - 1) * (P.length - 1) / Math.max(1, n - 1));
    return Math.round(P[clamp(i, 0, P.length - 1)] * k / 50) * 50;
  }
  // the price of an upgrade from level `from` to level `to` (the levels in between too)
  const careerUpgPrice = (from, to) => { let p = 0; for (let l = from + 1; l <= to; l++) p += CAREER.upg[l] || 0; return p; };

  // the stat bars (1..10) a vehicle's physics give (every registered vehicle's own bars are these +-1: tests/fleet.test.js). Moč: the
  // engine, a little its power-to-weight; Oprijem: the tyres (amax), the wings' grip at ~120 km/h on top; Lahkost: the mass; Drift: the
  // drive-type layer's power rotation, less grip (bigger slides), the slides' time constant, the wheelspin. Fitted on the 11 models above:
  // each bar within 1 of the hand-made one, all but the rally car's drift (9 by design: the formula gives it 5)
  function statsOf(M) {
    const a = (ARC[M.id] || ARC.kaze).amax, P = CSP[M.id] || CSP.kaze, r = (v) => clamp(Math.round(v), 1, 10);
    return {
      power: r(-27.5 + 5 * Math.log(M.kw) + 1.25 * Math.log(M.kw * 1000 / M.mass)),
      grip: r(6.5 + 17 * (a * (1 + (M.aero || 0) * 1111) - 1.72)),
      weight: r(10 - 10.5 * Math.pow(Math.max(0, Math.log(M.mass / 760)), 1.7)),
      drift: r(2.75 + 38 * P.pwr + 11 * (1.9 - a) + 2 * ((P.tv || 1) - 1) + 0.25 * Math.log(M.spinK || 1)),
    };
  }

  // a total wreck at once, the same every time (tests, the renderer's checks): hits at the four corners, the nose, the tail and both sides
  // until the car is destroyed: dmg 1, every zone and corner at the top, every part of its table off (the wheels only with damage on,
  // dmgMode 2) and a kit vehicle's wreck sequence done. No random numbers; the parts go onto c.detach (Race.step makes them debris). A car
  // with damage off (dmgMode 0) stays whole
  function wreckCar(c) {
    const hl = c.m.len * 0.5, hw = c.m.wid * 0.5, pts = [[hl, -hw], [hl, hw], [-hl, -hw], [-hl, hw], [hl, 0], [-hl, 0], [0, -hw], [0, hw]];
    for (let n = 0; n < 16 && c.dmgMode && (c.dmg < 1 || Math.min(...c.dz, ...c.cd) < 1); n++) for (const [x, z] of pts) applyDamage(c, 0.25, x, z);
    const W = c.wreck, PT = partsOf(c.m);
    if (W && W.seq) while (W.seq.length) { const n = W.seq.shift(); if (!c.lost[n] && PT[n]) detachPart(c, n, PT[n]); }
    return c;
  }

  /* ---------------------------------------------------------------------
     VEHICLE REGISTRY: js/cars/<id>.js, one file per vehicle, loaded before this file (as the tracks: index.html lists them after the
     track files, in registration order). Each pushes one def onto VEHICLE_DEFS (the template: any of them): its physics, grip (ARC),
     drive-type layer (CSP), stat bars, career price, Pikes Peak class, AI field, sound preset, handling targets (expect: the fleet test),
     part table and render look. A valid def becomes a model appended to MODELS (kit: true; MODELS[0..10] never move, the registration
     order is append-only: a shipped vehicle is retired, never removed), with Tmax as the loop at the models computes it, its ARC and CSP
     entries, its career price and its expanded part table. An invalid one is skipped with a console warning and listed in DEFS_SKIPPED
     (the fleet test fails on any). A patch def ({ id, patch: true, ... }) attaches fields to a vehicle already registered, one of the 11
     included (its look, its part table, its field ...): cat, ord, desc, stats, price, pk, field, fieldN, snd, expect, partNames, parts,
     glb, credit, retired, look.
     --------------------------------------------------------------------- */
  const DEFS = (typeof VEHICLE_DEFS !== 'undefined' ? VEHICLE_DEFS : []).slice(), DEFS_SKIPPED = [];
  const DRIVES = ['FR', 'FF', 'MR', 'AWD', 'RR'], PK_IDS = ['ta1', 'ppo', 'open', 'unl'];
  const BODY_KEYS = ['coupe', 'sedan', 'hatch', 'wedge', 'rally', 'formula', 'lm', 'muscle', 'ev', 'truck', 'p206'];   // (the renderer's body names: no vehicle's id)
  const PHYS_REQ = ['mass', 'a', 'b', 'kI', 'kw', 'redline', 'idle', 'gears', 'final', 'rw', 'cDrag', 'len', 'wid', 'steerMax'];
  const PHYS_OPT = { tracK: [0.2, 3], brakeK: [0.2, 3], spinK: [0.02, 3], aero: [0, 0.0005], loose: [0.2, 2], looseDrag: [0.1, 2], landV: [3, 40], landK: [0, 2], ev: null, sway: [0, 4],
    dmgK: [0.3, 2], vLim: [20, 400], aiGap: [2, 10], aiPass: [2, 8], aiEdge: [0.5, 4], aiLat: [1, 8], aiFol: [1, 6], circ: [3, 9] };
  const DEF_REQ = ['id', 'name', 'cat', 'drive', 'desc', 'phys', 'arc', 'csp', 'stats', 'price', 'pk', 'snd', 'parts'];
  const DEF_OPT = ['ord', 'field', 'fieldN', 'num', 'expect', 'partNames', 'glb', 'credit', 'retired', 'look'];
  const PATCH_KEYS = ['cat', 'ord', 'desc', 'stats', 'price', 'pk', 'field', 'fieldN', 'snd', 'expect', 'partNames', 'parts', 'glb', 'credit', 'retired', 'look'];
  const isNum = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  // the checks of a def's fields ('' when fine); a patch def's fields get the same
  const DEF_CHECK = {
    name: (v) => typeof v === 'string' && v.length >= 1 && v.length <= 18 ? '' : 'name: 1-18 characters',
    cat: (v) => CATS.some(c => c.id === v) ? '' : 'cat not one of ' + CATS.map(c => c.id).join(' '),
    ord: (v) => isNum(v, -1e6, 1e6) ? '' : 'ord not a number',
    drive: (v) => DRIVES.indexOf(v) >= 0 ? '' : 'drive not one of ' + DRIVES.join(' '),
    desc: (v) => typeof v === 'string' && v.length >= 1 && v.length <= 90 && !/\d\s*(kW|KM|kg)\b/.test(v) ? '' : 'desc: 1-90 characters, no kW / KM / kg (the game adds them)',
    stats: (v) => isObj(v) && ['power', 'grip', 'weight', 'drift'].every(k => isNum(v[k], 0, 10)) && Object.keys(v).length === 4 ? '' : 'stats: { power, grip, weight, drift } 0..10',
    price: (v) => Number.isInteger(v) && v >= 0 && v <= 1e7 ? '' : 'price not a whole number of euros',
    pk: (v) => PK_IDS.indexOf(v) >= 0 ? '' : 'pk not one of ' + PK_IDS.join(' '),
    field: (v) => v === null || (Array.isArray(v) && v.length >= 1 && v.length <= 12 && v.every(x => typeof x === 'string')) ? '' : 'field: null or a list of 1-12 ids',
    fieldN: (v) => Number.isInteger(v) && v >= 1 && v <= 20 ? '' : 'fieldN not 1..20',
    num: (v) => Number.isInteger(v) && v >= 1 && v <= 99 ? '' : 'num not 1..99',
    snd: (v) => isObj(v) && SND_KINDS.indexOf(v.kind) >= 0 && isNum(v.hz, 0.3, 3) && isNum(v.loud, 0.1, 3) && (v.turbo == null || isNum(v.turbo, 0, 1)) && Object.keys(v).every(k => ['kind', 'hz', 'loud', 'turbo'].indexOf(k) >= 0) ? '' : 'snd: { kind (SND_KINDS), hz 0.3..3, loud 0.1..3, turbo? 0..1 }',
    expect: (v) => isObj(v) && Object.keys(v).every(k => ['t100', 'vmax', 'latG', 'd100'].indexOf(k) >= 0 && Array.isArray(v[k]) && v[k].length === 2 && isNum(v[k][0], 0, 1e4) && isNum(v[k][1], v[k][0], 1e4)) ? '' : 'expect: { t100, vmax, latG, d100: [lo, hi] }',
    partNames: (v) => isObj(v) && Object.keys(v).every(k => typeof v[k] === 'string' && v[k].length >= 1 && v[k].length <= 24) ? '' : 'partNames: { id: English name, 1-24 characters }',
    glb: (v) => v === null || typeof v === 'string' ? '' : 'glb: null or a name',   // (a patch may take a glb skin away: null)
    credit: (v) => typeof v === 'string' ? '' : 'credit not a text',
    retired: (v) => typeof v === 'boolean' ? '' : 'retired not true / false',
    look: (v) => v === null || isObj(v) ? '' : 'look: null or an object',
  };
  function physBad(P) {
    if (!isObj(P)) return 'phys missing';
    for (const k in P) if (PHYS_REQ.indexOf(k) < 0 && !(k in PHYS_OPT)) return 'phys: unknown key ' + k;
    for (const k of PHYS_REQ) {
      if (k === 'gears') { if (!Array.isArray(P.gears) || !P.gears.length || P.gears.length > 12 || !P.gears.every(g => isNum(g, 0.05, 20))) return 'phys.gears: 1-12 ratios > 0'; }
      else if (k === 'idle') { if (!isNum(P.idle, 0, 8000)) return 'phys.idle not 0..8000'; }
      else if (!isNum(P[k], 1e-6, 1e6)) return 'phys.' + k + ' not a number > 0';
    }
    if (P.len > 6.4 || P.wid > 3.2) return 'phys: longer than 6.4 m or wider than 3.2 m';
    if (!(P.a + P.b < P.len)) return 'phys: the wheelbase (a + b) as long as the vehicle';
    if (!(P.redline > P.idle) || P.redline > 25000) return 'phys.redline not above idle (and up to 25000)';
    if (P.rw > 1.1 || P.kI > 3 || P.cDrag > 3 || P.steerMax > 1.2) return 'phys: rw, kI, cDrag or steerMax out of range';
    for (const k in PHYS_OPT) { if (P[k] == null) continue; const R = PHYS_OPT[k]; if (R ? !isNum(P[k], R[0], R[1]) : typeof P[k] !== 'boolean') return 'phys.' + k + (R ? ' not ' + R[0] + '..' + R[1] : ' not true / false'); }
    if (P.circ != null && !Number.isInteger(P.circ)) return 'phys.circ not a whole number';
    return '';
  }
  // a full def's problems ('' when fine): every key known, the required ones there, each one sound
  function defBad(d) {
    if (!isObj(d)) return 'not an object';
    if (typeof d.id !== 'string' || !/^[a-z][a-z0-9]{1,15}$/.test(d.id)) return 'id: 2-16 lower-case letters / digits';
    for (const k in d) if (DEF_REQ.indexOf(k) < 0 && DEF_OPT.indexOf(k) < 0) return 'unknown key ' + k;
    for (const k of DEF_REQ) if (d[k] == null) return 'missing ' + k;
    for (const k in DEF_CHECK) if (d[k] !== undefined && !(k === 'field' && d[k] === null)) { const why = DEF_CHECK[k](d[k]); if (why) return why; }
    const pb = physBad(d.phys); if (pb) return pb;
    const A = d.arc; if (!isObj(A) || !isNum(A.amax, 0.8, 2.6) || !isNum(A.kv, 0.1, 10) || !isNum(A.rmin, 1, 20) || (A.bscale != null && !isNum(A.bscale, 0.3, 3)) || Object.keys(A).some(k => ['amax', 'kv', 'rmin', 'bscale'].indexOf(k) < 0)) return 'arc: { amax 0.8..2.6, kv 0.1..10, rmin 1..20, bscale? 0.3..3 }';
    const S = d.csp; if (!isObj(S) || !['bx', 'coast', 'thr', 'liftP', 'pwr'].every(k => isNum(S[k], -1, 1)) || !['out', 'turn', 'w'].every(k => isNum(S[k], 0.1, 3)) || (S.tv != null && !isNum(S.tv, 0.1, 3))
      || Object.keys(S).some(k => ['bx', 'coast', 'thr', 'liftP', 'pwr', 'out', 'turn', 'w', 'tv'].indexOf(k) < 0)) return 'csp: { bx, coast, thr, liftP, pwr -1..1; out, turn, w 0.1..3; tv? }';
    const pp = partsBad(d.parts); if (pp) return pp;
    let df = 0; const PT = expandParts(d.parts, d.phys); for (const k in PT) df += PT[k].df || 0;
    if (df > 1 + 1e-9) return 'parts: the downforce shares (df) add up to more than 1';
    return '';
  }
  function registerVehicles() {
    const skip = (d, why) => { DEFS_SKIPPED.push({ id: d && d.id, why }); if (typeof console !== 'undefined') console.warn('vehicle ' + (d && d.id) + ' skipped: ' + why); };
    // full defs: each sound, its id new (no model's, no body's, no earlier def's) ...
    const ok = [];
    for (const d of DEFS) {
      if (isObj(d) && d.patch) continue;
      const why = defBad(d) || (MODELS.some(m => m.id === d.id) || ok.some(o => o.id === d.id) ? 'id ' + d.id + ' taken' : BODY_KEYS.indexOf(d.id) >= 0 ? 'id ' + d.id + ' is a body name' : '');
      if (why) skip(d, why); else ok.push(d);
    }
    // ... and every id of its field a vehicle (dropping a def can take another's field with it: until nothing changes)
    for (let again = true; again;) {
      again = false;
      for (let i = ok.length - 1; i >= 0; i--) {
        const d = ok[i], miss = (d.field || []).find(id => !MODELS.some(m => m.id === id) && !ok.some(o => o.id === id));
        if (miss) { skip(d, 'field: no vehicle ' + miss); ok.splice(i, 1); again = true; }
      }
    }
    for (const d of ok) {
      const P = d.phys, M = Object.assign({}, P, {
        id: d.id, name: d.name, drive: d.drive, cat: d.cat, ord: d.ord != null ? d.ord : 0, kit: true, def: d, sndP: d.snd, stats: Object.assign({}, d.stats),
        body: 'hatch',   // INTERIM (stage A, no render kit yet): every registered vehicle drawn as the generic hatch; the kit flips this to d.id
        parts: expandParts(d.parts, P), field: d.field ? d.field.slice() : null,
      });
      for (const k of ['fieldN', 'num', 'glb', 'credit', 'retired']) if (d[k] != null) M[k] = d[k];
      // the AI's room for a big vehicle (unless the def sets its own): the edge margin, the passing offset, the follow gap (centre to
      // centre), how far to its side a car counts as in its way and as one to follow (the hard-coded 3.2 / 2.1 for the others)
      if (P.aiEdge == null) M.aiEdge = Math.max(1.25, 0.43 * P.wid + 0.5);
      if (P.aiPass == null) M.aiPass = Math.max(3.3, P.wid + 1.5);
      if (P.aiGap == null) M.aiGap = Math.max(3, P.len - 0.2);
      if (P.aiLat == null) M.aiLat = Math.max(3.2, P.wid + 1.8);
      if (P.aiFol == null) M.aiFol = Math.max(2.1, P.wid + 0.1);
      const wr = M.redline * TAU / 60;   // (as the loop at the models)
      M.Tmax = M.kw * 1000 / (wr * tqShape(1.0));
      ARC[M.id] = { amax: d.arc.amax, kv: d.arc.kv, bscale: d.arc.bscale != null ? d.arc.bscale : 1, rmin: d.arc.rmin };
      CSP[M.id] = Object.assign({}, d.csp);
      CAREER.car[M.id] = d.price;
      MODELS.push(M);
    }
    // patch defs, in order: onto a vehicle registered by now
    for (const d of DEFS) {
      if (!isObj(d) || !d.patch) continue;
      const M = MODELS.find(m => m.id === d.id);
      let why = !M ? 'patch: no vehicle ' + d.id : '';
      for (const k in d) if (!why && k !== 'id' && k !== 'patch' && PATCH_KEYS.indexOf(k) < 0) why = 'patch: unknown key ' + k;
      for (const k of PATCH_KEYS) if (!why && d[k] !== undefined && !(k === 'field' && d[k] === null)) why = k === 'parts' ? partsBad(d[k]) : DEF_CHECK[k](d[k]);
      if (!why && d.parts) { let df = 0; const PT = expandParts(d.parts, M); for (const k in PT) df += PT[k].df || 0; if (df > 1 + 1e-9) why = 'parts: the downforce shares (df) add up to more than 1'; }
      if (!why && d.field) { const miss = d.field.find(id => !MODELS.some(m => m.id === id)); if (miss) why = 'field: no vehicle ' + miss; }
      if (why) { skip(d, why); continue; }
      const D = M.def = Object.assign({}, M.def || { id: M.id, name: M.name });
      for (const k of PATCH_KEYS) if (d[k] !== undefined) D[k] = d[k];
      if (d.cat !== undefined) M.cat = d.cat; if (d.ord !== undefined) M.ord = d.ord; if (d.stats !== undefined) M.stats = Object.assign({}, d.stats);
      if (d.field !== undefined) M.field = d.field ? d.field.slice() : null; if (d.fieldN !== undefined) M.fieldN = d.fieldN;
      if (d.parts !== undefined) M.parts = expandParts(d.parts, M);
      if (d.snd !== undefined) M.sndP = d.snd; if (d.price !== undefined) CAREER.car[M.id] = d.price;
      for (const k of ['glb', 'credit', 'retired']) if (d[k] !== undefined) M[k] = d[k];
    }
  }
  registerVehicles();

  return { G, clamp, lerp, wrapPi, sstep, rng, Track, TRACK_DEF, PIKES_DEF, TRACKS, MODELS, ASSISTS, Car, Race, wallCollide, carCollide, aiControl, DRIVER_NAMES, UPG, upgMods, upgStats, CSK, CSP, CSASSIST, CSSURF,
    aiDriver, CHAMPS, CHAMP_PTS, PLAYER_KEY, champPoints, champTable, champKeys, tyreFor, TYRE_GRIP, TYRE_CMP, cmpFor, CAREER, careerPrize, careerUpgPrice,
    DEFS, DEFS_SKIPPED, CATS, SND_KINDS, PARTS, PART_SETS, partsOf, applyDamage, detachPart, wreckCar, aiModel, fieldSize, statsOf, ARC };
})();



if (typeof module !== 'undefined') module.exports = Core;
