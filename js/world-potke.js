/* =========================================================================
   ALONG THE FOOTPATHS — benches, lamps, bins and a few walkers by the map's footpaths and unpaved ways that the chase camera sees (the
   ground round the houses, js/world-stavbe.js okolica: on Spa only). The user, 14. 11. 2026: »Ob takih potkah postavi na vsake toliko casa
   kaksen element. Klopca, svetilka, sprehajalec s psom, sprehajalec, 2 cloveka se skupaj sprehajata, ljudje kaksen sedi na klopci, in dodaj
   se kar mislis da je ob teh potkah kot recimo smeti itd...« (docs/realizem/paket-s.md, »Ob potkah«). Generic things only: no names, signs
   or writing.
   Each path (the map's rows that touch, as one; only its stretch that okolica draws, at least 3 m clear of the houses, 8 to 60 m from the
   road) is a scene of World.people (js/world-ljudje.js, its kit's EXTRA): its frame at the track's sample nearest the path's middle, the
   path in that frame. Along it: a lamp every ~22 m and a bench (or two on a long one) on the far side, facing the path, someone sitting on
   it, a bin beside it, a dog-bag post at one end, some litter in the grass; the walkers go there and back along the path at a stroll
   (stroll(): the act's path), a couple side by side, someone alone, someone with a dog on its leash, kept apart sideways so that they
   pass each other. As the car comes they look at it and walk on.
   ========================================================================= */
