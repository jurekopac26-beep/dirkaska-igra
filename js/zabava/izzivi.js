// Zabava · 5 · Izzivi ob cesti (docs/zabava.md, f; Nastavitve: Izzivi ob cesti, zbIzz): on every real track, placed by the track's
// shape (no hand placing per track): a speed trap (radar) at its fastest point, a timed section between two of its named places,
// on an open road a drift zone over its tightest bends, the jump of a road that has a famous one (def.jumpRec), and hidden golden
// posts in its side roads. Each with three stars and a record; the stars against what the player's car could do there (the track's
// speed profile with the car's own acceleration on it). Not online, not in a mission, not in the driving school.
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  // the stars: the radar's speed and the drift's share of the zone at least (of the car's possible), the section's time at most
  const STARS = { radar: [0.85, 0.93, 0.98], odsek: [1.2, 1.1, 1.03], drift: [0.15, 0.3, 0.5], skok: [0.5, 0.75, 0.95] };
  const starsOf = (k, x) => { const L = STARS[k]; let n = 0; for (let i = 0; i < 3; i++) if (k === 'odsek' ? x <= L[i] : x >= L[i]) n = i + 1; return n; };
  const starTxt = (n) => '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);

  // the speed the player's car can carry along the track: the speed profile (corners, braking: Race.vprof) with its own acceleration
  // (power, mass, drag) forward on it; an open road from a standing start at the line, a circuit a flying lap
  function carSpeeds(T, vp, M) {
    const N = T.N, ds = T.ds, vf = new Float32Array(N), m = M.mass || 1000, kw = M.kw || 100, cd = M.cDrag || 0.4;
    const acc = (v) => Math.min(8, kw * 800 / (m * Math.max(v, 6))) - cd * v * v / m - 0.12;
    const step = (v, i) => Math.min(vp[i], Math.sqrt(Math.max(0, v * v + 2 * acc(v) * ds)));
    if (T.open) { let v = 0; for (let i = T.idx(T.startS || 0); i < N; i++) vf[i] = v = step(v, i); }
    else { let v = vp[0]; for (let p = 0; p < 2; p++) for (let i = 0; i < N; i++) vf[i] = v = step(v, i); }
    return vf;
  }
  // the challenges of a race's track (metres after the start line, a circuit's within its lap): [{ k, d, d1, want, name, ... }]
  function plan(race) {
    const T = race.track, P = race.player, vp = (P && P.vprof) || race.vprof; if (!vp || !P) return [];
    const N = T.N, ds = T.ds, L = T.open ? T.raceLen : T.len, s0 = T.startS || 0, vf = carSpeeds(T, vp, P.m);
    const iOf = (d) => T.idx(s0 + d), out = [];
    // 1. the radar: the fastest point (on an open road not in its first 300 m or its last 100 m)
    let bi = -1, bv = 0; for (let d = T.open ? 300 : 0; d < L - (T.open ? 100 : 0); d += ds) { const v = vf[iOf(d)]; if (v > bv + 0.05) { bv = v; bi = d; } }
    if (bi >= 0 && bv > 15) out.push({ k: 'radar', d: bi, want: bv });
    // 2. the section: between two named places 700-2500 m apart, the one with the most corners; else 1.5 km from the first corner
    const names = (T.names || []).filter(q => q.d >= 0 && q.d <= L), C = T.corners || [];
    const nC = (a, b) => C.filter(c => { const d = ((c.i0 * ds - s0) % T.len + T.len) % T.len; return d > a && d < b; }).length;
    let sec = null;
    for (let i = 0; i + 1 < names.length; i++) { const a = names[i], b = names[i + 1], g = b.d - a.d; if (g >= 700 && g <= 2500 && (!sec || nC(a.d, b.d) > sec.n)) sec = { a: a.d, b: b.d, n: nC(a.d, b.d), name: a.n + ' – ' + b.n }; }
    if (!sec) { const c = C.map(c => ((c.i0 * ds - s0) % T.len + T.len) % T.len).filter(d => d > 200 && d < L - 1700).sort((x, y) => x - y)[0]; if (c != null) sec = { a: c - 100, b: c + 1400, name: '' }; }
    if (sec) { let t = 0; for (let d = sec.a; d < sec.b; d += ds) t += ds / Math.max(3, vf[iOf(d)]); out.push({ k: 'odsek', d: sec.a, d1: sec.b, want: t, name: sec.name }); }
    // 3. an open road's drift zone: the 500 m with the most tight bends (radius under 28 m), at least two
    if (T.open) {
      const tight = C.filter(c => c.minR < 28).map(c => ({ a: c.i0 * ds - s0, b: (c.i1 >= c.i0 ? c.i1 : c.i0) * ds - s0 })).filter(c => c.a > 100 && c.b < L - 50);
      let best = null; for (let i = 0; i < tight.length; i++) { let j = i; while (j + 1 < tight.length && tight[j + 1].b - tight[i].a <= 500) j++; if (j > i && (!best || j - i > best.n)) best = { a: tight[i].a - 20, b: tight[j].b + 20, n: j - i }; }
      if (best) out.push({ k: 'drift', d: best.a, d1: best.b, want: best.b - best.a });
    }
    // 4. the famous jump of a road (def.jumpRec: its record length)
    if (T.def.jumpRec && T.def.jumpRec.m > 0) out.push({ k: 'skok', d: 0, want: T.def.jumpRec.m });
    // 5. the golden posts: up to three side roads open for 25 m or more, a post 6 m short of each one's rail
    const st = (T.stubs || []).filter(S => S.L >= 25 && S.n > 3).slice(0, 3);
    st.forEach((S, k) => { const D = S.Lend / (S.n - 1), j = Math.max(0, Math.min(S.n - 1, Math.floor((S.L - 6) / D))); out.push({ k: 'smernik', id: k, x: S.x[j], z: S.z[j], y: S.Y ? S.Y[j] : 0 }); });
    return out;
  }

  const feat = {
    id: 'izzivi', STARS, starsOf, carSpeeds, plan,
    on: false, L: null, run: null, objs: null, prev: 0, air: null,
    fits: (race, ctx) => !ctx.on && !ctx.mis && !ctx.school && !ctx.nv && !ctx.chal && !!race.player && !race.track.def.test,
    begin(race, ctx) {
      this.clear();
      this.on = Z.on('izzivi', 'zbIzz') && this.fits(race, ctx);
      if (!this.on) return;
      this.L = plan(race); this.run = {}; this.prev = null; this.air = null; this.lapSec = null; this.drift = null;
      this.rec = Z.part('izzivi')[race.track.def.id] || (Z.part('izzivi')[race.track.def.id] = {});
      this.found = new Set(Array.isArray(this.rec.smer) ? this.rec.smer : []);
      this.draw(race);
    },
    // the marks on the road: the radar's sign by the road, the golden posts (one draw call each kind)
    draw(race) {
      if (typeof THREE === 'undefined' || typeof Render === 'undefined' || !Render.scene) return;
      const T = race.track, s0 = T.startS || 0, objs = this.objs = [];
      const R = this.L.find(c => c.k === 'radar');
      if (R) {
        const i = T.idx(s0 + R.d - 30), nx = T.nx ? T.nx[i] : 0, nz = T.nz ? T.nz[i] : 1, off = T.w + 0.9, y = T.hasElev ? T.hy[i] : 0;   // (30 m before the trap: seen coming)
        const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0x2a2f38 }), b = new THREE.MeshLambertMaterial({ color: 0xffd34d, emissive: 0x6b5000 });
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), m); pole.position.y = 1.7;
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 1.8), b); box.position.y = 3.6;
        g.add(pole, box); g.position.set(T.px[i] + nx * off, y, T.pz[i] + nz * off); g.rotation.y = -T.hd[i]; g.userData.zb = 1; Render.scene.add(g); objs.push(g);
      }
      const posts = this.L.filter(c => c.k === 'smernik' && !this.found.has(c.id));
      if (posts.length) {
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 1.5, 0.32), new THREE.MeshLambertMaterial({ color: 0xffc83d, emissive: 0x6b4a00 }), posts.length), o = new THREE.Object3D();
        posts.forEach((c, k) => { o.position.set(c.x, c.y + 0.75, c.z); o.updateMatrix(); im.setMatrixAt(k, o.matrix); });
        im.userData.zb = 1; im.userData.posts = posts.map(c => c.id); Render.scene.add(im); objs.push(im); this.postMesh = im;
      }
    },
    clear() {
      if (this.objs) for (const o of this.objs) { if (o.parent) o.parent.remove(o); o.traverse && o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); }
      this.objs = null; this.postMesh = null;
    },
    // a result: kept when better (record), said under the map
    done(race, c, val, txt) {
      const k = c.k, n = starsOf(k, k === 'drift' ? val : val / c.want),   // (the drift: already its share of the zone)
        R = this.rec[k], better = !R || (k === 'odsek' ? val < R.v : val > R.v);
      if (better) this.rec[k] = { v: +val.toFixed(3), st: n }; Z.save();
      const cur = this.run[k]; if (!cur || (k === 'odsek' ? val < cur.v : val > cur.v)) this.run[k] = { v: val, st: n, rec: better && !!R, first: !R, txt };
      const G = Z.G; if (G) G.showMsg(txt + ' ' + starTxt(n) + (better && R ? tr(' · REKORD') : ''), better && R ? 'fast' : 'gold', 2);
    },
    step(race, dt) {
      if (!this.on || !this.L) return;
      const G = Z.G, ph = G ? G.phase() : 'racing', P = race.player, T = race.track; if (ph !== 'racing' || P.finished || !(race.time > 0)) { this.prev = null; return; }
      const L = T.open ? T.raceLen : T.len, d = T.open ? P.dist : ((P.dist % L) + L) % L, p = this.prev; this.prev = d;
      const cross = (x) => p != null && (T.open ? p < x && d >= x : (p < x && d >= x) || (p > d + L / 2 && (x > p || x <= d)));
      for (const c of this.L) {
        if (c.k === 'radar' && cross(c.d)) this.done(race, c, P.speed, tr('RADAR {0} km/h', Math.round(P.speed * 3.6)));
        else if (c.k === 'odsek') {
          if (cross(c.d)) { this.lapSec = race.time; if (!this.run.odsekSaid && G) { this.run.odsekSaid = true; G.showMsg(tr('ODSEK NA ČAS · START'), 'gold', 1.4); } }
          else if (cross(c.d1) && this.lapSec != null) { const t = race.time - this.lapSec; this.lapSec = null; this.done(race, c, t, tr('ODSEK {0}', G ? G.fmt(t, true) : t.toFixed(2))); }
        } else if (c.k === 'drift') {
          const inZ = d >= c.d && d <= c.d1;
          if (inZ) { if (!this.drift) { this.drift = { m: 0 }; if (G && !this.run.driftSaid) { this.run.driftSaid = true; G.showMsg(tr('DRIFT CONA'), 'gold', 1.4); } } if (Math.abs(P.beta || 0) > 0.3 && P.speed > 8 && !P.air) this.drift.m += P.speed * dt; }
          else if (this.drift && d > c.d1) { const f = Math.min(1, this.drift.m / c.want); this.drift = null; this.done(race, c, f, tr('DRIFT {0} %', Math.round(f * 100))); }
        } else if (c.k === 'smernik' && !this.found.has(c.id) && Math.hypot(P.x - c.x, P.z - c.z) < 4) {
          this.found.add(c.id); this.rec.smer = [...this.found]; Z.save();
          const all = this.L.filter(x => x.k === 'smernik').length; this.run.smer = (this.run.smer || 0) + 1;
          if (G) G.showMsg(tr('ZLATI SMERNIK {0}/{1}!', this.found.size, all), 'fast', 2);
          if (this.postMesh) { const k = this.postMesh.userData.posts.indexOf(c.id); if (k >= 0) { const o = new THREE.Object3D(); o.scale.set(0, 0, 0); o.updateMatrix(); this.postMesh.setMatrixAt(k, o.matrix); this.postMesh.instanceMatrix.needsUpdate = true; } }
        }
      }
      // the famous jump: from the take-off to the landing, the longest of the run
      const J = this.L.find(c => c.k === 'skok');
      if (J) { if (P.air && !this.air) this.air = { x: P.x, z: P.z }; else if (!P.air && this.air) { const m = Math.hypot(P.x - this.air.x, P.z - this.air.z); this.air = null; if (m > 8) this.done(race, J, m, tr('SKOK {0} m', Math.round(m))); } }
    },
    // the results: what this run did, with its stars, and the posts found of all
    resEnd(race, kind) {
      if (!this.on || !this.run) return '';
      const NAME = { radar: 'Radar', odsek: 'Odsek na čas', drift: 'Drift cona', skok: 'Skok' }, rows = [];
      for (const k of ['radar', 'odsek', 'drift', 'skok']) { const r = this.run[k]; if (r) rows.push('<li>' + Z.esc(tr(NAME[k])) + ': ' + Z.esc(r.txt.replace(/^\S+\s/, '')) + ' <span class="zb-st">' + starTxt(r.st) + '</span>' + (r.rec ? ' <span class="zb-new">' + Z.esc(tr('nov rekord')) + '</span>' : '') + '</li>'); }
      const all = this.L.filter(x => x.k === 'smernik').length;
      if (all) rows.push('<li>' + Z.esc(tr('Zlati smerniki: {0}/{1}', this.found.size, all)) + '</li>');
      return rows.length ? '<div class="zb-sec zb-izz"><span class="zb-h">' + Z.esc(tr('IZZIVI OB CESTI')) + '</span><ul>' + rows.join('') + '</ul></div>' : '';
    },
    stop() { this.clear(); this.on = false; this.L = null; this.run = null; },
  };
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
