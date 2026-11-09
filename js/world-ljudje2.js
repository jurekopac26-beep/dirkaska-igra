/* =========================================================================
   PEOPLE ALONG THE TRACKS, ROUND TWO — more scene types on World.people's kit (js/world-ljudje.js, World.peopleKit), each with its places on the
   real tracks (World.peopleSites). The user, 3. 11. 2026: »naredi še 12 novih različnih ljudi, ki se na različne načine družijo in čakajo na
   tekmovalce«; »na dirkališčih naj bo čim manj ljudi okoli proge, tam naj bo več zaposlenih s svojimi orodji, vozili itd.: reševalci,
   gasilci, sodniki, fotografi, delavci, kamermani, živali«. A scene type: S.<name> = { seed, clear: [[a, b, r]], build(C, F, K) } (the frame
   F: a along the track, + ahead; b from the barrier away from the road); its places: site(trackId, [[name, metres after the start line, side
   (+1 right, -1 left, 'room')], ...]). Test tracks get nothing (World.people does not run on them).
   ========================================================================= */
(function () {
  'use strict';
  const K = World.peopleKit; if (!K) return;
  const { S, L, ITEMX, POSEX, MOTION, RATE, SITES, rnd, pick, box, cyl, sph, grp, bar, pal } = K;
  const site = (id, list) => { (SITES[id] || (SITES[id] = [])).push(...list); };

  // (the scenes of round two follow)

  /* 1 · Igra kart pod senčnikom (Mount Hotham, Great Alpine Road): four friends at a folding card table under a garden parasol; three sit and
     play (a fan of cards in the hand; the dealer, a green visor on, shuffles), the fourth stands behind one of them, bent over his shoulder to
     see his cards, a can in his hand; a cooler, the spare chair (his jacket on it), their car and their flag behind. As the car comes the two
     players and the one watching run to the fence and cheer (the cards still in hand); the dealer stays at the table, shuffling, and only
     looks up at it */
  {
    const TAU = Math.PI * 2, PI2 = Math.PI / 2;
    // a fan of five cards in the hand (the hand's frame: the fingers -y, the palm in, forwards +z): round the thumb, their faces to the player
    ITEMX.karte_cards = () => { const g = grp();
      for (let k = 0; k < 5; k++) { const f = (k - 2) * 0.26; g.add(box(0.064, 0.09, 0.004, k === 3 ? 0xd8262a : 0xf4f4f0, Math.sin(f) * 0.05, -0.03 - Math.cos(f) * 0.05, 0.035 + k * 0.004, { rz: f })); }
      return g; };
    // half the deck in each hand (o.s: towards the other hand), flat
    ITEMX.karte_deck = (o) => grp(box(0.068, 0.095, 0.028, 0xf4f4f0, (o.s || 0) * 0.035, -0.06, 0.035));
    // seated (as 'sit'), the left hand holds the fan up before the chest; the right now at the fan, now laying a card on the table (u: 1 laid)
    POSEX.karte_hand = (t) => { const u = Math.pow(Math.max(0, Math.sin(t)), 3);
      return { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: 0.1 + 0.14 * u, nod: 0.3, shz: [0.15, 0.12], shx: [0.35, 0.45 + 0.65 * u], el: [1.9, 1.75 - 1.15 * u], shy: [-0.3, -0.5 + 0.3 * u] }; };
    // seated, the fan in the left hand, the chin on the right fist: thinking it over
    POSEX.karte_think = (t, s) => ({ hy: 0.5, hp: [1.45, 1.5], kn: [1.4, 1.5], lean: 0.2, nod: 0.15 + 0.05 * s, look: 0.12 * s, shz: [0.15, 0.05], shx: [0.35, 0.55], el: [1.9, 2.65], shy: [-0.3, -0.7] });
    // the dealer: seated, the two halves of the deck before him over the table, riffled together and apart
    POSEX.karte_shuffle = (t, s) => { const c = Math.cos(t * 2);
      return { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: 0.18, nod: 0.35, shz: [0.2 + 0.05 * s, 0.2 + 0.05 * s], shx: [0.85, 0.85], el: [1.05 + 0.1 * c, 1.05 + 0.1 * c], shy: [-0.5 + 0.15 * s, -0.5 + 0.15 * s] }; };
    // standing behind a player, bent over his shoulder to see his cards, the left hand on the hip, a can in the right; now and then up for a drink
    POSEX.karte_kibitz = (t) => { const u = Math.pow(Math.max(0, Math.sin(t)), 6), b = 1 - u;
      return { lean: 0.38 * b, hy: 0.9 + 0.02 * u, hz: -0.06 * b, nod: 0.3 * b, shz: [0.55, 0.15 + 0.05 * u], shx: [-0.15, 0.6 - 0.05 * u], el: [1.4, 1.5 + 0.75 * u], shy: [0.6, -0.2] }; };
    Object.assign(MOTION, { karte_hand: { rate: 0.9 }, karte_think: { rate: 0.6 }, karte_shuffle: { rate: 4.5 }, karte_kibitz: { rate: 0.55 } });
    RATE.karte_shuffle = 4.5;   // (at the fence too: the dealer goes on shuffling)

    const MAT = new Map(), lamOf = (c) => { let m = MAT.get(c); if (!m) MAT.set(c, m = new THREE.MeshLambertMaterial({ color: c })); return m; };
    const tri = (a, b, c, col) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]], 3)); return new THREE.Mesh(g, lamOf(col)); };
    // a garden parasol through the table: the pole, an eight-sided canopy in two colours (its underside a shade darker) with a valance, tilted
    // on its hinge away from the road (local +z: the road side up, the chase camera sees under it)
    const shade = (c) => (((c >> 16) & 255) * 0.72 << 16) | (((c >> 8) & 255) * 0.72 << 8) | ((c & 255) * 0.72);
    function parasol(c1, c2, tilt) {
      const R = 1.32, hg = 2.3, h0 = -0.02, h1 = 0.42, A = [0, h1, 0], top = grp(cyl(0.028, 0.028, 0.5, 4, 0xdedede, 0, 0.2, 0), cyl(0.05, 0.05, 0.08, 5, 0xdedede, 0, h1 + 0.03, 0));
      for (let k = 0; k < 8; k++) {
        const t0 = k / 8 * TAU, t1 = (k + 1) / 8 * TAU, tm = (k + 0.5) / 8 * TAU, col = k % 2 ? c2 : c1;
        const P0 = [R * Math.cos(t0), h0, R * Math.sin(t0)], P1 = [R * Math.cos(t1), h0, R * Math.sin(t1)];
        top.add(tri(A, P1, P0, col)); top.add(tri(A, P0, P1, shade(col)));   // (the canopy's top, its underside)
        const rm = R * Math.cos(Math.PI / 8); top.add(box(2 * R * Math.sin(Math.PI / 8), 0.16, 0.012, col, rm * Math.cos(tm), h0 - 0.075, rm * Math.sin(tm), { ry: -tm - PI2 }));
      }
      top.position.y = hg; top.rotation.x = -(tilt || 0);
      return grp(cyl(0.028, 0.028, hg, 4, 0xdedede, 0, hg / 2, 0), top);
    }
    // the folding card table: a green top with a dark rim, four legs; on it the deck, the cards laid down, two cans
    function cardTable(top) {
      const g = grp(box(0.9, 0.035, 0.9, top, 0, 0.738, 0), box(0.94, 0.05, 0.94, 0x2a2c31, 0, 0.705, 0));
      for (const [x, z] of [[0.4, 0.4], [-0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]]) g.add(bar([x, 0.7, z], [x * 1.06, 0, z * 1.06], 0.03, 0x2a2c31));
      g.add(box(0.07, 0.03, 0.1, 0xf4f4f0, 0.2, 0.77, 0.14, { ry: 0.3 }));
      for (const [x, z, r, c] of [[-0.14, -0.08, 0.5, 0xf4f4f0], [-0.08, -0.16, -0.4, 0xf4f4f0], [0.02, -0.13, 1.2, 0xd8262a]]) g.add(box(0.064, 0.004, 0.09, c, x, 0.758, z, { ry: r }));
      g.add(cyl(0.033, 0.033, 0.12, 6, 0xc8c9cc, 0.33, 0.816, -0.3)); g.add(cyl(0.033, 0.033, 0.12, 6, 0x2f63c9, -0.32, 0.816, 0.3));
      return g;
    }
    const CHAIR = [0xd8262a, 0x2f9a48, 0xf0c22e, 0x2f63c9, 0x15171c, 0xf07a1c], PARA = [[0xd8262a, 0xf2f2ee], [0x2f63c9, 0xf2f2ee], [0xf07a1c, 0xf2f2ee], [0x2f9a48, 0xf0c22e], [0x22848f, 0xf2f2ee]];
    const CARS = [0xb8bcc4, 0x2f3f63, 0x7c8a99, 0xd8d8d2, 0x8a2a24, 0x2f5a3a, 0x1d1f25];
    const deal = (arr, n) => { const a = arr.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };

    S.karte = { seed: 263, clear: [[0, 5, 9.5], [-3.5, 9.5, 6]],   // (the second: round their car)
      build(C, F, K) {
        const T0 = [0, 4.6], [p1, p2] = pick(PARA), ch = deal(CHAIR, 4), sh = deal(pal.SHIRT, 4);
        C.prop(cardTable(0x2e6b3a), T0[0], T0[1], [0, -1]); C.prop(parasol(p1, p2, 0.17), T0[0], T0[1], 0.2);
        C.prop(L.chair(ch[0]), -0.7, 4.6, [1, 0]); C.prop(L.chair(ch[1]), 0.7, 4.6, [-1, 0]); C.prop(L.chair(ch[2]), 0, 5.3, [0, -1]);
        const spare = L.chair(ch[3]); spare.add(box(0.5, 0.36, 0.07, pick(pal.SHIRT), 0, 0.8, -0.3, { rx: -0.18 })); C.prop(spare, 0.15, 3.85, [0.3, 1]);   // (the one standing: his jacket on his chair)
        C.prop(L.cooler(pick([0x2f63c9, 0xd8262a, 0x2f9a48, 0x22848f])), -1.35, 5.45, [1, 0.3]);
        C.prop(L.car(pick(CARS)), -3.4, 9.2, [0, 1]); C.prop(L.flagPole(K.flag, 5), 3.2, 7.4);
        // the dealer (a green visor), the two players, the one watching
        C.man({ shirt: sh[0], pants: pick(pal.PANTS), hat: 'cap', hatCol: 0x2f7a3a }, { act: { a: 0, b: 5.3, pose: 'karte_shuffle', face: [0, -1], hold: [['karte_deck', 0, { s: -1 }], ['karte_deck', 1, { s: 1 }]] },
          bliza: { look: 'car' }, run: false, fence: { a: 0, b: 5.3, pose: 'karte_shuffle', face: [0, -1], hold: [['karte_deck', 0, { s: -1 }], ['karte_deck', 1, { s: 1 }]], look: 'car' } });
        C.man({ shirt: sh[1], pants: pick(pal.PANTS), shorts: rnd() < 0.5, hair: 'short' }, { act: { a: -0.7, b: 4.6, pose: 'karte_hand', face: [1, 0], hold: [['karte_cards', 0]] },
          fence: { a: -1.7, b: 0.95, pose: 'cheer', t: 0.6, hold: [['karte_cards', 0]] }, run: { f: 0.55 } });
        C.man({ shirt: sh[2], pants: pick(pal.PANTS), hair: pick(['long', 'pony']) }, { act: { a: 0.7, b: 4.6, pose: 'karte_think', face: [-1, 0], hold: [['karte_cards', 0]] },
          fence: { a: 0.6, b: 0.85, pose: 'fenceWave', t: 0.3, hold: [['karte_cards', 0]] }, run: { f: 0.5 } });
        C.man({ shirt: sh[3], pants: pick(pal.PANTS), shorts: true, hat: rnd() < 0.5 ? 'cap' : null, hair: 'bald' }, { act: { a: 1.32, b: 4.82, pose: 'karte_kibitz', face: [-1, -0.15], hold: [['can', 1, { c: 0xd8262a }]] },
          fence: { a: 2.9, b: 1.0, pose: 'cheer', t: 1.4, hold: [['can', 1, { c: 0xd8262a }]] }, run: { f: 0.6 } });
      } };
  }

  /* 2 · Nogomet na travi (Medvode, Ouninpohja): two kids and their dads play football on the grass between two pop-up goals (the frames white
     or bright, the nets lines); one kid winds up and kicks at the ball by his feet, a dad in goalkeeper's gloves crouches in the far goal, the
     other dad defends, side-stepping, the other kid runs along; the family's dog waits for the ball. As the car comes the kids run to the
     fence first and climb on the bench the family put there (over the boards), the dog with them, the dads jog after them (one films with
     his phone); the ball stays on the grass */
  {
    const TAU = Math.PI * 2, ease = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
    // the kick (the right leg): a slow wind-up (the leg back, the knee bent), the quick kick through the ball, the follow-through, back to stand
    // (k: 0 the leg back, 1 forward); the arms out for balance, the torso leaning into it, then back
    POSEX.nogomet_kick = (t) => {
      const f = ((t / TAU) % 1 + 1) % 1, k = f < 0.6 ? 0.35 - 0.35 * ease(f / 0.6) : f < 0.72 ? ease((f - 0.6) / 0.12) : 1 - 0.65 * ease((f - 0.72) / 0.28), bk = Math.max(0, 1 - k / 0.6);
      return { hy: 0.9, hp: [0.3, -0.55 + 1.5 * k], kn: [0.45, 0.1 + 1.2 * bk * bk], hpz: [0.06, 0.04], lean: 0.18 - 0.3 * k, tw: 0.25 * (0.35 - k), nod: 0.25,
        shz: [0.55 + 0.4 * k, 0.4 + 0.2 * bk], shx: [0.25 + 0.5 * k, -0.25 - 0.35 * k], el: [0.35, 0.4] }; };
    // the goalkeeper: crouched, the legs apart, the gloved hands out low and ready, the weight from one foot to the other
    POSEX.nogomet_keeper = (t, s) => ({ hy: 0.8, hp: [0.55, 0.55], kn: [0.85, 0.85], hpz: [0.32 + 0.06 * s, 0.32 - 0.06 * s], lean: 0.38, tz: 0.06 * s, dy: 0.02 * Math.abs(s), nod: -0.2,
      shz: [0.75, 0.75], shx: [0.7, 0.7], el: [0.6, 0.6], shy: [-0.3, -0.3] });
    // the defender: a low stance facing the kicker, side-stepping, the arms a little out
    POSEX.nogomet_def = (t, s) => ({ hy: 0.86, hp: [0.35, 0.35], kn: [0.55 + 0.15 * Math.max(0, s), 0.55 + 0.15 * Math.max(0, -s)], hpz: [0.18 + 0.1 * s, 0.18 - 0.1 * s], lean: 0.3, tz: -0.05 * s, nod: -0.15,
      shz: [0.45, 0.45], shx: [0.35, 0.35], el: [0.5, 0.5] });
    Object.assign(MOTION, { nogomet_kick: { rate: 2.4 }, nogomet_keeper: { rate: 2.2 }, nogomet_def: { rate: 3.0 } });
    // a pop-up goal: the front frame (posts, crossbar), the rods sloping back to the ground, the net as lines (the back, the sides); its mouth +z
    function goal(col) {
      const W = 0.7, H = 0.88, D = 0.8, net = 0xe4e6e8, n = 0.02, g = grp();
      for (const x of [-W, W]) { g.add(bar([x, 0, 0], [x, H, 0], 0.07, col)); g.add(bar([x, H, 0], [x, 0.01, -D], 0.05, col)); g.add(bar([x, 0.01, 0], [x, 0.01, -D], 0.04, col));
        g.add(bar([x, 0.42, 0], [x, 0.42, -D * (1 - 0.42 / H)], n, net)); g.add(bar([x, 0.01, -D * 0.48], [x, H * 0.52, -D * 0.48], n, net)); }
      g.add(bar([-W, H, 0], [W, H, 0], 0.07, col)); g.add(bar([-W, 0.01, -D], [W, 0.01, -D], 0.05, col));
      for (let k = 1; k <= 4; k++) { const x = -W + k * 2 * W / 5; g.add(bar([x, H, 0], [x, 0.01, -D], n, net)); }
      for (const f of [0.33, 0.66]) g.add(bar([-W, H * (1 - f), -D * f], [W, H * (1 - f), -D * f], n, net));
      return g;
    }
    // the ball (white, three dark patches), a small marker cone, the family's blanket with a bag and the water bottles
    const ball = () => grp(sph(0.115, 8, 6, 0xf4f4f0, 0, 0.115, 0), box(0.06, 0.012, 0.06, 0x15171c, 0, 0.229, 0), box(0.012, 0.055, 0.055, 0x15171c, 0.113, 0.13, 0.02), box(0.055, 0.055, 0.012, 0x15171c, -0.03, 0.12, -0.112));
    const marker = (c) => grp(cyl(0.025, 0.15, 0.32, 6, c, 0, 0.16, 0));
    // a folding bench (a plank on two trestles) by the fence: the children stand on it to see over the boards
    const bench = (c) => grp(box(1.7, 0.045, 0.26, c, 0, 0.47, 0), ...[-0.68, 0.68].map(x => grp(bar([x, 0, -0.12], [x, 0.45, 0], 0.035, 0x5b6068), bar([x, 0, 0.12], [x, 0.45, 0], 0.035, 0x5b6068))));
    function blanket(c1, c2) { const g = grp(); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g.add(box(0.62, 0.012, 0.7, (i + j) % 2 ? c1 : c2, -0.62 + i * 0.62, 0.006, -0.35 + j * 0.7));
      g.add(box(0.42, 0.26, 0.24, 0x2a3d6b, 0.55, 0.13, 0.35)); for (const [x, c] of [[-0.3, 0x8acbe8], [-0.18, 0xd8262a]]) g.add(cyl(0.035, 0.038, 0.22, 6, c, x, 0.11, 0.42)); return g; }
    const JERSEY = [0xd8262a, 0xf0c22e, 0x22848f, 0xf07a1c, 0x2f63c9, 0x8a3b8c, 0x2f9a48, 0xefefea], GOAL = [0xf2f2ee, 0xf2f2ee, 0xf07a1c, 0xf0c22e];
    const deal = (arr, n) => { const a = arr.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };

    S.nogomet = { seed: 271, clear: [[0, 5, 9.5], [-6.5, 5, 4], [6.5, 5, 4]],   // (and round the two goals)
      build(C, F, K) {
        const gc = pick(GOAL), js = deal(JERSEY, 3), sd = F.side || 1;
        C.prop(goal(gc), -6.0, 5.0, [1, 0]); C.prop(goal(gc), 6.0, 5.0, [-1, 0]);
        C.prop(ball(), 1.72, 5.2 + 0.05 * sd, 0.7);
        for (const [a, b] of [[-6.6, 3.0], [-6.6, 7.0], [6.6, 3.0], [6.6, 7.0]]) C.prop(marker(0xf07a1c), a, b);
        C.prop(blanket(pick([0xd8262a, 0x2f63c9, 0x2f9a48]), 0xf2f0ea), -3.4, 8.7, [0, -1]); C.prop(bench(0xb08a5a), -0.6, 1.25, [0, -1]);
        const dog = L.dog(pick([0x5c3a22, 0x2a221c, 0xc8a878, 0xe8e2d4])); dog.scale.setScalar(0.78);   // (a smaller dog: with the children it looked a calf)
        C.pet(dog, { act: { a: 2.4, b: 4.25, face: [-0.8, 0.7] }, fence: { a: 1.0, b: 1.6, face: [1, -0.2] }, run: { f: 1.1 }, kid: true });
        // the kicker and the other kid (a team's jerseys), the dad in goal (gloves), the dad defending
        C.man({ kid: true, shirt: js[0], pants: 0x15171c, shorts: true, shoes: 0xf2f2ee }, { act: { a: 1.4, b: 5.2, pose: 'nogomet_kick', face: [1, -0.04] },
          fence: { a: -0.05, b: 1.25, y: 0.49, pose: 'jump' }, run: { f: 0.9 }, kid: true });   // (on the bench)
        C.man({ kid: true, shirt: js[0], pants: 0x15171c, shorts: true, hair: 'pony', scale: 1.08 }, { act: { a: -1.6, b: 5.7, pose: 'walk', face: [1, 0.15] },
          fence: { a: -1.1, b: 1.25, y: 0.49, pose: 'cheer', t: 0.7 }, run: { f: 0.85 }, kid: true });
        C.man({ shirt: js[1], pants: 0x262a33, long: true, gloves: 0x15171c, hat: rnd() < 0.5 ? 'cap' : null, hatCol: 0x15171c }, { act: { a: 5.55, b: 5.0, pose: 'nogomet_keeper', face: [-1, 0.03] },
          fence: { a: 4.5, b: 1.05, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.1, hold: [] } });
        C.man({ shirt: js[2], pants: pick(pal.PANTS), shorts: true, hair: pick(['short', 'bald']) }, { act: { a: 3.0, b: 4.9, pose: 'nogomet_def', face: [-1, 0.1] },
          fence: { a: 2.6, b: 1.0, pose: 'wave', t: 0.4 }, run: { f: 0.15 } });
      } };
  }

  /* 1 · Kitara in ples (Rio do Rastro, Mauna Kea): five friends on the grass behind the fence; one sits on a cooler playing a
     guitar, two dance, two clap to it (one standing, one on the blanket); a boombox on a crate, a string of lights between two poles. As the car
     comes the dancers and the clappers run to the fence; the guitarist plays on and only looks up at it */
  const glasbaDrop = (hp, kn) => 0.41 * Math.cos(hp) + 0.46 * Math.cos(hp - kn);   // (the foot's drop under the hip: thigh 0.41, shin and shoe 0.46)
  const glasbaFeet = (J) => { J.hy = 0.05 + Math.max(glasbaDrop(J.hp[0], J.kn[0]), glasbaDrop(J.hp[1], J.kn[1])); return J; };   // (the straighter leg's foot on the ground)
  // the guitarist's arms (sitting): the left hand on the neck, the right forearm over the body's rim, its hand at the strings (strums: el)
  const glasbaL = { shz: 0.34, shx: 0.41, shy: 0.36, el: 1.42 }, glasbaR = { shz: 0.68, shx: 0.99, shy: -1.41, el: 1.45 }, glasbaSit = { hy: 0.5, hp: 1.5, kn: 1.5, lean: -0.08 };
  const glasbaPlay = (s, nod, look) => ({ hy: glasbaSit.hy, hp: [glasbaSit.hp, glasbaSit.hp], kn: [glasbaSit.kn, glasbaSit.kn + 0.06 * Math.max(0, s)], lean: glasbaSit.lean, shz: [glasbaL.shz, glasbaR.shz], shx: [glasbaL.shx, glasbaR.shx + 0.05 * s],
    shy: [glasbaL.shy, glasbaR.shy], el: [glasbaL.el, glasbaR.el + 0.22 * s], nod, look });
  POSEX.glasba_kitara = (t, s) => glasbaPlay(s, 0.3 + 0.05 * Math.sin(2 * t), 0.3);   // (looking down at the neck, nodding to the beat)
  POSEX.glasba_kitaraGor = (t, s) => glasbaPlay(s, -0.08, 0);   // (head up: the car)
  MOTION.glasba_kitara = { rate: 7.0 }; RATE.glasba_kitara = 7.0; RATE.glasba_kitaraGor = 7.0;
  // the guitar on the left hand: built as it lies in the lap (origin the lower bout's middle, x along the neck, z out of the top), then moved
  // into the hand's frame of glasba_kitara's left arm (as person() builds the arm: the shoulder 0.245 out and 0.45 up the torso, the torso 0.06
  // over the hips, the elbow 0.29 and the hand 0.3 down the arm)
  let glasbaInLap = null;
  const glasbaLap = () => {
    if (glasbaInLap) return glasbaInLap;
    const X = new THREE.Vector3(0.9, 0.35, 0.3).normalize(), Z0 = new THREE.Vector3(0, 0.25, 1);
    const Z = Z0.clone().sub(X.clone().multiplyScalar(Z0.dot(X))).normalize(), Y = new THREE.Vector3().crossVectors(Z, X);
    const G = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(-0.17, 0.7, 0.19);   // (the guitar in the sitting figure's frame: on its right thigh)
    const torso = new THREE.Object3D(); torso.position.y = glasbaSit.hy + 0.06; torso.rotation.x = glasbaSit.lean;
    const sh = new THREE.Object3D(); sh.position.set(0.245, 0.45, 0); sh.rotation.order = 'ZXY'; sh.rotation.set(-glasbaL.shx, glasbaL.shy, glasbaL.shz); torso.add(sh);
    const el = new THREE.Object3D(); el.position.y = -0.29; el.rotation.x = -glasbaL.el; sh.add(el);
    const hd = new THREE.Object3D(); hd.position.y = -0.3; el.add(hd); torso.updateMatrixWorld(true);
    return (glasbaInLap = hd.matrixWorld.clone().invert().multiply(G));
  };
  ITEMX.glasba_kitara = () => {
    const wood = 0x7a3e18, top = 0xe9a548, g = grp(
      cyl(0.19, 0.19, 0.1, 10, wood, 0, 0, 0, { rx: Math.PI / 2 }), cyl(0.15, 0.15, 0.1, 10, wood, 0.25, 0, 0, { rx: Math.PI / 2 }), box(0.14, 0.24, 0.1, wood, 0.13, 0, 0),
      cyl(0.18, 0.18, 0.012, 10, top, 0, 0, 0.052, { rx: Math.PI / 2 }), cyl(0.14, 0.14, 0.012, 10, top, 0.25, 0, 0.052, { rx: Math.PI / 2 }), box(0.14, 0.22, 0.012, top, 0.13, 0, 0.052),
      cyl(0.055, 0.055, 0.014, 8, 0x2a1a10, 0.2, 0, 0.056, { rx: Math.PI / 2 }), box(0.035, 0.13, 0.016, 0x2a1a10, -0.07, 0, 0.058),
      box(0.47, 0.055, 0.04, 0x3a2212, 0.6, 0, 0.03), box(0.17, 0.085, 0.03, 0x2a1a10, 0.91, 0, 0.022));
    g.scale.setScalar(1.1); g.applyMatrix4(glasbaLap()); return grp(g);
  };
  // dancing: a groove (knees by turns, the torso turning, bent arms swinging) and the hands up, swaying
  POSEX.glasba_ples = (t, s) => { const a = Math.max(0, s), b = Math.max(0, -s);
    return glasbaFeet({ hp: [0.18 + 0.25 * a, 0.18 + 0.25 * b], kn: [0.3 + 0.5 * a, 0.3 + 0.5 * b], hpz: [0.07, 0.07], tz: 0.07 * s, tw: 0.3 * s, lean: 0.08,
      shz: [0.35, 0.35], shx: [0.5 - 0.5 * s, 0.5 + 0.5 * s], shy: [-0.2, -0.2], el: [1.55, 1.55], nod: 0.05 + 0.06 * Math.sin(2 * t), look: -0.25 * s }); };
  POSEX.glasba_ples2 = (t, s) => { const a = Math.max(0, s), b = Math.max(0, -s);
    return glasbaFeet({ hp: [0.12 + 0.2 * a, 0.12 + 0.2 * b], kn: [0.22 + 0.42 * a, 0.22 + 0.42 * b], hpz: [0.08 + 0.04 * s, 0.08 - 0.04 * s], tz: 0.13 * s, tw: 0.1 * s,
      shz: [2.5 + 0.2 * s, 2.5 - 0.2 * s], shx: [0.25, 0.25], el: [0.35 + 0.2 * a, 0.35 + 0.2 * b], look: 0.2 * s }); };
  MOTION.glasba_ples = { rate: 5.2 }; MOTION.glasba_ples2 = { rate: 4.2 }; RATE.glasba_ples = 5.2; RATE.glasba_ples2 = 5.0;
  // clapping in front of the chin (k: 0 the palms together, 1 apart), standing or sitting on the blanket with the knees up
  const glasbaClap = (t, J) => { const k = 0.5 - 0.5 * Math.cos(t);
    return Object.assign(J, { shz: [0.01 + 0.2 * k, 0.01 + 0.2 * k], shx: [0.66 - 0.17 * k, 0.66 - 0.17 * k], shy: [-0.72 + 0.55 * k, -0.72 + 0.55 * k], el: [1.88 + 0.19 * k, 1.88 + 0.19 * k], nod: 0.04 }); };
  POSEX.glasba_plosk = (t) => glasbaClap(t, glasbaFeet({ hp: [0.08, 0.16], kn: [0.12, 0.3], hpz: [0.06, 0.06], tz: 0.03 * Math.sin(t / 2) }));
  POSEX.glasba_ploskSed = (t) => glasbaClap(t, { hy: 0.14, hp: [2.0, 2.0], kn: [1.05, 1.05], lean: 0.08 });
  MOTION.glasba_plosk = { rate: 9 }; MOTION.glasba_ploskSed = { rate: 8 }; RATE.glasba_plosk = 10;
  // a picnic blanket (squares of two colours), poles with the lights' string between them
  const glasbaOdeja = (C, a0, b0, c1, c2) => {   // (each square on the ground where it lies, 9 cm thick: the grass the game draws lies up to ~5 cm over groundH)
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) C.prop(grp(box(0.56, 0.09, 0.56, (i + j) % 2 ? c1 : c2, 0, 0.045, 0)), a0 + (i - 1.5) * 0.56, b0 + (j - 1) * 0.56, [0, -1]); };
  const glasbaLuci = (Ln, h, sag) => {   // two poles, the wire sagging between them, big bulbs of five colours (unlit)
    const g = new THREE.Group(), cols = [0xffd23a, 0xff5a3a, 0x5ad86a, 0x5ab0ff, 0xff8ad8], n = Math.round(Ln / 0.5), y = (k) => h - sag * Math.sin(k / n * Math.PI);
    for (const x of [-Ln / 2, Ln / 2]) g.add(cyl(0.05, 0.06, h + 0.2, 5, 0x8a6a45, x, (h + 0.2) / 2, 0));
    for (let k = 0; k < n; k += 2) g.add(bar([-Ln / 2 + k * Ln / n, y(k), 0], [-Ln / 2 + Math.min(n, k + 2) * Ln / n, y(Math.min(n, k + 2)), 0], 0.015, 0x2a2c31));
    for (let k = 1; k < n; k++) g.add(box(0.12, 0.15, 0.12, cols[k % cols.length], -Ln / 2 + k * Ln / n, y(k) - 0.1, 0, { basic: true }));
    return g; };
  S.glasba = { seed: 227, clear: [[0, 6.5, 11], [-13, 5, 6]],
    build(C, F, K) {
      glasbaOdeja(C, -0.4, 6.4, pick([0xd8262a, 0x2f63c9, 0xf07a1c]), 0xf2f0ea);
      C.prop(L.cooler(pick([0xd8262a, 0x2f9a48, 0x2f63c9])), 1.9, 5.3, [-0.8, -0.6]);   // (the guitarist's seat)
      const bx = L.boombox(); bx.scale.setScalar(1.5); bx.position.y = 0.3; C.prop(grp(L.crates(1, [0x2f7a3a]), bx), 3.0, 6.3, [-1, -0.7]);
      C.prop(glasbaLuci(7.0, 2.55, 0.45), 0.1, 8.6, [0, -1]); C.prop(glasbaLuci(5.6, 2.55, 0.4), 3.6, 5.8, [-1, 0]);   // (round the party: behind it and at its far end)
      C.prop(L.chair(pick([0xf0c22e, 0x22848f])), -2.9, 7.6, [0.6, -1]); C.prop(L.cooler(0xf2f2f2), -2.0, 7.9);
      C.prop(L.tentDome(pick([0xf07a1c, 0x2f9a48, 0x8a3b8c])), -3.8, 11.2, [0.3, -1]); C.prop(L.flagPole(K.flag, 5), 5.4, 9.6);
      for (const [a, b, c] of [[-1.0, 6.9, 0xc8c9cc], [-0.85, 7.05, 0xd8262a], [0.4, 7.1, 0x2f6b2a]]) C.prop(grp(cyl(0.035, 0.035, 0.13, 6, c, 0, 0.155, 0)), a, b);   // (cans on the blanket)
      C.man({ shirt: 0x22848f, pants: 0x2f3f63, hair: 'long', hairCol: 0x2a1d14 }, { act: { a: 1.9, b: 5.3, y: 0.05, pose: 'glasba_kitara', face: [-0.8, -0.6], hold: [['glasba_kitara', 0]] },
        bliza: { pose: 'glasba_kitaraGor', look: 'car' }, run: false });   // (plays on: only looks up at the car)
      C.man({ shirt: 0xd23a2c, pants: 0xd23a2c, hair: 'pony' }, { act: { a: -0.9, b: 4.0, pose: 'glasba_ples', face: [0.9, 0.45] }, fence: { a: -0.9, b: 0.9, pose: 'jump' }, run: { f: 0.6 } });
      C.man({ shirt: 0xf0c22e, pants: 0x262a33, shorts: true, hair: 'short' }, { act: { a: 0.5, b: 2.9, pose: 'glasba_ples2', face: [0.5, 0.85] }, fence: { a: 0.4, b: 0.9, pose: 'glasba_ples2' }, run: { f: 0.55 } });
      C.man({ shirt: 0x2f9a48, pants: 0x47494f, hat: 'cap', hatCol: 0xf2f2f2 }, { act: { a: -2.4, b: 5.6, pose: 'glasba_plosk', face: [1, -0.35] }, fence: { a: -2.2, b: 0.95, pose: 'glasba_plosk' }, run: { f: 0.5 } });
      C.man({ shirt: 0x8a3b8c, pants: 0x31406e, hair: 'long' }, { act: { a: -0.2, b: 6.6, y: 0.08, pose: 'glasba_ploskSed', face: [0.4, -1] }, fence: { a: 1.6, b: 0.9, pose: 'wave', t: 0.7 }, run: { f: 0.5 } });
    } };

  /* 2 · Starejši s časomerom (Ouninpohja, Pikes Peak): three older fans (grey hair, hats) in folding chairs in a row by the fence,
     a small camping table behind them with a thermos; one listens to the race radio in his headphones, one watches the track through
     binoculars, one writes the lap times on a clipboard; their dog. As the car comes they stand up and walk the few metres to the fence; the one
     with the binoculars follows the car with them, the one with the clipboard times it with a stopwatch held up */
  // a hand's frame in a pose (as person() builds the figure: the hips hy up, the torso 0.06 over them, the shoulder 0.245 out and 0.45 up the
  // torso, the elbow 0.29 and the hand 0.3 down the arm): a thing made where it is in the pose moved into the hand that holds it
  const radioHandM = (J, i) => {
    const v = (k, d) => J[k] == null ? d : Array.isArray(J[k]) ? J[k][i] : J[k], sd = i === 0 ? 1 : -1;
    const hips = new THREE.Object3D(); hips.position.set(0, v('hy', 0.92), v('hz', 0)); hips.rotation.x = v('hrx', 0);
    const torso = new THREE.Object3D(); torso.position.y = 0.06; torso.rotation.set(v('lean', 0), v('tw', 0), v('tz', 0)); hips.add(torso);
    const sh = new THREE.Object3D(); sh.position.set(sd * 0.245, 0.45, 0); sh.rotation.order = 'ZXY'; sh.rotation.set(-v('shx', 0), sd * v('shy', 0), sd * v('shz', 0.07)); torso.add(sh);
    const el = new THREE.Object3D(); el.position.y = -0.29; el.rotation.x = -v('el', 0.08); sh.add(el);
    const hd = new THREE.Object3D(); hd.position.y = -0.3; el.add(hd); hips.updateMatrixWorld(true); return hd.matrixWorld.clone();
  };
  const radioInHand = (J, i, g) => { g.applyMatrix4(radioHandM(J, i).invert()); return grp(g); };
  // the poses: sitting (as 'sit'), listening with a hand on the headphones' cup and the radio on the thigh; the binoculars at the eyes (the
  // elbows up), sitting or standing; leaning over the clipboard on the lap, writing; standing, the stopwatch held up at the eyes, the clipboard low
  const radioSit = (J) => Object.assign({ hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: -0.05 }, J);
  const RADIO_GLEDA = { shz: [0.3, 0.3], shx: [1.49, 1.49], shy: [-0.4, -0.4], el: [1.93, 1.93] };
  const RADIO_PISE = radioSit({ lean: 0.3, shz: [0.18, 0.15], shx: [0.27, 0.2], shy: [-0.9, -1.07], el: [1.44, 1.53], nod: 0.45 });
  const RADIO_CAS = { lean: 0.02, shz: [0.17, 0.35], shx: [0.33, 1.2], shy: [-0.88, -0.17], el: [1.24, 1.64] };
  // (these two move of their own, not by the head's idle look: the head never turns away from the hand on the headphones' cup, nor the
  // binoculars from the hands; he nods along, the other scans the track turning his whole torso)
  POSEX.radio_slusa = (t, s) => radioSit({ shz: [0.13, 1.9], shx: [0.25, 0.65], shy: [-0.73, 1.45], el: [1.04, 2.45], nod: 0.12 + 0.05 * s, tz: -0.06 });
  POSEX.radio_gleda = (t, s) => radioSit(Object.assign({ nod: -0.04, tw: 0.22 * s }, RADIO_GLEDA));
  POSEX.radio_gledaStoj = () => Object.assign({ lean: -0.05, nod: -0.04, hpz: [0.06, 0.06] }, RADIO_GLEDA);
  POSEX.radio_pise = (t, s) => Object.assign({}, RADIO_PISE, { shy: [RADIO_PISE.shy[0], RADIO_PISE.shy[1] + 0.1 * s], el: [RADIO_PISE.el[0], RADIO_PISE.el[1] + 0.06 * Math.sin(2.3 * t)] });
  POSEX.radio_cas = () => Object.assign({ hpz: [0.06, 0.06], nod: -0.05 }, RADIO_CAS);
  MOTION.radio_pise = { rate: 2.6 }; MOTION.radio_slusa = { rate: 1.6 }; MOTION.radio_gleda = { rate: 0.45 };
  // the things: the binoculars at the eyes (on the head: they follow its look) and in the hand (carried), the clipboard lying on the lap (left
  // hand), the pen on it (right hand), the stopwatch held up (right hand)
  const radioBinos = (c) => grp(cyl(0.032, 0.036, 0.14, 7, c, 0.04, 0, 0, { rx: Math.PI / 2 }), cyl(0.032, 0.036, 0.14, 7, c, -0.04, 0, 0, { rx: Math.PI / 2 }), box(0.05, 0.03, 0.07, c, 0, 0.012, -0.01),
    cyl(0.03, 0.03, 0.012, 7, 0x8fa8bc, 0.04, 0, 0.071, { rx: Math.PI / 2 }), cyl(0.03, 0.03, 0.012, 7, 0x8fa8bc, -0.04, 0, 0.071, { rx: Math.PI / 2 }));
  ITEMX.radio_daljnogled = () => { const b = radioBinos(0x23262c); b.position.set(0, 0.015, 0.035); return grp(b); };   // (the item's place: 0.12 up, 0.14 out of the head's front)
  ITEMX.radio_daljnogledR = () => { const b = radioBinos(0x23262c); b.position.set(0, -0.06, 0.06); return grp(b); };
  ITEMX.radio_tabla = () => { const g = grp(box(0.24, 0.016, 0.32, 0x8f6a3c, 0, 0, 0), box(0.2, 0.018, 0.26, 0xf4f4f0, 0, 0.002, 0.02), box(0.1, 0.03, 0.04, 0xb9bec6, 0, 0.012, -0.135));
    g.rotation.x = 0.25; g.position.set(0.04, 0.575, 0.3); return radioInHand(RADIO_PISE, 0, grp(g)); };   // (on the thighs, its clip away from him)
  ITEMX.radio_pero = () => radioInHand(RADIO_PISE, 1, grp(bar([0.0, 0.59, 0.27], [-0.06, 0.7, 0.2], 0.014, 0x1f4aa8)));
  ITEMX.radio_stoparica = () => { const w = grp(cyl(0.034, 0.034, 0.018, 10, 0xc9ccd2, 0, 0, 0), cyl(0.028, 0.028, 0.02, 10, 0xf4f4f0, 0, 0.001, 0), cyl(0.008, 0.008, 0.03, 5, 0xc9ccd2, 0, 0, 0.045, { rx: Math.PI / 2 }));
    const at = new THREE.Vector3(-0.12, 1.6, 0.36), eye = new THREE.Vector3(0, 1.67, 0.1); w.position.copy(at); w.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), eye.sub(at).normalize());
    return radioInHand(RADIO_CAS, 1, grp(w)); };   // (its face to his eyes)
  // on the head for good (baked into the figure: seen also while they walk): headphones, a bucket hat, a flat cap (head's frame: its bottom at 0, the face +z)
  const radioSlusalke = () => grp(box(0.25, 0.025, 0.045, 0x1b1d22, 0, 0.278, -0.01), box(0.022, 0.13, 0.04, 0x1b1d22, 0.118, 0.205, -0.01), box(0.022, 0.13, 0.04, 0x1b1d22, -0.118, 0.205, -0.01),
    cyl(0.05, 0.05, 0.045, 8, 0xf0c22e, 0.115, 0.125, -0.005, { rz: Math.PI / 2 }), cyl(0.05, 0.05, 0.045, 8, 0xf0c22e, -0.115, 0.125, -0.005, { rz: Math.PI / 2 }));
  const radioKlobuk = (c) => grp(cyl(0.105, 0.118, 0.1, 8, c, 0, 0.29, -0.005), cyl(0.175, 0.175, 0.016, 10, c, 0, 0.245, -0.005));
  const radioKapa = (c) => grp(box(0.222, 0.055, 0.238, c, 0, 0.268, -0.005), box(0.19, 0.022, 0.085, c, 0, 0.25, 0.14, { rx: 0.18 }));
  const radioThermos = () => grp(cyl(0.05, 0.05, 0.28, 8, 0x2f6b3a, 0, 0.14, 0), cyl(0.055, 0.055, 0.07, 8, 0xc8201c, 0, 0.315, 0), cyl(0.04, 0.035, 0.08, 7, 0xf2f2ee, 0.14, 0.04, 0.05),
    cyl(0.04, 0.035, 0.08, 7, 0xf2f2ee, -0.15, 0.04, -0.06), box(0.2, 0.07, 0.15, 0x2f63c9, 0.08, 0.035, -0.17));
  S.radio = { seed: 283, clear: [[0, 5, 10], [-12, 4, 6]],
    build(C, F, K) {
      const GREY = [0xc9c9c4, 0xb4b4ae, 0xdcdcd6];
      C.prop(L.chair(0x31406e), -1.6, 2.3, [-0.75, -0.65]); C.prop(L.chair(0x2f5a3a), 0.0, 3.1, [0.1, -1]); C.prop(L.chair(0x7c4a2e), 1.6, 3.9, [-0.2, -1]);   // (a slanting row: each seen from the road)
      C.prop(L.table(0.9, 0.6, { things: false, top: 0xd9d6cc }), 0.8, 5.1, [0, -1]); const th = radioThermos(); th.position.y = 0.74; C.prop(grp(th), 0.8, 5.1, [0, -1]);
      C.prop(L.cooler(0xf2f2ee), -2.7, 4.0, [1, 0]); C.prop(L.bag(0x5b5040), -2.3, 4.8, 0.4); C.prop(L.parasol(0x2f5a3a, 0xf2f2ee), 2.9, 5.6);
      C.prop(L.car(pick([0x8a2a24, 0x2f3f63, 0xc8b070, 0x2f5a3a]), { L: 4.5 }), 0.6, 9.4, [1, 0]); C.prop(L.flagPole(K.flag, 3.4), -1.6, 6.6);
      C.pet(L.dog(pick([0x5c3a22, 0x2a221c, 0xc8a878])), { act: { a: -0.6, b: 4.3, face: [-1, -0.4] }, fence: { a: 0.6, b: 1.2, face: [-1, -0.2] }, run: { f: 0.2 } });
      const P1 = C.man({ shirt: 0x7c4a2e, pants: 0x5b5040, long: true, hair: 'short', hairCol: pick(GREY), scale: 0.95 }, { act: { a: 0.0, b: 3.1, pose: 'radio_slusa', face: [0.1, -1], hold: [['radio', 0]] },
        zac: { look: 'car' }, run: { f: 0, pose: 'walk', hold: [['radio', 0]] }, fence: { a: -0.2, b: 0.9, pose: 'radio', hold: [['radio', 0]], look: 'car' } });
      P1.head.add(radioSlusalke());
      const P2 = C.man({ shirt: 0x2f4a6a, pants: 0x6a6f78, long: true, hair: 'short', hairCol: pick(GREY), scale: 0.95 }, { act: { a: -1.6, b: 2.3, pose: 'radio_gleda', face: [-0.75, -0.65], head: [['radio_daljnogled']] },
        zac: { look: 'car' }, run: { f: 0, pose: 'walk', hold: [['radio_daljnogledR', 1]] }, fence: { a: -1.7, b: 0.85, pose: 'radio_gledaStoj', head: [['radio_daljnogled']], look: 'car' } });
      P2.head.add(radioKlobuk(0xc8b88a));
      const P3 = C.man({ shirt: 0xb8bcc4, pants: 0x3a3f48, long: true, vest: 0x2f4a3a, stripes: 0x2f4a3a, hair: 'short', hairCol: pick(GREY), scale: 0.94 }, { act: { a: 1.6, b: 3.9, pose: 'radio_pise', face: [-0.2, -1], hold: [['radio_tabla', 0], ['radio_pero', 1]] },
        zac: { look: 'car' }, run: { f: 0, pose: 'walk', hold: [['radio_tabla', 0]] }, fence: { a: 1.4, b: 1.9, pose: 'radio_cas', hold: [['radio_tabla', 0], ['radio_stoparica', 1]], look: 'car' } });   // (a step behind the others)
      P3.head.add(radioKapa(0x6b5a45));
    } };

  /* 1 · Navijaški klub (Los Caracoles, Katu-Jaryk): seven fans of one club in its shirts by their tent and their minibus, the club's plain
     striped banner on the fence. The drummer on a crate beats the big drum on its strap, the flag-bearer sweeps the big flag over them, the
     other five jump and chant round them (two with air horns). As the car comes the five run to the fence and jump and wave, the horns up; the
     drummer and the flag-bearer stay where they are (the drum, the flag), beat and wave harder and watch it pass. The club's colours: the
     site's option club ([shirt, second]) or drawn. (A held thing bigger than a hand's, the drum, the flag, the kite below, is shaped in the
     torso's frame for its pose and held through the inverse of that hand's frame: navijaciInHand, zmajInHand. One who stays with it does what
     it does on a thing of its own, an anchor at its place, and watches the car on the ground there: its way back after the car is then a step
     between two frames, not World.people's quarter of a second of walking on the spot, in which the drum, the flag or the kite would swing with
     the walking arm.) */
  const NAV_CLUB = [[0xd8262a, 0xf2f2f2], [0xf0c22e, 0x15171c], [0x1f63d8, 0xf2f2f2], [0xf07a1c, 0x15171c], [0x2f9a48, 0xf2f2f2], [0x8a3b8c, 0xf0c22e]];
  // a hand's frame in the torso's for an arm's joints (as person() builds the arm: the shoulder at (±0.245, 0.45, 0) turned Z, X, Y, the elbow
  // 0.29 lower, the hand 0.3 lower; sd 1 the left arm, -1 the right): a thing shaped in the torso's frame for that pose, held in that hand
  function navijaciInHand(sd, j, g) {
    const m = new THREE.Matrix4().makeTranslation(sd * 0.245, 0.45, 0)
      .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-j.shx, sd * (j.shy || 0), sd * j.shz, 'ZXY')))
      .multiply(new THREE.Matrix4().makeTranslation(0, -0.29, 0)).multiply(new THREE.Matrix4().makeRotationX(-j.el)).multiply(new THREE.Matrix4().makeTranslation(0, -0.3, 0));
    m.invert().decompose(g.position, g.quaternion, g.scale); return grp(g);
  }
  const NAV_DRUM_L = { shz: 0.6, shx: 0.55, el: 1.4, shy: -0.6 };   // (the drummer's left hand on the drum's rim)
  const NAV_FLAG_R = { shz: 0.15, shx: 1.2, el: 1.5, shy: -0.6 }, NAV_FLAG_L = { shz: -0.55, shx: 0.55, el: 0.4, shy: -0.6 };   // (both hands on the pole in front of the chest)
  // the big drum on its strap (in front of the belly, its head tilted up to the front: the shell in the club's colour, the rims in the second,
  // the head white); in the left hand's frame of the drumming pose
  ITEMX.navijaci_drum = (o) => {
    const c = o.c || [0xd8262a, 0xf2f2f2], n = [0, Math.sin(0.5), Math.cos(0.5)], cx = 0, cy = 0.02, cz = 0.33, at = (d) => [cx + n[0] * d, cy + n[1] * d, cz + n[2] * d];
    const g = grp(cyl(0.27, 0.27, 0.3, 9, c[1], cx, cy, cz, { rx: Math.PI / 2 - 0.5 }), cyl(0.275, 0.275, 0.2, 9, c[0], cx, cy, cz, { rx: Math.PI / 2 - 0.5 }),
      cyl(0.24, 0.24, 0.02, 9, 0xf2f0ea, ...at(0.145), { rx: Math.PI / 2 - 0.5 }), bar([0.2, 0.18, 0.2], [0.24, 0.5, 0.02], 0.05, 0x2a2c31));
    return navijaciInHand(1, NAV_DRUM_L, g);
  };
  ITEMX.navijaci_mallet = () => grp(bar([0, 0.04, 0.02], [0, -0.2, 0.3], 0.025, 0xb08a5a), box(0.08, 0.08, 0.08, 0xf2f0ea, 0, -0.21, 0.31));
  // the big flag on its long pole (the club's colours in three stripes, no emblem): the pole upright through both hands of the flag pose; the
  // cloth to the right of the pole (o.m -1: to the left)
  ITEMX.navijaci_flag = (o) => {
    const c = o.c || [0xd8262a, 0xf2f2f2], m = o.m || 1, px = -0.06, pz = 0.38, y0 = -0.45, y1 = 3.0, fw = 2.1, g = grp(cyl(0.024, 0.024, y1 - y0, 4, 0xdedede, px, (y0 + y1) / 2, pz), box(0.07, 0.09, 0.07, c[1], px, y1 + 0.04, pz));
    for (const [y, h, col] of [[0, 0.5, c[0]], [0.5, 0.36, c[1]], [0.86, 0.5, c[0]]]) g.add(box(fw, h, 0.015, col, px - m * (0.03 + fw / 2), y1 - 0.06 - y - h / 2, pz));
    return navijaciInHand(-1, NAV_FLAG_R, g);
  };
  // an air horn held up (the can in the fist, the white trumpet on: it points where the arm does)
  ITEMX.navijaci_horn = (o) => grp(cyl(0.04, 0.04, 0.17, 6, o.c || 0xd8262a, 0, -0.06, 0.04), cyl(0.02, 0.085, 0.22, 7, 0xf2f2f2, 0, -0.25, 0.04));
  // drumming: the left hand on the drum, the right beating it (a bounce on each beat)
  POSEX.navijaci_drum = (t, s) => { const f = 0.5 + 0.5 * s, d = 1 - f;
    return { shz: [NAV_DRUM_L.shz, 0.12 + 0.23 * f], shx: [NAV_DRUM_L.shx, 0.75 + 0.55 * f], el: [NAV_DRUM_L.el, 0.8 + 1.1 * f], shy: [NAV_DRUM_L.shy, -0.6 + 0.1 * f],
      hp: [0.06 * d, 0.06 * d], kn: [0.12 * d, 0.12 * d], hy: 0.92 - 0.02 * d, nod: 0.1 }; };
  // the flag swept from side to side over the head (the arms still on the pole, the body sways: the hands stay on it)
  POSEX.navijaci_flag = (t, s) => { const c = Math.cos(t);
    return { shz: [NAV_FLAG_L.shz, NAV_FLAG_R.shz], shx: [NAV_FLAG_L.shx, NAV_FLAG_R.shx], el: [NAV_FLAG_L.el, NAV_FLAG_R.el], shy: [NAV_FLAG_L.shy, NAV_FLAG_R.shy],
      tz: 0.22 * s, tw: 0.25 * c, hpz: [0.12 + 0.05 * s, 0.12 - 0.05 * s], look: -0.3 * c, nod: -0.2 }; };
  // chanting: the arms up, the fists punching the beat, a bounce in the knees
  POSEX.navijaci_chant = (t, s) => { const u = Math.abs(s), d = 1 - u;
    return { shz: [2.45 + 0.2 * u, 2.45 + 0.2 * u], shx: [0.35, 0.35], el: [0.9 - 0.7 * u, 0.9 - 0.7 * u], hp: [0.08 * d, 0.08 * d], kn: [0.18 * d, 0.18 * d], hy: 0.92 - 0.03 * d, dy: 0.05 * u }; };
  // clapping over the head to the drum
  POSEX.navijaci_clap = (t, s) => { const u = 0.5 + 0.5 * s;
    return { shz: [-0.15 + 0.6 * u, -0.15 + 0.6 * u], shx: [2.45, 2.45], el: [0.35, 0.35], dy: 0.03 * u, nod: -0.15 }; };
  Object.assign(MOTION, { navijaci_drum: { rate: 7.5 }, navijaci_flag: { rate: 2.2 }, navijaci_chant: { rate: 4.2 }, navijaci_clap: { rate: 7.5 } });
  Object.assign(RATE, { navijaci_drum: 11, navijaci_flag: 4.2 });
  S.navijaci = { seed: 211, clear: [[0.5, 5, 11], [-16, 1.5, 7], [16, 1.5, 6]],
    build(C, F, K) {
      const [c1, c2] = K.club || pick(NAV_CLUB), side = F.side > 0 ? 1 : -1;
      const ban = L.fanBanner([c1, c2, c1], 4.5); ban.add(box(0.06, 2.0, 0.06, 0x9aa0a8, -2.25, 1.0, 0)); ban.add(box(0.06, 2.0, 0.06, 0x9aa0a8, 2.25, 1.0, 0)); C.prop(ban, -6.0, 0.5, [0, -1]);
      C.prop(L.gazebo(c1, 3.0), 0.8, 8.6); C.prop(L.cooler(c2), 2.4, 8.0); C.prop(L.crates(3, [c2, c1, c2]), -1.2, 8.4, [0, -1]); C.prop(L.flagPole([c1, c2, c1], 5.5), -3.8, 7.4);
      C.prop(L.van(c1, c2), 7.2, 9.6, [1, 0]); C.prop(grp(box(0.8, 0.3, 0.6, 0x8a6a45, 0, 0.15, 0)), -0.8, 4.8, [0, -1], 'navijaciBox'); C.prop(grp(), 3.2, 4.6, [-0.2, -1], 'navijaciFlag');
      const fan = (o) => Object.assign({ shirt: c1, pants: pick(pal.PANTS) }, o), hc = [['navijaci_horn', 1, { c: c2 }]];
      const drum = [['navijaci_drum', 0, { c: [c1, c2] }], ['navijaci_mallet', 1]], flag = [['navijaci_flag', 1, { c: [c1, c2], m: side }]];   // (the flag's cloth trails away from the coming car)
      // the drummer on his crate and the flag-bearer: they stay, beat and wave harder as the car passes and watch it
      C.man(fan({ hat: 'cap', hatCol: c2 }), { act: { on: 'navijaciBox', a: 0, b: 0, y: 0.3, pose: 'navijaci_drum', hold: drum }, run: false, fence: { a: -0.8, b: 4.8, y: 0.3, pose: 'navijaci_drum', hold: drum, look: 'car' } });
      C.man(fan({ hat: 'beanie', hatCol: c2, long: true }), { act: { on: 'navijaciFlag', a: 0, b: 0, pose: 'navijaci_flag', hold: flag }, run: false,
        fence: { a: 3.2, b: 4.6, pose: 'navijaci_flag', t: 1.0, face: [-0.2, -1], hold: flag, look: 'car' } });
      // the five round them, to the fence as the car comes
      C.man(fan({ hair: 'short' }), { act: { a: -2.4, b: 3.0, pose: 'navijaci_chant', face: [0.65, 0.75] }, fence: { a: -2.6, b: 0.9, pose: 'fenceWave', t: 0.5 }, run: { f: 0.6 } });
      C.man(fan({ hat: 'cap', hatCol: c2 }), { act: { a: -0.6, b: 2.6, pose: 'jump', face: [0, 1] }, fence: { a: -1.4, b: 1.45, pose: 'jump', t: 0.9 }, run: { f: 0.55 } });
      C.man(fan({ hair: 'pony' }), { act: { a: 1.2, b: 2.9, pose: 'navijaci_clap', face: [-0.7, 0.75] }, fence: { a: 0.0, b: 0.9, pose: 'cheer', t: 0.9 }, run: { f: 0.5 } });
      C.man(fan({ hair: 'bald' }), { act: { a: 1.4, b: 4.4, pose: 'navijaci_chant', t: 0.7, face: [-1, 0.15], hold: hc }, fence: { a: 1.2, b: 1.5, pose: 'wave', t: 0.3, hold: hc }, run: { f: 0.5 } });
      C.man(fan({ hair: 'long' }), { act: { a: -2.7, b: 4.7, pose: 'navijaci_clap', t: 1.6, face: [1, 0.1] }, fence: { a: 2.6, b: 0.95, pose: 'wave2', t: 1.1, hold: [['navijaci_horn', 0, { c: c2 }]] }, run: { f: 0.62 } });
    } };

  /* 2 · Spuščanje zmaja (Great Alpine Road, Mauna Kea): a family on a free afternoon by the road. The father flies a kite (a bright
     diamond with a tail, 12 m up, its line from his raised hand; his arm's small pulls make it bob), the child beside him points at it; the mother
     sits on the blanket under the parasol with the toddler, the grandfather in his camping chair reads a plain paper. As the car comes the child
     and the mother run to the fence; the father keeps the kite up and turns his head to the road; the grandfather looks up from his paper and
     the toddler turns after the car. The kite flies away from the road, ahead along it (towards the coming car: in the chase camera's view sooner).
     (The ones who stay do what they do on an anchor of their own, as the drummer above.) */
  const ZMAJ_KITES = [[0xf0c22e, 0xd8262a, 0x1f63d8, 0x2f9a48], [0xe85a9a, 0xf0c22e, 0x22848f, 0xf07a1c], [0xd8262a, 0xf2f2f2, 0xd8262a, 0x15171c], [0x8a3b8c, 0x8acbe8, 0xf0c22e, 0xd8262a]];
  // a hand's frame in the torso's for an arm's joints (as person() builds the arm: the shoulder at (±0.245, 0.45, 0) turned Z, X, Y, the elbow
  // 0.29 lower, the hand 0.3 lower; sd 1 the left arm, -1 the right): a thing shaped in the torso's frame for that pose, held in that hand
  function zmajInHand(sd, j, g) {
    const m = new THREE.Matrix4().makeTranslation(sd * 0.245, 0.45, 0)
      .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-j.shx, sd * (j.shy || 0), sd * j.shz, 'ZXY')))
      .multiply(new THREE.Matrix4().makeTranslation(0, -0.29, 0)).multiply(new THREE.Matrix4().makeRotationX(-j.el)).multiply(new THREE.Matrix4().makeTranslation(0, -0.3, 0));
    m.invert().decompose(g.position, g.quaternion, g.scale); return grp(g);
  }
  const ZMAJ_R = { shz: 0.15, shx: 2.1, el: 0.75, shy: 0 }, ZMAJ_L = { shz: 0.05, shx: 0.2, el: 1.1, shy: -0.6 };   // (the line's hand up in front of the head, the reel at the belly)
  const ZMAJ_PR = { shz: 0.15, shx: 0.15, el: 1.4, shy: -0.3 };   // (both hands on the paper in front of the chest)
  // the kite on its line (in the torso's frame of the flying pose: forward +z, the hand at (-0.18, 0.88, 0.34)): the diamond in four colours,
  // 1.35 m wide and 1.8 m tall (a big one: it reads from the chase camera), its face to the flier, its cross spars; the tail of bows hanging
  // from its foot; the line to the hand
  ITEMX.zmaj_kite = (o) => {
    const c = o.c || ZMAJ_KITES[0], hand = new THREE.Vector3(-0.18, 0.88, 0.34), at = new THREE.Vector3(0, 11.0, 8.5);
    const sq = new THREE.Group(); sq.rotation.z = Math.PI / 4;
    [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([i, j], k) => sq.add(box(0.5, 0.5, 0.025, c[k], i * 0.25, j * 0.25, 0)));
    const dia = grp(sq); dia.scale.set(1.35 / Math.SQRT2, 1.8 / Math.SQRT2, 1);
    const kite = grp(dia, bar([0, -0.9, 0.03], [0, 0.9, 0.03], 0.035, 0x2a2c31), bar([-0.675, 0.15, 0.03], [0.675, 0.15, 0.03], 0.035, 0x2a2c31));
    kite.position.copy(at); kite.lookAt(hand); kite.updateMatrixWorld(true);
    const foot = new THREE.Vector3(0, -0.9, 0).applyMatrix4(kite.matrixWorld), bridle = new THREE.Vector3(0, 0, 0.3).applyMatrix4(kite.matrixWorld);
    const g = grp(kite, bar(hand.toArray(), bridle.toArray(), 0.045, 0xf2f2ee));
    let p = foot.clone();
    for (let k = 0; k < 6; k++) { const q = foot.clone().add(new THREE.Vector3(0.14 * Math.sin(k * 1.3), -0.42 * (k + 1), 0.18 * (k + 1)));
      g.add(bar(p.toArray(), q.toArray(), 0.025, 0xf2f2ee)); g.add(box(0.28, 0.11, 0.035, c[k % 2 ? 1 : 0], q.x, q.y, q.z)); p = q; }
    return zmajInHand(-1, ZMAJ_R, g);
  };
  ITEMX.zmaj_reel = () => grp(cyl(0.075, 0.075, 0.1, 7, 0xd8262a, 0, -0.04, 0.05, { rz: Math.PI / 2 }), cyl(0.04, 0.04, 0.12, 6, 0xf2f2ee, 0, -0.04, 0.05, { rz: Math.PI / 2 }));
  // the grandfather's paper, open in both hands (plain: no writing), in the torso's frame of the reading pose
  ITEMX.zmaj_paper = () => zmajInHand(-1, ZMAJ_PR, grp(box(0.3, 0.4, 0.01, 0xeceae2, -0.15, 0.27, 0.4, { rx: -0.25, ry: 0.12 }), box(0.3, 0.4, 0.01, 0xe2e0d6, 0.15, 0.27, 0.4, { rx: -0.25, ry: -0.12 })));
  // flying: the line's arm up, small pulls (the kite bobs at the line's end), the head up to the kite (zmaj_lineLook: the head level)
  const zmajLine = (t, s, up) => ({ shz: [ZMAJ_L.shz, ZMAJ_R.shz + 0.03 * Math.cos(t * 0.7)], shx: [ZMAJ_L.shx, ZMAJ_R.shx + 0.05 * s], el: [ZMAJ_L.el, ZMAJ_R.el + 0.07 * Math.sin(t + 1.1)],
    shy: [ZMAJ_L.shy, ZMAJ_R.shy], hpz: [0.12, 0.12], lean: -0.06, nod: up ? -0.55 : -0.05, look: up ? 0.08 * s : 0 });
  POSEX.zmaj_line = (t, s) => zmajLine(t, s, true);
  POSEX.zmaj_lineLook = (t, s) => zmajLine(t, s, false);
  // the child pointing up at the kite, bouncing on its toes
  POSEX.zmaj_point = (t, s) => { const u = Math.abs(s); return { shz: [0.15, 0.35], shx: [0.1, 2.45], el: [0.3, 0.05], hp: [0.06 * u, 0.06 * u], kn: [0.14 * u, 0.14 * u], nod: -0.5, dy: 0.04 * u }; };
  // reading in the chair (sitting: the hips at the seat), the paper up; zmaj_readUp: the head up over the paper (both hands still on it)
  const zmajRead = (nod, lean) => ({ hy: 0.5, hp: [1.5, 1.5], kn: [1.45, 1.45], lean, shz: [ZMAJ_PR.shz, ZMAJ_PR.shz], shx: [ZMAJ_PR.shx, ZMAJ_PR.shx], el: [ZMAJ_PR.el, ZMAJ_PR.el], shy: [ZMAJ_PR.shy, ZMAJ_PR.shy], nod });
  POSEX.zmaj_read = () => zmajRead(0.32, -0.05);
  POSEX.zmaj_readUp = () => zmajRead(-0.12, -0.12);
  Object.assign(MOTION, { zmaj_line: { rate: 1.3 }, zmaj_point: { rate: 4.5 } });
  Object.assign(RATE, { zmaj_lineLook: 1.3 });
  // a picnic blanket (stripes) and a basket
  const zmajBlanket = (c1, c2) => grp(box(2.2, 0.012, 1.6, c1, 0, 0.006, 0), ...[-0.55, 0, 0.55].map(z => box(2.2, 0.014, 0.18, c2, 0, 0.007, z)));
  // a flat thing laid on the ground as it slopes (C.prop stands a thing upright at its middle's height: a blanket would sink into a slope)
  function zmajFlat(C, F, o, a, b, dir, key) {
    const yaw = F.yaw(dir[0], dir[1]), dirAB = (x, z) => [F.tx * x + F.tz * z, F.nx * x + F.nz * z];   // (a world direction in the frame's a, b)
    const [ax, bx] = dirAB(Math.cos(yaw), -Math.sin(yaw)), [az, bz] = dirAB(Math.sin(yaw), Math.cos(yaw)), d = 0.8;
    const sx = (F.y(a + ax * d, b + bx * d) - F.y(a - ax * d, b - bx * d)) / (2 * d), sz = (F.y(a + az * d, b + bz * d) - F.y(a - az * d, b - bz * d)) / (2 * d);
    const t = grp(o); t.rotation.set(-Math.atan(sz), 0, Math.atan(sx), 'YXZ'); return C.prop(grp(t), a, b, dir, key, -0.06);   // (a little over it: the drawn ground is not quite its height function)
  }
  const zmajBasket = () => grp(box(0.46, 0.26, 0.32, 0xb08a5a, 0, 0.13, 0), bar([-0.18, 0.26, 0], [0, 0.42, 0], 0.025, 0x8a6a45), bar([0.18, 0.26, 0], [0, 0.42, 0], 0.025, 0x8a6a45));
  S.zmaj = { seed: 231, clear: [[2.5, 5, 10], [-6.5, 6.5, 6]],
    build(C, F, K) {
      const kc = K.kite || pick(ZMAJ_KITES), side = F.side > 0 ? 1 : -1, bl = pick([[0xd8262a, 0xf2f0ea], [0x2f63c9, 0xf2f0ea], [0x2f9a48, 0xf0c22e]]);
      zmajFlat(C, F, zmajBlanket(bl[0], bl[1]), 4.2, 5.2, [0, -1]); C.prop(zmajBasket(), 5.1, 4.7, [0.3, -1], null, -0.06); C.prop(L.cooler(pick([0x2f63c9, 0xd8262a, 0xf2f2f2])), 5.7, 6.0);
      C.prop(L.parasol(pick([0xf0c22e, 0xd8262a, 0x22848f]), 0xf2f2ee), 4.9, 6.1); C.prop(L.chair(pick([0x2f9a48, 0x2f63c9, 0xd8262a])), 7.0, 4.4, [-0.6, -1], 'zmajChair');
      C.prop(grp(), 1.0, 3.6, [-1, 0.45], 'zmajDad'); C.prop(grp(), 4.5, 5.5, [-0.8, -0.5], 'zmajBaby');
      C.prop(L.car(pick([0xb8bcc4, 0x2f3f63, 0x7c8a99, 0xd8d8d2, 0x8a2a24])), 4.0, 10.6, [1, 0]); C.prop(grp(L.sph(0.12, 6, 3, pick([0xf2f2f2, 0xd8262a, 0xf0c22e]), 0, 0.12, 0)), 2.6, 3.4);
      const kite = [['zmaj_kite', 1, { c: kc }], ['zmaj_reel', 0]];
      // the father: the kite up all the time; as the car passes his head to the road (not his body: the kite stays where it flies)
      C.man({ shirt: pick(pal.SHIRT), pants: pick(pal.PANTS), hat: 'cap', hatCol: pick(pal.SHIRT) }, { act: { on: 'zmajDad', a: 0, b: 0, pose: 'zmaj_line', hold: kite }, run: false,
        fence: { a: 1.0, b: 3.6, pose: 'zmaj_lineLook', face: [-1, 0.45], hold: kite, look: -side * 0.95 } });
      C.man({ kid: true, shirt: pick(pal.SHIRT), pants: pick(pal.PANTS), shorts: true, hair: 'short' }, { act: { a: 0.0, b: 2.7, pose: 'zmaj_point', face: [-1, 0.55] }, fence: { a: -0.6, b: 0.85, pose: 'jump' }, run: { f: 0.85 }, kid: true });
      C.man({ shirt: pick(pal.SHIRT), pants: pick(pal.PANTS), hair: 'long' }, { act: { a: 3.6, b: 5.0, y: 0.07, pose: 'sitGround', face: [-0.6, -0.8] }, fence: { a: 0.6, b: 0.95, pose: 'wave', t: 0.6 }, run: { f: 0.5 } });
      C.man({ kid: true, scale: 0.78, shirt: pick(pal.SHIRT), pants: pick(pal.PANTS), hair: 'short' }, { act: { on: 'zmajBaby', a: 0, b: 0, y: 0.07, pose: 'sitGround' }, run: false,
        fence: { a: 4.5, b: 5.5, y: 0.07, pose: 'sitGround', face: [-0.8, -0.5], look: 'car' } });   // (the toddler stays on the blanket: it turns after the car)
      C.man({ shirt: pick([0xb8bcc4, 0x7c4a2e, 0x31406e]), pants: pick(pal.PANTS), long: true, hair: 'short', hairCol: 0xc8c8c4, scale: 0.92 }, { act: { on: 'zmajChair', a: 0, b: 0, pose: 'zmaj_read', hold: [['zmaj_paper', 1]] },
        bliza: { pose: 'zmaj_readUp', look: 'car' }, run: false, fence: { a: 7.0, b: 4.4, pose: 'zmaj_readUp', face: [-0.6, -1], hold: [['zmaj_paper', 1]], look: 'car' } });
    } };

  /* 1 · Golaž v kotlu (Vršič, Medvode, Ouninpohja): friends cook a goulash in a big black cauldron hung on a tripod over a campfire (its
     steam and smoke rising). The cook, a white apron and a tall cook's hat on, stirs it with a long wooden paddle, the other hand on his hip;
     three friends sit on logs round the fire, a bowl in one hand and a spoon in the other, and eat; behind them a table with a checked cloth,
     bread on its board, bottles and the bowls, the firewood and their car. As the car comes the three eaters run to the fence
     (one waves his spoon, one cheers; the hungriest only comes halfway, his bowl in his hand, eating); the cook stays at his pot, stirring,
     and only lifts his head to the road */
  {
    const TAU = Math.PI * 2;
    const WOOD = 0xc8a070, GOULASH = 0x8c3b1e, IRON = 0x1b1c1f, STEEL = 0x2e3034;
    // the long wooden paddle in the right hand (the hand's frame: the forearm -y, the palm in, +z forwards): from the hand forwards and down into
    // the pot (the forearm raised forwards, the paddle at ~35° under the horizon), its handle a little over the hand; the blade under the goulash
    ITEMX.kotlicek_ladle = () => { const d = [0.06, -0.66, -0.75], P = (k) => [d[0] * k, d[1] * k, d[2] * k];
      return grp(bar(P(-0.2), P(0.72), 0.035, WOOD), bar(P(0.62), P(0.82), 0.09, WOOD)); };
    // an enamelled bowl of goulash on the left palm (its axis along the hand's +z: up while the forearm is level), o.c its colour
    ITEMX.kotlicek_bowl = (o) => grp(cyl(0.1, 0.065, 0.075, 8, o.c || 0xf2f0ea, -0.02, -0.06, 0.085, { rx: Math.PI / 2 }), cyl(0.088, 0.088, 0.008, 8, GOULASH, -0.02, -0.06, 0.125, { rx: Math.PI / 2 }));
    // a wooden spoon in the right fist, across it (towards the body's middle: into the bowl in the left hand, or across to the mouth)
    ITEMX.kotlicek_spoon = () => grp(bar([-0.04, 0.0, 0.02], [0.17, -0.04, 0.1], 0.018, WOOD), sph(0.034, 5, 3, WOOD, 0.2, -0.045, 0.115, { s: [1.3, 0.55, 1] }));
    // the cook's tall white hat (worn on the head: the head's thing sits at (0, 0.12, 0.14) in its frame, so the hat back over the crown)
    ITEMX.kotlicek_toque = () => grp(cyl(0.118, 0.11, 0.22, 8, 0xf6f6f2, 0, 0.23, -0.14), cyl(0.15, 0.135, 0.09, 8, 0xf6f6f2, 0, 0.37, -0.14));
    // stirring: standing at the pot, the right arm forwards and down on the paddle going round, the torso with it, the left hand on the hip;
    // nod: the head down into the pot, or up to the road
    const stir = (t, nod) => { const c = Math.cos(t), s = Math.sin(t);
      return { shz: [0.55, -0.12 + 0.09 * c], shx: [-0.15, 0.92 + 0.1 * s], shy: [0.6, -0.25], el: [1.4, 0.9 - 0.06 * s], lean: 0.12, tw: -0.05 * c, nod, hp: [0.12, -0.04], kn: [0.08, 0.04] }; };
    POSEX.kotlicek_stir = (t) => stir(t, 0.42); POSEX.kotlicek_stirUp = (t) => stir(t, -0.05);
    // eating: the bowl held before the chest, the spoon down into it and up to the mouth (u 0: in the bowl, 1: at the mouth), the head with it;
    // seated (on the log) or standing (at the fence)
    const eat = (t, seated) => { const u = Math.pow(0.5 - 0.5 * Math.cos(t), 1.6);
      const J = { lean: 0.16 - 0.1 * u, nod: 0.38 - 0.3 * u, shz: [0.16, 0.15 + 0.05 * u], shx: [0.38, 0.45 + 0.1 * u], shy: [-0.55, -0.35 + 0.35 * u], el: [1.3, 1.25 + 1.0 * u] };
      if (seated) Object.assign(J, { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5] });
      return J; };
    POSEX.kotlicek_eat = (t) => eat(t, true); POSEX.kotlicek_eatUp = (t) => eat(t, false);
    Object.assign(MOTION, { kotlicek_stir: { rate: 2.3 }, kotlicek_stirUp: { rate: 2.3 }, kotlicek_eat: { rate: 1.9 }, kotlicek_eatUp: { rate: 1.9 } });
    Object.assign(RATE, { kotlicek_stir: 2.3, kotlicek_stirUp: 2.3, kotlicek_eat: 1.9, kotlicek_eatUp: 1.9 });   // (as the car comes and passes: still stirring, still eating)

    // the tripod with the cauldron (its origin at the fire's middle, the cook's side -z): three dark legs to a cap, the chain, the bail, the
    // black pot (a rounded bottom) with the goulash at the brim, the steam over it (a smoke marker of its own: white puffs)
    function kotlicek_tripod() {
      const g = grp(), H = 2.15, R = 1.02, yb = 0.62, h = 0.4, r = 0.37, top = yb + h, hk = [0, top + 0.36, 0];
      for (let k = 0; k < 3; k++) { const q = k / 3 * TAU + Math.PI / 2; g.add(bar([Math.cos(q) * R, -0.02, Math.sin(q) * R], [Math.cos(q) * 0.05, H, Math.sin(q) * 0.05], 0.055, STEEL)); }
      g.add(cyl(0.08, 0.08, 0.1, 6, STEEL, 0, H, 0)); g.add(bar([0, H, 0], hk, 0.025, 0x55585e));
      for (const sd of [1, -1]) { g.add(bar([sd * r, top - 0.03, 0], [sd * r * 0.62, top + 0.24, 0], 0.022, STEEL)); g.add(bar([sd * r * 0.62, top + 0.24, 0], hk, 0.022, STEEL)); }
      g.add(cyl(r, r * 0.86, h, 10, IRON, 0, yb + h / 2, 0)); g.add(sph(r * 0.86, 8, 2, IRON, 0, yb, 0, { half: true, rx: Math.PI, s: [1, 0.5, 1] }));
      g.add(cyl(r - 0.04, r - 0.04, 0.012, 10, GOULASH, 0, top + 0.006, 0));
      const st = new THREE.Object3D(); st.userData.smoke = { n: 3, h: 2.6, col: 0xf0f0ee, op: 0.5, spread: 1.3 }; st.position.y = top + 0.15; g.add(st);
      return g;
    }
    // the table: a checked cloth (red and white), the round loaf on its board, a knife, the wine and the water, the stack of bowls
    function kotlicek_table(cloth) {
      const g = L.table(1.3, 0.75, { things: false, top: cloth });
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) g.add(box(1.3 / 6, 0.012, 0.75 / 4, 0xf4f2ec, -0.65 + (i + 0.5) * 1.3 / 6, 0.746, -0.375 + (j + 0.5) * 0.75 / 4));
      g.add(box(0.44, 0.025, 0.3, WOOD, -0.25, 0.765, 0.05)); g.add(sph(0.14, 7, 3, 0xb5793a, -0.27, 0.778, 0.05, { half: true, s: [1.25, 0.8, 1] })); g.add(box(0.2, 0.012, 0.03, 0xb9bec6, -0.02, 0.784, 0.15, { ry: 0.4 }));
      for (const [x, z, c, hh] of [[0.28, -0.18, 0x1f4a2a, 0.3], [0.38, -0.08, 0x5a1a22, 0.3], [0.18, -0.24, 0x8acbe8, 0.27]]) { g.add(cyl(0.04, 0.042, hh, 6, c, x, 0.752 + hh / 2, z)); g.add(cyl(0.014, 0.022, 0.08, 5, c, x, 0.752 + hh + 0.04, z)); }
      for (let k = 0; k < 3; k++) g.add(cyl(0.1, 0.065, 0.06, 8, k % 2 ? 0x2f63c9 : 0xf2f0ea, 0.45, 0.78 + k * 0.035, 0.18));
      return g;
    }
    // a few split logs for the fire, on the ground
    const kotlicek_wood = () => { const g = grp(); for (const [x, z, y, ry] of [[0, 0, 0.07, 0.1], [0.05, 0.19, 0.07, -0.05], [-0.02, 0.38, 0.07, 0.12], [0.02, 0.1, 0.2, 0], [0.03, 0.29, 0.2, 0.08]]) g.add(cyl(0.075, 0.075, 0.62, 5, y > 0.1 ? 0xa07a4a : 0x8a6a45, x, y, z, { rz: Math.PI / 2, ry }));
      return g; };
    const BOWL = [0xf2f0ea, 0x2f63c9, 0x2f9a48, 0xf0c22e, 0x22848f], CARS = [0xb8bcc4, 0x2f3f63, 0x7c8a99, 0xd8d8d2, 0x8a2a24, 0x2f5a3a, 0x1d1f25];
    const deal = (arr, n) => { const a = arr.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };

    S.kotlicek = { seed: 307, clear: [[0, 5.5, 10.5], [4.8, 10, 5.5]],
      build(C, F, K) {
        const fire = L.campfire(); fire.scale.set(0.85, 0.5, 0.85); fire.traverse(o => { if (o.userData.smoke) Object.assign(o.userData.smoke, { n: 4, col: 0xa9acb0 }); });
        C.prop(fire, 0, 5.0); C.prop(kotlicek_tripod(), 0, 5.0, [0, -1]);
        C.prop(L.logBench(1.8), -1.95, 5.0, [1, 0]); C.prop(L.logBench(1.7), 2.05, 5.3, [-1, -0.15]);
        C.prop(kotlicek_table(pick([0xd8262a, 0x2f63c9, 0x2f9a48])), -3.6, 7.3, [0.25, -1]); C.prop(L.crates(2, [0xd8262a, 0xd8262a]), -2.2, 8.0, [0.3, -1]);
        C.prop(kotlicek_wood(), 1.25, 7.0, [1, 0.2]); C.prop(L.car(pick(CARS)), 5.0, 10.4, [-1, 0]);
        // the cook (the pot between him and the road), the three eaters on the logs
        const sh = deal(pal.SHIRT, 4), bw = deal(BOWL, 3), look = F.side > 0 ? 0.5 : -0.5;   // (the cook's head up the road, where the car comes from)
        const cook = { a: 0, b: 5.97, face: [0, -1], hold: [['kotlicek_ladle', 1]], head: [['kotlicek_toque']] };
        C.man({ shirt: sh[0], pants: pick(pal.PANTS), vest: 0xf6f6f2, stripes: 0xf6f6f2, hair: 'short' },
          { act: Object.assign({ pose: 'kotlicek_stir' }, cook), bliza: { pose: 'kotlicek_stirUp', look }, run: false, fence: Object.assign({ pose: 'kotlicek_stirUp', look }, cook) });
        const eats = (c) => [['kotlicek_bowl', 0, { c }], ['kotlicek_spoon', 1]];
        C.man({ shirt: sh[1], pants: pick(pal.PANTS), hat: 'cap', hatCol: pick(pal.SHIRT) }, { act: { a: -1.95, b: 4.45, pose: 'kotlicek_eat', face: [1, 0.25], hold: eats(bw[0]) },
          run: { f: 0.55, hold: [['kotlicek_spoon', 1]] }, fence: { a: -1.4, b: 0.9, pose: 'wave', t: 0.4, hold: [['kotlicek_spoon', 1]] } });
        C.man({ shirt: sh[2], pants: pick(pal.PANTS), hair: pick(['long', 'pony']) }, { act: { a: -1.95, b: 5.55, pose: 'kotlicek_eat', t: 1.7, face: [1, -0.25], hold: eats(bw[1]) },
          run: { f: 0.5, hold: [] }, fence: { a: 0.1, b: 0.9, pose: 'cheer', t: 0.9 } });
        C.man({ shirt: sh[3], pants: pick(pal.PANTS), hair: pick(['short', 'bald']), scale: 1.0 }, { act: { a: 2.05, b: 5.2, pose: 'kotlicek_eat', t: 3.1, face: [-1, -0.1], hold: eats(bw[2]) },
          run: { f: 0.42, pose: 'walk', hold: eats(bw[2]) }, fence: { a: 2.4, b: 2.5, pose: 'kotlicek_eatUp', t: 0.5, hold: eats(bw[2]) } });   // (he only comes halfway, eating)
      } };
  }

  /* 2 · Selfie in snemanje (Ouninpohja, Mount Hotham): four teenagers in bright hoodies behind the fence. One holds a selfie stick
     up high, the phone at its end turned to them, his other arm round his friend, who shows a V by her face; the friend on his other side
     makes a heart with both arms over her head; the fourth films them with a phone on a small tripod, a ring light glowing beside it, one
     thumb up; their bikes, a scooter, a speaker and their bags behind. As the car comes all four run to the fence and film it: three with
     their phones held up, the one with the stick lifts it high over the fence and follows the car with it */
  {
    const TAU = Math.PI * 2, DARK = 0x23252a;
    // the selfie stick in the right fist (the hand's frame: the forearm -y): on along the arm, the clamp, the phone in its bright case at the
    // end, flat across the stick (its screen to the holder)
    ITEMX.selfie_stick = (o) => grp(bar([0, 0.04, 0], [0, -0.84, 0], 0.026, DARK), box(0.05, 0.05, 0.05, DARK, 0, -0.86, 0), box(0.1, 0.016, 0.18, o.c || 0xe85a9a, 0, -0.9, 0.0));
    // two fingers in a V (the peace sign) out of the fist, along the forearm; o.c the skin
    ITEMX.selfie_v = (o) => grp(box(0.024, 0.1, 0.026, o.c || 0xe0ac87, 0.022, -0.06, 0.0, { rz: 0.32 }), box(0.024, 0.1, 0.026, o.c || 0xe0ac87, -0.022, -0.06, 0.0, { rz: -0.32 }));
    // the selfie: the stick up and forwards in the right hand (a small bob: another picture), the left arm round the friend's shoulders, the
    // head up to the phone
    POSEX.selfie_up = (t, s) => ({ shz: [0.95, 0.2], shx: [0.35, 2.35 + 0.05 * s], shy: [0.4, 0], el: [0.75, 0.12], nod: -0.22 + 0.04 * s, look: -0.12, tz: -0.05, hp: [0.06, -0.04] });
    // the V by the face (the left hand), the right arm loose towards the friend, the head tipped to him
    POSEX.selfie_peace = (t, s) => ({ shz: [0.45, 0.3], shx: [0.6, 0.1], el: [2.2 + 0.06 * s, 0.25], shy: [-0.15, 0], tz: 0.1 + 0.03 * s, nod: -0.08, look: 0.15 });
    // a heart over the head: both arms up and out, the forearms bent in over it till the hands meet; a sway
    POSEX.selfie_heart = (t, s) => ({ shz: [3.05, 3.05], shx: [0.2, 0.2], shy: [1.57, 1.57], el: [0.92, 0.92], tz: 0.06 * s, nod: -0.06, hpz: [0.06, 0.06] });
    // filming: the right hand at the phone on the tripod, the left thumb up and bobbing (»three, two, one«), the head to the screen
    POSEX.selfie_film = (t, s) => ({ shz: [0.3, 0.15], shx: [0.95, 1.2], el: [1.55 + 0.25 * Math.max(0, s), 0.45], shy: [0, -0.2], lean: 0.08, nod: 0.15 });
    // at the fence: the stick lifted high over it, the left hand on the fence
    POSEX.selfie_high = (t, s) => ({ shz: [0.2, 0.12], shx: [0.95, 2.75 + 0.04 * s], el: [1.3, 0.05], lean: 0.12, hy: 0.91 });
    Object.assign(MOTION, { selfie_up: { rate: 1.3 }, selfie_peace: { rate: 1.1 }, selfie_heart: { rate: 1.2 }, selfie_film: { rate: 3.2 } });
    Object.assign(RATE, { selfie_high: 1.5 });

    // the phone on a small tripod (its legs, the column, the holder; the phone across, its back with the lens to +z: the friends; its screen lit
    // to the one filming)
    function selfie_tripod() {
      const g = grp(), H = 1.28;
      for (let k = 0; k < 3; k++) { const q = k / 3 * TAU + 0.3; g.add(bar([Math.cos(q) * 0.34, 0, Math.sin(q) * 0.34], [0, 0.72, 0], 0.024, DARK)); }
      g.add(cyl(0.018, 0.018, H - 0.72, 5, DARK, 0, (0.72 + H) / 2, 0)); g.add(box(0.06, 0.05, 0.04, DARK, 0, H, 0));
      g.add(box(0.17, 0.088, 0.012, 0x15171c, 0, H + 0.07, 0)); g.add(box(0.15, 0.07, 0.004, 0x9fd0f2, 0, H + 0.07, -0.008, { basic: true }));
      return g;
    }
    // the ring light on its stand: three feet, the pole, the ring glowing white (unlit: seen glowing from the road too, its back as its front)
    const RING_M = new THREE.MeshBasicMaterial({ color: 0xfdfcf4 }), RING_G = new THREE.TorusGeometry(0.3, 0.034, 4, 14);
    function selfie_ring() {
      const g = grp(), H = 1.62, ring = new THREE.Mesh(RING_G, RING_M);
      for (let k = 0; k < 3; k++) { const q = k / 3 * TAU + 0.6; g.add(bar([Math.cos(q) * 0.38, 0, Math.sin(q) * 0.38], [0, 0.3, 0], 0.026, DARK)); }
      g.add(cyl(0.02, 0.02, H - 0.3, 5, DARK, 0, (0.3 + H) / 2, 0)); g.add(box(0.05, 0.08, 0.05, DARK, 0, H, 0)); g.add(bar([0, H, 0], [0, H + 0.1, 0], 0.03, DARK));
      ring.position.set(0, H + 0.42, 0); g.add(ring);
      return g;
    }
    const HOOD = [0xe85a9a, 0x9ad83a, 0x8a3b8c, 0x22b8c8, 0xf07a1c, 0xf0c22e, 0x2f63c9, 0xefefea, 0x15171c], JEANS = [0x3a5a8a, 0x2f3f63, 0x1d1f25, 0x6a6f78, 0xd8d0c0];
    const CASE = [0xe85a9a, 0x22b8c8, 0x9ad83a, 0xf0c22e, 0xefefea];
    const deal = (arr, n) => { const a = arr.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };

    S.selfie = { seed: 349, clear: [[0, 5.5, 9.5], [3.6, 7, 5], [-14, 3, 7]],   // (the third: the view open from the road before it)
      build(C, F, K) {
        const P0 = [0.7, 5.0], d = [-1, -0.12], L0 = Math.hypot(d[0], d[1]), u = [d[0] / L0, d[1] / L0];
        const left = F.side > 0 ? [u[1], -u[0]] : [-u[1], u[0]];   // (the selfie-taker's left in the frame: the frame is mirrored on the left side of the road)
        const at = (k) => [P0[0] + left[0] * 0.58 * k, P0[1] + left[1] * 0.58 * k];
        C.prop(selfie_tripod(), -2.0, 4.85, [1, 0.12]); C.prop(selfie_ring(), -1.75, 5.95, [1, -0.3]);
        const sc = pick([0xd8262a, 0x2f63c9, 0x15171c, 0xf2f2f2]); C.prop(L.scooter(sc), 3.9, 4.3, [1, -0.15]);
        C.prop(L.bike(pick(HOOD)), 3.0, 6.4, [1, 0.12]); C.prop(L.bike(pick(HOOD)), 4.3, 7.7, [1, 0.3]);
        C.prop(L.boombox(), 1.6, 6.9, [-0.4, -1]); C.prop(L.bag(pick(HOOD)), 0.9, 7.1, 0.4); C.prop(L.bag(DARK), -0.2, 6.9, -0.3);
        const hd = deal(HOOD, 4), skA = pick(pal.SKIN), teen = (o) => Object.assign({ pants: pick(JEANS), long: true, scale: 0.9 + rnd() * 0.04 }, o);
        const face = d, fence = (a, pose, hold) => ({ a, b: 0.9, pose, hold });
        // the selfie-taker (the stick), the friend on his left (the V), the one on his right (the heart), the one filming at the tripod
        const stick = [['selfie_stick', 1, { c: pick(CASE) }]];
        C.man(teen({ shirt: hd[0], hat: 'cap', hatCol: pick(HOOD), scale: 0.95 }), { act: { a: P0[0], b: P0[1], pose: 'selfie_up', face, hold: stick }, run: { f: 0.65 }, fence: fence(0.3, 'selfie_high', stick) });
        const [aA, bA] = at(1), [aB, bB] = at(-1);
        C.man(teen({ shirt: hd[1], skin: skA, hair: 'long', shorts: rnd() < 0.5 }), { act: { a: aA, b: bA, pose: 'selfie_peace', face, hold: [['selfie_v', 0, { c: skA }]] },
          run: { f: 0.7 }, fence: fence(-0.75, 'phoneUp', [['phone', 1]]) });
        C.man(teen({ shirt: hd[2], hair: 'pony' }), { act: { a: aB, b: bB, pose: 'selfie_heart', t: 1.3, face }, run: { f: 0.62 }, fence: fence(1.35, 'phoneUp', [['phone', 1]]) });
        C.man(teen({ shirt: hd[3], hair: 'short', hat: rnd() < 0.5 ? 'beanie' : null, hatCol: pick(HOOD) }), { act: { a: -2.62, b: 4.78, pose: 'selfie_film', face: [1, 0.12] },
          run: { f: 0.6 }, fence: fence(-1.85, 'phoneUp', [['phone', 1]]) });
      } };
  }

  /* 1 · Ležalniki in senčniki (Big Sur, Harju): a family's day in the sun by the road: four on sun loungers in two pairs,
     each pair under a beach parasol (the backrests away from the road, the feet to it), a cooler between the pairs, a beach bag; one reads a
     book, one sips a can, one scrolls a phone, one lies flat asleep with a straw hat over the face; their kid splashes in a paddling pool by
     them, a striped swim ring floating beside it. As the car comes the kid and the two (the can, the phone) run to the fence; the reader
     stays on the lounger and only lowers the book to watch it, the sleeper sleeps on */
  {
    const MAT = new Map(), lamOf = (c) => { let m = MAT.get(c); if (!m) MAT.set(c, m = new THREE.MeshLambertMaterial({ color: c })); return m; };
    const GEO = new Map(), torusArc = (R, r, n) => { const k = R + ',' + r + ',' + n; let g = GEO.get(k); if (!g) GEO.set(k, g = new THREE.TorusGeometry(R, r, 5, 2, Math.PI * 2 / n)); return g; };
    // a sun lounger along local z (the feet end +z: towards the road), its origin on the ground under the sitter's hip: a light frame on four
    // legs, a striped pad on the flat part and on the backrest (hinged at z 0.04, raised by `back` radians, propped from the frame)
    const HS = 0.3, PAD = 0.075, ZH = 0.04, Z1 = 1.22, LB = 0.8;
    function plaza_lounger(frame, c1, c2, back) {
      const g = grp(), A = back;
      for (const x of [-0.29, 0.29]) { g.add(box(0.045, 0.05, Z1 + 0.45, frame, x, HS - 0.025, (Z1 - 0.45) / 2));
        for (const z of [-0.4, Z1 - 0.07]) g.add(box(0.045, HS - 0.05, 0.045, frame, x, (HS - 0.05) / 2, z)); }
      const n1 = 4, l1 = (Z1 - ZH) / n1; for (let k = 0; k < n1; k++) g.add(box(0.6, PAD, l1, k % 2 ? c2 : c1, 0, HS + PAD / 2, ZH + l1 * (k + 0.5)));
      const bk = grp(), n2 = 3, l2 = LB / n2; for (let k = 0; k < n2; k++) bk.add(box(0.6, PAD, l2, k % 2 ? c1 : c2, 0, PAD / 2, -l2 * (k + 0.5)));
      bk.position.set(0, HS, ZH); bk.rotation.x = A; g.add(bk);
      const yp = HS + (ZH + 0.4) * Math.tan(A) - 0.02; if (yp - (HS - 0.025) > 0.06) for (const x of [-0.27, 0.27]) g.add(bar([x, HS - 0.025, -0.4], [x, yp, -0.4], 0.035, frame));
      return g;
    }
    // a swim ring floating on the paddling pool's water (its top 0.315 m over the ground): striped arcs
    function plaza_ring(c1, c2) { const g = grp(), n = 8, inner = grp();
      for (let k = 0; k < n; k++) { const m = new THREE.Mesh(torusArc(0.3, 0.1, n), lamOf(k % 2 ? c2 : c1)); m.rotation.z = k / n * Math.PI * 2; inner.add(m); }
      inner.rotation.x = -Math.PI / 2; inner.position.y = 0.34; g.add(inner); return g; }
    // a beach bag (a tote: the body, a handle over each side)
    const plaza_bag = (c) => grp(box(0.42, 0.3, 0.18, c, 0, 0.15, 0), bar([-0.12, 0.3, 0.07], [0, 0.44, 0.07], 0.025, c), bar([0.12, 0.3, 0.07], [0, 0.44, 0.07], 0.025, c),
      bar([-0.12, 0.3, -0.07], [0, 0.44, -0.07], 0.025, c), bar([0.12, 0.3, -0.07], [0, 0.44, -0.07], 0.025, c));
    // a beach ball: two halves in two colours, a white band round it
    const plaza_ball = (c1, c2) => grp(sph(0.2, 8, 3, c1, 0, 0.2, 0, { half: true }), sph(0.2, 8, 3, c2, 0, 0.2, 0, { half: true, rx: Math.PI }), cyl(0.203, 0.203, 0.05, 8, 0xf2f2ee, 0, 0.2, 0));
    // an open book in the right hand: two halves in a shallow V round the spine, the pages to the reader (hand frame: fingers -y, palm in, +z forwards)
    ITEMX.plaza_book = (o) => { const c = o.c || 0xd8262a, g = grp(), b = grp();
      for (const s of [-1, 1]) { const h = grp(box(0.15, 0.22, 0.016, c, s * 0.075, 0, 0), box(0.14, 0.205, 0.006, 0xf4f1e6, s * 0.074, 0, 0.011)); h.rotation.y = -s * 0.32; b.add(h); }
      b.position.set(0.1, -0.06, 0.07); g.add(b); return g; };
    // a straw sun hat laid over the sleeper's face (a head thing: its frame in front of the face, +z out of it)
    ITEMX.plaza_hat = () => grp(cyl(0.21, 0.21, 0.018, 10, 0xe2c57e, 0, 0, 0, { rx: Math.PI / 2 }), cyl(0.1, 0.115, 0.1, 8, 0xe2c57e, 0, 0, 0.055, { rx: Math.PI / 2 }),
      cyl(0.118, 0.118, 0.032, 8, 0x9a3b2a, 0, 0, 0.02, { rx: Math.PI / 2 }));
    // reclined on a lounger (the root under the hip): the torso back on the backrest, the legs out on the pad
    const LOUNGE = { hy: 0.505, hp: [1.5, 1.42], kn: [0.06, 0.14], lean: -0.87, nod: 0.38 };
    const lounge = (j) => Object.assign({}, LOUNGE, j);
    POSEX.plaza_read = (t, s) => lounge({ nod: 0.62 + 0.04 * s, shz: [0.3, 0.3], shx: [0.55, 0.55], el: [1.75, 1.75], shy: [-0.45, -0.45] });
    POSEX.plaza_readUp = () => lounge({ nod: 0.3, shz: [0.25, 0.22], shx: [0.45, 0.4], el: [1.2, 1.3], shy: [-0.4, -0.45] });   // (the book lowered: watching the car)
    POSEX.plaza_drink = () => lounge({ shz: [0.22, 0.25], shx: [0.45, 0.5], el: [0.95, 1.15], shy: [-0.35, -0.2] });
    POSEX.plaza_sip = () => lounge({ nod: 0.2, shz: [0.22, 0.2], shx: [0.45, 0.65], el: [0.95, 2.3], shy: [-0.35, -0.1] });
    POSEX.plaza_phone = (t, s) => lounge({ nod: 0.62, shz: [0.28, 0.28], shx: [0.6, 0.6], el: [1.65 + 0.05 * s, 1.65], shy: [-0.5, -0.5] });
    // flat on the back (the backrest down), the hands folded on the belly
    POSEX.plaza_sun = () => ({ hy: 0.47, hp: [1.55, 1.5], kn: [0.02, 0.08], lean: -1.53, nod: 0, shz: [0.15, 0.15], shx: [0.15, 0.15], el: [1.3, 1.3], shy: [-1.4, -1.4] });
    // the kid kneeling in the paddling pool, slapping the water with one hand, then the other
    POSEX.plaza_splash = (t, s) => { const u = Math.max(0, s), v = Math.max(0, -s);
      return { hy: 0.53, hp: [0.12, 0.12], kn: [1.65, 1.65], lean: 0.32, nod: 0.25, dy: 0.03 * Math.abs(s), shz: [0.4, 0.4], shx: [0.55 + 1.6 * u, 0.55 + 1.6 * v], el: [0.35, 0.35] }; };
    Object.assign(MOTION, { plaza_read: { rate: 0.45 }, plaza_drink: { alt: 'plaza_sip', hz: 0.085 }, plaza_phone: { rate: 1.3 }, plaza_splash: { rate: 7.5 } });
    const PARA = [[0xd8262a, 0xf2f2ee], [0x2f63c9, 0xf2f2ee], [0xf0c22e, 0xf2f2ee], [0x22848f, 0xf2f2ee], [0xf07a1c, 0xf2f2ee], [0x2f9a48, 0xf0c22e]];
    const TOWEL = [0x2f63c9, 0xd8262a, 0xf0c22e, 0x22848f, 0xf07a1c, 0x8a3b8c, 0xe85a9a, 0x2f9a48];
    const SWIM = [0xd8262a, 0x2f63c9, 0xf0c22e, 0x22848f, 0xf07a1c, 0x8a3b8c, 0xe85a9a, 0x15171c, 0x2f9a48];
    const deal = (arr, n) => { const a = arr.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };

    S.plaza = { seed: 353, clear: [[-0.5, 4.5, 9.5]],
      build(C, F, K) {
        const B0 = 4.3, fr = pick([0xf2f2ee, 0xf2f2ee, 0xb8885a]), tw = deal(TOWEL, 4), p1 = pick(PARA), p2 = pick(PARA), sw = deal(SWIM, 5);
        const LO = [[-4.4, 0.7], [-3.3, 0.7], [0.4, 0.7], [1.5, 0.06]];   // (a, the backrest's angle: the sleeper's flat)
        LO.forEach(([a, bk], k) => C.prop(plaza_lounger(fr, tw[k], 0xf2f2ee, bk), a, B0));
        C.prop(L.parasol(p1[0], p1[1]), -3.85, B0 + 0.95); C.prop(L.parasol(p2[0], p2[1]), 0.95, B0 + 0.95);
        C.prop(L.cooler(pick([0x2f63c9, 0xd8262a, 0x2f9a48, 0xf2f2ee])), -1.5, B0 + 0.3, [1, 0]); C.prop(plaza_bag(pick(TOWEL)), -5.4, B0 + 0.55, 0.4);
        C.prop(L.kidPool(pick([0x2f8fe0, 0xe85a9a, 0xf0c22e])), 4.9, 3.6); C.prop(plaza_ring(pick([0xd8262a, 0xf07a1c, 0xe85a9a]), 0xf2f2ee), 5.35, 4.05);
        C.prop(plaza_ball(pick([0xd8262a, 0x2f63c9]), pick([0xf0c22e, 0x2f9a48])), 3.3, 2.3);
        const skin = () => pick(pal.SKIN);
        // the reader (stays: lowers the book), the one with a can, the one with a phone, the sleeper (stays, sleeps), the kid in the pool
        const s0 = skin(), s1 = skin(), s2 = skin(), s3 = skin(), s4 = skin(), book = [['plaza_book', 1, { c: pick([0xd8262a, 0x2f63c9, 0x2f9a48, 0xf0c22e]) }]];
        C.man({ skin: s0, shoes: s0, shirt: sw[0], pants: sw[0], shorts: true, hair: pick(['long', 'pony']) }, { act: { a: -4.4, b: B0, pose: 'plaza_read', face: [0, -1], hold: book },
          bliza: { pose: 'plaza_readUp', look: 'car' }, run: false, fence: { a: -4.4, b: B0, pose: 'plaza_readUp', face: [0, -1], look: 'car', hold: book } });
        C.man({ skin: s1, shoes: s1, shirt: s1, pants: sw[1], shorts: true, hair: pick(['short', 'bald']) }, { act: { a: -3.3, b: B0, pose: 'plaza_drink', face: [0, -1], hold: [['can', 1, { c: 0xd8262a }]] },
          fence: { a: -2.5, b: 0.9, pose: 'cheer', t: 0.7, hold: [['can', 1, { c: 0xd8262a }]] }, run: { f: 0.5 } });
        C.man({ skin: s2, shoes: s2, shirt: sw[2], pants: sw[3], shorts: true, hat: rnd() < 0.5 ? 'cap' : null, hatCol: pick(SWIM) }, { act: { a: 0.4, b: B0, pose: 'plaza_phone', face: [0, -1], hold: [['phone', 1]] },
          fence: { a: 0.2, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.45 } });
        C.man({ skin: s3, shoes: s3, shirt: s3, pants: sw[4], shorts: true }, { act: { a: 1.5, b: B0, pose: 'plaza_sun', face: [0, -1], look: 0, head: [['plaza_hat']], still: true }, run: false });
        C.man({ kid: true, skin: s4, shoes: s4, shirt: s4, pants: pick(SWIM), shorts: true }, { act: { a: 4.75, b: 3.5, y: 0.04, pose: 'plaza_splash', face: [-0.4, -1] }, fence: { a: 3.4, b: 0.85, pose: 'jump' }, run: { f: 0.85 }, kid: true });
      } };
  }

  /* 2 · Badminton in frizbi (Medvode, Mount Hotham): two friends play badminton over a net strung between two poles across the grass
     (the net at right angles to the road: the chase camera sees it face on, one player from behind, the other from the front), hitting in turn;
     two more watch from folding chairs on the far side, a can and a bottle in hand, a cooler between them; a third, on the grass before the
     court, winds up to throw a frisbee to the family's dog, which waits for it with another frisbee in its mouth (each where the chase camera
     sees it apart from the others). As the car comes they all run to the fence (the rackets, the frisbee still in hand) and the dog runs along
     with them */
  {
    const TAU = Math.PI * 2, ease = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
    // a pose from keyframes over the motion's cycle: [[f, joints], ...] (f 0..1 in order, the last back at the first), eased between
    const KEYS2 = ['shz', 'shx', 'shy', 'el', 'hp', 'hpz', 'kn'], KEYS1 = ['hy', 'hz', 'lean', 'tw', 'tz', 'look', 'nod', 'dy'];
    const DEF2 = { shz: [0.07, 0.09] }, DEF1 = { hy: 0.92 };
    function keyed(keys, t) {
      const f = ((t / TAU) % 1 + 1) % 1; let k = 0; while (k < keys.length - 2 && f >= keys[k + 1][0]) k++;
      const [f0, A] = keys[k], [f1, B] = keys[k + 1], u = ease((f - f0) / Math.max(1e-6, f1 - f0)), J = {};
      for (const n of KEYS2) { const a = A[n] || DEF2[n] || [0, 0], b = B[n] || DEF2[n] || [0, 0]; J[n] = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
      for (const n of KEYS1) { const a = A[n] != null ? A[n] : DEF1[n] || 0, b = B[n] != null ? B[n] : DEF1[n] || 0; J[n] = a + (b - a) * u; }
      return J;
    }
    // the overhead clear (the racket in the right hand): ready, the racket back behind the head and the free hand up at the shuttle, the hit
    // high in front, the follow-through across, back to ready with a little hop
    const READY = { hy: 0.87, hp: [0.32, 0.25], kn: [0.42, 0.38], lean: 0.18, shz: [0.3, 0.32], shx: [0.75, 0.9], el: [0.8, 0.95], nod: -0.1 };
    const HIT = [[0, READY],
      [0.32, { hy: 0.91, hp: [0.12, -0.12], kn: [0.15, 0.2], lean: -0.14, tw: -0.5, shz: [0.32, 0.5], shx: [2.25, 2.55], el: [0.2, 1.05], nod: -0.3 }],
      [0.44, { hy: 0.92, hp: [0.25, -0.2], kn: [0.1, 0.25], lean: 0.05, tw: 0.15, shz: [0.3, 0.22], shx: [1.0, 2.7], el: [0.35, 0.05], nod: -0.25, dy: 0.07 }],
      [0.56, { hy: 0.88, hp: [0.38, -0.05], kn: [0.3, 0.35], lean: 0.32, tw: 0.42, shz: [0.25, -0.12], shx: [0.45, 1.0], el: [0.45, 0.35], nod: 0.05 }],
      [1, READY]];
    POSEX.badminton_hit = (t) => keyed(HIT, t);
    // the frisbee's backhand throw (in the right hand): wound up across the chest, the arm out flat, the follow-through, back (now and
    // then only a feint: the dog never knows)
    const WIND = { hy: 0.9, hp: [0.3, -0.18], kn: [0.25, 0.3], lean: 0.12, tw: 0.62, shz: [0.55, -0.3], shx: [0.3, 1.25], shy: [0, 0.4], el: [0.4, 1.55], nod: 0.05 };
    const THROW = [[0, WIND], [0.5, WIND],
      [0.62, { hy: 0.89, hp: [0.35, -0.2], kn: [0.3, 0.3], lean: 0.2, tw: -0.5, shz: [0.6, 1.35], shx: [0.25, 1.05], shy: [0, 0.4], el: [0.4, 0.12], nod: -0.05 }],
      [0.78, { hy: 0.91, hp: [0.25, -0.12], kn: [0.2, 0.25], lean: 0.1, tw: -0.3, shz: [0.4, 1.0], shx: [0.2, 0.8], shy: [0, 0.4], el: [0.35, 0.3] }],
      [1, WIND]];
    POSEX.badminton_throw = (t) => keyed(THROW, t);
    const R_HIT = TAU / 2.6, R_THROW = TAU / 3.4;
    Object.assign(MOTION, { badminton_hit: { rate: R_HIT }, badminton_throw: { rate: R_THROW } });
    // a racket in the right hand (the hand's frame: fingers -y, palm in, +z forwards): the grip and the shaft along the forearm, tipped a
    // little forwards; the oval head (the strings light, the frame in a colour) in the plane of the palm
    ITEMX.badminton_racket = (o) => { const c = o.c || 0xd8262a, g = grp(), R = grp();
      R.add(cyl(0.017, 0.017, 0.2, 5, 0x22252b, 0, 0.08, 0), cyl(0.007, 0.007, 0.26, 4, 0x9aa0a8, 0, 0.31, 0), cyl(0.1, 0.1, 0.006, 10, 0xe8e8e2, 0, 0.58, 0, { rz: Math.PI / 2, s: [1.3, 1, 1] }));
      for (let k = 0; k < 10; k++) { const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU; R.add(bar([0, 0.58 + 0.13 * Math.cos(a0), 0.104 * Math.sin(a0)], [0, 0.58 + 0.13 * Math.cos(a1), 0.104 * Math.sin(a1)], 0.02, c)); }
      R.rotation.x = Math.PI - 0.5; R.position.set(0, 0.03, 0.02); g.add(R); return g; };
    // a frisbee held at its rim (its face in the plane of the palm)
    ITEMX.badminton_disc = (o) => grp(cyl(0.12, 0.112, 0.028, 10, o.c || 0xf07a1c, 0.0, -0.05, 0.12, { rz: Math.PI / 2 }));
    // the net across the grass along local z (from the near pole at the origin, Ln long; dy: the far pole's ground over the near one's): two
    // poles, the white top band, the mesh in strands, a guy line out from each pole
    function badminton_net(Ln, dy) {
      const g = grp(), H = 1.55, lo = 0.8, M = 0x2a2d33, Y = (z) => dy * z / Ln;
      for (const [z, y0, out] of [[0, 0, -1], [Ln, dy, 1]]) { g.add(cyl(0.03, 0.035, H + 0.06, 5, 0xe2e4e6, 0, y0 + (H + 0.06) / 2, z)); g.add(cyl(0.12, 0.12, 0.04, 6, 0x5b6068, 0, y0 + 0.02, z));
        g.add(bar([0, y0 + H + 0.04, z], [0, y0 + 0.02, z + out * 1.05], 0.012, 0xd9dde2)); }
      g.add(bar([0, H - 0.035, 0.03], [0, dy + H - 0.035, Ln - 0.03], 0.07, 0xf4f4f0));
      for (const h of [lo, lo + 0.25, lo + 0.5]) g.add(bar([0, h, 0.03], [0, dy + h, Ln - 0.03], 0.018, M));
      const n = Math.round(Ln / 0.38); for (let k = 1; k < n; k++) { const z = k * Ln / n; g.add(bar([0, Y(z) + lo, z], [0, Y(z) + H - 0.07, z], 0.016, M)); }
      return g;
    }
    // the players' sports bag (a racket's cover on it) and a tube of shuttles beside it
    const badminton_bag = (c) => grp(box(0.75, 0.3, 0.32, c, 0, 0.15, 0), box(0.77, 0.04, 0.12, 0x22252b, 0, 0.3, 0), box(0.25, 0.04, 0.42, 0x15171c, 0.12, 0.33, 0.04, { ry: 0.5 }),
      cyl(0.04, 0.04, 0.42, 6, 0xf4f4f0, 0.52, 0.04, 0.1, { rz: Math.PI / 2 }));
    // the dog's frisbee in its mouth (on L.dog: its head +z at 0.62 m)
    const dogDisc = (c) => grp(cyl(0.12, 0.112, 0.028, 10, c, 0, 0.555, 0.6, { rx: 0.25 }));
    // the rally in turn: World.people gives each person a random phase (addScene's rec: three rnd() each, d0, bd, ph, in the order of C.man,
    // right after the build), and the scene's generator is a known one (x' = 16807 x mod 2^31 - 1) whose next numbers follow from the
    // last; each player's act.t takes its own phase back out (poseOne: t' = act.t + (t + ph 17) rate), so the two swing half a cycle apart
    function inTurn(C, list, rate) {
      let x = Math.round(rnd() * 2147483647); const nx = () => (x = (x * 16807) % 2147483647) / 2147483647;
      const ph = C.people.map(() => { nx(); nx(); return nx(); });
      for (const [P, phase] of list) { const k = C.people.indexOf(P); if (k >= 0) P.st.act.t = phase - ph[k] * 17 * rate; }
    }
    const SPORT = [0xd8262a, 0x2f63c9, 0xf0c22e, 0x22848f, 0xf07a1c, 0x8a3b8c, 0x2f9a48, 0xefefea, 0xe85a9a], CHAIR = [0xd8262a, 0x2f9a48, 0xf0c22e, 0x2f63c9, 0x15171c, 0xf07a1c];
    const deal = (arr, n) => { const a = arr.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };

    S.badminton = { seed: 379, clear: [[-1.5, 6, 10.5]],
      build(C, F, K) {
        const B1 = 2.4, Ln = 6.0, sh = deal(SPORT, 5), ch = deal(CHAIR, 2), rc = deal([0xd8262a, 0x2f63c9, 0xf0c22e, 0x2f9a48, 0xf07a1c], 2), disc = deal([0xf07a1c, 0xf0c22e, 0xe85a9a, 0x22848f], 2);
        C.prop(badminton_net(Ln, F.y(0, B1 + Ln) - F.y(0, B1)), 0, B1, [0, 1]);
        C.prop(badminton_bag(pick([0x15171c, 0x2f3f63, 0xd8262a])), -1.1, 1.7, [1, 0.3]);
        C.prop(L.chair(ch[0]), 1.6, 9.4, [0.05, -1]); C.prop(L.chair(ch[1]), 2.9, 9.55, [-0.2, -1]); C.prop(L.cooler(pick([0x2f63c9, 0xd8262a, 0xf2f2f2])), 2.2, 10.3, [1, 0]);
        const dog = L.dog(pick([0x5c3a22, 0x2a221c, 0xc8a878, 0xe8e2d4])); dog.add(dogDisc(disc[1]));
        C.pet(dog, { act: { a: -9.6, b: 3.8, face: [0.62, 0.79] }, fence: { a: -4.6, b: 1.9, face: [1, -0.3] }, run: { f: 1.1 } });
        const look = (o) => Object.assign({ pants: pick(pal.PANTS), shorts: true, shoes: 0xf2f2ee }, o);
        // the two players (the near one from behind, the far one facing the camera), the two watching, the one with the frisbee
        const p1 = C.man(look({ shirt: sh[0], hair: pick(['short', 'pony']) }), { act: { a: -3.6, b: 5.0, pose: 'badminton_hit', face: [1, 0.02], hold: [['badminton_racket', 1, { c: rc[0] }]] },
          fence: { a: -3.2, b: 0.9, pose: 'cheer', t: 0.4, hold: [['badminton_racket', 1, { c: rc[0] }]] }, run: { f: 0.6 } });
        const p2 = C.man(look({ shirt: sh[1], hat: rnd() < 0.5 ? 'cap' : null, hatCol: pick(SPORT) }), { act: { a: 3.6, b: 5.8, pose: 'badminton_hit', face: [-1, -0.05], hold: [['badminton_racket', 1, { c: rc[1] }]] },
          fence: { a: 1.2, b: 0.9, pose: 'wave', t: 1.1, hold: [['badminton_racket', 1, { c: rc[1] }]] }, run: { f: 0.62 } });
        const can = [['can', 1, { c: pick([0xd8262a, 0x2f63c9, 0xc8c9cc]) }]];
        C.man(look({ shirt: sh[2], shorts: rnd() < 0.5, shoes: null }), { act: { a: 1.6, b: 9.4, pose: 'sitDrink', face: [0.05, -1], hold: can },
          fence: { a: 0.5, b: 0.9, pose: 'cheer', t: 1.6, hold: can }, run: { f: 0.62 } });   // (his place on his side of the net: his run misses it and its pole)
        C.man(look({ shirt: sh[3], hair: 'long', shorts: false, shoes: null }), { act: { a: 2.9, b: 9.55, pose: 'sitDrink', face: [-0.2, -1], hold: [['bottle', 1, { c: 0x8acbe8 }]] },
          fence: { a: 2.8, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.58 } });
        C.man(look({ shirt: sh[4], hat: 'cap', hatCol: pick(SPORT) }), { act: { a: -6.0, b: 8.4, pose: 'badminton_throw', face: [-0.62, -0.79], hold: [['badminton_disc', 1, { c: disc[0] }]] },
          fence: { a: -5.6, b: 0.9, pose: 'wave', t: 0.3, hold: [['badminton_disc', 1, { c: disc[0] }]] }, run: { f: 0.55 } });
        inTurn(C, [[p1, 0], [p2, Math.PI]], R_HIT);
      } };
  }

  /* 1 · Na lestvah in tovornjaku (Great Alpine Road, Katu-Jaryk): five fans who brought their own height to see over the fence: one leans
     on the rail of a platform ladder, one on a stepladder scans the road with binoculars, three stand on the bed of a pickup parked behind them
     (a cooler, the country's flag on a pole). Nobody runs: as the car comes they turn to it where they stand, and cheer and wave as it passes */
  const lestveTYRE = 0x16171a, lestveDARK = 0x27313c, lestveBLK = 0x1d1f25;
  const lestveWheel = (r, w, x, y, z) => grp(cyl(r, r, w, 10, lestveTYRE, x, y, z, { rx: Math.PI / 2 }), cyl(r * 0.58, r * 0.58, w + 0.02, 7, 0xb9bec6, x, y, z, { rx: Math.PI / 2 }));
  // a platform ladder: an A-frame, its steps on the back (-z), the platform at hp, a guard round it; one leans on its front rail (+z, the road)
  const lestvePodest = (col, hp) => {
    const g = grp(), st = 0x8f949b, zb = -0.32, zf = 0.45, run = hp * 0.27, gh = 1.21;
    for (const x of [-0.3, 0.3]) {
      g.add(bar([x * 1.12, 0, zb - run], [x, hp, zb], 0.075, col)); g.add(bar([x * 1.12, 0, zf + run], [x, hp, zf], 0.075, col));   // (the rails, the legs)
      for (const z of [zb, zf]) g.add(bar([x * 1.2, hp - 0.03, z], [x * 1.2, hp + gh, z], 0.06, col));   // (the guard's posts)
      g.add(bar([x * 1.2, hp + gh, zb], [x * 1.2, hp + gh, zf], 0.06, col)); g.add(bar([x * 1.2, hp + 0.55, zb], [x * 1.2, hp + 0.55, zf], 0.045, col));
    }
    g.add(bar([-0.39, hp + gh, zf], [0.39, hp + gh, zf], 0.065, col)); g.add(bar([-0.37, hp + 0.55, zf], [0.37, hp + 0.55, zf], 0.045, col));
    for (let k = 1; k <= 3; k++) { const y = k * hp / 4; g.add(box(0.66, 0.045, 0.15, st, 0, y, zb - run * (1 - y / hp))); }
    g.add(box(0.7, 0.07, zf - zb + 0.06, st, 0, hp - 0.035, (zb + zf) / 2));   // (the platform: its top at hp)
    return g;
  };
  // a stepladder: an A-frame, the steps on its back (-z), the top cap at h (one stands on the fourth step, the cap at the thighs)
  const lestveLestev = (col, h) => {
    const g = grp(), run = h * 0.28;
    for (const x of [-0.25, 0.25]) { g.add(bar([x * 1.3, 0, -0.06 - run], [x, h, -0.06], 0.075, col)); g.add(bar([x * 1.3, 0, 0.06 + run], [x, h, 0.06], 0.07, col)); }
    for (let k = 1; k <= 5; k++) { const y = k * h / 6, f = 1 - y / h; g.add(box(0.52 + 0.16 * f, 0.05, 0.14, 0xc3c8ce, 0, y, -0.06 - run * f)); }
    g.add(box(0.62, 0.1, 0.32, lestveBLK, 0, h + 0.02, 0));
    for (const x of [-0.27, 0.27]) g.add(bar([x * 1.1, h * 0.42, -0.06 - run * 0.58], [x * 1.1, h * 0.42, 0.06 + run * 0.58], 0.025, lestveBLK));   // (the spreaders)
    return g;
  };
  // a plain pickup along x (front +x), the bed's floor at 0.96 (no badge, no writing); the flag on a pole at the bed's front corner (-z)
  const lestvePickup = (col, flag) => {
    const g = grp(), W = 1.9;
    g.add(box(5.3, 0.44, W, col, 0, 0.72, 0));   // (the body: 0.5-0.94)
    g.add(box(3.15, 0.18, W, col, 1.075, 1.03, 0));   // (the hood and the cab's waist)
    g.add(box(1.5, 0.74, W - 0.06, col, 0.25, 1.49, 0)); g.add(box(1.3, 0.42, W - 0.04, lestveDARK, 0.27, 1.56, 0));   // (the cab, its windows)
    g.add(box(0.06, 0.82, W - 0.14, lestveDARK, 1.28, 1.47, 0, { rz: 0.64 })); g.add(box(0.4, 0.82, W - 0.06, col, 1.096, 1.332, 0, { rz: 0.64 }));   // (the windscreen, the pillars behind it)
    g.add(box(0.03, 0.36, 1.4, lestveDARK, -0.505, 1.56, 0));
    g.add(box(2.1, 0.02, W - 0.2, lestveBLK, -1.58, 0.95, 0));   // (the bed: its liner, its walls and the tailgate)
    for (const z of [0.91, -0.91]) g.add(box(2.15, 0.36, 0.08, col, -1.575, 1.12, z));
    g.add(box(0.08, 0.36, W, col, -2.61, 1.12, 0));
    for (const x of [1.65, -1.65]) for (const z of [0.82, -0.82]) g.add(lestveWheel(0.42, 0.28, x, 0.42, z));
    for (const x of [1.65, -1.65]) for (const z of [0.96, -0.96]) g.add(box(1.05, 0.1, 0.06, lestveBLK, x, 0.9, z));   // (the arches' flares)
    g.add(box(0.14, 0.2, W + 0.04, 0xb9bec6, 2.69, 0.6, 0)); g.add(box(0.14, 0.2, W + 0.04, lestveBLK, -2.69, 0.6, 0));   // (the bumpers)
    g.add(box(0.04, 0.26, 1.0, lestveBLK, 2.665, 0.84, 0));
    for (const z of [0.7, -0.7]) { g.add(box(0.04, 0.14, 0.3, 0xf6f2dc, 2.665, 0.86, z, { basic: true })); g.add(box(0.03, 0.22, 0.1, 0xb01515, -2.66, 1.1, z * 1.3)); }
    const fp = L.flagPole(flag, 3.3); fp.position.set(-0.68, 0.96, -0.84); fp.rotation.y = Math.PI; g.add(fp);   // (streaming back over the bed)
    return g;
  };
  // binoculars at the eyes (both hands): the arms solved for the hands at the eyes' height, the torso scanning slowly; the binoculars in the
  // right hand's frame of that pose (made as they sit before the eyes, then moved into the hand)
  POSEX.lestve_dalj = (t, s) => ({ shz: [0.172, 0.172], shx: [1.319, 1.319], shy: [-0.469, -0.469], el: [1.956, 1.956], tw: 0.2 * s, nod: -0.03 });
  MOTION.lestve_dalj = { rate: 0.45 };
  ITEMX.lestve_dalj = () => {
    const k = 0x2a2c31, g = grp(cyl(0.036, 0.03, 0.15, 7, k, -0.04, 0, 0, { rx: Math.PI / 2 }), cyl(0.036, 0.03, 0.15, 7, k, 0.04, 0, 0, { rx: Math.PI / 2 }), box(0.06, 0.035, 0.07, k, 0, 0, -0.01));
    g.position.set(0.039, -0.093, -0.021); g.rotation.set(-2.982, -0.113, 0.628); return grp(g);
  };
  S.lestve = { seed: 233, clear: [[0, 4, 10], [-8, 5, 6]],
    build(C, F, K) {
      const wrap = (x) => x - Math.PI * 2 * Math.round(x / (Math.PI * 2)), up = wrap(F.yaw(-0.9, -1) - F.yaw(-0.25, -1));   // (on the stepladder: turned up the road, to where the car comes from)
      const low = (a, b, da, db) => { let m = 1e9; for (const sa of [-1, 1]) for (const sb of [-1, 1]) m = Math.min(m, F.y(a + sa * da, b + sb * db)); return F.y(a, b) - m; };   // (on a slope: the lowest foot on the ground)
      const pk = lestvePickup(pick([0xf0f0ea, 0xb3241f, 0x253a63, 0xa9aeb5, 0x2f5a3a, 0xc8b070]), K.flag), cl = L.cooler(pick([0xd8262a, 0x2f63c9, 0xf2f2f2]));
      cl.position.set(-2.2, 0.96, -0.5); pk.add(cl);   // (the cooler on the bed)
      const mx = F.side > 0 ? -1 : 1; pk.scale.x = mx;   // (mirrored on the right: its bed towards the coming car, the cab ahead)
      C.prop(pk, -3.4, 4.3, [0, -1], 'pk', low(-3.4, 4.3, 1.7, 0.85));
      const H1 = 1.4, H2 = 2.1;
      C.prop(lestvePodest(0xe9b51c, H1), 2.0, 1.6, [0, -1], 'ld1', low(2.0, 1.6, 0.45, 0.8));
      C.prop(lestveLestev(0xe2621e, H2), 5.6, 3.3, [-0.25, -1], 'ld2', low(5.6, 3.3, 0.45, 0.7));   // (further back: the two not one behind the other)
      C.prop(L.chair(pick([0x2f63c9, 0x2f9a48, 0xd8262a])), -0.2, 6.6, [0.3, -1]); C.prop(L.chair(pick([0xf0c22e, 0x15171c, 0xf07a1c])), 0.7, 6.9, [-0.2, -1]);
      C.prop(L.crates(2, [0xe0b020, 0xe0b020]), 1.6, 6.4, [0, -1]);
      const S1 = pal.SHIRT, P1 = pal.PANTS, can = [['can', 1, { c: pick([0xc8c9cc, 0xd8262a, 0x2f63c9]) }]];
      C.man({ shirt: pick(S1), pants: pick(P1), shorts: true, hat: 'cap', hatCol: pick(S1) }, { act: { on: 'ld1', a: 0, b: -0.12, y: H1, pose: 'fence' },
        bliza: { look: 'car' }, run: false, fence: { on: 'ld1', a: 0, b: -0.12, y: H1, pose: 'fenceWave', t: 0.4, look: 'car' } });
      C.man({ shirt: pick(S1), pants: pick(P1), long: true, hat: 'cap', hatCol: pick(S1) }, { act: { on: 'ld2', a: 0, b: -0.3, y: H2 * 4 / 6, yaw: up, pose: 'lestve_dalj', hold: [['lestve_dalj', 1]] },
        bliza: { pose: 'stand', yaw: 0, look: 'car', hold: [['lestve_dalj', 1]] }, run: false, fence: { on: 'ld2', a: 0, b: -0.3, y: H2 * 4 / 6, pose: 'cheer', t: 1.1, look: 'car', hold: [['lestve_dalj', 1]] } });
      const Y = 0.96;
      C.man({ shirt: pick(S1), pants: pick(P1), hair: 'short' }, { act: { on: 'pk', a: -0.9, b: 0.45, y: Y, pose: 'arms' },
        bliza: { look: 'car' }, run: false, fence: { on: 'pk', a: -0.9, b: 0.45, y: Y, pose: 'cheer', t: 0.3, look: 'car' } });
      C.man({ shirt: pick(S1), pants: pick(P1), hair: 'long' }, { act: { on: 'pk', a: -1.65, b: -0.15, y: Y, pose: 'drink', hold: can },
        bliza: { pose: 'stand', look: 'car' }, run: false, fence: { on: 'pk', a: -1.65, b: -0.1, y: Y, pose: 'wave', t: 0.9, look: 'car', hold: can } });
      C.man({ kid: true, shirt: pick(S1), pants: pick(P1), shorts: true, hat: 'cap', hatCol: pick(S1) }, { act: { on: 'pk', a: -2.3, b: 0.35, y: Y, yaw: 1.2 * mx, pose: 'talk' },
        bliza: { pose: 'stand', yaw: 0, look: 'car' }, run: false, fence: { on: 'pk', a: -2.3, b: 0.4, y: Y, pose: 'jump', look: 'car' }, kid: true });
    } };

  /* 2 · Motoristi (Rio do Rastro, Vršič, Great Alpine Road): riders in dark leathers have stopped in a gravel lay-by, four road bikes parked side by
     side: one polishes his tank, one sits on his bike with his helmet on, two talk with cans (one his helmet in his hand), the pillion looks at
     her phone. As the car comes they walk to the fence and wave (the pillion films it); the one on his bike stays in the saddle and waves */
  const motoTYRE = 0x16171a, motoDK = 0x2a2c31, motoMET = 0xb9bec6, motoVIS = 0x1a1d24, motoGRAVEL = 0x857f72;
  const motoKaciga = (c) => grp(sph(0.15, 8, 5, c, 0, 0, 0, { s: [0.95, 1, 1.1] }), box(0.19, 0.075, 0.05, motoVIS, 0, 0.0, 0.15));   // (a helmet lying about)
  // a plain road bike along x (front +x; no badge, no writing): the seat's top at 0.79, the grips at (0.52, 1.04, ±0.33), the tank's top ~1.0;
  // o.lean: parked on its side stand, leaning to -z; o.helmet: [x, y, z] where its rider's helmet lies (the seat, the tank)
  const motoMotor = (col, o) => {
    o = o || {}; const g = grp(), r = 0.31;
    for (const x of [-0.72, 0.72]) { g.add(cyl(r, r, 0.13, 10, motoTYRE, x, r, 0, { rx: Math.PI / 2 })); g.add(cyl(0.19, 0.19, 0.14, 6, motoDK, x, r, 0, { rx: Math.PI / 2 })); }
    g.add(box(0.5, 0.34, 0.3, 0x4a4d52, 0.02, 0.5, 0)); g.add(bar([0.6, 1.0, 0], [-0.25, 0.55, 0], 0.08, motoDK));   // (the engine, the frame)
    g.add(box(0.52, 0.2, 0.34, col, 0.22, 0.9, 0, { rz: -0.1 })); g.add(box(0.58, 0.08, 0.28, 0x15171c, -0.38, 0.75, 0));   // (the tank, the seat)
    g.add(box(0.42, 0.13, 0.2, col, -0.78, 0.83, 0, { rz: 0.22 })); g.add(box(0.04, 0.05, 0.12, 0xb01515, -0.99, 0.92, 0));   // (the tail, its lamp)
    for (const z of [0.1, -0.1]) g.add(bar([-0.2, 0.48, z], [-0.72, r, z], 0.05, motoDK));   // (the swingarm)
    for (const z of [0.09, -0.09]) g.add(bar([0.74, r, z], [0.57, 1.0, z], 0.045, motoMET));   // (the fork)
    g.add(box(0.05, 0.05, 0.72, motoDK, 0.52, 1.04, 0)); g.add(box(0.36, 0.03, 0.14, col, 0.74, 0.63, 0));   // (the handlebar, the mudguard)
    g.add(box(0.2, 0.32, 0.42, col, 0.68, 0.98, 0, { rz: 0.3 })); g.add(box(0.03, 0.22, 0.34, 0x56616d, 0.62, 1.24, 0, { rz: 0.45 }));   // (the fairing, its screen)
    g.add(box(0.03, 0.09, 0.2, 0xe8e4d4, 0.79, 0.95, 0, { rz: 0.3 })); g.add(cyl(0.065, 0.065, 0.55, 7, motoMET, -0.48, 0.42, 0.17, { rz: Math.PI / 2 - 0.2 }));   // (the lamp, the exhaust)
    if (o.helmet) { const h = motoKaciga(o.hcol || 0xf2f2f2); h.position.set(o.helmet[0], o.helmet[1], o.helmet[2]); h.rotation.y = 1.2; g.add(h); }
    if (!o.lean) return grp(g);
    g.add(bar([-0.02, 0.4, -0.12], [-0.12, 0.36 * Math.tan(0.12), -0.36], 0.03, motoDK)); g.rotation.x = -0.12;   // (on its stand: the stand's foot on the ground)
    return grp(g);
  };
  // a full-face helmet worn (a head thing: its frame 0.12 over the head's foot and 0.14 before it), one carried by the chin strap, a cloth
  ITEMX.moto_kaciga = (o) => grp(sph(0.168, 8, 6, o.c || 0xd8262a, 0, 0.0, -0.13, { s: [0.92, 1.0, 1.08] }), box(0.2, 0.075, 0.05, motoVIS, 0, 0.01, 0.04));
  ITEMX.moto_kacigaR = (o) => grp(sph(0.15, 8, 5, o.c || 0xf2f2f2, 0, -0.2, 0.03, { s: [0.95, 1, 1.1] }), box(0.18, 0.07, 0.04, motoVIS, 0, -0.2, 0.19));
  ITEMX.moto_krpa = () => grp(box(0.13, 0.04, 0.17, 0xf0c22e, 0, -0.04, 0.03));
  // astride (the arms solved for the grips: the seat's top 0.79 under the hips, the rider's root 0.276 over the bike's foot at x -0.15), and
  // waving from the saddle (the left hand stays on its grip); polishing the tank with both hands, each wiping a small circle (the joints of
  // the circle's middle and their change for 6 cm across and 5 cm forwards, solved on the figure)
  const motoSedi = { hy: 0.62, hp: [0.3, 0.3], kn: [0.4, 0.4], hpz: [0.2, 0.2], lean: 0.4, shz: [0.95, 0.95], shx: [1.3, 1.3], shy: [-0.2, -0.2], el: [0.125, 0.125] };
  POSEX.moto_sedi = () => Object.assign({}, motoSedi);
  POSEX.moto_sediMaha = (t, s) => Object.assign({}, motoSedi, { lean: 0.4, shz: [0.95, 2.35 + 0.25 * s], shx: [1.3, 0.2], shy: [-0.2, 0], el: [0.125, 0.55] });
  RATE.moto_sediMaha = 7.5;
  const motoP0 = [0.384, 0.725, -0.744, 1.291], motoPX = [0.219, -0.031, 0.112, 0.044], motoPZ = [-0.125, 0.081, 0.069, -0.172];
  POSEX.moto_polira = (t) => { const c = Math.cos(t), s = Math.sin(t), J = { hy: 0.9, lean: 0.4, hz: -0.04, nod: 0.25 }, k = ['shz', 'shx', 'shy', 'el'];
    k.forEach((n, i) => { J[n] = [motoP0[i] - motoPX[i] * c - motoPZ[i] * s, motoP0[i] + motoPX[i] * c + motoPZ[i] * s]; }); return J; };
  MOTION.moto_polira = { rate: 4.2 };
  S.motoristi = { seed: 251, clear: [[0, 3.5, 9.5], [-8, 3.5, 5]],
    build(C, F, K) {
      const fw = (fa, fb) => { const l = Math.hypot(fa, fb); return [-F.side * fb / l, F.side * fa / l]; };   // (the dir that turns a model's +x, its front, to (fa, fb))
      const mz = F.side > 0 ? -1 : 1;   // (mirrored on the right: the bikes lean towards the coming car, the side their riders stand on)
      // the lay-by: one slab of gravel laid on the ground's plane there (its slopes along and across), raised so the ground does not show
      // through it, its top 5 cm over that; onTop: how high the slab's top is over the ground at a place (the bikes and the riders stand on it).
      // K.lay false: a place that has its own (a parking place's gravel)
      const lay = { a: -0.6, b: 3.55, L: 12, W: 4.5 }, sa = (F.y(lay.a + 5, lay.b) - F.y(lay.a - 5, lay.b)) / 10, sb = (F.y(lay.a, lay.b + 1.8) - F.y(lay.a, lay.b - 1.8)) / 3.6;
      const plane = (a, b) => F.y(lay.a, lay.b) + sa * (a - lay.a) + sb * (b - lay.b);
      let up = 0; for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) { const a = lay.a + i * lay.L / 6.4, b = lay.b + j * lay.W / 4.4; up = Math.max(up, F.y(a, b) - plane(a, b)); }
      up = Math.min(up, 0.2); const onTop = (a, b) => K.lay === false ? 0 : plane(a, b) + up + 0.05 - F.y(a, b);
      if (K.lay !== false) { const slab = grp(box(lay.L, 0.42, lay.W, motoGRAVEL, 0, -0.16, 0)); slab.rotation.order = 'YXZ'; slab.rotation.z = Math.atan(-F.side * sa); slab.rotation.x = Math.atan(sb);
        C.prop(slab, lay.a, lay.b, [0, -1], null, -up); }
      const PC = [0xc8201c, 0x15171c, 0xe8e8e4, 0x1f4aa8, 0xf0c22e, 0xf07a1c, 0x2f7a3a, 0x9aa0a8], cols = [];
      for (let k = 0; k < 4; k++) { let c; do c = pick(PC); while (cols.includes(c)); cols.push(c); }
      const park = [[-3.7, 3.2], [-1.8, 3.45], [0.1, 3.45]], f0 = [0.5, 0.87];   // (three backed in, their fronts away from the road)
      const hcol = [0xf2f2f2, pick([0x15171c, 0xd8262a, 0x1f4aa8]), 0xf0c22e];
      park.forEach(([a, b], k) => { const m = motoMotor(cols[k], { lean: true, helmet: k === 1 ? [-0.36, 0.94, 0] : k === 2 ? [0.25, 1.15, 0] : null, hcol: hcol[k] });
        m.scale.z = mz; C.prop(m, a, b, fw(f0[0], f0[1]), null, -onTop(a, b)); });
      const m4 = motoMotor(cols[3]); C.prop(m4, 2.7, 3.0, fw(-0.55, -0.83), 'bk', -onTop(2.7, 3.0));   // (the fourth faces the road: its rider in the saddle)
      const LEA = { pants: 0x15171c, long: true, shoes: 0x15171c };
      // the polisher at the first bike's tank, on its near side (towards the coming car), facing it
      const [pa, pb] = park[0], ux = -f0[1], uz = f0[0], px = pa + 0.2 * f0[0] + 0.52 * ux, pz = pb + 0.2 * f0[1] + 0.52 * uz;
      C.man(Object.assign({ shirt: 0x1d1f25, hair: 'short' }, LEA), { act: { a: px, b: pz, y: onTop(px, pz), pose: 'moto_polira', face: [-ux, -uz], hold: [['moto_krpa', 1]] },
        run: { f: 0.45, pose: 'walk', hold: [['moto_krpa', 1]] }, fence: { a: -5.4, b: 1.0, pose: 'wave', t: 0.3, hold: [['moto_krpa', 1]] } });   // (past his bike: his walk does not go through it)
      C.man(Object.assign({ shirt: 0x3a2a22, hair: 'bald' }, LEA), { act: { a: -1.4, b: 1.75, y: onTop(-1.4, 1.75), pose: 'talk', face: [1, 0.15], hold: [['can', 1, { c: 0xc8c9cc }], ['moto_kacigaR', 0, { c: hcol[0] }]] },
        run: { f: 0.45, pose: 'walk' }, fence: { a: -1.5, b: 0.9, pose: 'wave', t: 1.1, hold: [['can', 1, { c: 0xc8c9cc }], ['moto_kacigaR', 0, { c: hcol[0] }]] } });
      C.man(Object.assign({ shirt: 0xa8241f, hair: 'short' }, LEA), { act: { a: -0.2, b: 1.85, y: onTop(-0.2, 1.85), pose: 'drink', face: [-1, -0.1], hold: [['can', 1, { c: 0xd8262a }]] },
        run: { f: 0.45, pose: 'walk' }, fence: { a: -0.2, b: 0.95, pose: 'wave2', t: 0.5, hold: [['can', 1, { c: 0xd8262a }]] } });
      C.man(Object.assign({ shirt: 0x23262c, hair: 'pony', scale: 0.93 }, LEA), { act: { a: 1.2, b: 2.6, y: onTop(1.2, 2.6), pose: 'phone', face: [-0.3, -1], hold: [['phone', 1]] },
        run: { f: 0.45, pose: 'walk' }, fence: { a: 1.2, b: 0.9, pose: 'phoneUp', hold: [['phone', 1]] } });
      const kc = [['moto_kaciga', 0, { c: cols[3] === 0x15171c ? 0xf2f2f2 : cols[3] }]];
      C.man(Object.assign({ shirt: 0x2f3f63, hair: 'bald', gloves: 0x15171c }, LEA), { act: { on: 'bk', a: -0.15, b: 0, y: 0.276, yaw: Math.PI / 2, pose: 'moto_sedi', head: kc },
        bliza: { look: F.side > 0 ? 0.6 : -0.6 }, run: false, fence: { on: 'bk', a: -0.15, b: 0, y: 0.276, yaw: Math.PI / 2, pose: 'moto_sediMaha', look: F.side > 0 ? 0.6 : -0.6, head: kc } });   // (only his head to the car: his hands stay on the grips)
    } };

  /* 1 · Reševalna postaja (Spa, Bathurst, Suzuka: behind the barrier where the cars brake for a corner) — the ambulance parked with its
     rear to the coming cars, both rear doors swung open, a stretcher on wheels beside it, the orange spine board against its side, a medical
     bag by the step; one paramedic sits on the rear sill with the radio (now and then at his mouth), one talks to him across the stretcher
     with her bag, the driver has a coffee by the cab. Staff: as the car comes they look at it (the one with the bag steps out towards the
     barrier), nobody runs. The ambulance plain white with a green band and a yellow stripe, no emblem (the red cross is protected) */
  const resevalci_fwd = (m) => { m.rotation.y = -Math.PI / 2; return grp(m); };   // (a model with its front to +x in a group whose +z it is: C.prop's dir)
  const resevalci_wheel = (x, z) => grp(cyl(0.34, 0.34, 0.22, 9, 0x16171a, x, 0.34, z, { rx: Math.PI / 2 }), cyl(0.19, 0.19, 0.24, 6, 0xb9bec6, x, 0.34, z, { rx: Math.PI / 2 }));
  function resevalci_ambulance() {   // a box van (front +x, 4.4 x 1.85 m) with its rear 0.6 m open: the floor at 0.78 m, grey walls inside, two doors swung open
    const WH = 0xf2f2ee, GR = 0x2a9a3a, YE = 0xf2c21a, GL = 0x27313c, IN = 0x9aa0a8, g = grp(
      box(3.8, 1.0, 1.85, WH, 0.3, 0.85, 0), box(3.8, 0.95, 1.85, WH, 0.3, 1.82, 0), box(4.3, 0.12, 1.75, WH, 0, 2.35, 0),   // (the body to x -1.6, its roof)
      box(0.6, 1.95, 0.06, WH, -1.9, 1.32, 0.895), box(0.6, 1.95, 0.06, WH, -1.9, 1.32, -0.895), box(0.6, 0.1, 1.85, WH, -1.9, 2.24, 0), box(0.6, 0.43, 1.85, WH, -1.9, 0.565, 0),   // (the open rear: walls, roof, floor)
      box(0.6, 1.4, 0.02, IN, -1.9, 1.48, 0.855), box(0.6, 1.4, 0.02, IN, -1.9, 1.48, -0.855), box(0.6, 0.02, 1.7, 0xc9ccd2, -1.9, 2.18, 0), box(0.6, 0.02, 1.7, 0x5b6068, -1.9, 0.785, 0),
      box(0.02, 1.4, 1.7, 0x30353d, -1.61, 1.48, 0), box(0.25, 0.7, 0.5, 0xd9dde2, -1.74, 1.75, 0.58),   // (the dark back of the inside, a cupboard)
      box(3.79, 0.22, 1.87, GR, 0.315, 1.2, 0), box(3.79, 0.07, 1.87, YE, 0.315, 1.03, 0), box(0.6, 0.22, 0.06, GR, -1.9, 1.2, 0.905), box(0.6, 0.22, 0.06, GR, -1.9, 1.2, -0.905),
      box(0.6, 0.07, 0.06, YE, -1.9, 1.03, 0.905), box(0.6, 0.07, 0.06, YE, -1.9, 1.03, -0.905),
      box(0.05, 0.62, 1.6, GL, 2.21, 1.82, 0), box(0.9, 0.5, 1.87, GL, 1.55, 1.85, 0), box(0.6, 0.35, 1.87, 0xc9d4de, -0.6, 1.95, 0),   // (the windscreen, the cab's side windows, a frosted one)
      box(0.06, 0.14, 0.3, 0xf6f2dc, 2.21, 0.95, 0.62, { basic: true }), box(0.06, 0.14, 0.3, 0xf6f2dc, 2.21, 0.95, -0.62, { basic: true }), box(0.3, 0.1, 1.2, 0x15171c, 1.6, 2.45, 0),
      box(0.28, 0.1, 0.4, 0x2f6bff, 1.6, 2.53, 0.35, { basic: true }), box(0.28, 0.1, 0.4, 0x2f6bff, 1.6, 2.53, -0.35, { basic: true }),
      box(0.12, 0.12, 0.2, 0x2f6bff, -2.15, 2.36, 0.72, { basic: true }), box(0.12, 0.12, 0.2, 0x2f6bff, -2.15, 2.36, -0.72, { basic: true }),
      box(0.36, 0.08, 1.7, 0x4a4f57, -2.38, 0.36, 0), box(0.05, 0.05, 1.75, 0xb9bec6, -2.2, 0.79, 0),   // (the rear step, its top at 0.4 m; the sill)
      resevalci_wheel(1.45, 0.85), resevalci_wheel(1.45, -0.85), resevalci_wheel(-1.2, 0.85), resevalci_wheel(-1.2, -0.85));
    for (const sz of [1, -1]) {   // (the doors swung ~145° about the rear corners: their insides to the coming cars)
      const th = 2.53, dx = -Math.sin(th), dz = -sz * Math.cos(th), w = 0.86, cx = -2.2 + dx * w / 2, cz = sz * 0.9 + dz * w / 2, o = { ry: Math.atan2(dx, dz) };
      g.add(box(0.05, 1.42, w, WH, cx, 1.49, cz, o)); g.add(box(0.07, 0.22, w, GR, cx, 1.2, cz, o)); g.add(box(0.07, 0.07, w, YE, cx, 1.03, cz, o)); g.add(box(0.07, 0.4, w * 0.62, GL, cx, 1.86, cz, o));
    }
    return g;
  }
  function resevalci_stretcher() {   // along x (its head +x): the frame on crossed legs, four castors, the mattress (its head raised), a pillow, a folded blanket
    const AL = 0xb9bec6, MAT = 0xe0602a, g = grp(box(1.96, 0.05, 0.58, AL, 0, 0.8, 0), box(1.32, 0.11, 0.54, MAT, -0.32, 0.88, 0), box(0.62, 0.11, 0.54, MAT, 0.61, 1.04, 0, { rz: 0.55 }),
      box(0.22, 0.09, 0.42, 0xf2f2ee, 0.71, 1.2, 0, { rz: 0.55 }), box(0.44, 0.07, 0.56, 0xe9ebee, -0.72, 0.97, 0));
    for (const z of [0.26, -0.26]) {
      g.add(bar([-0.62, 0.1, z], [0.62, 0.78, z], 0.035, AL)); g.add(bar([0.62, 0.1, z], [-0.62, 0.78, z], 0.035, AL)); g.add(box(1.42, 0.035, 0.035, AL, 0, 0.1, z));
      for (const x of [-0.7, 0.7]) g.add(cyl(0.065, 0.065, 0.04, 6, 0x16171a, x, 0.065, z, { rx: Math.PI / 2 }));
      g.add(box(1.3, 0.03, 0.03, AL, -0.25, 0.97, z * 1.12));
    }
    return g;
  }
  function resevalci_board() {   // the spine board leaning on a wall at -z (its foot at the origin): orange, three black straps
    const b = grp(box(0.44, 1.8, 0.05, 0xf07a1c, 0, 0.9, 0)); for (const y of [0.45, 1.0, 1.5]) b.add(box(0.46, 0.07, 0.07, 0x15171c, 0, y, 0));
    b.rotation.x = -0.2; return grp(b);
  }
  // the driver's coffee: the cup up to the mouth now and then, held at the chest between (and as he watches the car)
  POSEX.resevalci_kava = () => ({ shz: [0.1, 0.2], shx: [0, 0.55], el: [0.1, 2.25] });
  POSEX.resevalci_kavaDol = () => ({ shz: [0.1, 0.16], shx: [0.02, 0.5], el: [0.12, 1.35] });
  MOTION.resevalci_kavaDol = { alt: 'resevalci_kava', hz: 0.09 };
  S.resevalci = { seed: 263, clear: [[-0.5, 4.8, 10]],
    build(C, F, K) {
      const a0 = 0.4, b0 = 5.2, hl = Math.hypot(1, 0.3), H = [1 / hl, 0.3 / hl], Lr = [H[1], -H[0]];   // (its front ahead and a little away from the road)
      const P = (u, v) => [a0 + H[0] * u + Lr[0] * v, b0 + H[1] * u + Lr[1] * v], to = (p, q) => [q[0] - p[0], q[1] - p[1]];   // (u along the ambulance, + its front; v across, + to the road)
      const g0 = F.y(a0, b0), lo = Math.min(...[[1.45, 0.85], [1.45, -0.85], [-1.45, 0.85], [-1.45, -0.85]].map(([u, v]) => F.y(...P(u, v))));
      C.prop(resevalci_fwd(resevalci_ambulance()), a0, b0, H, 'amb', Math.min(0.3, Math.max(0, g0 - lo)));   // (on a slope: down to its lowest wheel)
      C.prop(resevalci_fwd(resevalci_stretcher()), ...P(-1.0, 1.75), H);
      C.prop(resevalci_board(), ...P(-0.45, 0.925 + 0.39), Lr);
      C.prop(L.bag(0xc8301c), ...P(-2.85, 1.25), H);
      const PARA = { shirt: 0x2f8a46, pants: 0x1f4f33, long: true, vest: 0xd8ee2c, stripes: 0xd9dde2, shoes: 0x15171c }, BAG = [['bag', 0, { c: 0xc8301c }]];
      const pA = P(-2.05, 0.3), pB = P(-1.0, 2.6), pB2 = P(-1.7, 3.6), pC = P(1.5, 1.45);
      // (on the sill, turned a little to the road: in the ambulance's own frame, its x across (the road at -chi), z along (its rear at -2.2))
      const chi = Math.sign(F.tz * F.nx - F.tx * F.nz) || 1, sill = { on: 'amb', a: -chi * 0.3, b: -2.05, y: 0.43, yaw: Math.atan2(-chi * Math.sin(0.6), -Math.cos(0.6)) };
      C.man(Object.assign({ hair: 'short' }, PARA), { act: Object.assign({ pose: 'sitDrink', hold: [['radio', 1]] }, sill), bliza: { look: 'car' }, run: false,
        fence: Object.assign({ pose: 'sitDrink', hold: [['radio', 1]], look: 'car' }, sill) });
      C.man(Object.assign({ hair: 'pony' }, PARA), { act: { a: pB[0], b: pB[1], pose: 'talk', face: to(pB, pA), hold: BAG }, bliza: { pose: 'stand', face: to(pB, pA), look: 'car' }, run: false,
        fence: { a: pB2[0], b: pB2[1], pose: 'stand', hold: BAG, look: 'car' } });
      C.man(Object.assign({ hair: 'bald' }, PARA), { act: { a: pC[0], b: pC[1], pose: 'resevalci_kavaDol', face: Lr, hold: [['cup', 1]] }, bliza: { look: 'car' }, run: false,
        fence: { a: pC[0], b: pC[1], pose: 'resevalci_kavaDol', face: Lr, hold: [['cup', 1]], look: 'car' } });
    } };
  site('spa', [['resevalci', 4736, 1]]); site('bathurst', [['resevalci', 5296, -1]]); site('suzuka', [['resevalci', 3510, -1]]);

  /* 2 · Odvozna služba (Nürburg, Štajerska, Montréal: where a car went off) — the flatbed recovery truck behind the barrier with its rear
     to the coming cars, a plain car on its bed on the winch's cable, the amber beacon on the cab, stacks of old tyres and sacks of absorbent
     by it; three marshals in orange: one kneels on the bed at the car's tow hook with a wrench, one sweeps the absorbent into heaps by the
     barrier with a wide broom, one stands by with the extinguisher. Staff: as the car comes they look at it (the one on the bed gets up, the
     one with the extinguisher steps out towards the barrier), nobody runs */
  const odvoz_fwd = (m) => { m.rotation.y = -Math.PI / 2; return grp(m); };   // (a model with its front to +x in a group whose +z it is: C.prop's dir)
  const odvoz_wheel = (x, z, w) => grp(cyl(0.5, 0.5, w, 10, 0x16171a, x, 0.5, z, { rx: Math.PI / 2 }), cyl(0.28, 0.28, w + 0.02, 6, 0xb9bec6, x, 0.5, z, { rx: Math.PI / 2 }));
  function odvoz_truck(carCol) {   // along x (its front +x, 8 m): the cab with the beacon bar, the bed (its top at 1.28 m) with the headboard and the winch, three axles; the car on it
    const WH = 0xf2f2ee, OR = 0xe8731c, GL = 0x27313c, ST = 0x6a6f78, DK = 0x2a2c31, RL = 0x4a4f57, AM = 0xffa31a, g = grp(
      box(7.9, 0.32, 1.0, DK, -0.05, 0.78, 0),   // (the chassis)
      box(1.9, 1.55, 2.3, WH, 3.0, 1.78, 0), box(1.92, 0.36, 2.32, OR, 3.0, 1.2, 0), box(0.06, 0.72, 2.0, GL, 3.96, 2.08, 0), box(0.85, 0.62, 2.32, GL, 3.3, 2.1, 0),   // (the cab, its band, windows)
      box(0.22, 0.32, 2.34, DK, 4.02, 0.82, 0), box(0.06, 0.16, 0.34, 0xf6f2dc, 3.97, 1.1, 0.82, { basic: true }), box(0.06, 0.16, 0.34, 0xf6f2dc, 3.97, 1.1, -0.82, { basic: true }),
      box(0.34, 0.14, 1.5, DK, 2.55, 2.62, 0), box(0.3, 0.14, 0.45, AM, 2.55, 2.74, 0.42, { basic: true }), box(0.3, 0.14, 0.45, AM, 2.55, 2.74, -0.42, { basic: true }),   // (the beacon bar)
      box(5.9, 0.16, 2.4, ST, -1.05, 1.2, 0), box(5.9, 0.12, 0.07, RL, -1.05, 1.33, 1.17), box(5.9, 0.12, 0.07, RL, -1.05, 1.33, -1.17),   // (the bed, its edges)
      box(0.12, 1.4, 0.12, RL, 1.86, 1.98, 1.08), box(0.12, 1.4, 0.12, RL, 1.86, 1.98, -1.08), box(0.12, 0.14, 2.3, RL, 1.86, 2.62, 0), box(0.12, 0.1, 2.2, RL, 1.86, 2.0, 0),   // (the headboard)
      cyl(0.2, 0.2, 0.7, 8, DK, 1.55, 1.48, 0, { rx: Math.PI / 2 }), bar([1.55, 1.48, 0], [1.12, 1.75, 0], 0.03, DK),   // (the winch and its cable to the car)
      box(0.14, 0.14, 2.2, DK, -3.9, 0.62, 0), box(0.08, 0.12, 0.3, 0xb01515, -4.0, 1.06, 0.95), box(0.08, 0.12, 0.3, 0xb01515, -4.0, 1.06, -0.95),   // (the under-run bar, the tail lamps)
      box(0.16, 0.16, 0.16, AM, -3.92, 1.42, 1.08, { basic: true }), box(0.16, 0.16, 0.16, AM, -3.92, 1.42, -1.08, { basic: true }),   // (two amber lamps at the back)
      odvoz_wheel(3.0, 1.0, 0.32), odvoz_wheel(3.0, -1.0, 0.32), odvoz_wheel(-1.9, 1.0, 0.5), odvoz_wheel(-1.9, -1.0, 0.5), odvoz_wheel(-3.0, 1.0, 0.5), odvoz_wheel(-3.0, -1.0, 0.5));
    for (let k = 0; k < 6; k++) g.add(box(0.06, 0.16, 0.4, k % 2 ? WH : OR, -4.02, 1.2, -1.0 + k * 0.4));   // (the bed's tail: orange and white blocks)
    const c = L.car(carCol); c.position.set(-1.0, 1.28, 0); g.add(c);
    return g;
  }
  ITEMX.odvoz_kljuc = () => grp(box(0.045, 0.045, 0.42, 0xb9bec6, 0, -0.03, 0.18), box(0.11, 0.05, 0.09, 0xb9bec6, 0, -0.03, 0.42));   // (a big wrench, forwards from the fist)
  ITEMX.odvoz_metla = () => grp(bar([0, 0.3, 0.02], [0, -0.9, 0.42], 0.04, 0xc8a060), box(0.62, 0.09, 0.13, 0x2a2c31, 0, -0.95, 0.44, { rx: 0.33 }));   // (a wide push broom)
  S.odvoz = { seed: 277, clear: [[0.5, 5, 11]],
    build(C, F, K) {
      const a0 = 1.2, b0 = 5.7, hl = Math.hypot(1, 0.1), H = [1 / hl, 0.1 / hl], Lr = [H[1], -H[0]];
      const P = (u, v) => [a0 + H[0] * u + Lr[0] * v, b0 + H[1] * u + Lr[1] * v], to = (p, q) => [q[0] - p[0], q[1] - p[1]];   // (u along the truck, + its front; v across, + to the road)
      const g0 = F.y(a0, b0), lo = Math.min(...[[3.0, 1.0], [3.0, -1.0], [-3.0, 1.0], [-3.0, -1.0]].map(([u, v]) => F.y(...P(u, v))));
      C.prop(odvoz_fwd(odvoz_truck(pick([0x2f63c9, 0xd8262a, 0xf2f2f2, 0x2f9a48, 0xf0c22e, 0x262a33]))), a0, b0, H, 'tr', Math.min(0.35, Math.max(0, g0 - lo)));
      C.prop(L.tyreStack(4, 0xf2f2f2), ...P(-5.0, 0.9)); C.prop(L.tyreStack(3, 0xf2f2f2), ...P(-5.75, 1.55)); C.prop(L.tyreStack(1, 0xf2f2f2), ...P(-4.6, 2.35));
      C.prop(grp(sph(0.7, 7, 3, 0xbab6aa, 0, 0.02, 0, { half: true, s: [1.3, 0.3, 0.75] })), -0.85, 1.2); C.prop(grp(sph(0.5, 7, 3, 0xc9c6bc, 0, 0.02, 0, { half: true, s: [1.2, 0.3, 0.9] })), 0.9, 1.35);   // (absorbent swept up into heaps by the barrier)
      for (const [a, b, r] of [[2.0, 2.0, 0.2], [2.5, 2.3, -0.3], [2.25, 2.0, 0.6]]) C.prop(grp(box(0.52, 0.26, 0.36, 0xf2f2ee, 0, r > 0.5 ? 0.39 : 0.13, 0)), a, b, r);
      const MAR = { shirt: 0xf07a1c, pants: 0xf07a1c, long: true, vest: 0xf07a1c, stripes: 0xd9dde2, gloves: 0x15171c, shoes: 0x15171c };
      // (on the bed: in the truck's own frame, its x across (the road at -chi), z along (the bed's tail at -4, the car's rear at -3.1))
      const chi = Math.sign(F.tz * F.nx - F.tx * F.nz) || 1, bed = { on: 'tr', a: -chi * 0.55, b: -3.5, y: 1.28 };
      C.man(Object.assign({ hat: 'cap', hatCol: 0xf07a1c }, MAR), { act: Object.assign({ pose: 'kneel', yaw: Math.atan2(chi * Math.sin(0.7), Math.cos(0.7)), hold: [['odvoz_kljuc', 1]] }, bed), bliza: { look: 'car' }, run: false,
        fence: Object.assign({ pose: 'stand', yaw: Math.atan2(-chi, 0), hold: [['odvoz_kljuc', 1]], look: 'car' }, bed) });
      C.man(Object.assign({ hair: 'short' }, MAR), { act: { a: -0.9, b: 2.15, pose: 'sweep', face: [0.15, -1], hold: [['odvoz_metla', 1]] }, bliza: { t: 3.8, still: true, look: 'car' }, run: false,
        fence: { a: -0.9, b: 2.15, pose: 'sweep', t: 3.8, still: true, hold: [['odvoz_metla', 1]], look: 'car' } });   // (he stops sweeping and watches: the broom's head on the ground)
      const pE = P(-3.7, 2.45), pE2 = P(-4.6, 3.4), pK = P(-3.5, 0.55);
      C.man(Object.assign({ hat: 'hard', hatCol: 0xf2f2f2 }, MAR), { act: { a: pE[0], b: pE[1], pose: 'talk', face: to(pE, pK), hold: [['ext', 0]] }, bliza: { pose: 'stand', face: to(pE, pK), look: 'car' }, run: false,
        fence: { a: pE2[0], b: pE2[1], pose: 'stand', hold: [['ext', 0]], look: 'car' } });
    } };
  site('nring', [['odvoz', 8832, 1]]); site('rbring', [['odvoz', 1848, 1]]); site('montreal', [['odvoz', 3888, 1]]);

  /* 1 · Delavci na progi (Bathurst, Suzuka, Marrakesh: a straight with the barrier close) — a track crew at work behind the barrier: a
     warning triangle and cones mark the place; one sweeps the debris along the barrier, one blows the leaves into a heap with a leaf blower
     (ear defenders on), one pushes a wheelbarrow of sand from the heap, one carries sandbags from the truck's tailgate to a low wall of them
     by the barrier; their small open truck (a coloured band, amber beacons, cones and sandbags on its bed) parked askew with its striped
     tailgate to the coming cars. Staff: as the car comes they stop and watch it pass (the sweeper on his broom, the blower lowered, hands on
     the hips, the bag held), nobody runs. Everything plain: no writing, no badges */
  const delavci_SAND = 0xb8955c, delavci_BAG = 0xcbb98e;
  const delavci_wheel = (x, z) => grp(cyl(0.38, 0.38, 0.26, 8, 0x16171a, x, 0.38, z, { rz: Math.PI / 2 }), cyl(0.21, 0.21, 0.28, 6, 0xb9bec6, x, 0.38, z, { rz: Math.PI / 2 }));
  const delavci_bag = (x, y, z, ry) => box(0.55, 0.17, 0.34, delavci_BAG, x, y, z, { ry: ry || 0 });
  // a stack of nested cones (one tall cone, two bases and two white bands showing)
  const delavci_cones = (x, y, z) => grp(box(0.36, 0.04, 0.36, 0x15171c, x, y + 0.02, z), box(0.34, 0.04, 0.34, 0x15171c, x, y + 0.13, z), cyl(0.035, 0.15, 0.85, 7, 0xf07a1c, x, y + 0.465, z),
    cyl(0.072, 0.086, 0.1, 7, 0xf2f2f2, x, y + 0.6, z), cyl(0.053, 0.064, 0.08, 7, 0xf2f2f2, x, y + 0.75, z));
  function delavci_truck(band) {   // a small open truck along z (its front +z, 5.2 m long): the cab over the front wheels (a band of its colour, two amber beacons), the bed (its floor at 1.05 m) with low sides, the tailgate in orange and white blocks; cones and sandbags on the bed
    const WH = 0xf2f2ee, OR = 0xe8731c, GL = 0x27313c, DK = 0x2a2c31, AL = 0xb9bec6, AM = 0xffa31a;
    const g = grp(
      box(0.9, 0.22, 4.9, DK, 0, 0.6, -0.05),   // (the chassis)
      box(1.9, 1.5, 1.5, WH, 0, 1.5, 1.85), box(1.92, 0.2, 1.52, band, 0, 1.06, 1.85), box(1.7, 0.66, 0.04, GL, 0, 1.78, 2.6), box(0.04, 0.55, 0.85, GL, 0.95, 1.8, 2.0), box(0.04, 0.55, 0.85, GL, -0.95, 1.8, 2.0),   // (the cab, its band, windows)
      box(1.94, 0.26, 0.14, DK, 0, 0.62, 2.62), box(0.3, 0.14, 0.04, 0xf6f2dc, 0.62, 0.95, 2.61, { basic: true }), box(0.3, 0.14, 0.04, 0xf6f2dc, -0.62, 0.95, 2.61, { basic: true }),   // (the bumper, the lamps)
      box(1.1, 0.12, 0.3, DK, 0, 2.31, 1.95), box(0.3, 0.14, 0.26, AM, 0.38, 2.43, 1.95, { basic: true }), box(0.3, 0.14, 0.26, AM, -0.38, 2.43, 1.95, { basic: true }),   // (the beacons)
      box(1.9, 0.1, 3.4, 0x6a6f78, 0, 1.0, -0.65), box(1.9, 0.95, 0.08, AL, 0, 1.52, 1.06), box(0.06, 0.42, 3.4, AL, 0.95, 1.26, -0.65), box(0.06, 0.42, 3.4, AL, -0.95, 1.26, -0.65),   // (the bed: floor, headboard, sides)
      box(0.1, 0.12, 0.05, 0xb01515, 0.82, 0.88, -2.38), box(0.1, 0.12, 0.05, 0xb01515, -0.82, 0.88, -2.38),
      delavci_wheel(0.85, 1.75), delavci_wheel(-0.85, 1.75), delavci_wheel(0.85, -1.35), delavci_wheel(-0.85, -1.35));
    for (let k = 0; k < 6; k++) g.add(box(1.9 / 6, 0.42, 0.06, k % 2 ? WH : OR, -0.95 + (k + 0.5) * 1.9 / 6, 1.26, -2.35));   // (the tailgate)
    for (const [x, z] of [[0.45, -1.9], [-0.42, -1.95]]) { const c = L.cone(); c.position.set(x, 1.05, z); g.add(c); }
    g.add(delavci_cones(0.48, 1.05, -1.2)); g.add(delavci_cones(-0.45, 1.05, -1.15));
    for (const [x, y, z, r] of [[-0.6, 1.135, 0.75, 0.04], [0, 1.135, 0.78, -0.03], [0.6, 1.135, 0.74, 0.06], [-0.58, 1.135, 0.38, -0.05], [0.05, 1.135, 0.4, 0.08], [-0.3, 1.305, 0.6, 0.1], [0.32, 1.305, 0.62, -0.07]]) g.add(delavci_bag(x, y, z, r));
    return g;
  }
  // L.wheelbarrow full of sand, tipped up on its wheel a little (its grips at 0.7 m, feet under its legs), its front (the wheel) +z
  function delavci_barrow(col) {
    const w = L.wheelbarrow(col); w.add(sph(0.3, 7, 3, delavci_SAND, 0, 0.6, 0, { half: true, s: [1.25, 0.55, 1.0] })); w.position.x = -0.55;
    const piv = grp(w); piv.rotation.z = -0.12; piv.position.x = 0.55;
    const g = grp(piv, box(0.04, 0.11, 0.04, 0x2a2c31, -0.195, 0.055, 0.198), box(0.04, 0.11, 0.04, 0x2a2c31, -0.195, 0.055, -0.198)); g.rotation.y = -Math.PI / 2;
    return grp(g);
  }
  const delavci_heap = () => grp(cyl(0.14, 1.25, 0.8, 9, delavci_SAND, 0, 0.4, 0), cyl(0.1, 0.75, 0.45, 8, delavci_SAND, 0.95, 0.225, 0.45), bar([0.5, 0.35, 0.2], [0.85, 1.4, 0.4], 0.04, 0x8a6a45), box(0.16, 0.035, 0.035, 0x2a2c31, 0.85, 1.42, 0.4));   // (a heap of sand, a shovel stuck in it)
  const delavci_wall = () => grp(delavci_bag(-0.58, 0.085, 0, 0.06), delavci_bag(0, 0.085, 0.02, -0.03), delavci_bag(0.58, 0.085, 0, 0.05), delavci_bag(-0.29, 0.255, 0.01, 0.07), delavci_bag(0.3, 0.255, 0, -0.05));   // (along x)
  // a warning triangle on a folding stand (a red border, white, a black bar and dot: no writing), facing +z
  const delavci_sign = () => grp(cyl(0.5, 0.5, 0.03, 3, 0xc8201c, 0, 1.05, 0, { rx: -Math.PI / 2 }), cyl(0.35, 0.35, 0.03, 3, 0xf2f2ee, 0, 1.05, 0.02, { rx: -Math.PI / 2 }),
    box(0.06, 0.2, 0.03, 0x15171c, 0, 1.09, 0.04), box(0.06, 0.06, 0.03, 0x15171c, 0, 0.93, 0.04),
    bar([-0.32, 0, 0.18], [0, 1.0, -0.03], 0.04, 0x9aa0a8), bar([0.32, 0, 0.18], [0, 1.0, -0.03], 0.04, 0x9aa0a8), bar([0, 0, -0.4], [0, 1.0, -0.04], 0.04, 0x9aa0a8));
  // in their hands: the broom upright (held at the chest, its head on the ground: delavci_metlaStoj), the leaf blower (the engine under the hand, the
  // tube forwards and down), the ear defenders (on the head), a sandbag (both hands, as a crate)
  ITEMX.delavci_metlaGor = () => { const s = grp(bar([0, 0.16, 0], [0, -1.0, 0], 0.028, 0xa07a4a), box(0.42, 0.07, 0.1, 0x3a3027, 0, -1.03, 0)); s.rotation.x = 1.25; return grp(s); };
  ITEMX.delavci_puhalnik = () => grp(box(0.2, 0.24, 0.34, 0xe8731c, 0, -0.17, -0.03), box(0.21, 0.09, 0.22, 0x2a2c31, 0, -0.32, -0.05), bar([0, -0.24, 0.1], [0, -1.0, 0.54], 0.075, 0x30343a),
    bar([0, -0.96, 0.52], [0, -1.07, 0.58], 0.1, 0xe8731c));
  ITEMX.delavci_glusniki = () => grp(box(0.05, 0.1, 0.09, 0xd8262a, 0.118, 0, -0.15), box(0.05, 0.1, 0.09, 0xd8262a, -0.118, 0, -0.15),
    bar([0.118, 0.04, -0.15], [0, 0.185, -0.15], 0.025, 0x2a2c31), bar([-0.118, 0.04, -0.15], [0, 0.185, -0.15], 0.025, 0x2a2c31));
  ITEMX.delavci_vreca = () => grp(box(0.48, 0.2, 0.3, delavci_BAG, 0, -0.12, 0.22));
  // pushing the wheelbarrow (bent over its grips, the arms straight down from the leant torso: forwards of it by its lean); blowing (the torso swinging the tube from side to side); the blower
  // lowered; standing with the broom upright in the right hand
  POSEX.delavci_push = () => ({ lean: 0.56, hy: 0.9, hp: [0.45, -0.2], kn: [0.6, 0.35], shz: [0.02, 0.02], shx: [0.48, 0.48], el: [0.08, 0.08] });   // (the hands on the grips: 0.2 m ahead, 0.7 m up)
  POSEX.delavci_puh = (t, s) => ({ lean: 0.1, tw: 0.28 * s, look: 0.12 * s, shz: [0.25, 0.14], shx: [0.35, 0.42], el: [0.5, 0.12], hpz: [0.07, 0.07] });
  MOTION.delavci_puh = { rate: 1.8 };
  POSEX.delavci_puhStoj = () => ({ shz: [0.1, 0.12], shx: [0.05, 0.15], el: [0.15, 0.35] });
  POSEX.delavci_metlaStoj = () => ({ shz: [0.1, 0.12], shx: [0.05, 0.35], el: [0.15, 0.9], hpz: [0.05, 0.08] });
  S.delavci = { seed: 316, clear: [[-1, 4.5, 11.5], [7.6, 6.8, 5.5]],
    build(C, F, K) {
      const band = pick([0xe8731c, 0xd8262a, 0x2f9a48, 0x1f63d8]), wcol = pick([0x3a6fb0, 0x2f7a3a, 0xd8262a, 0x6a6f78]);   // (the truck's band, the wheelbarrow: by the place)
      // the truck askew, its tailgate to the coming cars (u along it, + its front; v across: the truck is the same on both sides)
      const a0 = 7.7, b0 = 6.8, hl = Math.hypot(0.55, 0.835), H = [0.55 / hl, 0.835 / hl], P = (u, v) => [a0 + H[0] * u - H[1] * v, b0 + H[1] * u + H[0] * v];
      const g0 = F.y(a0, b0), lo = Math.min(...[[1.75, 0.85], [1.75, -0.85], [-1.35, 0.85], [-1.35, -0.85]].map(([u, v]) => F.y(...P(u, v))));
      C.prop(delavci_truck(band), a0, b0, H, null, Math.min(0.35, Math.max(0, g0 - lo)));   // (on a slope: down to its lowest wheel)
      C.prop(delavci_sign(), -10.5, 1.6, [-1, 0.1]);
      for (const a of [-8.4, -3.6, 2.6, 9.6]) C.prop(L.cone(), a, 1.0);
      C.prop(delavci_wall(), 5.0, 0.8);
      C.prop(delavci_heap(), 1.9, 7.4, [0.3, -1]);
      const pl = Math.hypot(0.45, 0.89), pu = [-0.45 / pl, -0.89 / pl], wA = 1.1, wB = 3.4;   // (the wheelbarrow pushed towards the barrier and the coming cars)
      C.prop(delavci_barrow(wcol), wA, wB, pu);
      C.prop(grp(sph(0.55, 7, 3, 0x7a5426, 0, 0, 0, { half: true, s: [1.5, 0.35, 1.1] }), sph(0.35, 6, 3, 0x946a2c, 0.55, 0, 0.35, { half: true, s: [1.3, 0.4, 1.0] })), -2.0, 5.1);   // (the leaves blown into a heap)
      const CREW = { shirt: 0xe8731c, pants: 0x2f3f63, long: true, vest: 0xf2e01e, stripes: 0xc9ccd2, shoes: 0x2a2018, gloves: 0x5b5040 };
      // the sweeper along the barrier, towards the coming cars: as the car comes he leans on his broom and watches
      const fS = [-0.9, -0.45];
      C.man(Object.assign({}, CREW, { hat: 'hard', hatCol: 0xf2f2ee }), { act: { a: -6.4, b: 2.0, pose: 'sweep', face: fS, hold: [['broom', 1]] },
        bliza: { pose: 'delavci_metlaStoj', hold: [['delavci_metlaGor', 1]], look: 'car' }, run: false,
        fence: { a: -6.4, b: 2.0, pose: 'delavci_metlaStoj', face: fS, hold: [['delavci_metlaGor', 1]], look: 'car' } });
      // the leaf blower, blowing the leaves off the verge into a heap: as the car comes he lowers it, glances back and steps to the barrier to watch
      const BL = [['delavci_puhalnik', 1]], EAR = [['delavci_glusniki']];
      C.man(Object.assign({}, CREW, { shirt: 0x31406e, long: false, hat: 'cap', hatCol: 0xf07a1c }), { act: { a: -2.6, b: 2.9, pose: 'delavci_puh', face: [0.25, 1], hold: BL, head: EAR },
        bliza: { pose: 'delavci_puhStoj', look: 'car' }, run: false, fence: { a: -2.8, b: 2.0, pose: 'delavci_puhStoj', face: [-0.7, -0.7], hold: BL, head: EAR, look: 'car' } });
      // the wheelbarrow's man behind its grips; as the car comes he lets go and stands, hands on the hips
      const mA = wA - pu[0] * 0.885, mB = wB - pu[1] * 0.885;
      C.man(Object.assign({}, CREW, { hair: 'short', hairCol: 0x2a1d14, vest: 0xf07a1c, shirt: 0x47494f }), { act: { a: mA, b: mB, pose: 'delavci_push', face: pu },
        bliza: { pose: 'hips', look: 'car' }, run: false, fence: { a: mA, b: mB, pose: 'hips', face: pu, look: 'car' } });
      // the sandbags from the tailgate to the wall by the barrier (to and fro); as the car comes he stops with his bag and watches
      const fC = [-0.315, -0.949], BAG = [['delavci_vreca', 1]];
      C.man(Object.assign({}, CREW, { hat: 'beanie', hatCol: 0x31406e }), { act: { a: 5.63, b: 2.7, pose: 'carryWalk', face: fC, hold: BAG },
        bliza: { pose: 'carry', face: fC, look: 'car' }, run: false });   // (where he stopped, turned to the barrier)
    } };
  site('bathurst', [['delavci', 744, -1]]); site('suzuka', [['delavci', 4454, -1]]); site('marrakesh', [['delavci', 1424, -1]]);

  /* 2 · TV ekipa (Spa, Montréal, Štajerska: behind the barrier on a straight) — a television crew recording a piece by the track: the
     reporter, her back to the track, talks into her microphone to the camera; the cameraman with the camera on his shoulder, the sound man
     with headphones holding the boom and its furry microphone over her head, the producer with headphones and a clipboard at a monitor on
     a flight case; a light on a stand turned to the reporter, cables on the grass to the TV van with its dish. Staff: as the car comes the
     cameraman turns to film it, the others watch it (the reporter steps to the barrier), nobody runs. Plain: no logos, no writing */
  // a cable on the grass through frame points [[a, b], ...] (one prop at the frame's origin, along the track: its z = a, its x = chi * b)
  function tvekipa_kabel(C, F, pts, col) {
    const chi = Math.sign(F.tz * F.nx - F.tx * F.nz) || 1, y0 = F.y(0, 0), g = grp();
    for (let k = 1; k < pts.length; k++) { const [a0, b0] = pts[k - 1], [a1, b1] = pts[k]; g.add(bar([chi * b0, F.y(a0, b0) - y0 + 0.03, a0], [chi * b1, F.y(a1, b1) - y0 + 0.03, a1], 0.05, col)); }
    C.prop(g, 0, 0, [1, 0]);
  }
  // a soft light on a tripod (its lamp unlit, warm white), facing +z and a little down
  const tvekipa_luc = () => grp(bar([0.35, 0, 0.2], [0, 1.0, 0], 0.03, 0x2a2c31), bar([-0.35, 0, 0.2], [0, 1.0, 0], 0.03, 0x2a2c31), bar([0, 0, -0.4], [0, 1.0, 0], 0.03, 0x2a2c31),
    cyl(0.025, 0.025, 1.15, 5, 0x5b6068, 0, 1.55, 0), box(0.62, 0.46, 0.1, 0x15171c, 0, 2.15, 0, { rx: 0.25 }), box(0.54, 0.38, 0.02, 0xfff3d6, 0, 2.135, 0.058, { rx: 0.25, basic: true }));
  const tvekipa_kovcek = (w, h, d) => grp(box(w, h, d, 0x2a2c31, 0, h / 2, 0), box(w + 0.02, 0.03, d + 0.02, 0xb9bec6, 0, h - 0.02, 0), box(w + 0.02, 0.03, d + 0.02, 0xb9bec6, 0, 0.03, 0));   // (a flight case: its metal rims)
  function tvekipa_monitor() {   // a field monitor on a flight case, its screen (unlit: the sky, the grass) to +z
    const m = grp(box(0.48, 0.34, 0.07, 0x15171c, 0, 0, 0), box(0.42, 0.14, 0.01, 0x8fbbe0, 0, 0.07, 0.04, { basic: true }), box(0.42, 0.14, 0.01, 0x46803a, 0, -0.07, 0.04, { basic: true }));
    m.position.y = 0.8; m.rotation.x = -0.15;
    const g = tvekipa_kovcek(0.7, 0.55, 0.5); g.add(box(0.06, 0.1, 0.06, 0x2a2c31, 0, 0.6, 0)); g.add(m); return g;
  }
  // in their hands (each built upright, as if the forearm hung straight down, and turned by the forearm's angle in its pose): the reporter's
  // microphone (a ball on a handle, a plain coloured cube under it), the boom (a pole forwards and a little up, the furry microphone hanging
  // at its end), headphones (the sound man's, the producer's)
  ITEMX.tvekipa_mikrofon = (o) => { const s = grp(cyl(0.018, 0.022, 0.2, 5, 0x15171c, 0, 0.06, 0), box(0.075, 0.07, 0.075, o.c || 0x1f63d8, 0, 0.12, 0), sph(0.042, 6, 4, 0x3a3d44, 0, 0.19, 0)); s.rotation.x = 2.65; return grp(s); };
  ITEMX.tvekipa_tyc = () => { const s = grp(bar([0, 0, -0.5], [0, 0, 2.4], 0.035, 0x2a2c31), bar([0, -0.11, 2.12], [0, -0.11, 2.5], 0.13, 0xb9b6ae)); s.rotation.x = 2.45; return grp(s); };
  ITEMX.tvekipa_slusalke = () => grp(box(0.05, 0.1, 0.09, 0x15171c, 0.118, 0, -0.15), box(0.05, 0.1, 0.09, 0x15171c, -0.118, 0, -0.15),
    bar([0.118, 0.04, -0.15], [0, 0.185, -0.15], 0.025, 0x15171c), bar([-0.118, 0.04, -0.15], [0, 0.185, -0.15], 0.025, 0x15171c));
  // talking into the microphone (the right fist at the chin, the left hand gesturing); the microphone lowered; holding the boom up (both arms)
  POSEX.tvekipa_govor = (t, s) => ({ shz: [0.2, 0.15], shx: [0.35 + 0.12 * s, 0.55], el: [1.05 - 0.3 * s, 2.1], shy: [0, -0.3], look: 0.08 * s, nod: 0.04 });
  MOTION.tvekipa_govor = { rate: 2.3 };
  POSEX.tvekipa_mikDol = () => ({ shz: [0.1, 0.14], shx: [0.05, 0.25], el: [0.15, 0.6] });
  POSEX.tvekipa_boom = () => ({ shz: [0.3, 0.3], shx: [2.5, 2.45], el: [0.25, 0.3], nod: -0.25, hpz: [0.08, 0.08] });
  S.tvekipa = { seed: 338, clear: [[1.5, 5, 9.5]],
    build(C, F, K) {
      C.prop(L.mediaVan(), 4.8, 8.6, [0, -1]);
      C.prop(tvekipa_luc(), -1.3, 3.2, [1, -1]);
      C.prop(tvekipa_monitor(), -2.4, 3.3, [0, 1]); C.prop(tvekipa_kovcek(0.6, 0.42, 0.45), -1.7, 5.1, 0.3); C.prop(tvekipa_kovcek(0.5, 0.36, 0.4), -2.3, 5.6, -0.2);
      tvekipa_kabel(C, F, [[3.0, 7.6], [2.2, 6.9], [1.2, 6.2], [0.8, 5.4], [0.5, 4.8]], 0x15171c);   // (the camera's, from the van)
      tvekipa_kabel(C, F, [[2.6, 7.7], [1.2, 7.2], [-0.4, 6.6], [-1.0, 5.2], [-1.25, 3.5]], 0xd9c35a);   // (the light's)
      const CREW = { shirt: 0x262a33, pants: 0x1d1f25, long: true, shoes: 0x15171c };
      const jacket = pick([0xd8262a, 0x1f63d8, 0x22848f, 0x8a3b8c]), MIC = [['tvekipa_mikrofon', 1, { c: pick([0x1f63d8, 0xd8262a, 0xf2c21a, 0xf2f2ee]) }]];   // (by the place)
      // the reporter, her back to the track: as the car comes she lowers the microphone, steps to the barrier and watches
      C.man({ shirt: jacket, pants: 0x1d1f25, long: true, hair: 'long', hairCol: 0x7a5532, shoes: 0x15171c }, { act: { a: 0, b: 1.9, pose: 'tvekipa_govor', face: [0.11, 1], hold: MIC },
        zac: { look: 'car' }, bliza: { pose: 'tvekipa_mikDol', look: 'car' }, run: false, fence: { a: -0.2, b: 1.2, pose: 'tvekipa_mikDol', hold: MIC, look: 'car' } });
      // the cameraman, facing her (and the road): the camera turns to the car and follows it
      C.man(Object.assign({}, CREW, { hat: 'cap', hatCol: 0x15171c }), { act: { a: 0.3, b: 4.6, pose: 'cam', face: [-0.11, -1], head: [['camera']] },
        bliza: { look: 'car' }, run: false, fence: { a: 0.3, b: 4.6, pose: 'cam', head: [['camera']], look: 'car' } });
      // the sound man, the boom's microphone over her head: he turns his head to the car
      const PH = [['tvekipa_slusalke']];
      C.man(Object.assign({}, CREW, { shirt: 0x47494f, hair: 'short' }), { act: { a: 1.45, b: 3.85, pose: 'tvekipa_boom', face: [-0.597, -0.802], hold: [['tvekipa_tyc', 1]], head: PH },
        bliza: { look: 'car' }, run: false, fence: { a: 1.45, b: 3.85, pose: 'tvekipa_boom', face: [-0.597, -0.802], hold: [['tvekipa_tyc', 1]], head: PH, look: 'car' } });
      // the producer at the monitor with her clipboard
      C.man(Object.assign({}, CREW, { shirt: 0xefefea, pants: 0x31406e, hair: 'pony' }), { act: { a: -2.45, b: 4.25, pose: 'stand', face: [0.05, -1], hold: [['clip', 1]], head: PH },
        bliza: { look: 'car' }, run: false, fence: { a: -2.45, b: 4.25, pose: 'stand', face: [0.05, -1], hold: [['clip', 1]], head: PH, look: 'car' } });
    } };
  site('spa', [['tvekipa', 6000, -1]]); site('montreal', [['tvekipa', 2656, 1]]); site('rbring', [['tvekipa', 1968, -1]]);

  /* ---------------- 1 · Sodniki s časomerom (Crystal Palace, Longford: the period's officials in white coats and hats; Štajerska) ----------------
     The race officials at their hut by the fence (its window band wrapped round the front and the side the car comes from, a flat roof with
     a chequered strip on its top's front edge and a clock turned to the coming car: the high chase camera sees the roofs), a lap board (plain
     bars, no writing). Staff (run: false): as the car comes one raises the binoculars, one the stopwatch, one speaks into the radio, one notes
     it on the clipboard, all watching it pass. K.old: the historic look */
  function sodnikiHut(old, hx) {   // along x (3.2 m), its front to +z (the road); hx: +x along the track (the door that way, the band round the other end)
    const W = 3.2, D = 2.3, F0 = 0.25, H = 2.3, top = F0 + H + 0.15, RD = D + 0.5, rz = 0.1, trim = old ? 0x2f5a3a : 0x1f4aa8, glass = 0x2a3440;
    const g = grp(
      box(W + 0.2, F0, D + 0.2, 0x8f949b, 0, F0 / 2, 0), box(W, H, D, old ? 0xe6dcc0 : 0xf1f0ea, 0, F0 + H / 2, 0),   // the plinth, the cabin
      box(W - 0.3, 0.9, 0.03, glass, -hx * 0.15, F0 + 1.4, D / 2 + 0.01), box(0.03, 0.9, D - 0.3, glass, -hx * (W / 2 + 0.01), F0 + 1.4, 0.15),   // the window band (front, the coming car's end)
      box(W + 0.1, 0.07, 0.45, trim, 0, F0 + 0.86, D / 2 + 0.2),   // the counter under it
      box(0.03, 1.95, 0.85, trim, hx * (W / 2 + 0.01), F0 + 0.975, 0.3), box(1.0, 0.15, 0.5, 0x8f949b, hx * (W / 2 + 0.35), 0.075, 0.3, { ry: Math.PI / 2 }),   // the door, its step
      box(W + 0.4, 0.15, RD, 0x9aa0a8, 0, top - 0.075, rz),   // the flat roof
      box(W + 0.43, 0.2, 0.03, trim, 0, top - 0.08, rz + RD / 2 + 0.015), box(0.03, 0.2, RD, trim, W / 2 + 0.215, top - 0.08, rz), box(0.03, 0.2, RD, trim, -W / 2 - 0.215, top - 0.08, rz),
      cyl(0.02, 0.02, 1.8, 4, 0x2a2c31, hx * (W / 2 - 0.3), top + 0.9, -D / 2 + 0.3));   // the radio's mast
    const n = 14, sw = (W + 0.4) / n;   // the chequered strip on the roof's top, along its front edge (two rows)
    for (let r = 0; r < 2; r++) for (let k = 0; k < n; k++) g.add(box(sw, 0.02, sw, (k + r) % 2 ? 0xf2f2ee : 0x15171c, -(W + 0.4) / 2 + (k + 0.5) * sw, top + 0.01, rz + RD / 2 - (r + 0.5) * sw));
    const clk = grp(cyl(0.46, 0.46, 0.08, 14, 0x2a2c31, 0, 0, -0.02, { rx: Math.PI / 2 }), cyl(0.4, 0.4, 0.09, 14, 0xf4f4f0, 0, 0, 0, { rx: Math.PI / 2 }),
      box(0.055, 0.32, 0.02, 0x15171c, 0.06, 0.13, 0.055, { rz: -0.45 }), box(0.05, 0.24, 0.02, 0x15171c, -0.09, -0.05, 0.055, { rz: -2.1 }));   // the clock: a dark rim, a white face, two hands
    clk.position.set(hx * (W / 2 - 0.55), top + 0.75, 0.75); clk.rotation.y = Math.atan2(-hx, 1.1); g.add(clk, box(0.08, 0.32, 0.08, 0x2a2c31, hx * (W / 2 - 0.55), top + 0.16, 0.7));   // (turned to the coming car)
    return g;
  }
  function sodnikiBoard(old) {   // the lap board on two legs: a dark panel, bars of white (no writing), facing +z
    const leg = old ? 0x7a5a3a : 0x9aa0a8, g = grp(box(0.08, 2.15, 0.08, leg, -0.8, 1.075, 0), box(0.08, 2.15, 0.08, leg, 0.8, 1.075, 0), box(1.8, 1.05, 0.06, old ? 0x24402e : 0x15171c, 0, 1.55, 0.05));
    for (let k = 0; k < 4; k++) g.add(box(k % 2 ? 1.0 : 1.35, 0.09, 0.02, 0xf2f2ee, k % 2 ? -0.25 : -0.07, 1.88 - k * 0.22, 0.09));
    return g;
  }
  ITEMX.sodniki_watch = () => grp(cyl(0.05, 0.05, 0.03, 8, 0xd9dde2, 0, -0.05, 0.05, { rx: Math.PI / 2 }), cyl(0.012, 0.012, 0.04, 4, 0xd9dde2, 0, 0.0, 0.05));   // the stopwatch
  ITEMX.sodniki_bino = () => grp(cyl(0.04, 0.045, 0.15, 7, 0x15171c, 0.048, 0, 0.06, { rx: Math.PI / 2 }), cyl(0.04, 0.045, 0.15, 7, 0x15171c, -0.048, 0, 0.06, { rx: Math.PI / 2 }), box(0.07, 0.035, 0.06, 0x2a2c31, 0, 0.015, 0.04));   // binoculars (worn on the head: before the eyes, they follow its look)
  POSEX.sodniki_write = (t, s) => ({ shz: [0.18, 0.16], shx: [0.85, 0.95 + 0.06 * s], el: [1.3, 1.45 - 0.08 * s], shy: [-0.5, -0.55], nod: 0.38, lean: 0.06 });   // the clipboard in the left hand, the right one writing
  POSEX.sodniki_time = () => ({ shz: [0.12, 0.25], shx: [0.25, 1.2], el: [0.35, 1.55], shy: [0, -0.45] });   // the stopwatch up before the face (right), the clipboard down (left)
  POSEX.sodniki_bino = () => ({ shz: [0.62, 0.62], shx: [1.35, 1.35], el: [1.75, 1.75], shy: [-0.2, -0.2], nod: -0.06 });   // both hands up to the binoculars
  MOTION.sodniki_write = { rate: 2.8 };
  S.sodniki = { seed: 233, clear: [[0, 4.5, 9]],
    build(C, F, K) {
      const old = !!K.old, hx = Math.sign(F.nx * F.tz - F.nz * F.tx) || 1;   // (hx: the hut's +x along the track or against it, by the side)
      C.prop(sodnikiHut(old, hx), 0, 5.6, [0, -1]); C.prop(sodnikiBoard(old), 4.0, 3.5, [-1, -0.8]);   // (the board ahead of the hut, turned to the coming car)
      C.prop(L.flagPole(K.flag, 6), -2.9, 6.8); if (old) C.prop(L.bench(0x7c5a3a), -3.9, 4.6, [0, -1]); else C.prop(L.bin(0x2f63c9), -3.6, 4.9);
      // the officials (before the hut's front: the roof hides nothing): white shirts and dark trousers, caps; on the historic tracks white coats
      // to the knees and hats of their time
      const look = old ? { shirt: 0xf2f2ee, pants: 0x2a2c31, long: true, hat: 'sodniki' } : { shirt: 0xf2f2f2, pants: 0x1d1f25, hat: 'cap', hatCol: 0x1f2c48 };
      const man = (o, st) => { const P = C.man(Object.assign({}, look, o), st);
        if (old) { const hc = o.hatCol || 0x3a3632; P.hips.add(box(0.37, 0.6, 0.25, 0xf2f2ee, 0, -0.19, 0));   // (the coat's skirt on the hips: the legs swing under it)
          P.head.add(cyl(0.19, 0.19, 0.02, 10, hc, 0, 0.215, 0.01), cyl(0.112, 0.122, 0.12, 8, hc, 0, 0.28, 0), cyl(0.124, 0.124, 0.03, 8, 0x15171c, 0, 0.24, 0)); }   // (a brimmed hat, its band)
        return P; };
      man({ hatCol: old ? 0x5b5040 : 0x1f2c48 }, { act: { a: -2.3, b: 2.7, pose: 'sodniki_write', face: [0.3, -1], hold: [['clip', 0]] }, bliza: { pose: 'stand', look: 'car' }, run: false,
        fence: { a: -2.3, b: 2.7, pose: 'sodniki_write', hold: [['clip', 0]], look: 'car' } });
      man({ hatCol: old ? 0x2a2c31 : 0xf2f2f2 }, { act: { a: -0.4, b: 3.7, pose: 'sodniki_write', face: [0, 1], hold: [['clip', 0]] }, bliza: { pose: 'sodniki_time', face: [0.2, -1], hold: [['sodniki_watch', 1], ['clip', 0]], look: 'car' }, run: false,
        fence: { a: -0.4, b: 3.7, pose: 'sodniki_time', hold: [['sodniki_watch', 1], ['clip', 0]], look: 'car' } });   // (the timekeeper, writing at the counter)
      man({}, { act: { a: 1.4, b: 2.5, pose: 'arms', face: [1, 0.4] }, bliza: { pose: 'sodniki_bino', face: [0, -1], head: [['sodniki_bino']], look: 'car' }, run: false,
        fence: { a: 1.4, b: 2.5, pose: 'sodniki_bino', head: [['sodniki_bino']], look: 'car' } });
      man({ hatCol: old ? 0x4a3a2c : 0x1f2c48 }, { act: { a: 2.9, b: 3.5, pose: 'talk', face: [-1, -0.4], hold: [['radio', 1]] }, bliza: { pose: 'radio', face: [0, -1], look: 'car' }, run: false,
        fence: { a: 2.9, b: 3.5, pose: 'radio', hold: [['radio', 1], ['clip', 0]], look: 'car' } });
    } };
  site('cpalace', [['sodniki', 248, 1, { old: true }]]); site('rbring', [['sodniki', 560, 1]]);

  /* ---------------- 2 · Varnostniki s psom (Toronto, Townsville, Bang Saen: the street circuits) ----------------
     Two security guards in black with yellow vests (as the gate's) walk slowly up and down along the fence, one with a shepherd dog on a
     short leash; their quad bike parked behind them, their post (a dark tent) by it. Staff (run: false): as the car comes they stop and
     watch it, the dog sits by its handler. The dog and its leash are the handler's own (on its root, shown with their hold key: walking,
     sitting), so they go and turn where it does (the kit's pets, C.pet, run along the fence after the car); the leash leaves the hand where
     it is at rest (walking: the arm's mid-swing) */
  function varnostDog(sit) {   // a shepherd dog facing +z: tan, a black saddle (the high camera sees its back); sitting: its front up, the hind legs under it
    const tan = 0x9a6a36, blk = 0x1d1a17;
    if (!sit) return grp(box(0.26, 0.26, 0.74, tan, 0, 0.5, 0), box(0.27, 0.09, 0.52, blk, 0, 0.64, -0.04), box(0.22, 0.24, 0.26, tan, 0, 0.72, 0.44), box(0.13, 0.11, 0.17, blk, 0, 0.66, 0.62),
      box(0.06, 0.13, 0.04, blk, 0.07, 0.89, 0.4), box(0.06, 0.13, 0.04, blk, -0.07, 0.89, 0.4), ...[[0.08, 0.27], [-0.08, 0.27], [0.08, -0.27], [-0.08, -0.27]].map(([x, z]) => box(0.08, 0.4, 0.08, tan, x, 0.2, z)),
      bar([0, 0.56, -0.36], [0, 0.32, -0.66], 0.06, blk));
    return grp(box(0.26, 0.26, 0.56, tan, 0, 0.42, 0.02, { rx: -0.85 }), box(0.27, 0.09, 0.4, blk, 0, 0.506, -0.078, { rx: -0.85 }), box(0.3, 0.22, 0.38, tan, 0, 0.12, -0.1),
      box(0.22, 0.24, 0.26, tan, 0, 0.8, 0.24), box(0.13, 0.11, 0.17, blk, 0, 0.75, 0.42), box(0.06, 0.13, 0.04, blk, 0.07, 0.97, 0.2), box(0.06, 0.13, 0.04, blk, -0.07, 0.97, 0.2),
      box(0.08, 0.46, 0.08, tan, 0.08, 0.23, 0.22), box(0.08, 0.46, 0.08, tan, -0.08, 0.23, 0.22), box(0.07, 0.06, 0.42, blk, 0, 0.03, -0.44));
  }
  function varnostHand(P, J) {   // the left hand's grip in the person's own frame (its root at rest) for the joints J, as the kit's setJ sets them
    const g = (k, d) => J[k] == null ? d : Array.isArray(J[k]) ? J[k][0] : J[k];
    P.sh[0].rotation.set(-g('shx', 0), g('shy', 0), g('shz', 0.07)); P.el[0].rotation.x = -g('el', 0.08); P.hips.position.y = g('hy', 0.92); P.torso.rotation.x = g('lean', 0);
    P.root.updateMatrixWorld(true); const v = new THREE.Vector3(0, -0.03, 0.03).applyMatrix4(P.hand[0].matrixWorld);
    P.sh[0].rotation.set(0, 0, 0); P.el[0].rotation.x = 0; P.hips.position.y = 0.92; P.torso.rotation.x = 0; P.root.updateMatrixWorld(true);
    return v;
  }
  ITEMX.varnost_dog = ITEMX.varnost_sit = () => grp();   // (nothing in the hand: the dog and the leash hang on the root under the same key)
  POSEX.varnost_hold = () => ({ shz: [0.3, 0.1], shx: [0.45, 0.05], el: [0.55, 0.25] });   // standing, the leash in the left hand
  S.varnost = { seed: 271, clear: [[-1, 3.8, 9]],
    build(C, F, K) {
      const hx = Math.sign(F.nx * F.tz - F.nz * F.tx) || 1;   // (a person facing the road: its left along the track (+1) or against it)
      C.prop(L.quad(0xe8b81a), 0.6, 5.3, [1, 0.35]); for (const [a, b] of [[2.7, 4.8], [3.3, 5.3]]) C.prop(L.cone(), a, b);
      C.prop(L.gazebo(0x22252b, 2.6), -5.6, 5.0); C.prop(L.table(1.0, 0.6, { things: false }), -5.6, 5.2, [0, -1]); C.prop(L.chair(0x15171c), -5.0, 5.9, [0, -1]);   // (their post: a dark tent, a table)
      const SEC = { shirt: 0x15171c, pants: 0x15171c, vest: 0xf5e21a, stripes: 0xc9ccd2 };
      // the handler: up and down the fence with the dog at its left; as the car comes it stops facing the road (the dog sits), looks at it coming, then after it
      const P = C.man(Object.assign({ hat: 'cap', hatCol: 0x15171c }, SEC), { act: { a: -2.4, b: 2.5, pose: 'walk', face: [1, 0], hold: [['varnost_dog', 0]] },
        bliza: { pose: 'varnost_hold', face: [0, -1], hold: [['varnost_sit', 0]], look: -0.7 * hx }, run: false,
        mimo: { look: 0.6 * hx } });   // (where he stopped; a fixed look: the torso does not turn, the leash stays in the hand)
      for (const sit of [false, true]) {   // the dog (walking, sitting) at the handler's left, the leash from its hand to the collar, a little slack
        const h = varnostHand(P, sit ? POSEX.varnost_hold() : { el: [0.35, 0.35], hy: 0.9, lean: 0.05 }), c = sit ? [0.6, 0.66, 0.51] : [0.6, 0.68, 0.58], m = [(h.x + c[0]) / 2, (h.y + c[1]) / 2 - 0.1, (h.z + c[2]) / 2];
        const d = varnostDog(sit); d.position.set(0.6, 0, 0.25);
        const g = grp(d, bar([h.x, h.y, h.z], m, 0.025, 0xb3261e), bar(m, c, 0.025, 0xb3261e)); g.userData.item = 'L:' + (sit ? 'varnost_sit' : 'varnost_dog'); P.root.add(g);
      }
      C.man(Object.assign({ hair: 'bald' }, SEC), { act: { a: 2.2, b: 2.2, pose: 'walk', face: [-1, 0] }, bliza: { pose: 'radio', face: [0, -1], hold: [['radio', 1]], look: 'car' }, run: false,
        mimo: { pose: 'arms', hold: [], look: 'car' } });   // (where he stopped)
    } };

  // the fans' places: on the open roads only (the user, 3. 11. 2026: »na dirkališčih naj bo čim manj ljudi okoli proge, tam naj bo več
  // zaposlenih«: the circuits have their staff's scenes); two or three each, where the chase camera sees them, the ground level and nothing
  // else there and no side road (a car may drive into one, the police waits in it), at least 260 m from the other fans' scenes (the staff's
  // stand by the marshals' posts: 100 m; tools/ljudje/mesta.mjs, --preveri; tests/ljudje-mesta.test.js)
  site('medvode', [['kotlicek', 1384, 1], ['badminton', 2456, 1], ['nogomet', 3208, 1]]);
  site('ouninpohja', [['selfie', 3744, 1], ['radio', 5296, 1], ['kotlicek', 6696, 1], ['nogomet', 7024, -1]]);
  site('harju', [['plaza', 1856, -1]]);
  site('greatalpine', [['karte', 2384, -1], ['zmaj', 5528, 1], ['lestve', 6048, -1], ['motoristi', 6992, -1]]);
  site('rastro', [['motoristi', 4064, 1], ['glasba', 4784, -1]]);
  site('caracoles', [['navijaci', 9936, -1, { club: [0xd52b1e, 0xf2f2f2] }]]);
  site('pikes', [['radio', 3824, 1]]);
  site('katu', [['lestve', 64, 1], ['navijaci', 392, -1, { club: [0x1c3f94, 0xf2f2f2] }]]);
})();
