// Videz ljudi, različica 1 · Postava in razmerja (silhueta): telo pod obleko na novo, da je iz 10-60 m videti kot človek, ne kot skladovnica škatel.
// Zožen trup (široka ramena, ožji pas, prsni koš, boki), poševna ramena do vratu, vrat, malo večja okrogla glava (vrh ostane pri y≈0.235, da
// vsa pokrivala sedejo), zoženi udi (nadlaket debelejša od podlakti, stegno od goleni), dlani, stopala naprej. Šest- ali štiristrani prizmi
// samo tam, kjer se vidi obris; skrite ploskve (v drugih delih, podplati, stiki) izpuščene, zato je oglišč največ toliko kot prej.
// Postave (vitka, čokata, široka, drobna, z ožjim pasom in širšimi boki): samo širina in globina, nikoli zglobi ali dolžine udov.
// Barve, ki jih prizor zahteva (majica, hlače, jopič, pokrivalo), ostanejo; naključne izbire v istem vrstnem redu kot person0 (isti prizori).
// Gledalci (instancirani): ista razmerja v 168 ogliščih (ramena, ožji vrat, okroglejša glava, dve nogi). Samo za slike (tools/ljudje/videz).
(function () {
  // ---- the build types: multipliers of widths and depths only (sw shoulders, ww waist, hw hips, cd chest depth, bd belly depth, lt legs, ar arms)
  const BUILDS = {
    avg:    { sw: 1.00, ww: 1.00, hw: 1.00, cd: 1.00, bd: 1.00, lt: 1.00, ar: 1.00, th: 1.00 },
    slim:   { sw: 0.94, ww: 0.86, hw: 0.94, cd: 0.90, bd: 0.86, lt: 0.88, ar: 0.88, th: 0.92 },
    stocky: { sw: 1.05, ww: 1.20, hw: 1.10, cd: 1.10, bd: 1.34, lt: 1.10, ar: 1.08, th: 1.10 },
    broad:  { sw: 1.13, ww: 1.02, hw: 1.00, cd: 1.10, bd: 1.00, lt: 1.06, ar: 1.12, th: 1.04 },
    small:  { sw: 0.90, ww: 0.90, hw: 0.92, cd: 0.92, bd: 0.92, lt: 0.90, ar: 0.90, th: 0.92 },
    curvy:  { sw: 0.90, ww: 0.82, hw: 1.18, cd: 1.08, bd: 0.92, lt: 0.95, ar: 0.86, th: 1.12 },
    kid:    { sw: 0.96, ww: 1.08, hw: 1.00, cd: 1.12, bd: 1.24, lt: 1.14, ar: 1.14, th: 1.10 },
  };
  const hash = (n) => { let h = n | 0; h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

  window.LJV = {
    people(K) {
      const { THREE, pick, SKIN, HAIR, SHIRT, PANTS, HATX } = K;
      let NB = 0;   // (a running count: the build type from a hash, not from the scene's random numbers, so every scene stays as it was)

      // ---- triangles by colour, each turned away from its inside point; group(): one mesh per colour (baked into the joint like any part)
      function Tri() {
        const T = new Map();
        const tri = (col, a, b, c, ins) => {
          if (col == null) return;
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          if (nx * nx + ny * ny + nz * nz < 1e-14) return;
          const mx = (a[0] + b[0] + c[0]) / 3 - ins[0], my = (a[1] + b[1] + c[1]) / 3 - ins[1], mz = (a[2] + b[2] + c[2]) / 3 - ins[2];
          let L = T.get(col); if (!L) T.set(col, L = []);
          if (nx * mx + ny * my + nz * mz >= 0) L.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
          else L.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
        };
        return {
          tri,
          quad(col, a, b, c, d, ins) { tri(col, a, b, c, ins); tri(col, a, c, d, ins); },
          to(parent) {
            for (const [col, L] of T) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); parent.add(new THREE.Mesh(g, K.M(col))); }
            T.clear(); return parent;
          },
        };
      }
      // a ring's points, counter-clockwise from the left (+x): n 6 a hexagon with flat front and back (a: how wide they are), n 4 a rectangle
      // sides (j: from point j to j+1) n 6: 0 front-left, 1 front, 2 front-right, 3 back-right, 4 back, 5 back-left; n 4: 0 front, 1 right, 2 back, 3 left
      function ring(r, n) {
        const y = r.y, w = r.w, d = r.d, cx = r.x || 0, cz = r.z || 0;
        if (n === 4) { const wb = r.wb != null ? r.wb : w; return [[cx + w, y, cz + d], [cx - w, y, cz + d], [cx - wb, y, cz - d], [cx + wb, y, cz - d]]; }
        const a = r.a != null ? r.a : 0.6, db = r.db != null ? r.db : d;
        return [[cx + w, y, cz], [cx + a * w, y, cz + d], [cx - a * w, y, cz + d], [cx - w, y, cz], [cx - a * w, y, cz - db], [cx + a * w, y, cz - db]];
      }
      // bands between rings (col(band, side) -> colour or null: left out), o.apex [x, y, z] + o.apexCol(side): a fan up from the last ring,
      // o.cap: a flat lid on the last ring (colour), o.chin [x, y, z] + o.chinCol(side): a fan down from the first ring
      function loft(B, rings, n, col, o) {
        o = o || {};
        const R = rings.map(r => ring(r, n)), C = rings.map(r => [r.x || 0, r.y, r.z || 0]);
        for (let b = 0; b + 1 < R.length; b++) {
          const ins = [(C[b][0] + C[b + 1][0]) / 2, (C[b][1] + C[b + 1][1]) / 2, (C[b][2] + C[b + 1][2]) / 2];
          for (let j = 0; j < n; j++) { const c = col(b, j); if (c != null) B.quad(c, R[b][j], R[b][(j + 1) % n], R[b + 1][(j + 1) % n], R[b + 1][j], ins); }
        }
        const L = R[R.length - 1], cl = C[C.length - 1];
        if (o.apex) for (let j = 0; j < n; j++) B.tri(o.apexCol(j), L[j], L[(j + 1) % n], o.apex, cl);
        if (o.cap != null) for (let j = 1; j + 1 < n; j++) B.tri(o.cap, L[0], L[j], L[j + 1], [cl[0], cl[1] - 0.05, cl[2]]);
        if (o.chin) for (let j = 0; j < n; j++) B.tri(o.chinCol(j), R[0][j], R[0][(j + 1) % n], o.chin, C[0]);
        return B;
      }
      // a band from a six-sided ring (below) to a four-sided one (above): ten triangles (the shoulders' slope up to the neck)
      function band64(B, r6, r4, col) {
        const S = ring(r6, 6), Nq = ring(r4, 4), ins = [((r6.x || 0) + (r4.x || 0)) / 2, (r6.y + r4.y) / 2, ((r6.z || 0) + (r4.z || 0)) / 2];
        const [L, FL, FR, R, BR, BL] = S, [nFL, nFR, nBR, nBL] = Nq;
        B.quad(col, FL, FR, nFR, nFL, ins); B.quad(col, BR, BL, nBL, nBR, ins);
        B.tri(col, FR, R, nFR, ins); B.tri(col, R, nBR, nFR, ins); B.tri(col, R, BR, nBR, ins);
        B.tri(col, BL, L, nBL, ins); B.tri(col, L, nFL, nBL, ins); B.tri(col, L, FL, nFL, ins);
        return B;
      }
      const all = (c) => () => c;
      const COVER = new Set(['cap', 'beanie', 'helmet', 'hard', 'fire', 'scarf', 'veil']);   // (hats that hide the head's crown: no crown under them)
      const BACK6 = (j) => j >= 3, SIDE6 = (j) => j === 0 || j === 2;

      function person(o) {
        o = o || {};
        // the colours: the same random choices in the same order as person0 (the scene's numbers stay as they were)
        const skin = o.skin != null ? o.skin : pick(SKIN), shirt = o.shirt != null ? o.shirt : pick(SHIRT), pants = o.pants != null ? o.pants : pick(PANTS);
        const hair = o.hairCol != null ? o.hairCol : pick(HAIR), shoes = o.shoes != null ? o.shoes : 0x24262b, long = !!o.long, hands = o.gloves != null ? o.gloves : skin;
        const root = new THREE.Group(), P = { root, o, sh: [], el: [], hand: [], hp: [], kn: [] }, lite = !!o.lite, kid = !!o.kid;
        P.sc = (o.scale || 0.97) * (kid ? 0.62 : 1);
        const hips = P.hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips);
        const torso = P.torso = new THREE.Group(); torso.position.y = 0.06; hips.add(torso);
        const head = P.head = new THREE.Group(); head.position.y = 0.56; torso.add(head);
        const hs = o.hat ? null : (o.hair || pick(['short', 'short', 'short', 'long', 'bald', 'pony']));
        const hc = o.hatCol != null ? o.hatCol : pick(SHIRT);
        // the build: kids their own; long hair or a ponytail a narrower waist and wider hips; the others by a hash
        const u = hash(++NB * 7919 + (shirt & 0xffff) * 31 + (pants & 0xfff) * 7 + (skin & 0xff));
        const bt = kid ? 'kid' : (hs === 'long' || hs === 'pony') ? (u < 0.8 ? 'curvy' : 'slim')
          : u < 0.32 ? 'avg' : u < 0.52 ? 'slim' : u < 0.67 ? 'stocky' : u < 0.84 ? 'broad' : u < 0.94 ? 'small' : 'curvy';
        const Bd = BUILDS[bt]; P.build = bt;
        const B = Tri();

        // ---- the hips (hips frame): a six-sided band from inside the torso out to the hips' width (its bottom between the thighs); lite: none (as before)
        if (!lite) loft(B, [{ y: -0.085, w: 0.165 * Bd.hw, d: 0.103 * Math.max(Bd.bd, 0.95), z: 0.0 }, { y: 0.075, w: 0.128 * Bd.ww, d: 0.085 * Bd.bd, z: 0.004 }], 6, all(pants)).to(hips);

        // ---- the torso (torso frame): from the waist out to the shoulders' line (chest in front: its depth), up the slope of the shoulders to the
        // neck's base (six sides to four), the neck (skin; lite: a collar in the shirt's colour up into the head)
        const W = { y: lite ? -0.09 : -0.035, w: 0.148 * Bd.ww, d: 0.098 * Bd.bd, z: 0.008 };
        const S = { y: 0.445, w: 0.214 * Bd.sw, d: 0.112 * Bd.cd, db: 0.1 * Math.max(1, Bd.cd * 0.96), z: 0.0, a: 0.56 };
        const N = { y: 0.54, w: 0.058, d: 0.056, z: -0.012 }, Nt = { y: 0.625, w: 0.05, d: 0.05, z: -0.006 };
        const vest = o.vest != null;
        loft(B, [W, S], 6, all(vest ? o.vest : shirt));   // (a vest: this band in its colour, the shirt on the shoulders and the sleeves)
        if (lite) band64(B, S, { y: 0.6, w: 0.052, d: 0.05, z: -0.01 }, shirt).to(torso);
        else {
          band64(B, S, N, shirt); loft(B, [N, Nt], 4, all(skin)).to(torso);
          if (vest) for (const y of [0.13, 0.27]) {   // the reflective bands round the vest
            const f = (y - W.y) / (S.y - W.y), lerp = (k) => W[k] + (S[k] - W[k]) * f;
            const rr = (dy) => ({ y: y + dy, w: lerp('w') * 1.03 + 0.005, d: lerp('d') * 1.04 + 0.005, db: (W.d + (S.db - W.d) * f) * 1.04 + 0.005, z: lerp('z'), a: 0.6 - 0.04 * f });
            loft(B, [rr(-0.02), rr(0.02)], 6, all(o.stripes != null ? o.stripes : 0xd9dde2)).to(torso);
          }
          if (o.belt) { const rr = (y, k) => ({ y, w: W.w * k + 0.004, d: W.d * k + 0.004, z: W.z }); loft(B, [rr(-0.04, 1.06), rr(0.02, 1.07)], 6, all(o.belt)).to(torso); }
        }

        // ---- the head (head frame): a jaw fan, the skull's band, a crown fan; hair on the top and at the back (long: also round the face)
        { if (kid) head.scale.setScalar(1.26);
          const nw = o.hat === 'scarf' ? 0.93 : 1;   // (the scarf's sides hug the head)
          const capLite = lite && o.hat === 'cap', cover = !capLite && COVER.has(o.hat), capY = cover && o.hat === 'cap' ? 0.218 : 0.19;   // (under a cap: up to its rim)
          const Hb = { y: lite ? 0.03 : 0.085, w: 0.103 * nw, d: 0.113, z: 0.004, a: 0.58 }, Hc = { y: capY, w: (capY > 0.2 ? 0.096 : 0.1) * nw, d: capY > 0.2 ? 0.106 : 0.11, db: capY > 0.2 ? 0.106 : 0.112, z: -0.006, a: 0.6 };
          const hcol = hs && hs !== 'bald' ? hair : skin;
          const band = (b, j) => hs === 'long' && (BACK6(j) || SIDE6(j)) ? hcol : BACK6(j) ? hcol : skin;
          loft(B, [Hb, Hc], 6, band, { apex: cover ? null : [0, 0.248, -0.012], apexCol: () => capLite ? hc : hcol, chin: lite ? null : [0, -0.03, 0.035], chinCol: (j) => BACK6(j) ? null : skin }).to(head);   // (the jaw; its back half is under the skull, over the neck)
          if (hs === 'long' && !lite) {   // hair down the back to the shoulders
            loft(B, [{ y: -0.13, w: 0.105, d: 0.03, z: -0.098 }, { y: 0.17, w: 0.094, d: 0.035, z: -0.082 }], 4, (b, j) => j === 0 ? null : hair).to(head);
          }
          if (hs === 'pony' && !lite) {   // a ponytail
            loft(B, [{ y: -0.02, w: 0.026, d: 0.026, z: -0.158 }, { y: 0.155, w: 0.036, d: 0.036, z: -0.076 }], 4, all(hair)).to(head);   // (its top inside the skull)
          }
          if (capLite) {   // (the stands' cap: the crown is the head's top in the cap's colour, a peak in front)
            B.quad(hc, [0.085, 0.2, 0.09], [-0.085, 0.2, 0.09], [-0.075, 0.19, 0.2], [0.075, 0.19, 0.2], [0, 0.1, 0.1]);
            B.to(head);
          } else if (o.hat === 'cap') { head.add(K.box(0.205, 0.07, 0.22, hc, 0, 0.25, -0.005));   // (the cap as before; its peak without the face inside the crown)
            const v = (x, y, z) => [x, y, z], ins = [0, 0.2, 0.15];
            B.quad(hc, v(0.085, 0.235, 0.1), v(-0.085, 0.235, 0.1), v(-0.085, 0.235, 0.215), v(0.085, 0.235, 0.215), ins); B.quad(hc, v(0.085, 0.215, 0.215), v(-0.085, 0.215, 0.215), v(-0.085, 0.235, 0.215), v(0.085, 0.235, 0.215), ins);
            B.quad(hc, v(0.085, 0.215, 0.1), v(0.085, 0.215, 0.215), v(0.085, 0.235, 0.215), v(0.085, 0.235, 0.1), ins); B.quad(hc, v(-0.085, 0.215, 0.1), v(-0.085, 0.215, 0.215), v(-0.085, 0.235, 0.215), v(-0.085, 0.235, 0.1), ins);
            B.to(head); }
          else if (o.hat === 'beanie') head.add(K.box(0.21, 0.11, 0.225, hc, 0, 0.225, -0.005));
          else if (o.hat === 'helmet' || o.hat === 'hard' || o.hat === 'fire') { head.add(K.sph(0.14, 6, 3, hc, 0, 0.16, 0, { half: true, s: [1, 0.85, 1.08] }));
            if (o.hat !== 'helmet') head.add(K.cyl(o.hat === 'fire' ? 0.2 : 0.165, o.hat === 'fire' ? 0.2 : 0.165, 0.02, 8, hc, 0, 0.165, o.hat === 'fire' ? -0.02 : 0.02));
            if (o.hat === 'fire') head.add(K.box(0.2, 0.06, 0.02, 0xd9dde2, 0, 0.21, 0.13)); }
          else if (o.hat === 'police') { head.add(K.cyl(0.125, 0.115, 0.08, 8, hc, 0, 0.255, 0)); head.add(K.cyl(0.135, 0.135, 0.02, 8, hc, 0, 0.3, 0)); head.add(K.box(0.17, 0.02, 0.1, 0x111111, 0, 0.22, 0.14)); }
          else if (HATX[o.hat]) head.add(HATX[o.hat](hc, o));
        }

        // ---- the arms: a rounded shoulder (deltoid), the upper arm thicker than the forearm, a hand
        const ar = Bd.ar;
        for (const sd of [1, -1]) {
          const sh = new THREE.Group(); sh.position.set(sd * 0.245, 0.45, 0); torso.add(sh); sh.rotation.order = 'ZXY';
          const Rd = { y: -0.03, w: 0.062 * ar, d: 0.064 * ar, x: sd * 0.004 }, Re = { y: -0.295, w: 0.045 * ar, d: 0.047 * ar };
          const top = lite ? { cap: long ? shirt : skin } : { apex: [sd * 0.006, 0.022, 0], apexCol: () => shirt };   // (rings from the bottom up: the fan on the last; lite: a flat lid)
          if (long) loft(B, [Re, Rd], 4, all(shirt), top);
          else if (lite) loft(B, [Re, Rd], 4, all(skin), top);
          else { const Rs = { y: -0.135, w: 0.06 * ar, d: 0.062 * ar }; loft(B, [Rs, Rd], 4, all(shirt), top);
            loft(B, [Re, { y: -0.135, w: 0.05 * ar, d: 0.052 * ar }], 4, all(skin)); }
          B.to(sh);
          const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
          loft(B, [{ y: -0.238, w: 0.034 * ar, d: 0.031 * ar }, { y: 0.03, w: 0.047 * ar, d: 0.048 * ar }], 4, all(long ? shirt : skin));
          if (!lite) {   // the hand; its fingers' end a lid tilted a little (a face looking straight down is dropped at the bake: seen when the arm is up)
            const Rf = [[0.041, -0.315, 0.031], [-0.041, -0.315, 0.031], [-0.041, -0.335, -0.023], [0.041, -0.335, -0.023]], Rw = ring({ y: -0.226, w: 0.034, d: 0.028 }, 4), ins = [0, -0.28, 0.004];
            for (let j = 0; j < 4; j++) B.quad(hands, Rf[j], Rf[(j + 1) % 4], Rw[(j + 1) % 4], Rw[j], ins);
            B.quad(hands, Rf[0], Rf[1], Rf[2], Rf[3], ins);
          }
          B.to(el);
          const hd = new THREE.Group(); hd.position.y = -0.3; el.add(hd);
          P.sh.push(sh); P.el.push(el); P.hand.push(hd);
        }

        // ---- the legs: the thigh (wide at the hip, narrow at the knee), the shin, a shoe forwards
        const lt = Bd.lt, th = Bd.th;
        for (const sd of [1, -1]) {
          const hp = new THREE.Group(); hp.position.set(sd * 0.09, -0.05, 0); hips.add(hp);
          loft(B, [{ y: -0.435, w: 0.058 * lt, d: 0.063 * lt, z: 0.004 }, { y: 0.045, w: 0.086 * th, d: 0.094 * th, z: 0.008, x: sd * 0.006 * (th - 1) * 5 }], 4, all(pants)).to(hp);
          const kn = new THREE.Group(); kn.position.y = -0.41; hp.add(kn);
          loft(B, [{ y: lite ? -0.44 : -0.4, w: 0.04 * lt, d: 0.044 * lt }, { y: 0.035, w: 0.056 * lt, d: 0.06 * lt, z: 0.002 }], 4, all(o.shorts ? skin : pants));
          if (!lite) {   // the shoe: heel up to the ankle, the toe low and forwards; no sole (no one sees it)
            const y0 = -0.46, hw = 0.052 * Math.min(1.1, lt), tw = 0.046 * Math.min(1.1, lt), zh = -0.078, zt = 0.19;
            const p = { hb: [hw, y0, zh], hB: [-hw, y0, zh], ht: [hw, -0.365, zh], hT: [-hw, -0.365, zh], tb: [tw, y0, zt], tB: [-tw, y0, zt], tt: [tw * 0.9, -0.415, zt], tT: [-tw * 0.9, -0.415, zt] };
            const ins = [0, -0.42, 0.05];
            B.quad(shoes, p.ht, p.hT, p.tT, p.tt, ins); B.quad(shoes, p.hb, p.ht, p.tt, p.tb, ins); B.quad(shoes, p.hB, p.hT, p.tT, p.tB, ins);
            B.quad(shoes, p.tb, p.tt, p.tT, p.tB, ins); B.quad(shoes, p.hb, p.ht, p.hT, p.hB, ins);
          }
          B.to(kn);
          P.hp.push(hp); P.kn.push(kn);
        }
        return P;
      }
      return { person };
    },

    // ---- the instanced spectator: the same proportions in 165 index vertices (was 168): the flag pole and its cloth as they were
    crowd(K) {
      const { THREE } = K;
      return {
        geo() {
          const P = [], Nm = [], Cl = [], Pa = [], Ix = [], W1 = [1, 1, 1];
          const poly = (pts, ins, part, col) => {   // a flat convex polygon (fan), facing away from ins
            const a = pts[0], b = pts[1], c = pts[2];
            const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
            let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
            let cx = 0, cy = 0, cz = 0; for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2]; } cx /= pts.length; cy /= pts.length; cz /= pts.length;
            const flip = nx * (cx - ins[0]) + ny * (cy - ins[1]) + nz * (cz - ins[2]) < 0, s = flip ? -1 : 1, k = P.length / 3;
            const L = flip ? [pts[0]].concat(pts.slice(1).reverse()) : pts;
            for (const p of L) { P.push(p[0], p[1], p[2]); Nm.push(nx * s, ny * s, nz * s); Cl.push(col[0], col[1], col[2]); Pa.push(part); }
            for (let i = 1; i + 1 < L.length; i++) Ix.push(k, k + i, k + i + 1);
          };
          const quad = (a, b, c, d, ins, part, col) => poly([a, b, c, d], ins, part, col);
          // legs (bone 3, trousers): the front in one piece with a gap between the legs up to the crotch, the outer sides, one dark sole
          { const zf = (y) => 0.098 + 0.03 * (1 - y / 0.86), zb = (y) => -0.094 + 0.024 * (1 - y / 0.86), xo = (y) => 0.125 + 0.042 * y / 0.86;
            const A = [-xo(0), 0, zf(0)], Bq = [-0.03, 0, zf(0)], Cq = [0, 0.4, zf(0.4)], D = [0.03, 0, zf(0)], E = [xo(0), 0, zf(0)], F = [xo(0.86), 0.86, zf(0.86)], G = [-xo(0.86), 0.86, zf(0.86)];
            const ins = [0, 0.43, 0];
            // (the front as a fan from the crotch: five triangles)
            for (const [p, q] of [[Bq, A], [A, G], [G, F], [F, E], [E, D]]) poly([Cq, p, q], [Cq[0], 0.43, 0], 33, W1);
            quad(A, G, [-xo(0.86), 0.86, zb(0.86)], [-xo(0), 0, zb(0)], ins, 33, W1); quad(E, F, [xo(0.86), 0.86, zb(0.86)], [xo(0), 0, zb(0)], ins, 33, W1);
            quad(A, E, [xo(0), 0, zb(0)], [-xo(0), 0, zb(0)], [0, 0.3, 0], 30, [0.12, 0.1, 0.09]); }   // (dark soles, seen when sitting)
          // torso (bone 0, shirt): from the hips to broad shoulders, sloping up to the neck (a low pyramid, its top inside the head)
          { const w0 = [0.163, 0.8, 0.1, -0.098], w1 = [0.275, 1.355, 0.118, -0.108];
            const r = (w) => [[w[0], w[1], w[2]], [-w[0], w[1], w[2]], [-w[0], w[1], w[3]], [w[0], w[1], w[3]]], R0 = r(w0), R1 = r(w1), ins = [0, 1.1, 0];
            for (let j = 0; j < 4; j++) quad(R0[j], R0[(j + 1) % 4], R1[(j + 1) % 4], R1[j], ins, 1, W1);
            const ap = [0, 1.505, -0.004]; for (let j = 0; j < 4; j++) poly([R1[j], R1[(j + 1) % 4], ap], [0, 1.3, 0], 1, W1); }
          // head (bone 0): narrower at the jaw, wider at the crown, a low pyramid on top; the face and sides skin, the back and the top hair (or a cap)
          { const r = (y, w, d, z) => [[w, y, z + d], [-w, y, z + d], [-w, y, z - d], [w, y, z - d]];
            const R0 = r(1.445, 0.072, 0.082, 0.012), R1 = r(1.645, 0.114, 0.124, -0.004), ins = [0, 1.55, 0];
            for (let j = 0; j < 4; j++) quad(R0[j], R0[(j + 1) % 4], R1[(j + 1) % 4], R1[j], ins, j === 2 ? 4 : 2, W1);
            const ap = [0, 1.738, -0.012]; for (let j = 0; j < 4; j++) poly([R1[j], R1[(j + 1) % 4], ap], [0, 1.6, 0], 4, W1); }
          // arms (bone 1 at x<0, bone 2 at x>0; the sleeve): three-sided, thick at the shoulder (a lid on top), thin at the hand; the top a scaled copy
          // of the bottom, so every side is flat (the hand's end open: it looks down unless the arm is up)
          for (const sd of [-1, 1]) { const b = sd < 0 ? 10 : 20, X = (x) => sd * x, cz = -0.004;
            const tri3 = (y, k) => [[X(0.27 - 0.026 * k), y, cz + 0.036 * k], [X(0.27 + 0.026 * k), y, cz + 0.036 * k], [X(0.27), y, cz - 0.042 * k]];
            const [FIb, FOb, Bb] = tri3(0.83, 1), [FIt, FOt, Bt] = tri3(1.372, 1.75), ins = [X(0.27), 1.1, cz];
            quad(FIb, FOb, FOt, FIt, ins, b + 5, W1); quad(FOb, Bb, Bt, FOt, ins, b + 5, W1); quad(Bb, FIb, FIt, Bt, ins, b + 5, W1);
            poly([FIt, FOt, Bt], [X(0.27), 1.2, cz], b + 5, W1); }
          // the flag pole and its cloth, as in js/world.js
          { const quad0 = (a, b, c, d, ins, part, col) => {
              const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
              let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
              const flip = nx * ((a[0] + c[0]) / 2 - ins[0]) + ny * ((a[1] + c[1]) / 2 - ins[1]) + nz * ((a[2] + c[2]) / 2 - ins[2]) < 0, s = flip ? -1 : 1, k = P.length / 3;
              for (const p of flip ? [a, d, c, b] : [a, b, c, d]) { P.push(p[0], p[1], p[2]); Nm.push(nx * s, ny * s, nz * s); Cl.push(col[0], col[1], col[2]); Pa.push(part); }
              Ix.push(k, k + 1, k + 2, k, k + 2, k + 3);
            };
            quad0([0.26, 0.82, 0.09], [0.3, 0.82, 0.09], [0.3, -0.68, 0.09], [0.26, -0.68, 0.09], [0.28, 0, 0], 40, [0.84, 0.84, 0.86]);
            for (const [y0, y1, cg] of [[-0.955, -0.68, 56], [-1.23, -0.955, 57]]) quad0([0.3, y1, 0.09], [1.2, y1, 0.09], [1.2, y0, 0.09], [0.3, y0, 0.09], [0.75, y0, 0], cg, W1); }
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nm, 3));
          g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(Pa, 1)); g.setIndex(Ix);
          g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), 2.4);
          return g;
        },
      };
    },
  };
})();
