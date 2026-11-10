// Zabava · 4 · Trener po vožnji in zlati duh (docs/zabava.md, e). After a time trial, a qualifying lap or a challenge: the three corners
// where the run lost the most time against the best run (the ghost) of the track, each with why (braked too early or too late, slower
// through it, a worse exit). Zlati duh (Race options: Gold ghost, zbGold, off by default): in a time trial the autopilot drives the run
// with the player's car in the background (a few ms a frame, as qualifying's rivals) and is stretched to the gold time; it then drives as
// the second ghost (where a friend's would be) and is what the coach compares against when there is no best run yet.
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  const DT = 0.1, CH = 7;

  // a run's samples (every DT s: x, y, z, ...) as the time, the distance along the track (from the first sample on, unwrapped round a
  // circuit) and the speed
  function profile(T, G) {
    const n = G.n, f = G.f, t = new Float64Array(n), s = new Float64Array(n), v = new Float64Array(n), q = {};
    let hint = -1, prev = 0, add = 0;
    for (let k = 0; k < n; k++) {
      const x = f[k * CH], z = f[k * CH + 2];
      T.query(x, z, hint, q); hint = q.i;
      let sk = q.s + add;
      if (k > 0 && !T.open) { if (sk - prev < -T.len / 2) { add += T.len; sk += T.len; } else if (sk - prev > T.len / 2) { add -= T.len; sk -= T.len; } }
      s[k] = sk; prev = sk; t[k] = k * DT;
      v[k] = k ? Math.hypot(x - f[(k - 1) * CH], z - f[(k - 1) * CH + 2]) / DT : 0;
    }
    if (n > 1) v[0] = v[1];
    return { n, t, s, v };
  }
  // the time (or speed) of a profile where it was at distance x: interpolated between the samples (null outside the run)
  function at(P, x, key) {
    const s = P.s; if (!(P.n > 1) || x < s[0] || x > s[P.n - 1]) return null;
    let lo = 0, hi = P.n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] <= x) lo = m; else hi = m; }
    const u = s[hi] > s[lo] ? (x - s[lo]) / (s[hi] - s[lo]) : 0, a = P[key || 't'];
    return a[lo] + (a[hi] - a[lo]) * u;
  }
  // where the car started to brake before the corner's apex: the first point in [b, apex] where it is 2 m/s under the fastest it was there
  function brakeAt(P, b, apex) {
    let vmax = 0, sb = null;
    for (let x = b; x <= apex; x += 2) { const v = at(P, x, 'v'); if (v == null) return null; if (v > vmax) vmax = v; else if (sb == null && v < vmax - 2) sb = x; }
    return sb;
  }
  // the track's corners (Track.corners) within the run: from 80 m before the bend to 60 m after it, the apex at its tightest; the name:
  // a place of the track (def.names) within 120 m of the apex, else its number among the corners
  function corners(T, A) {
    const out = [], s0 = A.s[0], s1 = A.s[A.n - 1], ds = T.ds, L = T.len;
    const names = (T.names || []).map(q => ({ n: q.n, s: q.d + (T.startS || 0) }));
    (T.corners || []).forEach((c, k) => {
      let i1 = c.i1; if (!T.open && i1 < c.i0) i1 += T.N;
      let a = c.i0 * ds, e = i1 * ds, apex = (a + e) / 2;
      if (!T.open) { while (apex < s0) { a += L; e += L; apex += L; } while (apex - L >= s0) { a -= L; e -= L; apex -= L; } }
      const b = a - 80, end = e + 60; if (b < s0 || end > s1) return;
      let nm = null, nd = 120; for (const q of names) { let d = Math.abs(q.s - apex); if (!T.open) d = Math.min(d, Math.abs(q.s + L - apex), Math.abs(q.s - L - apex)); if (d < nd) { nd = d; nm = q.n; } }
      out.push({ b, a, apex, e, end, name: nm || tr('Ovinek {0}', k + 1) });
    });
    return out;
  }
  // the coach: the three corners with the most time lost against the reference run (B), each with its biggest reason
  function analyze(T, Ag, Bg) {
    if (!Ag || !Bg || !(Ag.n > 10) || !(Bg.n > 10)) return [];
    const A = profile(T, Ag), B = profile(T, Bg); if (!T.open) { const d = A.s[0] - B.s[0]; if (Math.abs(d) > T.len / 2) { const k = Math.round(d / T.len); for (let i = 0; i < B.n; i++) B.s[i] += k * T.len; } }
    const L = [];
    for (const c of corners(T, A)) {
      const ta0 = at(A, c.b), ta1 = at(A, c.end), tb0 = at(B, c.b), tb1 = at(B, c.end); if ([ta0, ta1, tb0, tb1].some(v => v == null)) continue;
      const d = (ta1 - ta0) - (tb1 - tb0); if (!(d > 0.05)) continue;
      const why = [];
      const ba = brakeAt(A, c.b, c.apex), bb = brakeAt(B, c.b, c.apex);
      if (ba != null && bb != null && bb - ba > 8) why.push({ w: (bb - ba) / 10, t: tr('zaviraš {0} m prezgodaj', Math.round(bb - ba)) });
      if (ba != null && bb != null && ba - bb > 8) why.push({ w: (ba - bb) / 10, t: tr('zaviraš {0} m prepozno', Math.round(ba - bb)) });
      let va = 1e9, vb = 1e9; for (let x = c.a; x <= c.e; x += 2) { const p = at(A, x, 'v'), q = at(B, x, 'v'); if (p != null) va = Math.min(va, p); if (q != null) vb = Math.min(vb, q); }
      if (va < 1e9 && vb < 1e9 && vb - va > 1) why.push({ w: (vb - va) * 0.6, t: tr('skozi ovinek {0} km/h počasneje', Math.round((vb - va) * 3.6)) });
      const xa = at(A, c.e + 50, 'v'), xb = at(B, c.e + 50, 'v');
      if (xa != null && xb != null && xb - xa > 1.5) why.push({ w: (xb - xa) * 0.5, t: tr('slabši izhod ({0} km/h manj)', Math.round((xb - xa) * 3.6)) });
      why.sort((p, q) => q.w - p.w);
      L.push({ name: c.name, d, why: why.length ? why[0].t : tr('počasneje skozi ves ovinek') });
    }
    return L.sort((p, q) => q.d - p.d).slice(0, 3);
  }
  // a ghost stretched in time to last t s (its samples every DT s again): the gold ghost from the autopilot's run
  function stretch(G, t) {
    const T0 = (G.n - 1) * DT, n = Math.max(2, Math.round(t / DT) + 1), f = new Float32Array(n * CH), k = T0 / Math.max(1e-6, (n - 1) * DT);
    for (let i = 0; i < n; i++) {
      const u = Math.min(G.n - 1.000001, i * k), j = Math.floor(u), a = u - j, o = j * CH, p = (j + 1) * CH;
      for (let c = 0; c < CH; c++) f[i * CH + c] = c === 3 ? G.f[o + 3] + wrap(G.f[p + 3] - G.f[o + 3]) * a : G.f[o + c] + (G.f[p + c] - G.f[o + c]) * a;
    }
    return { n, f, t, M: G.M, color: G.color, stripe: G.stripe, lap: false };
  }
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  const gold = new Map();   // the gold ghosts made in this visit (track, car, physics, wet): made once, used by every run after
  const feat = {
    id: 'trener', profile, analyze, corners, stretch, gold,
    ref: null, sim: null, key: '', lapN: 0, lastLap: null,
    begin(race, ctx) {
      this.ref = null; this.sim = null; this.key = ''; this.lapN = 0; this.lastLap = null; this.runRec = null;
      if (ctx.on || !(race.timeTrial || race.quali || race.chal) || !Z.on('trener')) return;
      const G = Z.G, gh = G && G.ghost ? G.ghost() : {};
      this.ref = gh.play ? { g: gh.play, what: 'best' } : race.chal && gh.fr ? { g: gh.fr.g, what: 'friend' } : null;
      // the gold ghost: a time trial (not a challenge) with the setting on and a gold time for this track
      const S = G && G.S, gt = G && G.gold ? G.gold() : 0;
      if (!race.timeTrial || race.chal || !S || !(S.zbGold === 1 || Z.forced('zlati')) || !(gt > 0)) return;
      this.key = [race.track.def.id, race.player.m.id, race.opts.phys || 'cs', race.rain ? 'wet' : 'dry'].join('|');
      const have = gold.get(this.key);
      if (have) this.show(have, gt);
      else this.sim = { r: null, t: 0, n: 0, f: null, gt, done: false };
    },
    // the gold ghost on the road: as the second ghost, unless a friend's drives there
    show(g, gt) {
      const G = Z.G, gh = G && G.ghost ? G.ghost() : {}; if (!G || !G.setGhostF || gh.fr) return;
      G.setGhostF({ name: tr('ZLATO'), t: gt, g });
      if (!this.ref) this.ref = { g, what: 'gold' };
    },
    // the autopilot's run, a few ms a frame: the same race alone (the player's car, upgrades, set-up, weather), samples every DT s
    step(race) {
      // a circuit's flying lap: kept when it is over (the game starts the next lap's samples over it), for the coach after qualifying
      const gh = this.ref && (race.quali || race.timeTrial) && Z.G && Z.G.ghost ? Z.G.ghost() : null, L = gh && race.quali && gh.lap;
      if (gh && gh.rec) this.runRec = gh.rec;   // (a time trial's run: the game takes it at the line, before the results)
      if (L) { if (L.n < this.lapN && this.lapN > 10) this.lastLap = { n: this.lapN, f: L.f.slice(0, this.lapN * CH) }; this.lapN = L.n; }
      const M = this.sim; if (!M || M.done || typeof Core === 'undefined') return;
      const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now()), H = 1 / 120;
      if (!M.r) {
        M.r = new Core.Race(race.track, Object.assign({}, race.opts, { numAI: 0, playerGrid: 1, laps: 1, flying: 0, traffic: false, police: false, chars: false, faults: false, radio: false, damage: 0, repro: true, seed: 3 }));
        M.f = new Float32Array(12000 * CH); M.r.start();
      }
      const P = M.r.player, cap = race.track.raceLen / 8 + 240;
      while ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0 < 3) {
        for (let k = 0; k < 24; k++) {
          Core.aiControl(P, M.r, H); M.r.step(H); M.t += H;
          while (M.n < 12000 && M.n * DT <= M.t + 1e-9) { const o = M.n * CH; M.f[o] = P.x; M.f[o + 1] = P.y; M.f[o + 2] = P.z; M.f[o + 3] = P.h; M.f[o + 4] = P.delta || 0; M.f[o + 5] = Math.atan(P.gradeNow || 0); M.f[o + 6] = 0; M.n++; }
          if (P.finished || M.t > cap) break;
        }
        if (P.finished || M.t > cap) {
          M.done = true;
          if (P.finished && M.n > 10) { const g = stretch({ n: M.n, f: M.f, M: P.m, color: 0xffcc33, stripe: false }, M.gt); gold.set(this.key, g); this.show(g, M.gt); }
          M.r = null; break;
        }
      }
    },
    // the results: the coach's block
    resEnd(race, kind) {
      if (!(kind === 'tt' || kind === 'quali' || kind === 'chal') || !this.ref) return '';
      const G = Z.G, gh = G && G.ghost ? G.ghost() : {}, run = kind === 'tt' || (kind === 'chal' && race.timeTrial) ? gh.rec || this.runRec : kind === 'chal' ? race.chal && race.chal.mine : this.lastLap;
      if (!run || !(run.n > 10)) return '';
      const L = analyze(race.track, run, this.ref.g);
      const head = tr(this.ref.what === 'gold' ? 'TRENER · proti zlatemu duhu' : this.ref.what === 'friend' ? 'TRENER · proti prijateljevi vožnji' : 'TRENER · proti tvoji najboljši vožnji');
      const body = L.length ? '<ul>' + L.map(x => '<li><b>' + Z.esc(x.name) + '</b> ' + Z.esc(tr('−{0} s', Z.dec(x.d.toFixed(2)))) + ': ' + Z.esc(x.why) + '</li>').join('') + '</ul>' : '<p>' + Z.esc(tr('V nobenem ovinku nisi izgubil časa. Odlično!')) + '</p>';
      return '<div class="zb-sec zb-coach"><span class="zb-h">' + Z.esc(head) + '</span>' + body + '</div>';
    },
    stop() { this.ref = null; this.sim = null; },
  };
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
