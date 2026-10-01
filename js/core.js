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
      // mixed surfaces (def.surf = [[from, to, 'makadam'], ...], metres after the start line; rallycross: part asphalt, part gravel), see _buildSurf
      this.srf = null; this.gripK = null; this.pGrip = null;
      if (def.surf) this._buildSurf(def.surf);
      // side roads that meet the circuit (def.junctions; closed circuits), see _buildJunctions
      this.jc = [];
      if (def.junctions && !open) this._buildJunctions(def.junctions);
      // the joker lap (def.joker; rallycross, closed circuits), see _buildJoker
      this.jk = null; this.jshare = null; this.jkOther = null;
      if (def.joker && !open) this._buildJoker(def.joker);
      // a gravel stage with puddles in the rain (def.rain = { seed, puddles }; open roads, or a circuit's gravel sections: rallycross): [s, d
      // (m across, + right), half length, half width]; pudAt: per sample, the puddle there (-1: none). inRain: the race driving on it has rain
      // (Race.step); only then are the puddles a surface (6)
      this.puddles = []; this.pudAt = null; this.inRain = false;
      if (def.rain && (open || this.srf)) this._buildPuddles(def.rain);
      // the race's marks on an asphalt road (see roadGrip; Race.road, set here by Race.step): the marbles off the racing line in the corners
      // (closed circuits), the standing water of heavy rain (every asphalt road), the sausage kerbs at a track's chicanes (def.saus)
      this.road = null; this.mbI = null; this.pools = null; this.poolAt = null; this.poolK = 0; this.saus = null; this.sausAt = null;
      const tarmac = def.roadSurface !== 'makadam' && !def.surf;
      if (tarmac && !open) this._buildMarbles();
      if (tarmac) this._buildPools();
      if (def.saus && !open) this._buildSaus(def.saus);
    }

    // the marbles: the bits of rubber the tyres shed collect just off the racing line in the corners, on the side away from the bend (the cars
    // throw them outwards), most where the bend is tight and on its way out. mbI[i]: how many at sample i (0..1), + on the right of the racing
    // line, - on its left; Race road.mb: how much rubber the race has laid so far
    _buildMarbles() {
      const N = this.N, rk = this.rk, ds = this.ds, raw = new Float32Array(N), mb = this.mbI = new Float32Array(N), B = Math.round(12 / ds), A = Math.round(34 / ds);
      for (let i = 0; i < N; i++) raw[i] = -Math.sign(rk[i]) * sstep(1 / 320, 1 / 45, Math.abs(rk[i]));
      for (let i = 0; i < N; i++) {   // (smeared: more on the way out of the bend, a little before it)
        let sm = 0, ws = 0;
        for (let o = -B; o <= A; o++) { const wt = o < 0 ? 1 + o / (B + 1) : 1 - o / (A + 1); sm += raw[(i - o + N) % N] * wt; ws += wt; }
        mb[i] = this.srf && this.srf[i] === 5 ? 0 : clamp(sm / ws * 2.2, -1, 1);
      }
    }
    // standing water in heavy rain: in the dips of the profile (a stream right across the road where the dip is deep), on the inside of the
    // bends (the road drains towards the kerb) and here and there by an edge; not on the grid, not at the way into or out of the pit lane.
    // pools [s, d (m across, + right), half length, half width, stream]; poolAt[i]: the pool over sample i (-1 none). Race.step sets poolK
    // (0..1, with the water on the road): each grows from its middle to its full size (surface 7: the physics and the picture alike)
    _buildPools() {
      const N = this.N, ds = this.ds, w = this.w, hy = this.hy, L = this.len, open = this.open, id = this.def.id || 'x';
      let seed = 17; for (let k = 0; k < id.length; k++) seed = (seed * 31 + id.charCodeAt(k)) >>> 0;
      const R = rng(seed), P = [], n = clamp(Math.round(L / 450), 3, 16), st = this.startS, s0 = open ? st + 40 : 0, s1 = open ? this.finishS - 40 : L;
      const W = (s) => open ? s : ((s % L) + L) % L;
      const free = (s, hl) => {
        if (s - hl < s0 || s + hl > s1) return false;
        if (!open) { const b = W(st - s), a = W(s - st); if (b < 210 || a < 70) return false; }   // (the grid, the start)
        if (this.def.pit && (this.pitAt(s - hl - 15) || this.pitAt(s + hl + 15) || this.pitAt(s))) return false;
        for (const p of P) { let d = Math.abs(p[0] - s); if (!open) d = Math.min(d, L - d); if (d < 70) return false; }
        return true;
      };
      const put = (s, d, hl, hw, stream) => { s = W(s); if (!free(s, hl)) return; hw = Math.min(hw, w + 0.3 - Math.abs(d)); if (hw < 0.6) return; P.push([s, d, hl, hw, stream ? 1 : 0]); };
      if (this.hasElev) {   // (the dips: the lowest sample within 30 m either way, at least 0.2 m below both ends)
        const r = Math.round(30 / ds), dips = [];
        for (let i = open ? r : 0; i < (open ? N - r : N); i++) {
          const h = hy[i], a = hy[open ? i - r : (i - r + N) % N] - h, b = hy[open ? i + r : (i + r) % N] - h; if (a < 0.2 || b < 0.2) continue;
          let lo = true; for (let k = -r; k <= r && lo; k++) if (hy[open ? i + k : (i + k + N) % N] < h - 1e-4) lo = false;
          if (lo) dips.push([i, Math.min(a, b)]);
        }
        dips.sort((x, y) => y[1] - x[1]);
        for (const [i, dep] of dips) { if (P.length >= Math.ceil(n * 0.45)) break; if (dep > 0.3 && R() < 0.65) put(i * ds, 0, 1.4 + R() * 1.2, w + 0.3, true); else put(i * ds, (R() - 0.5) * 2 * (w - 2), 3 + R() * 3, 1.4 + R() * 1.4, false); }
      }
      const cs = this.corners.filter(c => c.minR < 90).sort((a, b) => a.minR - b.minR);
      for (const c of cs) {   // (the inside of the bend, past the apex)
        if (P.length >= Math.ceil(n * 0.8)) break;
        let ap = c.i0, mk = 0; for (let i = c.i0, g = 0; g < N; i = (i + 1) % N, g++) { if (Math.abs(this.k[i]) > mk) { mk = Math.abs(this.k[i]); ap = i; } if (i === c.i1) break; }
        const side = c.dir > 0 ? 1 : -1, hw = 0.9 + R() * 0.9;
        put(ap * ds + 4 + R() * 10, side * (w - hw - 0.15), 2.5 + R() * 3.5, hw, false);
      }
      for (let t = 0; t < 400 && P.length < n; t++) { const hw = 0.8 + R() * 0.7; put(s0 + R() * (s1 - s0), (R() < 0.5 ? -1 : 1) * (w - hw - 0.2), 3.5 + R() * 4.5, hw, false); }
      P.sort((a, b) => a[0] - b[0]);
      this.pools = P;
      const at = this.poolAt = new Int16Array(N).fill(-1);
      P.forEach((p, k) => { for (let x = p[0] - p[2] - ds; x <= p[0] + p[2] + ds; x += ds / 2) { const i = open ? Math.floor(x / ds) : ((Math.floor(x / ds) % N) + N) % N; if (i >= 0 && i < N) at[i] = k; } });
    }
    // standing water at a lookup (on the asphalt, see surface): inside pool p as big as it is now (poolK)
    _inPool(p, q) {
      const u = this.pools[p], k = this.poolK; let ds = q.s - u[0];
      if (!this.open) { ds = ((ds % this.len) + this.len) % this.len; if (ds > this.len / 2) ds -= this.len; }
      const a = ds / (u[2] * k), b = (q.d - u[1]) / (u[3] * k); return a * a + b * b < 1;
    }
    // sausage kerbs (def.saus = [m after the start line where a chicane's first bend begins, ...]): a high yellow hump right behind the kerb on
    // the inside of each of the chicane's two bends, round the apex; a car cutting across it is thrown into the air (Race._saus). saus: [{ i0,
    // i1 (samples), ap (the apex), side (+1 right, -1 left), d0, d1 (m out from the centre line) }]; sausAt[i]: the one at sample i (-1 none)
    _buildSaus(list) {
      const N = this.N, ds = this.ds, Z = [], at = new Int8Array(N).fill(-1), C = this.corners;
      for (const m of list) {
        const i0 = this.idx(this.startS + m); let a = -1, best = 50 / ds;
        C.forEach((c, n) => { let d = Math.abs(c.i0 - i0); d = Math.min(d, N - d); if (d < best) { best = d; a = n; } });
        if (a < 0) continue;
        for (const c of [C[a], C[(a + 1) % C.length]]) {
          let ap = c.i0, mk = 0; for (let i = c.i0, g = 0; g < N; i = (i + 1) % N, g++) { if (Math.abs(this.k[i]) > mk) { mk = Math.abs(this.k[i]); ap = i; } if (i === c.i1) break; }
          const side = c.dir > 0 ? 1 : -1, d0 = this.w + (this.curb[ap] ? this.curbW : 0.3) + 0.05, d1 = d0 + 0.6, hr = Math.round(7 / ds);
          if ((side > 0 ? this.br : this.bl)[ap] < d1 + 0.4) continue;   // (no room before the barrier)
          const zi = Z.length; Z.push({ i0: (ap - hr + N) % N, i1: (ap + hr) % N, ap, side, d0, d1 });
          for (let o = -hr; o <= hr; o++) at[(ap + o + N) % N] = zi;
        }
      }
      if (Z.length) { this.saus = Z; this.sausAt = at; }
    }

    // mixed surfaces: the road is asphalt but on the gravel sections (def.surf [from, to, 'makadam'], metres after the start line; an open
    // road from its sample 0). srf[i] the surface of sample i (0 asphalt, 5 makadam), no kerbs on the gravel; gripK[i] the grip left on
    // the asphalt right after a gravel section (the gravel the cars carry onto it: 10 % less at the seam, fading out over 45 m); pGrip[i]
    // the grip the AI's speed profile reckons with (the gravel's side grip)
    _buildSurf(S) {
      const N = this.N, ds = this.ds, open = this.open, sf = this.srf = new Uint8Array(N), gk = this.gripK = new Float32Array(N).fill(1);
      for (const [a, b, k] of S) if (k === 'makadam') for (let d = a; d < b; d += ds / 2) sf[this.idx(this.startS + d)] = 5;
      const nD = Math.round(45 / ds);
      for (let i = 0; i < N; i++) {
        const j = open ? i + 1 : (i + 1) % N; if (j >= N) break;
        if (sf[i] !== 5 || sf[j] !== 0) continue;
        for (let k = 0; k < nD; k++) { const m = open ? j + k : (j + k) % N; if (m >= N || sf[m] !== 0) break; gk[m] = Math.min(gk[m], 1 - 0.1 * (1 - k / nD)); }
      }
      for (let i = 0; i < N; i++) if (sf[i] === 5) this.curb[i] = 0;
      const pg = this.pGrip = new Float32Array(N); for (let i = 0; i < N; i++) pg[i] = sf[i] === 5 ? CSSURF[5].lat : gk[i];
    }

    // side roads that meet the circuit (def.junctions = [{ at (m after the start line) or x, z (the point on the centre line), side (-1 left,
    // 1 right), hw (the side road's half width), depth (m out along it, from the road's edge, to where it is closed: a gate, tyres or bales),
    // ang (deg from the road's direction of travel: 90 square, less: the side road leaves forwards), kind }]): the barrier on that side
    // opens over the side road's mouth, as far out as the side road goes before it is closed (for each station along the road, the part of
    // the side road's strip that reaches the road's edge). jc: [{ i, side, hw, depth, ang, kind, x, z (where its axis meets the edge),
    // ax, az (its direction, outwards) }] for the world
    _buildJunctions(L) {
      const N = this.N, ds = this.ds, w = this.w;
      for (const J of L) {
        const i0 = J.at != null ? this.idx(this.startS + J.at) : this.nearestIdx(J.x, J.z), side = J.side > 0 ? 1 : -1, hw = J.hw || 3.5, dep = J.depth || 8;
        const ang = clamp(J.ang || 90, 20, 160) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang), arr = side > 0 ? this.br : this.bl;
        const reach = Math.ceil((hw / sa + dep * Math.abs(ca) + 2) / ds);
        for (let k = -reach; k <= reach; k++) {
          const i = (i0 + k + N) % N, d = k * ds;   // (d: metres along the road from where the side road's axis meets the edge)
          let u = 0;   // how far out from the edge the side road's strip reaches without a gap (the axis: along = u cot(ang))
          for (let uu = 0; uu <= dep + hw; uu += 0.25) { const lat = d * sa - uu * ca, t = d * ca + uu * sa; if (Math.abs(lat) > hw || t < -0.5 || t > dep) break; u = uu; }
          if (u > 0.5) arr[i] = Math.max(arr[i], w + u);
        }
        const x = this.px[i0] + this.nx[i0] * side * w, z = this.pz[i0] + this.nz[i0] * side * w;
        const ax = this.tx[i0] * ca + this.nx[i0] * side * sa, az = this.tz[i0] * ca + this.nz[i0] * side * sa;
        this.jc.push({ i: i0, side, hw, depth: dep, ang: J.ang || 90, kind: J.kind || 'gate', x, z, ax, az });
      }
    }

    // the joker lap (def.joker = { points: [[x, z], ...] from the split to the join, halfWidth, h: [height at each point] (the two ends: the
    // circuit's), surf, runoff, inner, side }): a second road that leaves the circuit and joins it again further on (rallycross: every car
    // drives it once a race, see Race._joker). jk: its Track (an open road); jkA / jkB: the samples of the split and of the join on the
    // circuit; jkK: circuit metres per joker metre (the race distance a car covers on it). jshare (on both roads): the stretches where the
    // two run together (the split and the join): a car there is on the surface and inside the barriers of either road. Elsewhere a divider
    // stands between them, each road's barrier midway across the gap between their edges. jkOther: the other road
    _buildJoker(J) {
      // (the joker's road starts J.lead m (default 12) before the split and ends as far after the join, on the circuit itself: it leaves and
      // joins tangentially, and its speed profile holds the braking for its first bend)
      const N0 = this.N, kL = Math.round((J.lead || 12) / this.ds), n0 = J.points.length;
      const iS = this.nearestIdx(J.points[0][0], J.points[0][1]), iJ = this.nearestIdx(J.points[n0 - 1][0], J.points[n0 - 1][1]);
      const iA = (iS - kL + N0) % N0, iB = (iJ + kL) % N0;
      const P = [[this.px[iA], this.pz[iA]]].concat(J.points, [[this.px[iB], this.pz[iB]]]), n = P.length, Hh = J.h ? [null].concat(J.h, [null]) : null;
      const elev = P.map((p, k) => [p[0], p[1], k === 0 ? this.hy[iA] : k === 1 ? this.hy[iS] : k === n - 2 ? this.hy[iJ] : k === n - 1 ? this.hy[iB] : Hh ? Hh[k] : lerp(this.hy[iS], this.hy[iJ], (k - 1) / (n - 3))]);
      const jk = this.jk = new Track({ id: (this.def.id || '') + ':joker', points: P, open: true, halfWidth: J.halfWidth || this.w, elev, elevSmooth: J.elevSmooth || 10,
        surf: J.surf, noCurbs: J.curbs === false || !!this.def.noCurbs, noGravel: true, runoff: J.runoff || 0.6, inner: J.inner || 3, side: J.side || 3.5, gradeForce: this.def.gradeForce });
      jk.jkOther = this; this.jkOther = jk; jk.jkOf = this;
      const L = this.len, N = this.N, NJ = jk.N, q = {};
      // where it runs on the lap or right beside it (its lead-in and lead-out, the first and last stretches of the split and the join) it
      // takes the lap's height (the lap's crests there, the two roads' own heights differ): fully within 2 m of the lap's edge, not at all
      // once the two edges are 6 m apart; then its grade and vertical curvature again (as _buildElevationOpen)
      if (jk.hasElev) {
        for (let j = 0; j < NJ; j++) { if (j > NJ * 0.45 && j < NJ * 0.55) continue; this.query(jk.px[j], jk.pz[j], j < NJ / 2 ? iA : iB, q);
          jk.hy[j] = lerp(jk.hy[j], this.elevAt(q.s).y, 1 - sstep(this.w + 2, this.w + jk.w + 6, Math.abs(q.d))); }
        const hy = jk.hy, gr = jk.grade, cv = jk.curv;
        for (let j = 0; j < NJ; j++) { const a = Math.max(0, j - 1), b = Math.min(NJ - 1, j + 1); gr[j] = (hy[b] - hy[a]) / ((b - a) * jk.ds); }
        for (let j = 0; j < NJ; j++) { const a = Math.max(0, j - 1), b = Math.min(NJ - 1, j + 1); cv[j] = (gr[b] - gr[a]) / ((b - a) * jk.ds); }
        let mx = -1e9; for (let j = 0; j < NJ; j++) mx = Math.max(mx, hy[j]); jk.maxElev = mx;
      }
      this.jkA = iA; this.jkB = iB; this.jkK = (((iB - iA) * this.ds) % L + L) % L / jk.len;
      // shared: where the gap between the two roads' edges is under 2.5 m (a joker sample in its first or last 45 %; a circuit sample
      // near the split or the join, at most 20 m before the joker's first sample or after its last), widened by 6 m either way
      const gapMin = this.w + jk.w + 2.5, shJ = new Uint8Array(NJ), shM = new Uint8Array(N);
      for (let j = 0; j < NJ; j++) { if (j > NJ * 0.45 && j < NJ * 0.55) continue; this.query(jk.px[j], jk.pz[j], j < NJ / 2 ? iA : iB, q); if (Math.abs(q.d) < gapMin) shJ[j] = 1; }
      for (const [i0, dir] of [[iA, 1], [iB, -1]]) for (let k = -12; k < 80; k++) {
        const i = (i0 + dir * k + N) % N; jk.query(this.px[i], this.pz[i], dir > 0 ? 0 : NJ - 1, q);
        if (Math.abs(q.d) < gapMin && Math.abs(q.over || 0) < 20) shM[i] = 1;
      }
      const dil = (a, M, wrap) => { const o = new Uint8Array(M); for (let i = 0; i < M; i++) if (a[i]) for (let d = -3; d <= 3; d++) { const k = wrap ? (i + d + M) % M : clamp(i + d, 0, M - 1); o[k] = 1; } return o; };
      this.jshare = dil(shM, N, true); jk.jshare = dil(shJ, NJ, false);
      // where the joker's centre line leaves the circuit's surface (m after jkA along the circuit) and on which side: the AI can still turn in
      // before that point, and keeps away from that side of the road there when it does not take the joker this lap (see aiControl)
      this.jkLeave = 30; this.jkSide = -1; let sideB = -1;
      for (let j = 0; j < NJ; j++) { this.query(jk.px[j], jk.pz[j], iA, q); if (Math.abs(q.d) > this.w) { this.jkLeave = ((q.s - iA * this.ds) % L + L) % L; this.jkSide = q.d > 0 ? 1 : -1; break; } }
      for (let j = NJ - 1; j >= 0; j--) { this.query(jk.px[j], jk.pz[j], iB, q); if (Math.abs(q.d) > this.w) { sideB = q.d > 0 ? 1 : -1; break; } }
      // in the shared stretches each road's barrier on the side that faces the other (the gore between them) comes in to 2.5 m past its
      // edge: a car there is on either road or on the verge beside it (the other road's surface: see wallCollide); the gore is walled off
      const face = (A, i, side) => { if (side > 0) A.br[i] = Math.min(A.br[i], A.w + 2.5); else A.bl[i] = Math.min(A.bl[i], A.w + 2.5); };
      for (let i = 0; i < N; i++) if (this.jshare[i]) { const dA = Math.abs(i - iA), dB = Math.abs(i - iB); face(this, i, Math.min(dA, N - dA) <= Math.min(dB, N - dB) ? this.jkSide : sideB); }
      for (let j = 0; j < NJ; j++) if (jk.jshare[j]) face(jk, j, j < NJ / 2 ? -this.jkSide : -sideB);
      // the dividers: for a sample of one road outside the shared stretches, the other road's samples within 80 m, left and right of it
      // (roughly abeam: within +-35 deg of square across); the barrier on each side comes in to the middle of the gap between the two
      // edges there (0.3 m short of it)
      const div = (A, B) => {
        for (let i = 0; i < A.N; i++) {
          if (A.jshare[i]) continue;
          let dL = 80, dR = 80;
          for (let j = 0; j < B.N; j++) {
            const dx = B.px[j] - A.px[i], dz = B.pz[j] - A.pz[i], lat = dx * A.nx[i] + dz * A.nz[i], al = dx * A.tx[i] + dz * A.tz[i];
            if (Math.abs(al) > 2 + 0.7 * Math.abs(lat)) continue;
            if (lat > 0) dR = Math.min(dR, lat); else dL = Math.min(dL, -lat);
          }
          const lim = (d) => A.w + Math.max(0.6, (d - A.w - B.w) / 2 - 0.3);
          if (dR < 80) A.br[i] = Math.min(A.br[i], lim(dR));
          if (dL < 80) A.bl[i] = Math.min(A.bl[i], lim(dL));
        }
      };
      div(this, jk); div(jk, this);
    }
    // the puddles: in the dips of the profile first (the water runs down into them), then spread along the rest of the run, some on the
    // racing line, 30 m apart at least, and none from a jump's approach to its landing (the jumps fly as tuned). A circuit: only on its
    // gravel (the whole puddle and 6 m round it)
    _buildPuddles(rain) {
      const N = this.N, ds = this.ds, hy = this.hy, R = rng(rain.seed || 31), P = this.puddles, n = rain.puddles || 40, loop = !this.open, s0 = loop ? 0 : this.startS + 40, s1 = loop ? this.len - 1 : this.finishS - 40;
      const jumps = (this.def.bumps || []).map(b => [clamp(b.at, 0, 1) * this.len, b.w || 8]);
      const grav = (s) => !loop || [-10, -5, 0, 5, 10].every(k => this.srf[this.idx(s + k)] === 5);
      const free = (s) => grav(s) && jumps.every(([c, w]) => s < c - 2.2 * w - 25 || s > c + 1.6 * w + 10) && P.every(p => Math.abs(p[0] - s) > 30);
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
    // aero: grip that grows with speed, latA (1 + aero v^2) (the formula's wings): v^2 (curvature - latA aero) = latA (no limit once the wings hold any bend)
    // mixed surfaces (pGrip): each sample's grip scales its cornering and braking; vEnd (an open road that runs on into another, the
    // joker): the speed it may end at instead of a stop
    speedProfile(latA, brakeA, vtop, wMax, aero, vEnd) {
      const N = this.N, rk = this.rk, rds = this.rds, la = latA * (aero || 0), pg = this.pGrip;
      const v = new Float32Array(N);
      for (let i = 0; i < N; i++) { const g = pg ? pg[i] : 1, kk = Math.max(Math.abs(rk[i]), 1e-5) - la * g; v[i] = kk > 1e-6 ? Math.min(vtop, Math.sqrt(latA * g / kk)) : vtop; }
      if (this.bank) for (let i = 0; i < N; i++) { const b = this.bank[i], g = pg ? pg[i] : 1, kk = Math.max(Math.abs(rk[i]), 1e-5) - la * g; if (b > 0) v[i] = kk > 1e-6 ? Math.min(vtop, Math.sqrt((latA * g + G * b / Math.sqrt(1 + b * b)) / kk)) : vtop; }   // a banked bend carries part of the cornering force
      if (wMax) for (let i = 0; i < N; i++) v[i] = Math.min(v[i], wMax / Math.max(Math.abs(rk[i]), 1e-5));   // cs: the car turns no faster than wMax (rad/s) along its path
      const bA = pg ? (i) => brakeA * (0.55 + 0.45 * pg[i]) : null;   // (mixed surfaces: the brakes keep 0.55 + 0.45 x the grip, as in Car)
      if (this.open) {   // open road: come to a stop at the far end of the road (or run on at vEnd), nothing wraps
        v[N - 1] = vEnd != null ? Math.min(v[N - 1], vEnd) : 0;
        for (let i = N - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * (bA ? bA(i) : brakeA) * rds[i]));
        return v;
      }
      if (bA) {   // (a mixed-surface circuit: its own braking pass, with the slopes as below)
        const gr = this.def.gradeForce && this.hasElev ? this.grade : null;
        for (let pass = 0; pass < 3; pass++) for (let i = N - 1; i >= 0; i--) { const b = (i + 1) % N, a0 = bA(i), a = gr ? Math.max(a0 * 0.6, a0 + G * gr[i]) : a0; v[i] = Math.min(v[i], Math.sqrt(v[b] * v[b] + 2 * a * rds[i])); }
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
    // def.gravelStrips: gravel just past the kerb), 5 makadam; 6 a puddle on it (in the rain, inRain: def.rain's puddles); 7 standing water on
    // the asphalt (heavy rain: pools, poolK)
    surface(q) {
      const d = q.d, ad = Math.abs(d), w = this.w;
      if (ad <= w) {
        if ((this.srf ? this.srf[q.a] : this.def.roadSurface === 'makadam' ? 5 : 0) !== 5) { const p = this.poolK > 0 && this.poolAt ? this.poolAt[q.a] : -1; return p >= 0 && this._inPool(p, q) ? 7 : 0; }   // (def.surf: the section's own surface; standing water in heavy rain)
        const p = this.inRain && this.pudAt ? this.pudAt[q.a] : -1;
        if (p >= 0) { const u = this.puddles[p], a = (q.s - u[0]) / u[2], b = (d - u[1]) / u[3]; if (a * a + b * b < 1) return 6; }
        return 5;
      }
      if (this.jshare && this.jshare[q.a] && !this._alt) {   // where the joker and the circuit run together: the other road's surface under the wheel
        const o = this.jkOther, oq = o.query(q.x, q.z, o._altI != null ? o._altI : -1, _qAlt); o._altI = oq.i;
        if (Math.abs(oq.d) <= o.w) { o._alt = true; const sf = o.surface(oq); o._alt = false; return sf; }
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
    { mu: 0.7, c0: 2.6, c1: 0.12 },     // a puddle on the makadam (in the rain, on top of WET): the water drags at the wheel
    { mu: 0.9, c0: 1.4, c1: 0.06 },     // standing water on the asphalt (heavy rain, Track.pools): it drags at the wheel, and at speed the tyre floats on it (aqua)
  ];
  const LOOSE = [0, 0, 1, 1, 0, 1];     // grass, gravel, makadam: where a car on slicks (model.loose) has only that share of its grip
  // rain: the grip left on a wet track (x every surface's mu: cornering and traction; the brakes keep 0.55 + 0.45 x of theirs).
  // Less grip also means bigger, lazier slides in both slide models (as on the loose surfaces)
  const WET = 0.8;
  // tyres (Race opts tyres): slicks and rain tyres, their grip on a road with water w (0 dry .. 1 wet): slicks lose most of theirs in the wet,
  // rain tyres have less on a dry road (and wear fast there); the right ones give the old grip (1 dry, WET in the rain). Worn out: 10 % less
  const TYRE_GRIP = { dry: (w) => 1 - 0.38 * w, wet: (w) => 0.9 - (0.9 - WET) * w };
  const tyreFor = (w) => w > 0.3 ? 'wet' : 'dry';   // the tyres to fit for a road with this much water
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
    formula: { amax: 1.98, kv: 3.3, bscale: 0.78, rmin: 5.0 },   // slicks: grip, the travel follows the nose quickly (small slides); a wide turning circle
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
    { lat: 0.7, tr: 0.72, c0: 2.6, c1: 0.12 },      // a puddle (in the rain, on top of WET): the water drags at the wheel (one side in it: a tug towards it)
    { lat: 0.9, tr: 0.9, c0: 1.4, c1: 0.06 },       // standing water on the asphalt (= SURF; aquaplaning at speed: aqua)
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
  const _qAlt = {}, _qW2 = {};    // (lookups on the other road where the joker and the circuit run together)
  // a mixed-surface road's grip (Track.gripK): the asphalt just after a gravel section a little less (the gravel carried onto it), the gravel
  // in winter less than the asphalt (Race sets trk.coldK: its share of the cold grip against the asphalt's, which every car's wet already holds)
  // The race's own marks on the road (trk.road, Race.road: see roadGrip) on every track.
  const gkAt = (trk, q, sf) => (sf === 0 ? (trk.gripK ? trk.gripK[q.a] : 1) : sf === 5 ? trk.coldK || 1 : 1) * (trk.road ? roadGrip(trk, q, sf) : 1);
  // the grip the race has left on the road (Race.road, set on the track by Race.step): oil from a crash (very slippery; under the cement
  // the marshals put on it a little less than the road), the marbles off the racing line in the corners (Track.mbI) as the rubber builds up
  // (road.mb, 0..1): up to MB_LOSS less grip there
  const MB_LOSS = 0.22;
  function roadGrip(T, q, sf) {
    if (sf > 1 && sf !== 7) return 1;   // (the road and the kerbs only)
    const R = T.road; let g = 1;
    for (const o of R.oil) {
      let ds = q.s - o.s; if (!T.open) { ds = ((ds % T.len) + T.len) % T.len; if (ds > T.len / 2) ds -= T.len; }
      if (Math.abs(ds) > o.r) continue;
      const dd = q.d - o.d; if (ds * ds + dd * dd < o.r * o.r) g = Math.min(g, o.cem ? 0.9 : 0.5);
    }
    if (sf === 0 && R.mb > 0 && T.mbI) {
      const m = T.mbI[q.a];
      if (m) { const u = (q.d - T.rl[q.a]) * (m > 0 ? 1 : -1); if (u > 1.4) g *= 1 - MB_LOSS * R.mb * Math.abs(m) * sstep(1.4, 2.2, u) * (1 - sstep(4.4, 5.4, u)); }
    }
    return g;
  }
  // aquaplaning (standing water, surface 7): the tyre rides up on the water from ~50 km/h, at 110 km/h on a deep pool it has little grip left
  const aqua = (v, k) => 1 - 0.62 * k * sstep(14, 30, v);
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
      // the set-up for the track (opts.setup: wing and gears 0 / 1 / 2, 1 the standard one): less wing = less drag but less grip at speed,
      // more wing the other way round; short gears pull harder and top out lower, long ones the other way round
      const SU = opts.setup, sw = SU ? clamp(Math.round(+SU.wing) || 0, 0, 2) : 1, sg = SU ? clamp(Math.round(+SU.gear) || 0, 0, 2) : 1;
      if (SU && (sw !== 1 || sg !== 1)) model = Object.assign({}, model, { cDrag: model.cDrag * SETUP_DRAG[sw], final: model.final * SETUP_FINAL[sg] });
      this.setup = { wing: SU ? sw : 1, gear: SU ? sg : 1 };
      const arc0 = ARC[model.id] || ARC.kaze;
      this.arc = U ? Object.assign({}, arc0, { amax: arc0.amax * U.grip, kv: arc0.kv * U.kv }) : arc0;   // per-car arcade handling
      this.tracG = U ? TRAC_G * U.trac : TRAC_G; this.brakeG = U ? BRAKE_G * U.brake : BRAKE_G; this.aeroK = (U ? U.aeroK : 0) + (SU ? SETUP_AEROK[sw] : 0);
      if (model.aero) { this.tracG *= model.tracK; this.brakeG *= model.brakeK; this.aeroK += model.aero; this.aeroK0 = this.aeroK; }   // the formula (aeroK0: with both wings)
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
      this.wet = 1;   // grip left in the rain (Race.setRain): 1 dry
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
        const sf = trk.surface(q); this.ws[k] = sf; muSum += SURF[sf].mu * (M.loose && LOOSE[sf] ? M.loose : 1) * (trk.gripK || trk.road ? gkAt(trk, q, sf) : 1) * (sf === 7 ? aqua(spd, trk.poolK) : 1); if (sf === 1) curb++;   // (slicks on loose ground; gkAt: dirty asphalt after gravel, the winter gravel, the race's marks on the road)
        dragC0 += SURF[sf].c0 * 0.25; dragC1 += SURF[sf].c1 * 0.25;
      }
      this.onCurb = curb;
      const muSurf = muSum / 4 * this.wet;   // (rain: less grip)
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
      const Fdmax = this.tracG * G * m * share * muSurf * (0.42 + 0.58 * sstep(0.5, 9, Math.abs(vl))) * (M.aero ? 1 + this.aeroK * spd * spd : 1);   // (the formula's wings press the driven wheels down too)
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
      this.spin = thr > 0.2 && grounded ? spin * (M.spinK || 1) : 0;
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
      // vertical motion (hilly tracks): fly off crests, arc, land (a flat track: only after a sausage kerb's kick)
      if (trk.hasElev || this.air) {
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
        const sf = trk.surface(q); this.ws[k] = sf; const S = CSSURF[sf], lk = (M.loose && LOOSE[sf] ? M.loose : 1) * (trk.gripK || trk.road ? gkAt(trk, q, sf) : 1) * (sf === 7 ? aqua(spd, trk.poolK) : 1), tr = S.tr * lk, lt = S.lat * lk;   // (slicks on loose ground; gkAt: dirty asphalt after gravel, the winter gravel, the race's marks on the road)
        muSum += tr; if (k < 2) muF += tr * 0.5; else muR += tr * 0.5; if (sf === 1) curb++;
        const dk = (S.c0 * Math.min(1, spd / 3) + S.c1 * spd) * 0.25, lw = 0.5 * (1 + ldK * sgO * (k & 1 ? -1 : 1));   // (k odd: +lateral side = inner in a + turn)
        dragC0 += S.c0 * 0.25; dragC1 += S.c1 * 0.25;
        if (k < 2) { latF += lt * 0.5; latFw += lt * lw; } else { latB += lt * 0.5; latBw += lt * lw; }
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
      if (!fwd) rT = (vl < -0.5 ? -stIn : 0) * Math.min(Math.abs(vl) / P.rmin, 1.6);   // reversing: kinematic (as the arcade)
      if (!grounded) rT = this.w * Math.exp(-dt / K.airYawT);                            // no steering in the air; the spin dies away
      const rA = bF > 0.3 ? K.rAccB : K.rAcc;
      if (grounded) this.w += clamp((rT - this.w) * Math.min(1, dt / K.tR), -rA * dt, rA * dt); else this.w = rT;
      // ---- integrate: forces, then the path turn as an exact rotation of the velocity (no speed gained or lost by turning) ----
      const ax = (Fx * ch - Fy * sh) / m, az = (Fx * sh + Fy * ch) / m;
      this.vx += ax * dt; this.vz += az * dt;
      if (wN !== 0) { const cr = Math.cos(wN * dt), sr = Math.sin(wN * dt), vx0 = this.vx; this.vx = vx0 * cr - this.vz * sr; this.vz = vx0 * sr + this.vz * cr; }
      this.x += this.vx * dt; this.z += this.vz * dt; this.h += this.w * dt;
      if (trk.hasElev || this.air) {   // (a flat track: only after a sausage kerb's kick)
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
        this.ws[k] = s; muW[k] = SURF[s].mu * this.wet * (trk.gripK || trk.road ? gkAt(trk, q, s) : 1) * (s === 7 ? aqua(spd, trk.poolK) : 1);
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
      if (c.dz[P.z] >= P.th || (P.corner != null && c.cd[P.corner] >= 0.55)) {
        c.lost[name] = 1; c.detach.push(name);
        if (c.aeroK0 != null && WING[name]) c.aeroK = Math.max(0, c.aeroK - c.m.aero * WING[name]);   // the formula: a wing gone, its downforce with it
      }
    }
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

  // a car on the joker: its lookups on the joker take the place of its circuit lookups for the physics and the barriers (and back after)
  function jkSwap(c) { const q = c.q; c.q = c.jq; c.jq = q; const w = c.wq; c.wq = c.wqj; c.wqj = w; }
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
      if (pen > 0 && trk.jshare && (trk.jshare[q.a] || trk.jshare[q.a + 1 < trk.N ? q.a + 1 : q.a])) {   // where the joker and the circuit run together: on the
        const o = trk.jkOther, oq = o.query(px, pz, o._altI != null ? o._altI : -1, _qW2); o._altI = oq.i;   // other road (its surface and 2.5 m beside it) is inside
        const eR = Math.min(oq.br, o.w + 2.5), eL = Math.min(oq.bl, o.w + 2.5);
        let p2 = 0, n2x = 0, n2z = 0;
        if (oq.d > eR) { p2 = oq.d - eR; n2x = -oq.nx; n2z = -oq.nz; } else if (oq.d < -eL) { p2 = -eL - oq.d; n2x = oq.nx; n2z = oq.nz; }
        if (o.open) { const sl = oq.s + (oq.over || 0); if (sl < -0.5 || sl > o.len + 0.5) p2 = Math.max(p2, 1e3); }   // (past the joker's ends: not on it)
        if (p2 <= 0) pen = 0; else if (p2 < pen) { pen = p2; nx = n2x; nz = n2z; }
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
  // the AI's look-ahead point at s along its route (out: the road R and its samples i0, i1, f): on its own road; on the joker (onJ) past its
  // end, on the circuit from the join on; on the circuit, into the joker when it takes it this lap (jkGo) and the point lies past the split
  function aiPoint(T, onJ, jkGo, s, out) {
    const J = T.jk;
    if (onJ) { if (s <= J.len - 1) return rsamp(J, s, out); s = T.jkB * T.ds + (s - J.len); }
    else if (jkGo) { let d = s - T.jkA * T.ds; d = ((d % T.len) + T.len) % T.len; if (d > T.len / 2) d -= T.len; if (d > 0 && d < J.len - 1) return rsamp(J, d, out); }
    return rsamp(T, s, out);
  }
  function rsamp(R, s, out) {   // the samples around s on road R (an open road: clamped to its ends)
    const N = R.N, fi = s / R.ds;
    if (R.open) { const f = clamp(fi, 0, N - 1); out.i0 = Math.min(N - 2, Math.floor(f)); out.i1 = out.i0 + 1; out.f = f - out.i0; }
    else { out.i0 = ((Math.floor(fi) % N) + N) % N; out.i1 = (out.i0 + 1) % N; out.f = fi - Math.floor(fi); }
    out.R = R; return out;
  }
  // the hazards on the road ahead (heavy rain's standing water: Track.pools; oil: race.road.oil): the nearest within `ahead` m that the car,
  // at `lat` m from the centre line, would drive into: { s (where, along the road), d, hw (its half width), wide (right across the road),
  // oil } or null
  function aiHazard(T, RD, s, ahead, lat) {
    const L = T.len, fwd = (x) => { let d = x - s; if (!T.open) { d = ((d % L) + L) % L; if (d > L - 40) d -= L; } return d; };
    let best = null, bd = 1e9;
    if (T.poolK > 0 && T.pools) for (const p of T.pools) {
      const k = T.poolK, d = fwd(p[0]); if (d < -p[2] * k || d > ahead || d > bd) continue;
      if (p[4] || Math.abs(lat - p[1]) < p[3] * k + 1.3) { bd = d; best = { s: p[0], d: p[1], hw: p[3] * k, wide: !!p[4], oil: false }; }
    }
    if (RD) for (const o of RD.oil) {
      const d = fwd(o.s); if (d < -o.r || d > ahead || d > bd || o.cem) continue;
      if (Math.abs(lat - o.d) < o.r + 1.3) { bd = d; best = { s: o.s, d: o.d, hw: o.r, wide: false, oil: true }; }
    }
    return best;
  }
  // the grip the marbles leave at sample i, d m from the centre line (see roadGrip)
  function mbGrip(T, mb, i, d) { const m = T.mbI[i]; if (!m) return 1; const u = (d - T.rl[i]) * (m > 0 ? 1 : -1); return u > 1.4 ? 1 - MB_LOSS * mb * Math.abs(m) * sstep(1.4, 2.2, u) * (1 - sstep(4.4, 5.4, u)) : 1; }
  const _ap = {}, _ap2 = {};
  function aiControl(c, race, dt) {
    const T = race.track, M = c.m, A = c.assist;
    const q = c.q;
    const v = Math.max(0, c.vl);
    const N = T.N;
    // the joker (Track.jk): on it, its own road and lookup (R, rq); jkGo: this lap it takes the joker and can still make the split
    const J = T.jk, onJ = !!(J && c.rd), R = onJ ? J : T, rq = onJ ? c.jq : q;
    let jkGo = false, jkPass = false;   // (jkPass: past the split without taking it: keep off the joker's side until it has left the road)
    if (J && !onJ) {
      let dq = q.s - T.jkA * T.ds; dq = ((dq % T.len) + T.len) % T.len; if (dq > T.len / 2) dq -= T.len;
      if (race.jkRule && !c.jkN && c.lap >= 1 && c.lap >= Math.min(c.jkLap || 1, race.laps)) jkGo = dq < T.jkLeave - 4 || (c.jkGo && dq > -5 && dq < 90 && !!T.jshare[q.a]);   // (once it turns in, it goes through with it while the roads still run together)
      jkPass = !jkGo && dq > -Math.max(10, v * 1.6) && (dq < T.jkLeave + 10 || (dq < 90 && !!T.jshare[q.a]));   // (fast cars move over earlier)
    }
    if (J) c.jkGo = jkGo;
    // --- avoidance / overtaking ---
    c.aiT -= dt;
    if (c.aiT <= 0) {
      c.aiT = 0.12 + Math.random() * 0.08;
      let target = c.laneBias;
      let threat = null, tgap = 1e9;
      for (const o of race.cars) {
        if (o === c || (o.out && o.out.gone)) continue;   // (a retired car already lifted away)
        let gap = o.dist - c.dist;
        if (!T.open && Math.abs(gap) > T.len / 2) { gap = ((gap % T.len) + T.len) % T.len; if (gap > T.len / 2) gap -= T.len; }   // (a lap down or up: where it is on the road)
        if (gap < -4 || gap > 22) continue;
        if (J && (o.rd || 0) !== (c.rd || 0)) continue;   // (the other road: the divider is between them)
        const lat = (onJ ? o.jq.d : o.q.d) - rq.d;
        const closing = v - Math.max(0, o.vl);
        if (gap > 0 && Math.abs(lat) < 3.2 && (closing > -1 || gap < 7) && gap < tgap) { threat = o; tgap = gap; }
      }
      c.aiThreat = threat; c.aiGap = tgap;
      if (threat && race.fl && !(threat.fl && threat.fl.stopT > 0) && (c.sc || race._noPass(c))) { target = c.laneBias; c.passing = 0; }   // (a yellow flag or the safety car: no overtaking, stay in line; a stopped car is passed)
      else if (threat) {
        const rlHere = R.rl[rq.i];
        const oPos = onJ ? threat.jq.d : threat.q.d;
        // choose side with more room
        const roomL = oPos - (-R.w + 1.2), roomR = (R.w - 1.2) - oPos;
        const side = J && threat.jkGo && !jkGo && !onJ ? -T.jkSide : roomR > roomL ? 1 : -1;   // (a car slowing for the joker ahead: past it on the side away from the joker)
        const want = oPos + side * (M.aiPass || 3.3);   // (aiPass: the formula passes wider)
        target = clamp(want - rlHere, -2 * R.w, 2 * R.w);
        c.passing = 1;
      } else c.passing = 0;
      // a blue flag (race.fl, see Race._flags): a faster car a lap up right behind: over to the side of the road away from the racing line
      // 30 m on (where the faster car is heading) and staying there (fl.bSide) while it passes on the other side, easing off as it comes by
      // (below). The target is a place across the road, taken against the racing line where the car steers to
      const bf = !c.isPlayer && !onJ && c.fl && c.fl.blue;
      if (bf) {
        const iA = R.idx(rq.s + 30), iL = R.idx(rq.s + 5.5 + v * 0.36);
        if (!c.fl.bSide) c.fl.bSide = R.rl[iA] > 0 ? -1 : 1;
        target = c.fl.bSide * (R.w - 2.2) - R.rl[iL]; c.passing = 0;
      } else if (c.fl && c.fl.bSide) c.fl.bSide = 0;
      // standing water or oil ahead: round it where there is room on the road (else slower through it, see the speed); c.aiHz the one
      c.aiHz = null;
      if (!onJ && (T.poolK > 0 || race.road.oil.length)) {
        const hz = aiHazard(T, race.road, rq.s, 25 + v * 2.2, R.rl[rq.i] + target);
        if (hz) {
          const lim = R.w - (M.aiEdge || 1.25), i = T.idx(hz.s), pos = T.rl[i] + target, a = hz.d - hz.hw - 1.5, b = hz.d + hz.hw + 1.5;
          const ok = (x) => x >= -lim && x <= lim, pick = hz.wide ? null : ok(a) && ok(b) ? (Math.abs(a - pos) < Math.abs(b - pos) ? a : b) : ok(a) ? a : ok(b) ? b : null;
          if (pick != null) target = pick - T.rl[i]; else c.aiHz = hz;
        }
      }
      c.aiOffT = target;
    }
    c.aiOff += clamp(c.aiOffT - c.aiOff, -3.2 * dt, 3.2 * dt);

    // --- steering: pure pursuit on racing line + offset ---
    const look = 5.5 + v * 0.36;
    const sT = rq.s + look;
    const Pt = aiPoint(T, onJ, jkGo, sT, _ap), Rt = Pt.R, i0 = Pt.i0, i1 = Pt.i1, ft = Pt.f;   // (an open road: the look-ahead stops at the end; the joker: see aiPoint)
    const rlv = lerp(Rt.rl[i0], Rt.rl[i1], ft);
    const lim = Rt.w - (M.aiEdge || 1.25);   // (M.aiEdge: the formula keeps further in)
    let off = clamp(rlv + c.aiOff, -lim, lim);
    if (jkPass) off = T.jkSide < 0 ? Math.max(off, -T.w + 3) : Math.min(off, T.w - 3);   // (not taking the joker this lap: clear of its way in)
    if (c.pitWant && T.def.pit) {   // (autopilot into the pits: follow the lane)
      // the player's autopilot with tyres (every race of the game on a track with pits) comes in like an AI car, among the AI cars coming
      // in for tyres: over to the lane's side of the road first, the fast lane beside the boxes, over to its own box where its crew waits;
      // and when it missed the way in (beside the lane, on the track's side of the pit wall), round again, not through the pit wall
      const ap = c.isPlayer && !!c.ty, pz = T.pitAt(sT), pn = ap && !c.inPit && T.pitAt(q.s), missed = pn && !pn.gap;
      if (pz && !missed) off = pz.o;
      if (pz && c.ty && !pz.gap && (!c.isPlayer || c.inPit)) {   // (in for tyres: the fast lane beside the boxes, over to its own box to stop)
        const L = T.len; let db = T.startS + (c.isPlayer ? T.def.pit[3] : race._aiBox(c)) - sT; db = ((db % L) + L) % L; if (db > L / 2) db -= L;
        off += !c.pitDone && db > -8 && db < 16 ? (c.isPlayer ? 0 : -2) : 1.5;
      } else { const P = T.def.pit, L = T.len; let d = sT - T.startS; d = ((d % L) + L) % L; if (d > L / 2) d -= L; if (d > P[1] - 220 && d < P[1]) off = Math.sign(P[0]) * lim; }   // (coming in: over to the lane's side of the road first)
    }
    const tx = lerp(Rt.px[i0], Rt.px[i1], ft) + lerp(Rt.nx[i0], Rt.nx[i1], ft) * off;
    const tz = lerp(Rt.pz[i0], Rt.pz[i1], ft) + lerp(Rt.nz[i0], Rt.nz[i1], ft) * off;
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
    const sA = rq.s + v * 0.22 + 3;
    // skill > 1 (hard): faster in the quicker corners and on the brakes, but no faster than the profile through the slowest hairpins,
    // where the cars would only slide wide (tested per car model at the limit)
    let vpA;
    if (onJ || jkGo) {   // (the joker: its own profile on it; on the way to it, slow enough to brake down to its entry speed by the split)
      const Pv = aiPoint(T, onJ, jkGo, sA, _ap2); vpA = Pv.R === J ? race.vprofJ[Pv.i0] * 0.93 : (c.vprof || race.vprof)[Pv.i0];   // (the joker's tight bends: a margin)
      if (jkGo) { let dA = T.jkA * T.ds - sA; dA = ((dA % T.len) + T.len) % T.len; if (dA < T.len / 2) vpA = Math.min(vpA, Math.sqrt(race.vprofJ[0] * race.vprofJ[0] * 0.86 + 2 * race.brA * dA)); }
    } else vpA = (c.vprof || race.vprof)[T.idx(sA)];
    const offErr = Math.abs(rq.d - (R.rl[rq.i] + c.aiOff)), offLine = Math.abs(c.aiOff) > 1.2 || offErr > 1.2;
    let sk = Math.min(c.skill * c.rubber, c.skCap || 1.14) * (c.isPlayer || !T.def.aiPace ? 1 : T.def.aiPace[c.phys] || 1);   // (def.aiPace: quicker rivals on a track with room for them, skill and cap; never the player's autopilot)
    if (sk > 1 && offLine) sk = 1 + (sk - 1) * 0.3;   // away from the ideal line (overtaking, defending, knocked aside) the extra pace is not there
    let vT = vpA * (sk <= 1 ? sk : 1 + (sk - 1) * sstep(11, 24, vpA));
    if (c.upgGrip) vT *= Math.pow(c.upgGrip * (1 + c.aeroK * vT * vT), 0.25);   // upgraded tyres / aero: carry more speed through the corners (half the grip gain: safe for every car)
    if (race.wst && race.wst.tyres && c.ty) vT *= Math.sqrt(clamp(c.wet / race.wst.profW, 0.5, 1.4));   // its own tyres (and their wear) against the grip the profile assumes
    if (c.aeroK0 != null && c.aeroK < c.aeroK0) vT *= Math.sqrt((1 + c.aeroK * vT * vT) / (1 + c.aeroK0 * vT * vT));   // the formula with a wing knocked off: less grip at speed
    // if displaced from line, be a little more careful
    if (offErr > 2.5) vT *= 0.94;
    if (jkGo && !onJ && c.jq.i >= 0 && c.jq.s > 0) { const e = Math.abs(c.jq.d - J.rl[c.jq.i]); vT = Math.min(vT, race.vprofJ[c.jq.i] * 0.93 * (e > 1.5 ? 0.85 : 1)); }   // (turning into the joker: its first bend where the car is now, slower when off its line)
    if (c.passing) vT *= 1.01;
    if (c.aiHz) {   // (standing water right across the road, or no room round it: through it at 68 km/h; oil: slower)
      let dh = c.aiHz.s - rq.s; if (!T.open) { dh = ((dh % T.len) + T.len) % T.len; if (dh > T.len - 40) dh -= T.len; }
      const vh = c.aiHz.oil ? 15 : 19; if (dh > -8) vT = Math.min(vT, Math.sqrt(vh * vh + 2 * 9 * Math.max(0, dh - 4)));
    }
    if (c.fl && c.fl.blue && !c.isPlayer) { const g = c.dist - (c.fl.blue.dist - T.len); vT *= g < 15 ? 0.86 : g < 40 ? 0.93 : 1; }   // (a blue flag: let it by, lifting as it comes alongside)
    if (race.road.mb > 0 && T.mbI && !onJ) vT *= Math.sqrt(mbGrip(T, race.road.mb, T.idx(sA), R.rl[T.idx(sA)] + c.aiOff));   // (off the line in the marbles: slower)
    if (c.pitWant && T.def.pit) { const pz = T.pitAt(q.s + v * 0.8 + 6), pn = T.pitAt(q.s); if (pz || c.inPit) vT = Math.min(vT, (pz && pz.t < 0.98) || (pn && pn.t < 0.98) ? 15 * (1 - 0.2 * (c.dmgMode === 2 ? c.dmg : 0)) : PIT_V * 0.97); }   // (easy through the S of the way in and out; a badly damaged car, its handling gone, easier still)
    { const o = c.aiThreat, g0 = M.aiGap || 3; if (o && c.aiGap < g0 + 6 && Math.abs(o.q.d - q.d) < 2.1) vT = Math.min(vT, Math.max(0, o.vl) + Math.max(0, c.aiGap - g0) * 0.8);   // right behind someone with no gap yet: follow, don't ram (M.aiGap: the formula keeps a longer gap)
      if (o && J && o.jkGo && !o.rd && !jkGo && !onJ && Math.abs(o.q.d - q.d) < 3.2) vT = Math.min(vT, Math.sqrt(Math.max(0, o.vl) ** 2 + 1.2 * race.brA * Math.max(0, c.aiGap - g0))); }   // (behind a car braking hard for the joker: in time, not into its back)
    if (race.fl) {   // flags: the safety car's steady pace; slower through a yellow; the queue behind the safety car, 15 m apart
      const F = race.fl, S = F.sc;
      if (c.sc) { if (!(S && S.state === 'in' && !S.pit)) vT = Math.min(vT * 0.75, 36); }   // (speeding off: at full pace)
      else if (!c.finished) {
        if (F.yel.length && race._yelAt(q.s)) vT *= 0.8;
        if (S && S.car && !c.inPit && !c.pitWant) {
          let gap = 1e9, a = null;
          for (const o of race.cars) { if (o === c || o.finished || o.inPit || o.pitWant) continue; const g = o.dist - c.dist; if (g > 0 && g < gap) { gap = g; a = o; } }
          const off = S.state === 'in' && !S.pit;   // (speeding off up the road: the field lets it go, at a steady pace)
          const gS = S.car.dist - c.dist; if (gS > 0 && gS < gap && !off && !(S.car.pitWant && T.pitAt(S.car.q.s))) { gap = gS; a = S.car; }   // (the safety car turning into the pit lane: not any more)
          if (off) vT = Math.min(vT, 0.7 * vpA);
          if (a && gap < 400) vT = Math.min(vT, Math.max(0, a.vl) + (gap - 15) * 0.45);
          vT = Math.min(vT, 46);
        }
      }
    }
    if (c.ty && (c.inPit || c.pitWant)) { const o = c.aiThreat; if (o && Math.abs(o.q.d - q.d) < 2.4) vT = Math.min(vT, Math.sqrt(Math.max(0, o.vl) ** 2 + 10 * Math.max(0, c.aiGap - 6))); }   // (the pit lane, the player's autopilot too: wait behind a car stopping at its box or pulling out; right behind it at walking pace, a nudge swung the car into the pit wall, and at walking pace it cannot steer out)
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
  const DRIVER_NAMES = ['M. Kovač', 'T. Hayashi', 'L. Rossi', 'J. Novak', 'K. Weber', 'A. Silva', 'R. Horvat', 'S. Tanaka', 'P. Dubois', 'N. Petek', 'E. Lindqvist', 'G. Moretti', 'D. Zupan', 'H. Kimura', 'F. Keller', 'O. Nieminen', 'B. Kranjc', 'C. Duarte', 'I. Kowalski', 'V. Andersen'];
  const AI_COLORS = [0xe8e8ee, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xf07a1a, 0x9a2bd8, 0x19b7c7, 0xd81f45, 0xc9c3b0, 0x6b8e23, 0xff5fa2, 0x3b3fa8, 0x8a1c2b, 0x0f5e4e, 0x8ec9e8, 0xb87333, 0x6b737c, 0xb4dc2c, 0xc2187a];
  const CAR_NUMS = [7, 3, 11, 21, 5, 44, 9, 16, 27, 8, 12, 33, 2, 55, 14, 23, 31, 46, 63, 77, 88];   // by grid slot (the player's own number replaces the one of its slot)
  // the AI drivers in grid order (the fastest first): name, car and colour are the same in every race (a championship's standings follow them)
  const aiDriver = (k) => ({ name: DRIVER_NAMES[k % DRIVER_NAMES.length], model: MODELS[(k * 3 + 1) % 4], color: AI_COLORS[k % AI_COLORS.length] });
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
      if (track.def.rivals && opts.numAI > 0 && !opts.noPlayer && !opts.remote && !opts.champ) opts = Object.assign({}, opts, { numAI: track.def.rivals });   // a track's own field size (def.rivals) in a normal race; not the title-screen demo, a time trial, an online race or a championship round (its own drivers in every round)
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
      const oneMake = opts.playerModel && opts.playerModel.oneMake ? opts.playerModel : null;   // the player in the formula: every rival in one too
      if (oneMake) this.oneMake = oneMake;
      const aiSpecs = [];
      for (let k = 0; k < nAI; k++) {
        const skill = lerp(diff[1], diff[0], k / Math.max(1, nAI - 1)) + (R() - 0.5) * 0.012;
        aiSpecs.push(Object.assign({ skill }, aiDriver(k), oneMake ? { model: oneMake } : null));   // (a formula race: the same drivers, in formulas)
      }
      // grid: fastest first
      let ai = 0;
      for (let g = 1; g <= total; g++) {
        let c;
        if (g === playerGrid) {
          c = new Car(opts.playerModel || MODELS[0], { id: g, isPlayer: true, arcade: opts.arcade !== false, phys: opts.phys, name: 'TI', color: opts.playerColor, assist: opts.assist, upg: opts.playerUpg, setup: opts.playerSetup });
          this.player = c;
        } else if (g === remoteGrid) {
          c = new Car(RM.model || MODELS[0], { id: g, net: true, arcade: true, phys: opts.phys, name: RM.name || 'Prijatelj', color: RM.color });
          this.remote = c;
        } else {
          const s = aiSpecs[order ? order[ai++] : ai++];
          c = new Car(s.model, { id: g, name: s.name, color: s.color, skill: s.skill, assist: opts.phys === 'cs' ? CSK.aiAssist : 1, arcade: true, phys: opts.phys, laneBias: (R() - 0.5) * 1.6 });
          c.skCap = s.model.id === 'pico' ? 1.0 : opts.phys === 'cs' ? CSK.aiSkCap : 1.14;   // no point pushing a car past what it can hold (the light pico understeers into the walls beyond the line's own pace)
        }
        c.grid = g; c.num = CAR_NUMS[(g - 1) % CAR_NUMS.length]; if (playerGrid > 0 && !c.isPlayer && c.num === opts.playerNum) c.num = CAR_NUMS[(playerGrid - 1) % CAR_NUMS.length];   // (not the player's own number: that car takes the one of the player's slot)
        c.rubber = 1;
        c.dmgMode = opts.damage == null ? 2 : opts.damage;
        this.cars.push(c);
        this._placeOnGrid(c, g);
      }
      if (this.player) this.player.num = opts.playerNum || 1;
      if (this.remote) this.remote.num = RM.num || 2;
      // rallycross (def.rx, a circuit with a joker, Track.jk): every car drives the joker once a race (jkRule; not in qualifying). c.rd: the
      // road the car is on (0 the circuit, 1 the joker); c.jq / c.wqj: its lookups on the joker (swapped in for the physics there); c.jkN:
      // how often it has driven it; c.jkLap: the lap an AI driver takes it on (its own RNG: many on the first lap, the split comes right
      // after Turn 1 at Höljes; some in the middle of the race; a few leave it late, to the lap before the last: the last lap is their
      // spare, should a push from behind at the split make them miss it)
      if (track.jk) {   // (these fields only on a circuit with a joker: every other race's state stays as it was)
        this.jkRule = !!(track.def.rx && !(opts.qualiBack > 0) && !this.timeTrial);
        const RJ = rng(((opts.seed || 7) * 31 + 5) >>> 0);
        for (const c of this.cars) { c.rd = 0; c.jq = { i: -1 }; c.wqj = [{ i: -1 }, { i: -1 }, { i: -1 }, { i: -1 }]; c.jkN = 0; c.jkIn = false; c.jPrev = 0; c.jkEv = 0;
          const u = RJ(); c.jkLap = u < 0.45 ? 1 : u < 0.8 ? Math.min(2 + Math.floor(RJ() * Math.max(1, this.laps - 3)), Math.max(1, this.laps - 1)) : Math.max(1, this.laps - 1); }
      }
      // winter (opts.winter): cold tarmac grips a little less (x0.94), a gravel road packed with snow much less (x0.74): on every car's grip and the AI's profile
      this.cold = { gk: opts.winter ? (track.def.roadSurface === 'makadam' ? 0.74 : 0.94) : 1 };   // (in an object: the golden references digest only the plain fields)
      this.rain = 0; this._wet(opts.rain);
      this.sky = { storm: !!opts.storm };   // a thunderstorm (opts.storm, while it rains): the renderer's lightning, thunder and gale; the grip is the rain's (in an object, as above)
      // tyres and a changing weather (opts.tyres; opts.weather = { at, dur, to }: the rain goes from opts.rain to `to` over dur s from race time
      // at). The water on the road follows the rain (wet in about a minute, dry in about four, the racing line twice as fast); a car's grip
      // follows its tyres (c.ty = { k: 'dry' | 'wet', wear }), the water where it drives (on the line or off it) and the wear (see _weather).
      // wst.ev / evK: 'rain' when it starts to rain, 'dry' when it stops
      const WX = opts.weather && !opts.remote ? opts.weather : null;
      this.wst = { on: !!(opts.tyres || WX), tyres: !!opts.tyres, water: this.rain, line: this.rain, profW: (this.rain ? 1 - (1 - WET) * this.rain : 1) * this.cold.gk, ev: 0, evK: '',
        wx: WX ? { at: Math.max(0, +WX.at || 0), dur: Math.max(1, +WX.dur || 60), r0: this.rain, r1: clamp(+WX.to || 0, 0, 1) } : null };
      if (opts.tyres) for (const c of this.cars) c.ty = { k: c.isPlayer && (opts.playerTyre === 'dry' || opts.playerTyre === 'wet') ? opts.playerTyre : tyreFor(this.rain), wear: 0 };
      if (track.drs) this.drsLast = track.drs.map(() => null);   // (per DRS zone: who crossed its detection line last, and when)
      this.sec = { best: [Infinity, Infinity, Infinity] };   // sector times on a circuit without TV sectors (thirds of the lap, see _thirds): the fastest of anyone in this race
      // flags (opts.flags, a closed circuit with rivals): a yellow flag where a car has stopped on the track, the safety car after a heavy
      // crash (see _flags). ev / evK: 'yellow', 'sc' (out), 'scIn' (in this lap), 'scGone' (in the pits: no overtaking until the leader is
      // at the line), 'green'; pev / pevK, the player: 'passWarn' (overtook under a flag: give the place back), 'passOk', 'pen' (+5 s)
      this.fl = opts.flags && !track.open && total > 1 ? { yel: [], ev: 0, evK: '', sc: null, scUsed: false, pev: 0, pevK: '', blue: [], oil: [] } : null;
      // the race's marks on the road (set on the track every step, see roadGrip): mb how much rubber is down (the marbles, 0..1), oil the
      // spots of oil from crashes ({ s, d, r, t, cem: covered with cement }), lk the cars leaking it now, dm every car's damage a step ago,
      // leaks how many cars have leaked, sk when each car may next be kicked by a sausage kerb. (In an object: the golden references digest
      // only the plain fields.)
      this.road = { mb: 0, oil: [], lk: new Map(), dm: new Map(), leaks: 0, sk: new Map() };
      if (track.sectors) this.secBest = [Infinity, Infinity, Infinity];   // (the best time in each sector of the race so far)
      this._prof();
    }

    // online race: a finish time on the clock both phones share, and the order by it. The friend's comes from its phone (once);
    // mine replaces the local one (measured on that clock, see game.js)
    netFinish(c, t) {
      if (c.net && c.finished) return;
      if (!c.finished) { c.finished = true; c.lap = this.laps + 1; this.finishOrder.push(c); }
      c.finishTime = t;
      if (this.jkRule) c.jkMiss = !c.jkN;   // (rallycross: the friend's joker laps come from its phone)
      this.finishOrder.sort((a, b) => (this.jkRule ? (a.jkMiss ? 1 : 0) - (b.jkMiss ? 1 : 0) : 0) || a.finishTime - b.finishTime);
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
        c.wet = (W.tyres && c.ty ? TYRE_GRIP[c.ty.k](w) * (1 - 0.1 * c.ty.wear) : 1 - (1 - WET) * w) * this.cold.gk; }
      const pw = (W.tyres ? TYRE_GRIP[tyreFor(W.line)](W.line) : 1 - (1 - WET) * W.water) * this.cold.gk;
      if (Math.abs(pw - W.profW) > 0.012) { W.profW = pw; this._prof(); }
    }
    // an AI car's box in the pit lane (metres from the start line): along the crews' row (def.pitRow), by its grid slot, clear of the player's
    _aiBox(c) {
      const P = this.track.def.pit, R = this.track.def.pitRow || [P[1] + 60, P[2] - 40], k = (c.grid - 1) % 13;
      let d = R[0] + (R[1] - R[0]) * k / 12; if (Math.abs(d - P[3]) < 9) d += d < P[3] ? -9 : 9;
      return d;
    }

    // speed profile for the AI (on the racing line), per physics; an upgraded player's autopilot brakes later with better brakes (its own profile).
    // Rain: the corners as much slower as the grip is lower, the braking as the brakes (see Car). A formula race: the formula's profile (its
    // grip against the road cars' ~1.8, the wings' grip growing with speed, its brakes, its path-rate cap)
    _prof() {
      const opts = this.opts, track = this.track, w = this.wst && this.wst.on ? this.wst.profW : (this.rain ? 1 - (1 - WET) * this.rain : 1) * this.cold.gk, F = this.oneMake;
      const csP = opts.phys === 'cs', wM0 = csP ? CSK.aiWmax : 0;
      let latA0 = opts.aiLatA || (csP ? CSK.aiLatA : 16.5), brA0 = opts.aiBrakeA || (csP ? CSK.aiBrakeA : 13.0);
      if (w < 1) { latA0 *= w; brA0 *= 0.55 + 0.45 * w; }
      const lat = latA0 * (F ? ARC[F.id].amax / 1.8 : 1), fb = F ? F.brakeK : 1, br = brA0 * fb, wM = wM0 * (F ? CSP[F.id].w : 1), aero = F ? F.aero : 0, bG = BRAKE_G * fb;
      this.vprof = track.speedProfile(lat, br, 85, wM, aero);
      if (track.jk) { this.vprofJ = track.jk.speedProfile(lat, br, 85, wM, aero, this.vprof[track.jkB]); this.brA = br; }   // (the joker: it runs on into the circuit at the join)
      if (this.player && this.player.upg && this.player.brakeG !== bG) this.player.vprof = track.speedProfile(lat, br * this.player.brakeG / bG, 85, wM, aero);
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
      if (this.opts.qualiBack > 0 && !T.open) return this.opts.qualiBack;   // qualifying: one car, its run-up to a flying lap
      if (this.opts.remote) return 9;   // online: the two of them side by side on the front row (the same distance to the line)
      if (!T.open) { const ab = this._abreast(); return ab ? 9 + Math.floor((g - 1) / ab) * 8 : 9 + (g - 1) * 7.5; }   // (def.gridAbreast: rows side by side, rallycross)
      // open road: the grid has to fit between the bottom end of the road and the start line (two abreast, staggered)
      const sp = clamp((T.startS - 9) / Math.max(1, this._gridN - 1), 2.4, 3.6);
      return Math.min(3 + (g - 1) * sp, T.startS - 4);
    }
    _abreast() { const ab = this.track.def.gridAbreast; return ab && this._gridN > 8 ? 3 : ab || 0; }   // (rows side by side: a bigger field than the track's own, the title demo or a championship round, three abreast)
    _placeOnGrid(c, g) {
      const T = this.track;
      const back = this._gridBack(g);
      const s = T.startS - back;
      const i = this.timeTrial ? T.startIdx : T.idx(s);
      const lat = this.timeTrial ? 0 : this.opts.qualiBack > 0 && !T.open ? T.rl[i] : !T.open && this._abreast() === 3 ? ((g - 1) % 3 - 1) * 4.3 : (g % 2 === 1 ? -1 : 1) * 3.4;   // (qualifying: on the racing line)
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
        yaw: c.h, rx: 0, rz: 0, wx: (Math.random() - 0.5) * 16, wy: (Math.random() - 0.5) * 12, wz: (Math.random() - 0.5) * 16, r: P.r, m: P.m, h: P.h, rest: false, ground: false,
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
      { const RD = this.road, wt = this.wst && this.wst.on ? this.wst.water : this.rain; T.road = RD; if (T.jk) T.jk.road = null;   // (this race's marks on the road; the joker is gravel)
        T.poolK = T.pools ? sstep(0.6, 0.95, wt) : 0;   // (standing water in heavy rain)
        if (T.mbI) { let lead = 0; for (const c of cars) if (!c.net && c.dist > lead) lead = c.dist; RD.mb = clamp((lead / T.len - 0.5) / 3, 0, 1) * (1 - wt); } }   // (the rubber builds up from half a lap on, fully down after three and a half; the rain washes over it)
      if (T.gripK) { T.coldK = this.opts.winter ? 0.74 / 0.94 : 1; if (T.jk) T.jk.coldK = T.coldK; }   // (a mixed-surface road in winter: the gravel packed with snow grips less than the asphalt)
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
        if (c.rd) { jkSwap(c); c.step(dt, T.jk); jkSwap(c); } else c.step(dt, T);   // (on the joker: its lookups and its road)
      }
      if (T.saus) for (const c of cars) if (!c.net && !c.air && !c.rd) this._saus(c);   // (a sausage kerb under a wheel: thrown into the air)
      const SC = this.fl && this.fl.sc && this.fl.sc.car;   // (the safety car, when it is out: driven here, not one of the race's cars)
      if (SC) { aiControl(SC, this, dt); SC.steer += clamp(SC.inSteer - SC.steer, -10 * dt, 10 * dt); SC.step(dt, T); }
      // collisions (a figure of eight: a car on the bridge and one under it do not touch)
      const lv = T.cross.length > 0;
      for (let i = 0; i < cars.length; i++) {
        if (cars[i].out && cars[i].out.t > 12) continue;   // (a retired car up on the recovery crane's hook)
        for (let j = i + 1; j < cars.length; j++) if ((!lv || Math.abs((cars[i].y || 0) - (cars[j].y || 0)) < 3) && !(cars[j].out && cars[j].out.t > 12)) carCollide(cars[i], cars[j]);
      }
      if (SC) { for (const c of cars) if (!c.net && (!lv || Math.abs((c.y || 0) - (SC.y || 0)) < 3)) carCollide(SC, c); wallCollide(SC, T); }
      if (T.def.pit) for (const c of cars) if (c.isPlayer || c.pitWant || c.inPit) this.pitStep(c, dt, true);   // which side of the pit wall the car is on (before the walls push it; AI: on the way in for tyres)
      for (const c of cars) if (!c.net) { if (c.rd) { jkSwap(c); wallCollide(c, T.jk); jkSwap(c); } else wallCollide(c, T); }
      if (T.def.pit) for (const c of cars) if (c.isPlayer || c.pitWant || c.inPit) this.pitStep(c, dt, false);  // speed limiter, stopping at the box, repair
      for (const c of cars) if (c.detach.length) { for (const name of c.detach) this.spawnDebris(c, name); c.detach.length = 0; }
      this._oil(dt);   // (a car badly hit leaks oil)
      for (const c of cars) if (c.out) c.out.t += dt;   // (a retired car: the recovery, see _retire)
      for (const c of cars) if (!c.net && !Number.isFinite(c.x + c.z + c.vx + c.vz + c.h + c.w + (c.y || 0))) { c.x = c.z = c.vx = c.vz = c.w = c.h = 0; c.y = 0; c.vy = 0; c.air = 0; c.q.s = c.goodS || 0; c.q.i = -1; this.rescue(c); }
      if (this.debris.length) { for (const d of this.debris) stepDebris(d, T, dt); for (const c of cars) if (!c.net) for (const d of this.debris) if (!lv || Math.abs(d.y - (c.y || 0)) < 4) debrisHit(c, d); }
      // progress
      for (const c of cars) {
        const q = T.query(c.x, c.z, c.q.i, c.q);
        if (c.net) { c.sPrev = q.s; continue; }   // (distance, laps and the finish of the friend's car come from its phone)
        let ds;
        if (T.jk) ds = this._joker(c, q);   // (the joker: which road it is on, its distance there)
        else { ds = q.s - c.sPrev; if (!T.open) { if (ds > T.len * 0.5) ds -= T.len; else if (ds < -T.len * 0.5) ds += T.len; } }
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
              if (this.jkRule) this._jkFinish(c);
            }
          }
        }
        if (this.drsLast) this._drs(c, ds, dt);
        if (this.secBest) this._sectors(c, ds, dt);   // (TV sectors: the Red Bull Ring's)
        else if (!T.open && this.state !== 'grid') this._thirds(c);   // (elsewhere: the thirds of the lap)
        if (c.ty && ds > 0 && this.state === 'racing') {   // tyre wear: 0.8 % a km, up to 4 % more a km in a full slide; rain tyres on a drying road 2.5 times as fast
          const W = this.wst, sl = Math.min(1, Math.abs(c.beta || 0) / 0.35);
          c.ty.wear = Math.min(1, c.ty.wear + ds * (0.000008 + 0.00004 * sl) * (c.ty.k === 'wet' && W.line < 0.25 ? 2.5 : 1));
          // an AI car on the wrong tyres goes in for the right ones (a track with pits; not in the last 40 % of a lap)
          // (not in the pit zone: from before its way in; each driver with a threshold of its own, not all on the same lap; at most three on
          // their way in or in the lane at a time, the others wait a lap)
          if (T.def.pit && !c.isPlayer && !c.net && !c.finished && !c.pitWant && !c.inPit && c.ty.k !== tyreFor(W.line) && !T.pitAt(q.s)) {
            const j = ((c.grid * 7) % 13) / 12;
            if ((c.ty.k === 'dry' ? W.line > 0.35 + 0.35 * j : W.line < 0.04 + 0.16 * j && this.rain < 0.05) && this.laps * T.len - c.dist > T.len * 0.4) {
              let n = 0; for (const o of cars) if (!o.isPlayer && (o.pitWant || o.inPit)) n++;
              if (n < 3) c.pitWant = true;
            }
          }
        }
        // wrong way
        const tq = c.rd ? c.jq : q, fwd = Math.cos(c.h) * tq.tx + Math.sin(c.h) * tq.tz;   // (on the joker: its direction)
        if (fwd < -0.2 && c.speed > 3) c.wrongT += dt; else c.wrongT = Math.max(0, c.wrongT - dt * 2);
        // stuck detection (AI auto-rescue)
        if (!c.locked && (!c.pitState || (c.ty && !c.isPlayer && c.pitState === 'done')) && c.speed < 1.2 && (this.state === 'racing' || this.state === 'done')) c.stuckT += dt; else c.stuckT = Math.max(0, c.stuckT - dt);   // (an AI car that came in for tyres: also when stuck on its way out)
        if (!c.isPlayer && (c.stuckT > (c.ty && c.inPit ? 12 : 3.5) || c.wrongT > 3)) { if (this._canRetire(c)) this._retire(c); else this.rescue(c); }   // (in for tyres: waiting in the pit lane behind a car at its box is no reason; badly damaged after a crash: out of the race)
      }
      if (this._rq.length) this._serveRespawn();
      this.stepProps(dt);
      // order
      this.order = cars.slice().sort((a, b) => {
        if (a.finished && b.finished) return a.finishPos - b.finishPos;
        if (a.finished) return -1; if (b.finished) return 1;
        if (!a.out !== !b.out) return a.out ? 1 : -1;   // (a retired car behind every running one)
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
        if (c.pitT >= c.pitDur) { this.repairCar(c); if (c.ty) { c.ty.k = tyreFor(this.wst.line); c.ty.wear = 0; } c.pitState = 'done'; c.pitDone = true; c.pitEv = 'done'; }   // (tyres: a new set, the ones for the water on the line)
        return;
      }
      let vmax = lim;
      if (!c.pitDone && P[3] != null) {   // pull up at the box: a braking curve that ends right at it (the player's box, or the AI car's own)
        const L = T.len; let ds = (T.startS + (c.isPlayer ? P[3] : this._aiBox(c))) - q.s; ds = ((ds % L) + L) % L; if (ds > L / 2) ds -= L;
        if (ds < 40 && ds > -5) {
          vmax = Math.min(vmax, Math.sqrt(2 * 6.5 * Math.max(0, ds - 0.2)));
          if (!c.pitState) { c.pitState = 'stop'; c.pitEv = 'box'; }
          if (sp < (c.phys === 'cs' ? 1.5 : 0.8) && Math.abs(ds) < 4) {   // (cs: its drive holds ~0.9 m/s against the stop curve at part throttle)
            let lost = 0; for (const k in c.lost) lost++;
            c.pitState = 'repair'; c.pitT = 0; c.pitDur = Math.min(5, 1.2 + 3.3 * c.dmg + lost * 0.15); if (c.ty) c.pitDur = Math.max(c.pitDur, 2.6); c.vx = c.vz = 0; c.w = 0; c.pitEv = 'repair';   // (tyres: 2.6 s at least)
          }
        }
      }
      if (sp > vmax) { const k = Math.max(vmax / sp, 1 - 4 * dt); c.vx *= k; c.vz *= k; if (vmax < 1) c.w *= k; }   // the limiter (and the stop) take over smoothly
    }
    // ---- the race's marks on the road ----
    // a sausage kerb (Track.saus) under a wheel at speed: the car is thrown up (0.2-0.4 s in the air: no grip, no drive), the hump twists it
    // and costs it a little speed and a knock to that corner; once in 0.8 s
    _saus(c) {
      const T = this.track, RD = this.road, spd = c.speed;
      if (spd < 5 || (RD.sk.get(c) || 0) > this.time) return;
      for (let k = 0; k < 4; k++) {
        const q = c.wq[k]; if (!(q.i >= 0)) continue;
        const zi = T.sausAt[q.a]; if (zi < 0) continue;
        const z = T.saus[zi], u = q.d * z.side; if (u < z.d0 || u > z.d1) continue;
        c.air = 1; c.airT = 0; c.y = Math.max(c.y || 0, c.roadY || 0); c.vy = clamp(0.05 * spd + 1, 1.4, 3);
        c.w += z.side * (k < 2 ? 0.55 : -0.4) * clamp(spd / 25, 0.4, 1.2); c.vx *= 0.96; c.vz *= 0.96;
        applyDamage(c, 0.012 + 0.0007 * spd, k < 2 ? c.m.len * 0.5 : -c.m.len * 0.5, (k & 1 ? 1 : -1) * c.m.wid * 0.5);
        RD.sk.set(c, this.time + 0.8); return;
      }
    }
    // oil: a car badly hit (its damage up by 0.18 or more at once, to 0.4 or more) may leak oil (every other time): a pool where it happened, drops along its way for
    // the next 2-4 s (every 6-9 m), a bigger pool where it comes to a stop. The marshals cover each spot with cement 35 s on (it still grips a
    // little less than the road, see roadGrip). Two cars a race at most, 32 spots; none in the pit lane, nor on an open road. F.oil (flags):
    // the oil flag before the first spot of each leak until it is covered
    _oil(dt) {
      const RD = this.road, T = this.track, F = this.fl;
      for (const o of RD.oil) { o.t += dt; if (!o.cem && o.t > 35) o.cem = true; }
      for (const c of this.cars) {
        if (c.net) continue;
        const d0 = RD.dm.has(c) ? RD.dm.get(c) : c.dmg; RD.dm.set(c, c.dmg);
        if (this.state !== 'racing' || T.open || c.inPit || c.out) { RD.lk.delete(c); continue; }
        if (c.dmg - d0 >= 0.18 && c.dmg >= 0.4 && RD.leaks < 2 && !RD.lk.has(c) && Math.random() < 0.5) {
          RD.leaks++; const L = { t: 2 + Math.random() * 2, next: c.dist + 6, stop: false, first: null }; RD.lk.set(c, L);
          L.first = this._oilAt(c, 1.6 + Math.random() * 0.5);
          if (F && L.first) { F.oil.push(L.first); F.ev++; F.evK = 'oil'; }
        }
        const L = RD.lk.get(c); if (!L) continue;
        L.t -= dt;
        if (c.speed < 1.2) { if (!L.stop) { L.stop = true; this._oilAt(c, 1.9 + Math.random() * 0.6); } RD.lk.delete(c); continue; }
        if (L.t > 0 && c.dist >= L.next) { L.next = c.dist + 6 + Math.random() * 3; this._oilAt(c, 0.6 + Math.random() * 0.45); }
        if (L.t <= 0) RD.lk.delete(c);
      }
      if (F && F.oil.length) F.oil = F.oil.filter(o => !o.cem);
    }
    _oilAt(c, r) {   // a spot of oil under the back of the car (on the road or the verge)
      const RD = this.road; if (RD.oil.length >= 32) return null;
      const T = this.track, b = c.m.len * 0.25, x = c.x - Math.cos(c.h) * b, z = c.z - Math.sin(c.h) * b, q = T.query(x, z, c.q.i, {});
      const o = { s: q.s, d: q.d, r, t: 0, cem: false, x, z }; RD.oil.push(o); return o;
    }
    // a retired car (flags: an AI car stuck after a heavy crash, its damage 0.55 or more, from the first lap on, not near the finish): it stays
    // where it stopped under the yellow flag; marshals run to it with extinguishers, the recovery crane behind the barrier lifts it over and it
    // is gone (out.gone, 21 s on: out of the way of the others; the order and the results put it behind every running car: did not finish).
    // c.out = { t, x, z, y, h, s, d, gone } for the renderer
    _canRetire(c) {
      const T = this.track;
      return !!this.fl && !c.out && !c.finished && c.dmg >= 0.55 && !c.inPit && !c.pitWant && !c.pitState && c.lap >= 1 && this.state === 'racing' && !T.open && this.laps * T.len - c.dist > 300;
    }
    _retire(c) {
      c.out = { t: 0, x: c.x, z: c.z, y: c.y || 0, h: c.h, s: c.q.s, d: c.q.d, gone: false };
      c.locked = true; c.inThr = 0; c.inBrk = 1; c.inSteer = 0; c.inHand = 0; c.vx = c.vz = c.w = 0; c.stuckT = 0; c.wrongT = 0;
      const F = this.fl; F.ev++; F.evK = 'out'; F.outCar = c;
    }

    // ---- flags (opts.flags) ----
    // a yellow flag: a car stopped on the track (not in the pit lane, from its first lap on) for more than a second; the section from 250 m
    // before it to 30 m past it, until 5 s after the car is moving again. The AI slows down there and does not overtake (except the stopped
    // car). The safety car: once a race, after a heavy crash (a car stopped for 2.5 s badly damaged, or two stopped together, or one for 6 s),
    // when the leader has more than a lap and a quarter to go. It comes out 90-350 m ahead of the leader, the field queues up behind it
    // (15 m apart, no overtaking); after 25 s, with the queue formed (or after 40 s), it goes in (into the pit lane when that is less than
    // half a lap ahead, else it speeds off up the road), and nobody overtakes until the leader is back at the line. The player: overtaking under a flag (not a stopped car,
    // not one in the pit lane) has to be given back within 10 s, else +5 s on the race time (c.fl.pen)
    _yelAt(s) {
      const L = this.track.len;
      for (const y of this.fl.yel) { let d = y.s - s; d = ((d % L) + L) % L; if (d > L / 2) d -= L; if (d > -30 && d < 250) return y; }
      return null;
    }
    _noPass(c) { const F = this.fl; return !!(F && (F.sc || (F.yel.length && this._yelAt(c.q.s)))); }
    _flags(dt) {
      const F = this.fl, T = this.track, L = T.len, cars = this.cars;
      if (this.state !== 'racing') return;
      let lead = null; for (const c of this.order) if (!c.finished) { lead = c; break; }
      // incidents: cars stopped on the track
      const stop = [];
      for (const c of cars) {
        const f = c.fl || (c.fl = { stopT: 0, v: 30, yel: null, pen: 0, owe: null, ah: null, blue: null });
        if (c.out && !c.out.gone && c.out.t > 21) c.out.gone = true;   // (lifted away: out of the way)
        if (c.net || c.finished || (c.out && c.out.gone)) { f.stopT = 0; continue; }
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
      if (!F.scUsed && !T.def.rx && lead && lead.lap >= 1 && this.laps * L - lead.dist > L * 1.25) {   // (rallycross: no safety car)
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
          for (const c of this.order) { if (c === lead || c.finished || c.inPit || c.pitWant || (c.fl && c.fl.stopT > 0) || lead.dist - c.dist > L / 2) continue; if (prev - c.dist > 40) { formed = false; break; } prev = c.dist; }
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
      // blue flags: a car about to be lapped (a car a lap up 2-60 m behind it on the road; not under the safety car): the marshal at the next
      // post (every 250 m) waves the blue flag, the AI lets the faster car by (aiControl). F.blue: [{ s }] the posts; the player's 'blue'
      F.blue.length = 0;
      for (const c of cars) {
        const f = c.fl; if (!f) continue;
        let fast = null;
        if (!c.finished && !c.net && !c.inPit && !c.pitWant && !c.out && !F.sc) for (const o of cars) {
          if (o === c || o.finished || o.net || o.inPit || o.out) continue;
          const g = o.dist - c.dist; if (g > L - 60 && g < L - 2) { fast = o; break; }
        }
        if (fast && !f.blue && c.isPlayer) { F.pev++; F.pevK = 'blue'; }
        f.blue = fast;
        if (fast) { const p = Math.ceil((c.q.s + 40) / 250) * 250; if (!F.blue.some(b => Math.abs(b.s - p) < 1)) F.blue.push({ s: p % L }); }
      }
      // the player overtaking under a flag
      const P = this.player;
      if (P && P.fl && !P.finished && !P.net) {
        const f = P.fl, ban = this._noPass(P);
        if (!f.ah) f.ah = new Map();
        for (const o of cars) {   // (clearly ahead: 1 m, clearly past it: 3 m; side by side changes nothing)
          if (o === P) continue;
          const d = o.dist - P.dist, was = f.ah.get(o), ahead = d > 1 ? true : d < -3 ? false : was;
          if (ban && was === true && ahead === false && !o.finished && !o.inPit && !o.pitWant && o.speed > 8 && !P.inPit && !f.owe) { f.owe = { car: o, t: 10 }; F.pev++; F.pevK = 'passWarn'; }
          f.ah.set(o, ahead);
        }
        if (f.owe) {
          if (f.owe.car.dist > P.dist + 1 || f.owe.car.finished) { f.owe = null; F.pev++; F.pevK = 'passOk'; }
          else if ((f.owe.t -= dt) <= 0) { f.owe = null; f.pen += 5; F.pev++; F.pevK = 'pen'; }
        }
      }
    }
    // the safety car out: ahead of the leader, on the racing line where the road is clear (90-350 m on)
    _scOut(lead) {
      const F = this.fl, T = this.track;
      let s0 = lead.q.s + 90;
      for (let k = 0; k < 13; k++, s0 += 20) { const i = T.idx(s0); let clear = true; for (const c of this.cars) { const dx = c.x - T.px[i], dz = c.z - T.pz[i]; if (dx * dx + dz * dz < 30 * 30) { clear = false; break; } } if (clear) break; }
      const i = T.idx(s0), off = T.rl[i], X = new Car(MODELS[1], { id: 0, name: 'Varnostni avto', color: 0xdfe3e8, skill: 1, assist: this.opts.phys === 'cs' ? CSK.aiAssist : 1, arcade: true, phys: this.opts.phys, laneBias: 0 });
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
    // the joker (Track.jk): which road a car is on and the race distance it covers (returns it for this step). A car goes onto the joker where
    // the two roads run together at the split, once it is more than 1.5 m into it and nearer its centre line than the circuit's; it is back
    // on the circuit at the join (or at the split, if it turned back). Past 60 % of the joker it counts (c.jkN, c.jkEv for the HUD and the
    // commentator). On the joker the race distance grows by jkK x its metres: back on the circuit, it has covered the circuit's own way from
    // the split to the join
    _joker(c, q) {
      const T = this.track, J = T.jk, jq = c.jq;
      if (!c.rd) J.query(c.x, c.z, jq.i >= 0 ? jq.i : -1, jq);   // (on the joker the physics has just looked it up)
      const sl = jq.s + (jq.over || 0);
      let ds;
      if (c.rd) {   // (back onto the circuit: past the joker's end, or off the joker's surface and on the circuit's where they run together)
        ds = (jq.s - c.jPrev) * T.jkK; c.jPrev = jq.s;
        if (!c.jkIn && jq.s > J.len * 0.6) { c.jkIn = true; c.jkN++; c.jkEv++; }
        if (sl >= J.len - 0.5 || sl <= 0.5 || (J.jshare[jq.a] && Math.abs(jq.d) > J.w + 0.3 && Math.abs(q.d) < T.w + 1)) c.rd = 0;   // (run wide off the joker back onto the circuit: on the circuit)
      } else {   // (onto the joker: where they run together, once off the circuit's surface and on the joker's; the racing line through the inside of
        ds = q.s - c.sPrev; if (ds > T.len * 0.5) ds -= T.len; else if (ds < -T.len * 0.5) ds += T.len;   // the bend at the split stays on the circuit)
        if (T.jshare[q.a] && sl > 1.5 && sl < J.len * 0.5 && Math.abs(jq.d) < J.w + 0.3 && Math.abs(q.d) > T.w - 0.3 + (c.isPlayer || c.jkGo ? 0 : 1.5)) { c.rd = 1; c.jPrev = jq.s; c.jkIn = false; }   // (an AI driver that does not take it now: only when well off the circuit)
      }
      return ds;
    }
    // the joker rule at the finish (rallycross, as in the semi-finals and finals of the championship series): a car that has not driven the joker is
    // classified behind every car that has (c.jkMiss); the finishing order and places follow
    _jkFinish(c) {
      if (!c.jkN) c.jkMiss = true;
      const F = this.finishOrder, ok = F.filter(o => !o.jkMiss), miss = F.filter(o => o.jkMiss);
      this.finishOrder = ok.concat(miss); this.finishOrder.forEach((o, i) => { o.finishPos = i + 1; });
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
      if (c.ty && !c.isPlayer) c.pitWant = false;   // (an AI car in for tyres: it tries again from the next lap)
      if (!c.rd && T.jk && this.jkRule && c.jkGo && !c.jkN) {   // stuck on its way into the joker (in the gore where the two roads part): onto the joker
        T.jk.query(c.x, c.z, c.jq.i >= 0 ? c.jq.i : -1, c.jq);
        if (c.jq.s < T.jk.len * 0.45) { c.rd = 1; c.jkIn = false; }
      }
      if (c.rd && T.jk) {   // on the joker: back onto the joker, on its line (the circuit's lookup follows; the joker still counts from there)
        const J = T.jk, i = clamp(J.idx(c.jq.s), 3, J.N - 4), off = J.rl[i] * 0.5;
        c.place(J.px[i] + J.nx[i] * off, J.pz[i] + J.nz[i] * off, J.hd[i]); if (J.hasElev) c.y = c.py = J.hy[i];
        c.locked = false; c.jq = J.query(c.x, c.z, i, c.jq); c.jPrev = c.jq.s; c.q = T.query(c.x, c.z, -1, c.q); c.sPrev = c.q.s;
        c.stuckT = 0; c.wrongT = 0; c.rescued = 1.2; c.vx = Math.cos(c.h) * 8; c.vz = Math.sin(c.h) * 8;
        return;
      }
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
      const pen = (c) => (c.fl && c.fl.pen) || 0;   // (flags: time penalties)
      for (const c of done) res.push({ car: c, time: c.finishTime + pen(c), est: false, pen: pen(c) });
      for (const c of rest) {
        const remain = Math.max(0, (T.open ? T.raceLen : this.laps * T.len) - c.dist);
        const avg = c.dist > 50 ? c.dist / Math.max(1, this.time) : 30;
        const t = this.time + remain / Math.max(15, avg) + pen(c);
        res.push({ car: c, time: t, est: true, pen: pen(c) });
      }
      const miss = (r) => this.jkRule && !r.car.jkN ? 1 : 0;   // (rallycross: without the joker, behind everyone who drove it)
      for (const r of res) if (r.car.out) r.dnf = true;   // (retired: did not finish, behind everyone)
      res.sort((a, b) => miss(a) - miss(b) || (a.dnf ? 1 : 0) - (b.dnf ? 1 : 0) || (a.dnf && b.dnf ? b.car.dist - a.car.dist : a.time - b.time));
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
    { id: 'veliko', name: 'Veliko prvenstvo', desc: 'Vse krožne proge igre, ena za drugo.', tracks: TRACKS.filter(d => !d.timeTrial).map(d => d.id) },
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
    car: { pico: 0, p206: 20000, kaze: 30000, strega: 45000, vortex: 50000, rally: 60000, formula: 90000 },
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

  return { G, clamp, lerp, wrapPi, sstep, rng, Track, TRACK_DEF, PIKES_DEF, TRACKS, MODELS, ASSISTS, SURF, Car, Race, wallCollide, carCollide, aiControl, tire, DRIVER_NAMES, UPG, upgMods, upgStats, CSK, CSP, CSASSIST, CSSURF, roadGrip, aqua,
    aiDriver, CHAMPS, CHAMP_PTS, PLAYER_KEY, champPoints, champTable, champKeys, tyreFor, TYRE_GRIP, CAREER, careerPrize, careerUpgPrice };
})();



if (typeof module !== 'undefined') module.exports = Core;