(function () {
  'use strict';
  const K = World.peopleKit; if (!K) return;
  const { EXTRA, L, ITEMX, rnd, pick, box, cyl, grp, bar, pal } = K;

  // the left hand's grip in the person's own frame for the joints J (as js/world-ljudje2.js varnostHand: the leash's end)
  function handAt(P, J) {
    const g = (k, d) => J[k] == null ? d : Array.isArray(J[k]) ? J[k][0] : J[k];
    P.sh[0].rotation.set(-g('shx', 0), g('shy', 0), g('shz', 0.07)); P.el[0].rotation.x = -g('el', 0.08); P.hips.position.y = g('hy', 0.92); P.torso.rotation.x = g('lean', 0);
    P.root.updateMatrixWorld(true); const v = new THREE.Vector3(0, -0.03, 0.03).applyMatrix4(P.hand[0].matrixWorld);
    P.sh[0].rotation.set(0, 0, 0); P.el[0].rotation.x = 0; P.hips.position.y = 0.92; P.torso.rotation.x = 0; P.root.updateMatrixWorld(true);
    return v;
  }
  ITEMX.potka_dog = () => grp();   // (nothing in the hand: the dog and its leash hang on the walker's root)

  const lamp = () => grp(cyl(0.06, 0.08, 3.4, 6, 0x2a3a2e, 0, 1.7, 0), box(0.3, 0.42, 0.3, 0x2a3a2e, 0, 3.55, 0), box(0.24, 0.3, 0.24, 0xe8e2c4, 0, 3.52, 0), cyl(0.02, 0.2, 0.14, 6, 0x2a3a2e, 0, 3.83, 0));
  const bagPost = () => grp(cyl(0.035, 0.035, 1.05, 5, 0x3a3f44, 0, 0.52, 0), box(0.26, 0.34, 0.16, 0x2f6a3a, 0, 1.12, 0.06), box(0.2, 0.06, 0.12, 0x24502c, 0, 0.93, 0.08));
  const litter = (k) => k === 0 ? box(0.16, 0.05, 0.12, 0xe8e6de, 0, 0.025, 0, { ry: 0.6 })                 // (a paper)
    : k === 1 ? grp(cyl(0.035, 0.035, 0.12, 6, 0xb8bcc2, 0, 0.035, 0, { rz: Math.PI / 2 }))                  // (a can on its side)
      : grp(cyl(0.045, 0.035, 0.11, 6, 0xf2f2ee, 0, 0.04, 0, { rx: Math.PI / 2 }));                           // (a cup)

  // the drawn stretch of each path, in the world: [[x, z], ...] every metre
  function pathsOf(o, T, def) {
    const OK = o.okolica, rows = (def.okolica && def.okolica.osm || []).filter(r => r[0] !== 0 && r[1] !== 0); if (!OK || !OK.clip || !rows.length) return [];
    const ptsOf = (r) => { const P = []; for (let k = 3; k + 1 < r.length; k += 2) P.push([r[k], r[k + 1]]); return P; };
    const chains = rows.map(r => ({ P: ptsOf(r), hw: r[2] }));
    for (let again = true; again;) { again = false;   // (rows that touch end to end: one path)
      for (let i = 0; i < chains.length && !again; i++) for (let j = i + 1; j < chains.length && !again; j++) {
        const A = chains[i].P, B = chains[j].P, d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
        const join = d(A[A.length - 1], B[0]) < 2.5 ? A.concat(B.slice(1)) : d(A[A.length - 1], B[B.length - 1]) < 2.5 ? A.concat(B.slice().reverse().slice(1))
          : d(A[0], B[B.length - 1]) < 2.5 ? B.concat(A.slice(1)) : d(A[0], B[0]) < 2.5 ? B.slice().reverse().concat(A.slice(1)) : null;
        if (join) { chains[i] = { P: join, hw: Math.min(chains[i].hw, chains[j].hw) }; chains.splice(j, 1); again = true; } } }
    const houses = (def.bld || []).map(([x, z, Lb, Wb, a]) => ({ x, z, L: Lb / 2, W: Wb / 2, c: Math.cos(a), s: Math.sin(a), r: Math.hypot(Lb, Wb) / 2 }));
    const byHouse = (x, z, m) => houses.some(h => { const dx = x - h.x, dz = z - h.z; if (dx * dx + dz * dz > (h.r + m) * (h.r + m)) return false;
      return Math.abs(dx * h.c + dz * h.s) < h.L + m && Math.abs(-dx * h.s + dz * h.c) < h.W + m; });
    const out = [];
    for (const ch of chains) {
      const S = [];   // every metre along it
      for (let k = 0; k + 1 < ch.P.length; k++) { const a = ch.P[k], b = ch.P[k + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])));
        for (let u = 0; u < n; u++) S.push([a[0] + (b[0] - a[0]) * u / n, a[1] + (b[1] - a[1]) * u / n]); }
      S.push(ch.P[ch.P.length - 1]);
      const ok = S.map(([x, z]) => { const i = T.nearestIdx(x, z), lat = Math.abs((x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]);
        return OK.clip(x, z) > 1.5 && lat > 8 && lat < 60 && !byHouse(x, z, 3); });
      let best = [0, -1];   // (the longest good stretch)
      for (let i = 0; i < S.length; i++) { if (!ok[i]) continue; let j = i; while (j + 1 < S.length && ok[j + 1]) j++; if (j - i > best[1] - best[0]) best = [i, j]; i = j; }
      if (best[1] - best[0] >= 25) out.push({ P: S.slice(best[0], best[1] + 1), hw: ch.hw, byHouse });
    }
    return out;
  }

  const LOOKS = () => ({ shirt: pick(pal.SHIRT), pants: pick(pal.PANTS), hair: pick(['short', 'short', 'long', 'pony', 'bald']), hairCol: pick(pal.HAIR) });

  EXTRA.push(function (o, T, gH, def) {
    if (!def || def.test || def.pending || def.id !== 'spa') return null;   // (Spa's footpaths; okolica is Spa's only)
    const ps = pathsOf(o, T, def); if (!ps.length) return null;
    ps.sort((p, q) => T.nearestIdx(p.P[0][0], p.P[0][1]) - T.nearestIdx(q.P[0][0], q.P[0][1]));
    return ps.map((pa, k) => {
      const m = pa.P[pa.P.length >> 1], i = T.nearestIdx(m[0], m[1]), side = ((m[0] - T.px[i]) * T.nx[i] + (m[1] - T.pz[i]) * T.nz[i]) >= 0 ? 1 : -1;
      const len = pa.P.length - 1, cy = gH(m[0], m[1]) + 1.5;
      return { name: 'potka', s: i * T.ds, side, seed: 17 + k * 13, path: true, box: [m[0], cy, m[1], len / 2 + 10],
        build(C, F) {
          const ab = ([x, z]) => [(x - F.px) * F.tx + (z - F.pz) * F.tz, (x - F.px) * F.nx + (z - F.pz) * F.nz - F.bar];
          const pts = pa.P.map(ab), cum = [0]; for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
          const Lp = cum[cum.length - 1], hw = pa.hw, clear = C.clear = [];
          const at = (d) => { let j = 1; while (j < pts.length - 1 && cum[j] < d) j++; const f = (d - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1), p = pts[j - 1], q = pts[j];
            const ux = q[0] - p[0], uz = q[1] - p[1], l = Math.hypot(ux, uz) || 1; return { a: p[0] + ux * f, b: p[1] + uz * f, ux: ux / l, uz: uz / l }; };
          // the far side (away from the road: b grows): the side's unit normal at d
          const far = (q) => { const nx = -q.uz, nz = q.ux; return nz >= 0 ? [nx, nz] : [-nx, -nz]; };
          const free = (a, b) => { const [x, z] = F.w(a, b); return b > 2 && !pa.byHouse(x, z, 1.2) && !(o.okolica.on && o.okolica.on(x, z, 0.3)); };
          const put = (obj, d, off, dir, r) => { const q = at(d), [nx, nz] = far(q), a = q.a + nx * off, b = q.b + nz * off; if (!free(a, b)) return null;
            C.prop(obj, a, b, dir === 'path' ? [-nx, -nz] : dir); clear.push([a, b, r || 1]); return { a, b, nx, nz, q }; };
          // lamps every ~22 m on the far side
          const nl = Math.max(1, Math.round(Lp / 22)); for (let j = 0; j < nl; j++) put(lamp(), (j + 0.5) * Lp / nl, hw + 0.7, null, 0.8);
          // a bench (two on a long path) facing the path, a bin beside it, someone on it; litter in the grass round it
          const benches = Lp > 55 ? [0.3, 0.72] : [0.42]; let sat = 0;
          for (const [bi, f] of benches.entries()) {
            const B = put(L.bench(pick([0x7c5a3a, 0x8a6a45, 0x5f4a35])), f * Lp + (bi ? 3 : -2), hw + 0.85, 'path', 1.3); if (!B) continue;
            put(L.bin(0x2a5a3a), f * Lp + (bi ? 3 : -2) + 1.25, hw + 0.75, 'path', 0.6);
            if (bi === 0 || rnd() < 0.5) {   // someone sitting (facing the path: as the bench, 5 cm back), now and then a look at the car
              const P = C.man(Object.assign(LOOKS(), { long: rnd() < 0.5, scale: 0.97 + rnd() * 0.06 }), { act: { a: B.a + B.nx * 0.05, b: B.b + B.nz * 0.05, pose: 'sit', face: [-B.nx, -B.nz] },
                bliza: { look: 'car' }, run: false }); P.noUm = rnd() < 0.5; sat++; }
            for (let j = 0; j < 2 + (rnd() < 0.5 ? 1 : 0); j++) { const d = f * Lp + (rnd() - 0.5) * 7, q = at(d), [nx, nz] = far(q), off = hw + 0.5 + rnd() * 1.6;
              const a = q.a + nx * off, b = q.b + nz * off; if (free(a, b)) C.prop(litter(j % 3), a, b, [rnd() - 0.5, rnd() - 0.5]); }
          }
          put(bagPost(), k % 2 ? Lp - 4 : 4, hw + 0.6, 'path', 0.6);   // (the dog-bag post near an end)
          // the walkers: there and back at a stroll, each on its own line beside the path's middle (off: + to the left of the way out)
          const W = (v, off, ph) => ({ pts, cum, L: Lp, v, tr: 1.3, off, ph });
          const walker = (look, w, hold) => C.man(look, { act: Object.assign({ a: pts[0][0], b: pts[0][1], pose: 'walk', face: [1, 0], path: w, y: 0.08 }, hold ? { hold } : {}), run: false });
          const wide = hw * 0.55, roster = k % 3;
          if (roster !== 1) {   // a couple, side by side, the same pace
            const ph = rnd() * 60, v = 1.05 + rnd() * 0.15, A = LOOKS(), B = LOOKS(); A.hair = 'short'; B.hair = pick(['long', 'pony']);
            walker(A, W(v, -wide - 0.05, ph)); walker(B, W(v, -wide + 0.42, ph));
          }
          if (roster !== 0 || hw >= 1.6) {   // someone with a dog on its leash (the dog at its left, the leash from its left hand)
            const P = walker(Object.assign(LOOKS(), { long: true, hat: rnd() < 0.4 ? 'cap' : null, hatCol: pick(pal.SHIRT) }), W(1.15 + rnd() * 0.1, roster === 1 ? 0 : wide, rnd() * 60), [['potka_dog', 0]]); P.noUm = true;
            const h = handAt(P, { el: [0.35, 0.35], hy: 0.9, lean: 0.05 }), c = [0.6, 0.68, 0.58], mm = [(h.x + c[0]) / 2, (h.y + c[1]) / 2 - 0.1, (h.z + c[2]) / 2];
            const dg = L.dog(pick([0x5c3a22, 0x2a221c, 0xc8a878, 0xe8e2d4, 0x8a7a68])); dg.scale.setScalar(0.85); dg.position.set(0.6, 0, 0.25);
            const gr = grp(dg, bar([h.x, h.y, h.z], mm, 0.02, pick([0xb3261e, 0x1f4fa8, 0x2a2a2a])), bar(mm, c, 0.02, 0x2a2a2a)); gr.userData.item = 'L:potka_dog'; P.root.add(gr);
          }
          if (roster !== 2 || !sat) walker(LOOKS(), W(1.25 + rnd() * 0.15, roster === 0 ? wide : -wide, rnd() * 60));   // someone alone, a little quicker
        } };
    });
  });
})();
