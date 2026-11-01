// Zabava · 7 · Živa cesta (docs/zabava.md, g; Nastavitve: Živa cesta, zbCesta): on an open road something happens ahead of the player:
// rocks on the road, an animal crossing it, road works with a temporary traffic light, a slow tractor. One at a time, one or two a run,
// 250-400 m ahead of the player where no rival is between them (it never stands in a rival's way), gone once the player is past. In a
// time trial the same places and kinds every run (the track's own seed), so the records stay fair. One draw call each (the works three).
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  const KINDS = ['rocks', 'animal', 'works', 'tractor'];
  // a seeded random number source (mulberry32), the track's id as its seed in a time trial
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  // the animal of the road's country (the track's name: »Kraj, Država«)
  const ANIMAL = { Avstralija: 'kenguru', Finska: 'los', Rusija: 'los', Kanada: 'los', 'Čile': 'gvanako', Brazilija: 'gvanako', 'Južna Afrika': 'antilopa', Kitajska: 'koza', Japonska: 'srna', ZDA: 'jelen', Slovenija: 'gams', Avstrija: 'gams' };
  const animalOf = (def) => ANIMAL[String(def.name || '').split(', ').pop()] || 'srna';
  // a point of the road: s along it (track metres), lat across it (m, to the normal's side), its height and heading
  function at(T, s, lat) { const i = T.idx(s); return { i, x: T.px[i] + T.nx[i] * lat, z: T.pz[i] + T.nz[i] * lat, y: T.hasElev ? T.hy[i] : 0, h: T.hd[i] }; }
  // one geometry of boxes (w, h, l, x, y, z, ry; x along the road, z along its normal as q.d): one draw call for a whole thing
  function boxes(list) {
    const pos = [], nor = [];
    for (const [w, h, l, x, y, z, ry] of list) {
      const g = new THREE.BoxGeometry(l, h, w).toNonIndexed(), p = g.attributes.position.array, n = g.attributes.normal.array, c = Math.cos(ry || 0), s = Math.sin(ry || 0);
      for (let i = 0; i < p.length; i += 3) { const px = p[i], pz = p[i + 2], nx = n[i], nz = n[i + 2]; pos.push(px * c - pz * s + x, p[i + 1] + y, px * s + pz * c + z); nor.push(nx * c - nz * s, n[i + 1], nx * s + nz * c); }
      g.dispose();
    }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return G;
  }
  const mesh = (list, col, em) => new THREE.Mesh(boxes(list), new THREE.MeshLambertMaterial({ color: col, emissive: em || 0 }));

  // where and what in a run: two places along the road (35-45 % and 65-80 % of it; a short road one), each with its kind
  function plan(T, def, seed) {
    const R = rng(seed), L = T.raceLen, n = L > 2500 ? 2 : 1, out = [];
    for (let k = 0; k < n; k++) { const a = n === 1 ? 0.45 : k ? 0.65 : 0.35, b = n === 1 ? 0.65 : k ? 0.8 : 0.45; out.push({ d: L * (a + (b - a) * R()), kind: KINDS[Math.floor(R() * KINDS.length) % KINDS.length], done: false }); }
    return out;
  }

  const feat = {
    id: 'cesta', KINDS, plan, animalOf, at,
    on: false, L: null, ev: null,
    fits: (race, ctx) => !ctx.on && !ctx.mis && !ctx.school && !ctx.nv && !ctx.chal && !!race.player && !!race.track.open && !race.track.def.test,
    begin(race, ctx) {
      this.clear(); this.ev = null;
      this.on = Z.on('cesta', 'zbCesta') && this.fits(race, ctx);
      if (!this.on) return;
      const T = race.track, seed = race.timeTrial ? hash(T.def.id + '|cesta') : (Math.random() * 4294967296) >>> 0;
      this.L = plan(T, T.def, seed); this.R = rng(seed ^ 0x9e3779b9);
    },
    // a place it can stand: no rival between the player and it (and 30 m past it), not right at the finish
    free(race, d) {
      const P = race.player, T = race.track;
      if (d > T.raceLen - 120 || d < P.dist + 150) return false;
      return !race.cars.some(c => c !== P && !c.finished && !race.isOut(c) && c.dist > P.dist - 2 && c.dist < d + 30);
    },
    spawn(race, E) {
      const T = race.track, s0 = T.startS || 0, s = s0 + E.d, w = T.w, R = this.R, side = R() < 0.5 ? -1 : 1, ev = { E, kind: E.kind, s, d: E.d, side, objs: [], t: 0, hit: false, told: false };
      const add = (m) => { if (typeof Render !== 'undefined' && Render.scene) { m.userData.zb = 1; Render.scene.add(m); } ev.objs.push(m); return m; };
      const put = (m, p, ry) => { m.position.set(p.x, p.y, p.z); m.rotation.y = -(p.h + (ry || 0)); return m; };
      if (E.kind === 'rocks') {   // 4-6 rocks over one half of the road
        ev.rocks = []; const k = 4 + Math.floor(R() * 3), L = [];
        for (let j = 0; j < k; j++) { const dl = side * (0.4 + R() * (w - 0.8)), ds = (R() - 0.5) * 8, r = 0.4 + R() * 0.4; ev.rocks.push({ s: s + ds, lat: dl, r }); L.push([r * 2, r * 1.5, r * 2, ds, r * 0.6, dl, R() * 3]); }
        if (typeof THREE !== 'undefined') add(put(mesh(L, 0x7d7468), at(T, s, 0)));
      } else if (E.kind === 'animal') {   // an animal crossing the road at a walk, from the side it came out of
        const big = ['los', 'jelen'].includes(animalOf(T.def)), sc = big ? 1.9 : 1.5, col = { kenguru: 0x9a6b45, los: 0x4a3524, gvanako: 0xc89a62, antilopa: 0xb07a45, koza: 0xd8d0c0, srna: 0x8a5a33, jelen: 0x7a4f2c, gams: 0x5b4330 }[animalOf(T.def)] || 0x8a5a33;
        ev.lat = -side * (w + 2.5); ev.v = side * (2.2 + R() * 1.2); ev.r = 0.9 * sc;
        if (typeof THREE !== 'undefined') ev.m = add(mesh([[0.55 * sc, 0.55 * sc, 1.25 * sc, 0, 1.0 * sc, 0], [0.3 * sc, 0.35 * sc, 0.45 * sc, 0.75 * sc, 1.45 * sc, 0], [0.12 * sc, 0.75 * sc, 0.12 * sc, 0.45 * sc, 0.4 * sc, 0.2 * sc], [0.12 * sc, 0.75 * sc, 0.12 * sc, 0.45 * sc, 0.4 * sc, -0.2 * sc], [0.12 * sc, 0.75 * sc, 0.12 * sc, -0.45 * sc, 0.4 * sc, 0.2 * sc], [0.12 * sc, 0.75 * sc, 0.12 * sc, -0.45 * sc, 0.4 * sc, -0.2 * sc]], col));
      } else if (E.kind === 'works') {   // one half closed by cones over 40 m, a light at its start: green 6 s, red 8 s
        const L = []; for (let j = 0; j <= 5; j++) L.push([0.55, 1.0, 0.55, j * 8 - 4, 0.5, -side * 0.6]);
        for (let j = 0; j <= 4; j++) L.push([0.55, 1.0, 0.55, j * 9, 0.5, -side * (w - 0.5)]);
        ev.cyc = R() * 14;
        if (typeof THREE !== 'undefined') {
          add(put(mesh(L, 0xff6a1a, 0x401000), at(T, s, 0)));
          add(put(mesh([[0.18, 3.0, 0.18, -6, 1.5, side * (w + 0.7)]], 0x2a2f38), at(T, s, 0)));
          ev.lamp = add(put(mesh([[0.6, 0.9, 0.5, -6, 3.2, side * (w + 0.7)]], 0x22aa33, 0x22aa33), at(T, s, 0)));
        }
      } else {   // a tractor at 25 km/h on its half, the player to pass it
        ev.lat = side * (w * 0.45); ev.v = 7; ev.ds = 0; ev.r = 1.4;
        if (typeof THREE !== 'undefined') ev.m = add(mesh([[1.6, 1.0, 2.6, 0, 1.0, 0], [1.2, 1.1, 1.1, -0.5, 2.0, 0], [0.5, 1.5, 1.5, -0.7, 0.75, 0.95], [0.5, 1.5, 1.5, -0.7, 0.75, -0.95], [0.35, 0.9, 0.9, 1.0, 0.45, 0.85], [0.35, 0.9, 0.9, 1.0, 0.45, -0.85]], 0x3f8a2e));
      }
      this.ev = ev; this.place(race);
      return ev;
    },
    // the moving ones (the animal, the tractor) where they are now
    place(race) {
      const ev = this.ev; if (!ev || !ev.m) return; const T = race.track;
      if (ev.kind === 'animal') { const p = at(T, ev.s, ev.lat); ev.m.position.set(p.x, p.y, p.z); ev.m.rotation.y = -(p.h + (ev.v > 0 ? Math.PI / 2 : -Math.PI / 2)); }
      if (ev.kind === 'tractor') { const p = at(T, ev.s + ev.ds, ev.lat); ev.m.position.set(p.x, p.y, p.z); ev.m.rotation.y = -p.h; }
    },
    clear() {
      const ev = this.ev; if (ev) for (const o of ev.objs) { if (o.parent) o.parent.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }
      this.ev = null;
    },
    // a knock: the car slows by k (0.6 keeps 60 %), the screen and the phone shake
    knock(race, k, what) {
      const P = race.player; P.vx *= k; P.vz *= k;   // (not a touch of the barrier: the team's goals and the achievements count those)
      if (typeof Sfx !== 'undefined' && Sfx.crash) Sfx.crash(4);
      if (typeof Render !== 'undefined' && Render.shake) Render.shake(0.6);
      const G = Z.G; if (G) G.showMsg(what, 'slow', 1.6);
    },
    step(race, dt) {
      if (!this.on || !this.L) return;
      const G = Z.G, ph = G ? G.phase() : 'racing', P = race.player, T = race.track; if (ph !== 'racing' || P.finished || !(race.time > 0)) return;
      let ev = this.ev;
      if (!ev) { const E = this.L.find(e => !e.done && e.d - P.dist < 400 && e.d - P.dist > 150); if (E) { E.done = true; if (this.free(race, E.d)) ev = this.spawn(race, E); } return; }
      ev.t += dt;
      const s0 = T.startS || 0, rel = (P.dist + s0) - ev.s;   // (the player's car to the thing along the road: < 0 before it)
      const lat = P.q ? P.q.d : 0;
      if (!ev.told && rel > -140) { ev.told = true; if (G) { G.showMsg(tr({ rocks: 'POZOR: KAMENJE NA CESTI', animal: 'POZOR: ŽIVAL NA CESTI', works: 'POZOR: DELA NA CESTI', tractor: 'POZOR: POČASEN TRAKTOR' }[ev.kind]), 'slow', 1.8); G.say('zbCesta_' + ev.kind, null, 3); } }
      if (ev.kind === 'animal') { ev.lat += ev.v * dt; if (Math.abs(ev.lat) > T.w + 3) ev.v = 0; this.place(race);
        if (!ev.hit && Math.abs(rel) < ev.r + 1.6 && Math.abs(lat - ev.lat) < ev.r + 0.9) { ev.hit = true; this.knock(race, 0.55, tr('ŽIVAL! UPOČASNI')); } }
      else if (ev.kind === 'tractor') { ev.ds += ev.v * dt; this.place(race); const r2 = rel - ev.ds;
        if (!ev.hit && Math.abs(r2) < 2.6 && Math.abs(lat - ev.lat) < 1.9) { ev.hit = true; this.knock(race, 0.5, tr('TRAKTOR! PREHITEVAJ PREVIDNO')); } }
      else if (ev.kind === 'rocks') { for (const k of ev.rocks) if (!k.hit && Math.abs((P.dist + s0) - k.s) < k.r + 1.5 && Math.abs(lat - k.lat) < k.r + 0.9) { k.hit = true; this.knock(race, 0.82, tr('KAMEN!')); break; } }   // (one rock a step)
      else if (ev.kind === 'works') {
        const red = ((race.time + ev.cyc) % 14) >= 6; if (ev.lamp) { ev.lamp.material.color.setHex(red ? 0xdd2222 : 0x22aa33); ev.lamp.material.emissive.setHex(red ? 0xdd2222 : 0x22aa33); }
        if (!ev.passed && rel >= -6) { ev.passed = true; if (red) { P.tfPen = (P.tfPen || 0) + 3; if (G) G.showMsg(tr('RDEČA LUČ! +3 s KAZNI'), 'slow', 2); } }
        if (!ev.hit && rel > -4 && rel < 40 && Math.sign(lat || 1) === -ev.side && Math.abs(lat) > 0.8) { ev.hit = true; this.knock(race, 0.85, tr('STOŽCI!')); }
      }
      if (rel > (ev.kind === 'tractor' ? ev.ds + 120 : 70) || ev.t > 90) this.clear();   // (past it: gone)
    },
    stop() { this.clear(); this.on = false; this.L = null; },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) {
    Comm.addLines('zbCesta_rocks', ['Caution! Rocks on the road ahead!', 'Rocks have come down onto the road. Pick your line!']);
    Comm.addLines('zbCesta_animal', ['Watch out, an animal on the road!', 'Something is crossing the road ahead. Careful!']);
    Comm.addLines('zbCesta_works', ['Road works ahead, one lane only. Mind the light!', 'Temporary lights at the road works. Is it green?']);
    Comm.addLines('zbCesta_tractor', ['A slow tractor ahead. Wait for a clear stretch to pass!', 'Farm traffic! A tractor holding everyone up.']);
  }
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
