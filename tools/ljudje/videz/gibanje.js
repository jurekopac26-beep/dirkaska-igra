// Različica 4 · Živahna drža in gibanje (tools/ljudje/videz, poskus za slike; v igri je ni): ljudje ob progi živijo z držo in gibanjem, brez
// novih oblik in brez novih oglišč. Ljudje v prizorih (js/world-ljudje.js, kljuke poseJ / alive / setJ): sproščena drža z utežjo na eni nogi
// (bok ven, ramena proti njemu, glava malo nagnjena), vsak svoje roke (v bok, prekrižane, za hrbtom, ob telesu), počasno dihanje in
// prestopanje vsak v svojem ritmu, pogled za avtom (že ko se bliža, med tekom do ograje), ob ograji mirni odzivi (ploskanje, dvignjena pest,
// kazanje na avto, palec gor, obe roki gor; brez skakanja, otroci poskakujejo na mestu z upogibom kolen), hoja in tek z boki in rameni v
// nasprotni smeri, pozibavanjem in zamahom rok; na tribuni vsak malo drugače sede. Instancirani gledalci (js/world.js, kljuka shader, samo
// na pravih progah, CR_CALM): se rahlo zibljejo in prestopajo, se obračajo k avtu (telo, ramena, glava), čakajo vsak s svojimi rokami in ko
// je avto blizu ploskajo, dvignejo roko ali pokažejo nanj; redarji (rumeni, oranžni) in snemalci samo gledajo; nihče ne skače, zastave ne gredo gor.
window.LJV = {
  people(K) {
    const TAU = K.TAU, jv = K.jv;
    const clamp = (x, a, b) => (x < a ? a : x > b ? b : x), wrapA = (a) => a - TAU * Math.round(a / TAU);
    const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
    const fr = (x) => x - Math.floor(x), dice = (a, k) => fr(Math.sin(a * 91.345 + k * 47.853) * 43758.5453);
    const K2 = ['shz', 'shx', 'shy', 'el', 'hp', 'hpz', 'kn'], K1 = ['hy', 'hz', 'hrx', 'lean', 'tw', 'tz', 'look', 'nod', 'dy'], KX = ['hx', 'hrz', 'hry', 'htz'];
    // the joints a person is posed with: one set each, written over every frame (no new objects in the hot path); hx: the hips sideways,
    // hrz: the hips tipped sideways (its left up), hry: the hips turned, htz: the head tilted (setJ below)
    const newJ = () => ({ shz: [0, 0], shx: [0, 0], shy: [0, 0], el: [0, 0], hp: [0, 0], hpz: [0, 0], kn: [0, 0], hy: 0.92, hz: 0, hrx: 0, lean: 0, tw: 0, tz: 0, look: 0, nod: 0, dy: 0, hx: 0, hrz: 0, hry: 0, htz: 0 });
    function copyJ(D, J) {
      for (let k = 0; k < 7; k++) { const n = K2[k], a = D[n]; a[0] = jv(J, n, 0); a[1] = jv(J, n, 1); }
      for (let k = 0; k < 9; k++) { const n = K1[k]; D[n] = jv(J, n); }
      for (let k = 0; k < 4; k++) { const n = KX[k], v = J[n]; D[n] = v == null ? 0 : v; }
      return D;
    }
    const arm = (D, i, shz, shx, shy, el) => { D.shz[i] = shz; D.shx[i] = shx; D.shy[i] = shy; D.el[i] = el; };
    const legsStand = (D) => { D.hp[0] = D.hp[1] = D.hpz[0] = D.hpz[1] = 0; D.kn[0] = D.kn[1] = 0.04; D.hy = 0.92; D.dy = 0; D.hz = 0; };
    // a person's own way (seeded by its phase: the same every time the scene is built): how often and how far it shifts its weight, its arms
    // while it waits, its gesture as the car passes, its free hand, its pace, its breath, how much the car draws its eye
    function traits(P, p) {
      const a = (p.ph || 0.37) * 7.77 + (P.sc || 1) * 3.1, kid = !!(P.o && P.o.kid);
      return { J: newJ(), kid, wT: kid ? 2.4 + 2.2 * dice(a, 1) : 6.5 + 7 * dice(a, 1), wP: dice(a, 2) * TAU, cp: 0.75 + 0.25 * dice(a, 3),
        arms: dice(a, 4), tilt: (dice(a, 5) - 0.5) * 0.22, re: dice(a, 6), fa: dice(a, 7), rk: 0.82 + 0.4 * dice(a, 8), br: 3.3 + 1.5 * dice(a, 9),
        bP: dice(a, 10) * TAU, gl: 0.7 + 0.3 * dice(a, 11), as: 0.85 + 0.3 * dice(a, 12), ln: (dice(a, 13) - 0.5) * 0.07, cross: dice(a, 14), side: dice(a, 15) < 0.5 ? 0 : 1 };
    }
    // the weight: -1 on its right leg .. +1 on its left, a slow square wave with soft edges (it stays on one leg, then shifts)
    const wOf = (lv, t) => { let u = 1.8 * Math.sin(t * TAU / lv.wT + lv.wP); u = u > 1 ? 1 : u < -1 ? -1 : u; return u * (1.5 - 0.5 * u * u); };
    // contrapposto: the hips out over the leg it stands on and tipped up on that side, the shoulders the other way (the head back over the
    // feet), the leg it stands on straight and in under it, the other loose (out, its knee bent); cross: the loose foot crossed behind
    function contra(D, w, a, cross) {
      const wa = w * a, uL = 0.5 + 0.5 * w, uR = 0.5 - 0.5 * w;
      D.hx += 0.065 * wa; D.hrz += 0.12 * wa; D.tz -= 0.2 * wa; D.htz += 0.09 * wa; D.hy -= 0.014 * Math.abs(wa);
      if (cross) { D.hpz[0] += (0.08 - 0.32 * uR) * a; D.hpz[1] += (0.08 - 0.32 * uL) * a; D.hp[0] -= 0.16 * uR * a; D.hp[1] -= 0.16 * uL * a; D.kn[0] += 0.55 * uR * a; D.kn[1] += 0.55 * uL * a; return; }
      D.hpz[0] += (0.33 - 0.5 * uL) * a; D.hpz[1] += (0.33 - 0.5 * uR) * a;
      D.kn[0] += (0.42 - 0.38 * uL) * a; D.kn[1] += (0.42 - 0.38 * uR) * a;
      D.hp[0] += (0.18 - 0.18 * uL) * a; D.hp[1] += (0.18 - 0.18 * uR) * a;
    }
    // a free arm: hanging (a little swing), on the hip, on the rail in front
    const armHang = (D, i, t, lv) => arm(D, i, 0.1 + 0.03 * Math.sin(t * 0.7 + i * 2 + lv.bP), 0.05 * Math.sin(t * 0.55 + i + lv.wP), 0, 0.2 + 0.08 * i);
    const armHip = (D, i) => arm(D, i, 0.55, -0.15, 0.6, 1.4);
    const armFree = (D, i, t, lv) => { if (lv.fa < 0.45) armHang(D, i, t, lv); else if (lv.fa < 0.82) armHip(D, i); else arm(D, i, 0.18, 0.95, 0, 1.35); };
    // waiting, the hands free (mask: 1 the left busy, 2 the right): along the body, both on the hips, folded, behind the back, one on the hip
    function armsIdle(D, lv, t, mask) {
      const a = lv.arms;
      if (mask === 3) return;
      if (mask) { const i = mask === 1 ? 1 : 0; if (a < 0.5) armHang(D, i, t, lv); else armHip(D, i); return; }
      if (a < 0.2) { armHang(D, 0, t, lv); armHang(D, 1, t, lv); }
      else if (a < 0.38) { armHip(D, 0); armHip(D, 1); }
      else if (a < 0.58) { arm(D, 0, 0.22, 0.55, -0.75, 1.95); arm(D, 1, 0.24, 0.6, -0.75, 1.9); }
      else if (a < 0.78) { arm(D, 0, 0.1, -0.3, -1.3, 1.2); arm(D, 1, 0.1, -0.3, -1.3, 1.2); }
      else { armHip(D, lv.side); armHang(D, 1 - lv.side, t, lv); }
    }
    // the calm gesture at the fence as the car passes (no jumping): clapping, a fist up, both hands up, pointing at it, a thumb up
    function react(D, lv, t, ph, dC) {
      const r = lv.re, w = lv.rk;
      if (r < 0.28) { const c = 0.5 + 0.5 * Math.cos(t * 14 * w + ph); arm(D, 0, 0.25, 1.2, -0.12 - 0.42 * c, 1.15); arm(D, 1, 0.25, 1.2, -0.12 - 0.42 * c, 1.15); D.kn[0] += 0.05 * c; D.kn[1] += 0.05 * c; D.hy -= 0.006 * c; }
      else if (r < 0.5) { const i = r < 0.39 ? 1 : 0, u = 0.5 + 0.5 * Math.sin(t * 5.5 * w + ph); arm(D, i, 2.5 + 0.12 * u, 0.25, 0, 0.35 + 0.45 * u); armFree(D, 1 - i, t, lv); }
      else if (r < 0.68) { const u = Math.sin(t * 3.2 * w + ph); arm(D, 0, 2.38 + 0.12 * u, 0.3, 0, 0.32); arm(D, 1, 2.42 - 0.12 * u, 0.3, 0, 0.38); }
      else if (r < 0.86) { const da = clamp(dC - clamp(dC * 0.35, -0.5, 0.5), -1.5, 1.5), i = da >= 0 ? 0 : 1;   // (the torso turns a third of the way: poseOne)
        arm(D, i, 1.42, clamp(Math.PI / 2 - Math.abs(da), 0.05, 1.5), 0, 0.08); armFree(D, 1 - i, t, lv); }
      else { arm(D, 0, 0.1, 0, 0, 0.12); arm(D, 1, 0.3, 0.85, 0, 1.35 + 0.12 * Math.sin(t * 4 * w + ph)); if (lv.fa > 0.5) armHip(D, 0); }
    }
    // a child at the fence: bouncing on its knees (its feet stay down), both hands up waving
    function kidBounce(D, lv, t, ph, up) {
      const b = 0.5 + 0.5 * Math.sin(t * 8.5 * lv.rk + ph), a = 0.06 + 0.22 * b;
      D.hp[0] += a; D.hp[1] += a; D.kn[0] += 2 * a; D.kn[1] += 2 * a; D.lean += 0.45 * a; D.hy -= 0.87 * (1 - Math.cos(a)); D.dy = 0;
      if (up) { const u = Math.sin(t * 7 * lv.rk + ph); arm(D, 0, 2.5 + 0.22 * u, 0.25, 0, 0.3); arm(D, 1, 2.55 - 0.22 * u, 0.25, 0, 0.35); }
    }
    const handsOf = (h) => { let m = 0; if (h) for (let k = 0; k < h.length; k++) m |= h[k][1] === 0 ? 1 : 2; return m; };   // (a state's hold: [kind, hand])
    const STANDS = new Set(['stand', 'relax', 'talk', 'drink', 'radio', 'phone', 'phoneUp', 'arms', 'hips', 'thumbs', 'point', 'wave', 'wave2', 'cheer', 'flagHold', 'flagWave', 'cam', 'direct', 'carry', 'grill', 'fence', 'fenceWave', 'boardOut']);
    const NOT = new Set(['walk', 'run', 'carryWalk', 'jump', 'jack0', 'jack1', 'stretch', 'sweep', 'chopUp', 'chopDown', 'push', 'hang', 'lie', 'bend', 'fixHood', 'squat', 'kneel', 'crouchCam']);
    const standing = (pose, J) => STANDS.has(pose) || (!NOT.has(pose) && jv(J, 'hy') > 0.89 && Math.abs(jv(J, 'hp', 0)) < 0.12 && Math.abs(jv(J, 'hp', 1)) < 0.12 && jv(J, 'kn', 0) < 0.2 && jv(J, 'kn', 1) < 0.2 && Math.abs(jv(J, 'hpz', 0)) < 0.2 && Math.abs(jv(J, 'hpz', 1)) < 0.2);
    const sitting = (pose, J) => pose !== 'squat' && jv(J, 'hy') < 0.6 && jv(J, 'hp', 0) > 1.2 && jv(J, 'hp', 1) > 1.2;
    // the walk and the run: the legs as people step (the knee bent as the leg swings through, straight as it lands), the hips turning with
    // the leg that steps and the shoulders against them, the body highest over the standing leg, the hips over it, the arms swinging the
    // other way (the elbow more bent as it comes forward), the head steady
    function gait(name, t) {
      const s = Math.sin(t), c = Math.cos(t);
      if (name === 'run') {
        const kL = Math.max(0, -Math.sin(t - 1.2)), kR = Math.max(0, Math.sin(t - 1.2));
        return { hp: [0.12 + 0.82 * s, 0.12 - 0.82 * s], kn: [0.32 + 1.5 * kL, 0.32 + 1.5 * kR], shx: [0.12 - 0.8 * s, 0.12 + 0.8 * s], shz: [0.14, 0.14], shy: [0, 0],
          el: [1.3 + 0.3 * Math.max(0, -s), 1.3 + 0.3 * Math.max(0, s)], lean: 0.32, hy: 0.875 - 0.035 * Math.cos(2 * t), hx: -0.012 * c, hry: -0.15 * s, hrz: -0.03 * c, tw: 0.26 * s, tz: 0.03 * c, look: -0.11 * s, nod: -0.12, dy: 0.025 };
      }
      const kL = Math.max(0, -Math.sin(t - 0.89)), kR = Math.max(0, Math.sin(t - 0.89)), carry = name === 'carryWalk';
      const J = { hp: [0.4 * s, -0.4 * s], kn: [0.08 + 0.85 * kL, 0.08 + 0.85 * kR], lean: carry ? -0.03 : 0.05, hy: 0.89 + 0.026 * Math.cos(2 * t), hx: -0.018 * c, hry: -0.11 * s, hrz: -0.035 * c, tz: 0.03 * c };
      if (carry) { J.shz = [0.1, 0.1]; J.shx = [0.75, 0.75]; J.el = [1.05, 1.05]; J.shy = [-0.3, -0.3]; J.tw = 0.08 * s; J.look = -0.03 * s; }
      else { J.shz = [0.09, 0.11]; J.shx = [-0.34 * s, 0.34 * s]; J.el = [0.22 + 0.32 * Math.max(0, -s), 0.22 + 0.32 * Math.max(0, s)]; J.tw = 0.17 * s; J.look = -0.06 * s; }
      return J;
    }
    function poseJ(name, t, poseJ0) { return name === 'walk' || name === 'run' || name === 'carryWalk' ? gait(name, t || 0) : poseJ0(name, t); }
    // the head after the car (and the shoulders a little), away from the fence: as much as the car draws its eye
    function glance(D, fence, gC, dC, lv) { if (!fence && gC > 0) { const g = gC * lv.gl; D.look += (clamp(dC * 0.85, -1.1, 1.1) - D.look) * g; D.tw += clamp(dC * 0.3, -0.35, 0.35) * g; } }
    // the last word on the joints, every posed frame: its own stance, breath, look and gesture
    function alive(J, c) {
      const P = c.P, p = c.p, sg = c.sg, s = sg && sg.s;
      if (s && (s.still || s.rx)) return J;   // (asleep in the hammock, lying: as it is)
      const lv = P.lv || (P.lv = traits(P, p)), D = copyJ(lv.J, J), t = c.t, pose = c.pose, ph = (p.ph || 0) * TAU;
      let dC = 0, gC = 0;   // the car: its angle from the facing (+: to the left), how much it draws the eye (near, in front or beside)
      if (c.car) { const R = P.root.position, dx = c.car.x - R.x, dz = c.car.z - R.z;
        if (R.x !== 0 || R.z !== 0) { dC = wrapA(Math.atan2(dx, dz) - c.yaw); gC = (1 - sstep(70, 140, Math.hypot(dx, dz))) * (1 - sstep(2.0, 2.7, Math.abs(dC))); } }
      if (pose === 'walk' || pose === 'run' || pose === 'carryWalk') {
        if (!c.moving && !c.act) {   // stopped on its way (at its place before the fence): standing, not frozen in a stride
          legsStand(D); D.tw = D.look = D.hx = D.hrz = D.hry = 0; D.lean = 0.02;
          if (pose !== 'carryWalk') { armHang(D, 0, t, lv); armHang(D, 1, t, lv); }
          contra(D, wOf(lv, t), lv.cp, false);
        } else {   // its own swing and lean; the head after the car (it runs to see it)
          if (pose === 'walk') { D.shx[0] *= lv.as; D.shx[1] *= lv.as; } else if (pose === 'run') { D.shx[0] = 0.12 + (D.shx[0] - 0.12) * lv.as; D.shx[1] = 0.12 + (D.shx[1] - 0.12) * lv.as; }
          D.lean += lv.ln;
          D.look += clamp(dC * 0.85, -0.95, 0.95) * gC * lv.gl;
        }
        D.htz += lv.tilt * 0.5;
        return D;
      }
      const br = Math.sin(t * TAU / lv.br + lv.bP);   // the breath
      D.lean += 0.014 * br;
      if (sitting(pose, J)) {   // sitting: its knees apart or together, a leg out (on the ground: a knee up), leaning, the head its own way
        D.hpz[0] += 0.14 * (lv.cross - 0.35); D.hpz[1] += 0.14 * (lv.cross - 0.35);
        if (lv.fa < 0.35) { const i = lv.fa < 0.17 ? 0 : 1; if (D.hy > 0.3) D.kn[i] = Math.max(0.6, D.kn[i] - 0.5); else { D.kn[i] += 1.0; D.hp[i] += 0.3; } }
        D.lean += lv.ln; D.tz += lv.tilt * 0.4; D.htz += lv.tilt;
        if (pose === 'sit' && !handsOf(s && s.hold) && lv.arms > 0.6) { arm(D, 0, 0.22, 0.55, -0.75, 1.95); arm(D, 1, 0.24, 0.6, -0.75, 1.9); }   // (its arms folded)
        glance(D, c.fence, gC, dC, lv);
        return D;
      }
      if (!standing(pose, J)) { D.htz += lv.tilt * 0.5; glance(D, c.fence, gC, dC, lv); return D; }   // (at its work: the head after the car)
      const w = wOf(lv, t), mask = handsOf(s && s.hold) | (s && s.head && s.head.length ? 3 : 0);
      let cross = false, a = lv.cp;
      if (c.fence) {   // at the fence as the car comes and passes
        if (pose === 'cheer' || pose === 'jump' || pose === 'jack0') {
          legsStand(D);
          if (lv.kid) { kidBounce(D, lv, t, ph, true); D.htz += lv.tilt; return D; }
          react(D, lv, t, ph, dC);
        } else if (pose === 'wave' || pose === 'wave2' || pose === 'fenceWave') {
          const i = pose === 'wave2' ? 0 : 1, u = t * 7.5 * lv.rk + ph;
          arm(D, i, 2.25 + 0.3 * Math.sin(u), 0.2, 0, 0.45 + 0.22 * Math.cos(u)); D.dy = 0;
          if (pose !== 'fenceWave' && !(mask & (i ? 1 : 2))) armFree(D, 1 - i, t, lv);
          if (lv.kid) { kidBounce(D, lv, t, ph, false); D.htz += lv.tilt; return D; }
        } else if (pose === 'phoneUp' && lv.fa < 0.55) { arm(D, 1, 0.35, 1.55, -0.3, 0.5); armFree(D, 0, t, lv); }
        else if (pose === 'fence') { cross = lv.cross < 0.45; if (lv.fa < 0.4) { arm(D, 0, 0.18, 0.95, 0, 1.35); if (lv.arms < 0.5) armHip(D, 1); else armHang(D, 1, t, lv); } }
        else if (pose === 'stand' || pose === 'relax') armsIdle(D, lv, t, mask);
        else if (pose === 'flagHold' && !(mask & 1) && lv.fa > 0.4) armHip(D, 0);
      } else {   // at what it does (or waiting at its place before it runs): standing its own way, the head after the car
        if (pose === 'stand' || pose === 'relax') armsIdle(D, lv, t, mask);
        if (lv.kid) { D.shx[0] += 0.16 * Math.sin(t * 2.3 + ph); D.shx[1] += 0.16 * Math.sin(t * 2.1 + ph + 2); D.look += 0.3 * Math.sin(t * 0.9 + ph); }   // (a child fidgets)
        if (pose === 'grill' || pose === 'boardOut' || pose === 'carry') a *= 0.6;
      }
      contra(D, w, a, cross);
      if (c.fence && gC > 0 && pose !== 'fence' && pose !== 'boardOut') { D.lean += 0.12 * gC; D.tz -= (dC > 0 ? 1 : -1) * Math.min(1, Math.abs(dC)) * 0.1 * gC; }   // (leaning out to see it come)
      D.hx += 0.01 * Math.sin(t * 0.83 + lv.bP); D.htz += lv.tilt;
      glance(D, c.fence, gC, dC, lv);
      return D;
    }
    // the joints on the figure: the game's, then the hips sideways, tipped and turned, the head tilted; the grandstand's people (posed only
    // when something changes) each a little their own way: leaning, turned, the head tilted, the knees apart or together
    function setJ(P, J, setJ0) {
      setJ0(P, J);
      P.hips.position.x = J.hx || 0; P.hips.rotation.z = J.hrz || 0; P.hips.rotation.y = J.hry || 0; P.head.rotation.z = J.htz || 0;
      if (P.seat) {
        const v = P.lv2 || (P.lv2 = ((k) => ({ lean: (dice(k, 1) - 0.4) * 0.16, tz: (dice(k, 2) - 0.5) * 0.12, tilt: (dice(k, 3) - 0.5) * 0.3, look: (dice(k, 4) - 0.5) * 0.7, kz: (dice(k, 5) - 0.35) * 0.22 }))(P.seat.k * 13.7 + P.seat.x * 0.31));
        P.torso.rotation.x += v.lean; P.torso.rotation.z += v.tz; P.head.rotation.z += v.tilt; P.head.rotation.y += v.look;
        if (jv(J, 'hy') < 0.6) { P.hp[0].rotation.z += v.kz; P.hp[1].rotation.z -= v.kz; }
      }
    }
    return { poseJ, alive, setJ };
  },

  crowd(K) {
    // the instanced fans and staff (real tracks only: CR_CALM; the test tracks' crowd as it is): the same figure, posed in the shader
    const HEAD = 'mat3 crRy(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }';
    const ARMS = [   // before the arms' matrix: its dice, the car's angle, its turn, its weight, its arms while it waits and its gesture
      '#ifdef CR_CALM',
      'float lvH = fract(sin(crPh * 12.9898 + crV * 0.7311) * 43758.5453), lvH2 = fract(lvH * 7.13 + crPh * 0.917), lvH3 = fract(lvH * 3.71 + lvH2 * 5.31);',
      '#ifdef USE_INSTANCING_COLOR', 'vec3 lvC = instanceColor;', '#else', 'vec3 lvC = vec3(1.0);', '#endif',
      // staff: hi-vis orange or yellow, or filming: they watch, no gesture
      'float lvStaff = ((lvC.r > 0.7 && lvC.g > 0.27 * lvC.r && lvC.g < 0.78 * lvC.r && lvC.b < 0.28 * lvC.r) || (lvC.g > 0.68 && lvC.r > 0.5 && lvC.b < 0.33 * lvC.g) || abs(crPose - 3.0) < 0.5) ? 1.0 : 0.0;',
      'vec3 lvRt = (modelMatrix * (instanceMatrix * vec4(1.0, 0.0, 0.0, 0.0))).xyz;',
      'vec2 lvD = uCar.xz - crW.xz;',
      'float lvA = atan(dot(lvD, normalize(lvRt.xz)), dot(lvD, normalize(crFw.xz)));',   // the car from its facing (+: to its +x side)
      'float lvSee = (1.0 - smoothstep(60.0, 130.0, crDc)) * (1.0 - smoothstep(1.9, 2.8, abs(lvA)));',   // it sees the car coming
      'float lvNear = (1.0 - smoothstep(30.0, 65.0, crDc)) * (1.0 - smoothstep(2.0, 2.8, abs(lvA))) * (1.0 - lvStaff);',   // the car close: its gesture
      'float lvIdle = 0.6 * sin(uTime * 0.23 + lvH * 6.2832) * sin(uTime * 0.13 + lvH2 * 6.2832 + 1.3);',   // looking about while it waits
      'float lvBy = clamp(lvA * 0.35, -0.5, 0.5) * lvSee * (1.0 - crSit);',   // the body turned a little to the car, the shoulders more, the head the rest
      'float lvTy = clamp((lvA - lvBy) * 0.45, -0.45, 0.45) * lvSee + 0.12 * lvIdle * (1.0 - lvSee);',
      'float lvHy = mix(lvIdle, clamp(lvA - lvBy - lvTy, -1.05, 1.05), lvSee);',
      'float lvW = clamp(1.7 * sin(uTime * (0.42 + 0.3 * lvH) + lvH2 * 6.2832), -1.0, 1.0); lvW = lvW * (1.5 - 0.5 * lvW * lvW);',   // its weight, from leg to leg
      'float lvHx = 0.065 * lvW * (1.0 - crSit);',
      'float lvRoll = -lvHx * 1.5 + 0.02 * sin(uTime * (0.8 + 0.4 * lvH3) + lvH * 6.2832);',
      'float lvSw = 0.014 * sin(uTime * (0.55 + 0.3 * lvH2) + lvH3 * 6.2832);',
      'float lvHt = 0.07 * lvW + 0.12 * (lvH3 - 0.5);',
      'if (crPose < 2.5 || abs(crPose - 4.0) < 0.5) {',   // standing, cheering, waving, clapping: its own arms while it waits, the gesture as the car comes
      '  float iL = 0.09 + 0.04 * sin(crT * 0.9), iR = 0.1 + 0.04 * sin(crT * 0.8 + 1.3), jL = 0.04, jR = 0.04;',
      '  if (lvH2 < 0.2) { iL = -0.16; iR = -0.16; jL = -0.38; jR = -0.38; }',   // hands behind the back
      '  else if (lvH2 < 0.4) { iL = -0.42; iR = -0.38; jL = 0.9; jR = 0.96; }',   // arms folded
      '  else if (lvH2 < 0.55) { iL = 0.47; iR = 0.45; jL = -0.12; jR = -0.1; }',   // hands on the hips
      '  else if (lvH2 < 0.7) { iL = 0.47; jL = -0.12; }',   // one hand on the hip
      '  float gL = rL, gR = rR, hL = fL, hR = fR;',   // (waving, clapping: their own motion)
      '  if (crPose < 0.5) {',
      '    if (lvH3 < 0.32) { gL = -0.22 + 0.2 * sin(uTime * 13.0 + crPh); gR = gL; hL = 0.95; hR = 0.95; }',   // clapping
      '    else if (lvH3 < 0.6) { gR = 2.4 + 0.28 * sin(uTime * 5.5 + crPh); hR = -0.15; gL = iL; hL = jL; }',   // a hand up
      '    else if (lvH3 < 0.84) { float pa = lvA - lvBy - lvTy; if (pa > 0.0) { gR = clamp(pa, 0.0, 1.4); hR = 1.45; gL = iL; hL = jL; } else { gL = clamp(-pa, 0.0, 1.4); hL = 1.45; gR = iR; hR = jR; } }',   // pointing at it
      '    else { gL = iL; gR = iR; hL = jL; hR = jR; }',   // only watching
      '  } else if (crPose < 1.5) { gL = 2.4 + 0.14 * sin(uTime * 3.0 + crPh); gR = 2.45 + 0.14 * sin(uTime * 3.0 + crPh + 0.9); hL = -0.2; hR = -0.2; }',   // both hands up, calmly
      '  rL = mix(iL, gL, lvNear); rR = mix(iR, gR, lvNear); fL = mix(jL, hL, lvNear); fR = mix(jR, hR, lvNear);',
      '} else if (crSit > 0.5 && lvH3 < 0.4) { rR = mix(rR, 2.3 + 0.2 * sin(uTime * 5.0 + crPh), lvNear); fR = mix(fR, -0.1, lvNear); }',   // sitting: a hand up
      '#endif'];
    const NORM = [   // the turns as matrices (the head about the neck, the upper body about the waist, the whole figure about its feet): the normals
      '#ifdef CR_CALM',
      'mat3 lvMB = crRy(lvBy) * crRx(lvSw), lvMU = crRz(lvRoll) * crRy(lvTy), lvMH = crRy(lvHy) * crRz(lvHt);',
      'float lvLeg = (crBone > 2.5 && crBone < 3.5) ? 1.0 : 0.0, lvHead = (crBone < 0.5 && position.y > 1.435) ? 1.0 : 0.0;',
      'if (lvHead > 0.5) objectNormal = lvMH * objectNormal;',
      'if (lvLeg < 0.5) objectNormal = lvMU * objectNormal;',
      'objectNormal = lvMB * objectNormal;',
      '#endif'];
    const POS = [   // and the vertices (before sitting down: the sitting ones moved down and back after)
      '#ifdef CR_CALM',
      'if (lvHead > 0.5) transformed = vec3(0.0, 1.43, 0.0) + lvMH * (transformed - vec3(0.0, 1.43, 0.0));',
      'if (lvLeg < 0.5) { transformed = vec3(0.0, 0.84, 0.0) + lvMU * (transformed - vec3(0.0, 0.84, 0.0)); transformed.x += lvHx; }',
      'else transformed.x += lvHx * clamp(transformed.y / 0.84, 0.0, 1.0);',   // (the legs lean with the hips; the feet stay)
      'transformed = lvMB * transformed;',
      '#endif'];
    return {
      shader(S) {
        const N = S.CR_VS_NORMAL.split('\n'), Q = S.CR_VS_POS.split('\n');
        const iN = N.findIndex(l => l.indexOf('mat3 crM = mat3(1.0)') === 0), iQ = Q.findIndex(l => l.indexOf('if (crSit > 0.5) transformed +=') === 0);
        if (iN < 0 || iQ < 0) return S;   // (the game's shader changed: as it is)
        N.splice(iN, 0, ...ARMS); N.push(...NORM); Q.splice(iQ, 0, ...POS);
        return { CR_VS_HEAD: S.CR_VS_HEAD + '\n' + HEAD, CR_VS_COLOR: S.CR_VS_COLOR, CR_VS_NORMAL: N.join('\n'), CR_VS_POS: Q.join('\n') };
      },
    };
  },
};
