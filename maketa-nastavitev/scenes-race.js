/* SETTINGS ANIMATIONS — Dirka: Težavnost, Poškodbe, Okvare, Radio ekipe, Uvod, Prelet proge, Video najboljšega trenutka; Pavza: Gume v boksih */
(function () {
  'use strict';
  const A = SetAnim, { TAU, clamp, lerp, sstep, ease, easeOut, fract, hash, PAL } = A;

  /* ---------------- a straight road to the east (x), endless: the asphalt, its lines, kerbs, a wall, things beside it ---------------- */
  function straight(g, V, x0, x1, o) {
    o = o || {}; const w = o.w || 12, hw = w / 2;
    A.quad(g, V, x0, 0, -hw, x1, 0, -hw, x1, 0, hw, x0, 0, hw, o.col || PAL.asphalt);
    for (const z of [-hw + 0.3, hw - 0.6]) A.quad(g, V, x0, 0, z, x1, 0, z, x1, 0, z + 0.3, x0, 0, z + 0.3, PAL.line);
    if (o.lanes) for (let x = Math.floor(x0 / 8) * 8; x < x1; x += 8) for (const z of o.lanes) A.quad(g, V, x, 0, z - 0.12, x + 3.5, 0, z - 0.12, x + 3.5, 0, z + 0.12, x, 0, z + 0.12, 'rgba(255,255,255,.6)');
    if (o.kerbs) for (let x = Math.floor(x0 / 2) * 2; x < x1; x += 2) { const c = (Math.floor(x / 2) & 1) ? PAL.kerbR : PAL.kerbW; for (const s of [-1, 1]) A.quad(g, V, x, 0, s * hw, x + 2, 0, s * hw, x + 2, 0, s * (hw + 1), x, 0, s * (hw + 1), c); }
  }
  // the wall along the north edge of the road (a barrier of red and white blocks): drawn in pieces so the depth sort is right
  function wallPieces(x0, x1, z, list) { for (let x = Math.floor(x0 / 3) * 3; x < x1; x += 3) list.push({ kind: 'wall', x: x + 1.5, z, c: (Math.floor(x / 3) & 1) ? PAL.kerbR : PAL.kerbW }); }
  function drawWall(g, V, o) { const B = [[o.x - 1.5, 0, o.z + 0.35], [o.x + 1.5, 0, o.z + 0.35], [o.x + 1.5, 0, o.z - 0.35], [o.x - 1.5, 0, o.z - 0.35]].reverse(); const T = B.map(p => [p[0], 1.0, p[2]]); A.prism(g, V, B, T, o.c); }
  // the things beside an endless straight: deterministic per 6 m of road, those in view
  function roadside(x0, x1, o) {
    const a = [], hw = (o.w || 12) / 2;
    for (let x = Math.floor(x0 / 6) * 6; x < x1; x += 6) for (const side of [-1, 1]) {
      const r = hash(x * 0.37 + side * 11 + (o.seed || 0)); if (r > (o.p || 0.5)) continue;
      const z = side * (hw + 4 + hash(x * 1.3 + side) * (o.far || 20));
      if (o.noNorth && side > 0) continue;
      a.push({ kind: r < 0.15 ? 'pine' : 'tree', x: x + hash(x + side) * 5, z, s: 0.7 + hash(x * 2.1 + side) * 0.5, c: PAL.leaf[(Math.floor(x / 6) + (side > 0 ? 1 : 0)) & 3] });
    }
    return a;
  }
  A.straight = straight; A.roadside = roadside;

  /* ---------------- Težavnost: Lahka / Srednja / Težka / Super težka ---------------- */
  A.def('difficulty', {
    opts: [0, 1, 2, 3], dur: 0.6,
    P: (v) => ({ lvl: +v, rate: [-7, 0, 6.5, 6.5][+v], fight: +v === 1 ? 1 : 0, pol: +v === 3 ? 1 : 0 }),
    init(S) { S.V = new A.View(); S.t0 = 0; },
    onChange(S, v, prev, now) { S.t0 = now; },
    draw(g, W, H, t, p, st, S) {
      const PER = 4.8, T = ((t - S.t0) % PER + PER) % PER, vP = 30, px = t * vP;
      const player = { x: px, z: 0, h: Math.PI / 2, col: PAL.player, marker: true };
      const RIV = [[2.5, -4.2, PAL.rivals[1]], [-0.5, 4.2, PAL.rivals[2]], [6, 0.2, PAL.rivals[3]]];
      const cars = RIV.map(([b, z, c], i) => {
        const rel = b + p.rate * T * (0.85 + i * 0.15) + p.fight * 3 * Math.sin(T * 1.6 + i * 2.1);
        return { x: px + rel, z: z + (rel > -5 && rel < 5 && Math.abs(z) < 1 ? 4.2 : 0), h: Math.PI / 2, col: c, stripe: false };
      });
      if (p.pol > 0.01) for (const [k, z] of [[0, -4], [1, 4]]) { const rel = (A.orient() === 'land' ? -18 + 3.4 * T : -9 + 2.6 * T) + k * 1.5; cars.push({ x: px + rel - (1 - p.pol) * 30, z, h: Math.PI / 2, col: '#f4f6f9', roof: '#1b2a4a', police: true, t, stripe: false }); }
      cars.push(player);
      const asp = W / H, D = Math.max(20 * Math.sin(0.82) / (2 * Math.tan(15 * A.D2R)), 48 / (2 * Math.tan(15 * A.D2R) * asp));
      const V = S.V.set(A.orient() === 'land' ? A.camAt(px + 5, 0, 0, D, 0, 0.82, 30) : A.driveCam(player, { hv: Math.PI / 2, Dc: 30, ahc: 8, pc: 0.74, fc: 44 }), 0, 0, W, H);
      A.scene(g, V, { t, things: roadside(px - 60, px + 80, { w: 14, p: 0.45 }), cars, under: (g2, V2) => straight(g2, V2, px - 80, px + 90, { w: 14, kerbs: true, lanes: [-2.1, 2.1] }) });
      // the meter: 1..4 bars
      const n = 4, bw = Math.max(5, H * 0.05), bx = W - 12 - n * (bw + 3), by = 12, bh = H * 0.2;
      g.fillStyle = 'rgba(8,13,22,.7)'; A.rr(g, bx - 7, by - 5, n * (bw + 3) + 11, bh + 10, 6); g.fill();
      const cols = ['#5fd13a', '#f1c21b', '#ff8a3d', '#ee3b2b'];
      for (let i = 0; i < n; i++) { const hh = bh * (0.35 + 0.65 * (i + 1) / n), on = clamp(p.lvl + 1 - i, 0, 1); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(bx + i * (bw + 3), by + bh - hh, bw, hh); if (on > 0) { g.fillStyle = cols[Math.min(3, Math.round(p.lvl))]; g.fillRect(bx + i * (bw + 3), by + bh - hh * on, bw, hh * on); } }
      const fade = sstep(PER - 0.35, PER, T) + (1 - sstep(0, 0.3, T));
      if (fade > 0.01) { g.fillStyle = 'rgba(8,18,31,' + Math.min(0.85, fade * 0.85) + ')'; g.fillRect(0, 0, W, H); }
    }
  });

  /* ---------------- Poškodbe avtov: Izklop / Samo videz / Vklop ---------------- */
  function dmgIcon(g, x, y, s, front, alpha) {   // the game's #h-dmg: the car's outline, its zones from green to red
    if (alpha <= 0.01) return;
    const col = (z) => 'hsl(' + Math.round(120 * (1 - Math.min(1, z))) + ',78%,52%)';
    g.save(); g.globalAlpha = alpha; g.translate(x, y); g.scale(s / 50, s / 50);
    g.fillStyle = 'rgba(10,14,20,.6)'; g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.6; A.rr(g, 5, 3, 20, 44, 6); g.fill(); g.stroke();
    g.fillStyle = col(front); A.rr(g, 7.5, 5.5, 15, 9, 3); g.fill();
    g.fillStyle = col(0); A.rr(g, 7.5, 35.5, 15, 9, 3); g.fill(); g.fillStyle = col(front * 0.55); A.rr(g, 7.5, 16, 4.5, 18, 1.5); g.fill(); g.fillStyle = col(0.05); A.rr(g, 18, 16, 4.5, 18, 1.5); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)'; A.rr(g, 13, 17, 4, 16, 1.5); g.fill();
    g.restore();
  }
  A.dmgIcon = dmgIcon;
  A.def('damage', {
    opts: [0, 1, 2], dur: 0.5,
    P: (v) => ({ vis: +v >= 1 ? 1 : 0, real: +v === 2 ? 1 : 0, icon: +v >= 1 ? 1 : 0 }),
    init(S) { S.V = new A.View(); S.t0 = 0; S.fx = new A.Particles(); S.x = 0; S.last = -1; S.v = 32; },
    onChange(S, v, prev, now) { S.t0 = now - 0.5; S.fx = new A.Particles(); },
    draw(g, W, H, t, p, st, S) {
      const PER = 5.4, T = ((t - S.t0) % PER + PER) % PER, dt = st.dt || 0;
      if (T < S.last) { S.fx = new A.Particles(); S.v = 32; }
      const hitT = 1.55, hit = T >= hitT, after = T - hitT;
      // the speed: the same after the knock (off, visual only), a car that limps on (on)
      const vTarget = hit ? lerp(31, 18, p.real) : 32;
      S.v += (vTarget - S.v) * (1 - Math.exp(-dt * (hit ? 2.2 : 3))); S.x += S.v * dt;
      // the line: along the road, a swerve into the wall, the knock, back
      let z = 0, hd = 0;
      if (T > 0.9 && !hit) { const k = sstep(0.9, hitT, T); z = 4.3 * k; hd = -0.42 * Math.sin(k * Math.PI * 0.9); }
      else if (hit) { const k = sstep(0, 0.7, after); z = lerp(4.3, 1.2, k); hd = 0.35 * Math.exp(-after * 2.5) * Math.cos(after * 9) + p.real * 0.06 * Math.sin(T * 13); }
      const car = { x: S.x, z, h: Math.PI / 2 + hd, col: PAL.player, marker: true, dent: p.vis * sstep(0, 0.12, after) * (hit ? 0.95 : 0) };
      if (hit && S.last < hitT) {   // the knock
        const cx = S.x + 2, cz = 5.4;
        for (let i = 0; i < 26; i++) S.fx.add({ kind: p.vis > 0.5 ? 'spark' : 'smoke', x: cx, z: cz, y: 0.6, vx: (Math.random() - 0.2) * 14, vz: -Math.random() * 6, vy: Math.random() * 5, g: 14, age: 0, life: p.vis > 0.5 ? 0.5 + Math.random() * 0.4 : 0.5, r0: 0.3, r1: 1.2, c: '200,200,200' });
        if (p.vis > 0.5) for (let i = 0; i < 5; i++) S.fx.add({ kind: 'bit', x: cx, z: cz - 0.5, y: 0.6, vx: 4 + Math.random() * 10, vz: -2 - Math.random() * 5, vy: 3 + Math.random() * 4, g: 14, age: 0, life: 1.4, c: i & 1 ? PAL.player : '#20242b' });
      }
      if (hit && p.real > 0.5 && Math.random() < dt * 22) { const ch = Math.cos(car.h), sh = Math.sin(car.h); S.fx.add({ kind: 'smoke', x: car.x + sh * 1.8, z: car.z + ch * 1.8, y: 1, vx: -S.v * 0.6 + (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2, vy: 1.4, age: 0, life: 1.2, r0: 0.6, r1: 2.6, c: '90,92,96' }); }
      S.fx.step(dt); S.last = T;
      const asp = W / H, D = Math.max(15 * Math.sin(0.82) / (2 * Math.tan(15 * A.D2R)), 26 / (2 * Math.tan(15 * A.D2R) * asp));
      const V = S.V.set(A.orient() === 'land' ? A.camAt(S.x + 3, 0, 2.2, D, 0, 0.82, 30) : A.driveCam({ x: S.x, z: 1.6, h: Math.PI / 2 }, { hv: Math.PI / 2, Dc: 21, ahc: 4, pc: 0.8, fc: 50 }), 0, 0, W, H);
      const things = roadside(S.x - 50, S.x + 70, { w: 10, p: 0.5, noNorth: true }); wallPieces(S.x - 60, S.x + 80, 5.6, things);
      A.scene(g, V, { t, things, cars: [car], under: (g2, V2) => straight(g2, V2, S.x - 70, S.x + 90, { w: 10, lanes: [0] }), over: (g2, V2) => S.fx.draw(g2, V2) });
      // the HUD: the car's damage (not there with damage off) and the speed
      const s = Math.max(26, H * 0.24), fs = Math.max(11, H * 0.09);
      g.fillStyle = 'rgba(8,13,22,.62)'; A.rr(g, 6, H - fs * 2.3 - 6, fs * 6.2, fs * 2.3, 6); g.fill();
      A.text(g, String(Math.round(S.v * 7.2)), 12 + fs * 2.4, H - fs * 1.15 - 6, { size: fs * 1.3, col: S.v < 25 ? '#ff8a7a' : PAL.lime, al: 'right', w: 900 });
      A.text(g, 'km/h', 16 + fs * 2.4, H - fs * 1.05 - 6, { size: fs * 0.7, col: '#c9d3e2', al: 'left', w: 800 });
      g.fillStyle = 'rgba(8,13,22,.62)'; A.rr(g, W - s * 0.62 - 12, 6, s * 0.62 + 6, s + 4, 6); g.globalAlpha = p.icon; g.fill(); g.globalAlpha = 1;
      dmgIcon(g, W - s * 0.62 - 9, 8, s, p.vis * (hit ? 0.95 : 0), p.icon);
      const fade = sstep(PER - 0.3, PER, T); if (fade > 0.01) { g.fillStyle = 'rgba(8,18,31,' + fade * 0.85 + ')'; g.fillRect(0, 0, W, H); }
    }
  });
  // (the wall pieces go through scene()'s things: drawn by thing() — a kind it does not know; drawn here instead)
  A.kinds.wall = drawWall;

  /* ---------------- Okvare: Izklop / Vklop (a cut tyre, hot brakes, a hot engine) ---------------- */
  A.def('faults', {
    opts: [0, 1], dur: 0.5,
    P: (v) => ({ on: +v }),
    init(S) { S.V = new A.View(); S.fx = new A.Particles(); S.x = 0; S.t0 = 0; },
    onChange(S, v, prev, now) { S.t0 = now - 0.3; S.fx = new A.Particles(); },
    draw(g, W, H, t, p, st, S) {
      const PER = 7.6, T = ((t - S.t0) % PER + PER) % PER, dt = st.dt || 0, on = p.on;
      const punct = on * (T > 0.5 && T < 2.7 ? sstep(0.5, 1.0, T) : 0), brakes = on * (T > 2.9 && T < 5.0 ? sstep(2.9, 3.4, T) * (1 - sstep(4.6, 5.0, T)) : 0), engine = on * (T > 5.2 && T < 7.3 ? 1 : 0);
      const v = 24 - brakes * 9 - punct * 4; S.x += v * dt;
      const car = { x: S.x, z: -punct * 0.8, h: Math.PI / 2 - punct * 0.06 * (1 + Math.sin(T * 9)), col: PAL.player, marker: false, flat: [punct > 0.6, false, false, false], glow: brakes, brakeLights: brakes > 0.3 };
      const ch = Math.cos(car.h), sh = Math.sin(car.h);
      if (punct > 0.05 && punct < 0.9 && Math.random() < dt * 30) S.fx.add({ kind: 'air', x: car.x + sh * 1.35 + ch * -1.0, z: car.z + ch * 1.35 - sh * -1.0, y: 0.4, age: 0, life: 0.6 });
      if (punct > 0.9 && Math.random() < dt * 18) S.fx.add({ kind: 'spark', x: car.x + sh * 1.35 + ch * -1.0, z: car.z + ch * 1.35 - sh * -1.0, y: 0.1, vx: -v * 0.8 - Math.random() * 6, vz: (Math.random() - 0.5) * 4, vy: Math.random() * 3, g: 12, age: 0, life: 0.35 });
      if (engine > 0.5 && Math.random() < dt * 26) S.fx.add({ kind: 'smoke', x: car.x + sh * 1.6, z: car.z + ch * 1.6, y: 1.1, vx: -v * 0.5 + (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2, vy: 1.6, age: 0, life: 1.1, r0: 0.5, r1: 2.2, c: '240,240,240' });
      S.fx.step(dt);
      const asp = W / H, D = Math.max(12 * Math.sin(0.82) / (2 * Math.tan(15 * A.D2R)), 24 / (2 * Math.tan(15 * A.D2R) * asp));
      const V = S.V.set(A.orient() === 'land' ? A.camAt(S.x + 1.5, 0, 0.4, D, 0, 0.82, 30) : A.driveCam({ x: S.x, z: 0, h: Math.PI / 2 }, { hv: Math.PI / 2, Dc: 13, ahc: 1.5, pc: 0.86, fc: 42 }), 0, 0, W, H);
      A.scene(g, V, { t, things: roadside(S.x - 30, S.x + 40, { w: 9, p: 0.5 }), cars: [car], under: (g2, V2) => straight(g2, V2, S.x - 40, S.x + 50, { w: 9, lanes: [0], kerbs: true }), over: (g2, V2) => {
        S.fx.draw(g2, V2);
        if (brakes > 0.3) for (let i = 0; i < 3; i++) {   // the heat over the brakes: wavy lines
          const T3 = [0, 0, 0, 0]; V2.p(car.x + (i - 1) * 1.3, 1.6, car.z - 1.2, T3); if (!T3[3]) continue; g2.strokeStyle = 'rgba(255,170,90,' + 0.5 * brakes + ')'; g2.lineWidth = 1.5; g2.beginPath();
          for (let k = 0; k < 8; k++) { const y = T3[1] - k * 3, x = T3[0] + Math.sin(t * 9 + k + i) * 2.5; if (k) g2.lineTo(x, y); else g2.moveTo(x, y); } g2.stroke(); }
      } });
      // the HUD's pills (#h-flt)
      const s = Math.max(9, H * 0.075); let x = 10;
      if (punct > 0.5) x += A.pill(g, x, 14, 'PREDRTA GUMA', { size: s, bg: 'rgba(190,30,30,.85)' }) + 5;
      if (brakes > 0.3) x += A.pill(g, x, 14, 'VROČE ZAVORE', { size: s, bg: 'rgba(214,104,18,.88)' }) + 5;
      if (engine > 0.5) A.pill(g, x, 14, 'VROČ MOTOR', { size: s, bg: 'rgba(196,58,28,.88)' });
    }
  });

  /* ---------------- Radio ekipe: Izklop / Vklop ---------------- */
  const RADIO = ['Pred tabo 1,2 s · za tabo 0,8 s', 'Boksi v tem krogu.', 'Dež čez dva kroga.'];
  function headset(g, x, y, r, talk, on) {
    g.save(); g.translate(x, y);
    g.strokeStyle = on ? '#dfe6f1' : '#5d6b82'; g.lineWidth = r * 0.16; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, r * 0.8, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.fillStyle = on ? '#dfe6f1' : '#5d6b82'; for (const s of [-1, 1]) { A.rr(g, s * r * 0.8 - r * 0.22, -r * 0.1, r * 0.44, r * 0.62, r * 0.18); g.fill(); }
    g.strokeStyle = on ? '#dfe6f1' : '#5d6b82'; g.lineWidth = r * 0.1; g.beginPath(); g.moveTo(-r * 0.75, r * 0.45); g.quadraticCurveTo(-r * 0.6, r * 0.9, -r * 0.05, r * 0.88); g.stroke();
    g.fillStyle = on ? PAL.gold : '#5d6b82'; g.beginPath(); g.arc(0, r * 0.88, r * 0.12, 0, TAU); g.fill();
    if (on && talk > 0) for (let i = 1; i <= 3; i++) { const a = (0.5 + 0.5 * Math.sin(talk * 12 - i)) * 0.8; g.strokeStyle = 'rgba(255,198,41,' + a + ')'; g.lineWidth = Math.max(1.5, r * 0.07); g.beginPath(); g.arc(r * 0.05, r * 0.88, r * 0.22 * i + r * 0.1, -0.7, 0.7); g.stroke(); }
    g.restore();
  }
  A.headset = headset;
  A.def('radio', {
    opts: [0, 1], dur: 0.6,
    P: (v) => ({ on: +v }),
    draw(g, W, H, t, p) {
      A.studio(g, W, H);
      const wide = W / H > 2.6, i = Math.floor(t / 2.8) % RADIO.length, f = fract(t / 2.8), msg = RADIO[i];
      const typed = msg.slice(0, Math.ceil(msg.length * clamp(f / 0.35, 0, 1))), talking = f < 0.5 ? t : 0;
      const r = Math.min(H * 0.3, W * 0.12), hx = wide ? W * 0.18 : W * 0.17, hy = H * 0.47;
      headset(g, hx, hy, r, talking * p.on, true);
      A.slash(g, hx, hy + r * 0.2, r * 1.1, 1 - p.on);
      // the radio box (#h-teamradio): a gold edge, RADIO, the words
      if (p.on > 0.01) {
        const bx = wide ? W * 0.33 : W * 0.36, bw = W - bx - 12, bh = Math.min(H * 0.42, 64), by = H / 2 - bh / 2 + (1 - ease(p.on)) * 16;
        g.save(); g.globalAlpha = ease(p.on) * (f > 0.92 ? 1 - (f - 0.92) / 0.08 : 1);
        g.fillStyle = 'rgba(10,14,20,.85)'; A.rr(g, bx, by, bw, bh, 8); g.fill(); g.fillStyle = PAL.lcd; g.fillRect(bx, by + 4, 4, bh - 8);
        const s = Math.max(10, Math.min(H * 0.1, bw * 0.06));
        g.fillStyle = PAL.lcd; A.rr(g, bx + 12, by + bh * 0.5 - s * 0.75, s * 4, s * 1.5, 4); g.fill(); A.text(g, 'RADIO', bx + 12 + s * 2, by + bh * 0.5 + 0.5, { size: s * 0.82, col: '#111', w: 900 });
        g.font = '700 ' + s + 'px ApexMenu, Roboto, sans-serif'; const room = bw - 30 - s * 4.3, fs = Math.min(s, s * room / Math.max(1, g.measureText(msg).width));
        A.text(g, typed, bx + 20 + s * 4.3, by + bh * 0.5 + 0.5, { size: fs, col: '#fff', al: 'left', w: 700, it: false });
        g.restore();
      }
    }
  });

  /* ---------------- Uvod pred dirko: Polni / Kratki / Brez ---------------- */
  const STAGE_LEN = { globe: 2.8, heli: 2.4, lights: 1.8, race: 1.4 };
  const STAGE_COL = { globe: '#3a8bd8', heli: '#2fa84f', lights: '#e63b2e', race: '#ffc629' };
  const INTRO = [['globe', 'heli', 'lights', 'race'], ['heli', 'lights', 'race'], ['lights', 'race']];
  function globe(g, x, y, r, t, k) {   // a turning Earth with a flight from one pin to another
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, '#4fa3e6'); gr.addColorStop(1, '#123d73');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
    for (let i = 0; i < 9; i++) { const lon = fract(hash(i * 3.7) + t * 0.06) * TAU, lat = (hash(i * 9.1) - 0.5) * 2.2, cx = x + Math.sin(lon) * Math.cos(lat) * r, cy = y - Math.sin(lat) * r * 0.9;
      if (Math.cos(lon) < 0) continue; g.fillStyle = 'rgba(96,170,84,' + (0.5 + 0.5 * Math.cos(lon)) + ')'; g.beginPath(); g.ellipse(cx, cy, r * (0.18 + hash(i) * 0.2) * Math.cos(lon), r * (0.12 + hash(i * 2) * 0.14), 0, 0, TAU); g.fill(); }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    const ax = x - r * 0.45, ay = y + r * 0.1, bx = x + r * 0.4, by = y - r * 0.25, mx = (ax + bx) / 2, my = Math.min(ay, by) - r * 0.55;
    g.strokeStyle = PAL.gold; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(mx, my, bx, by); g.stroke(); g.setLineDash([]);
    const u = clamp(k, 0, 1), px = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx, py = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by;
    for (const [qx, qy, c] of [[ax, ay, '#dfe6f1'], [bx, by, PAL.curb]]) { g.fillStyle = c; g.beginPath(); g.arc(qx, qy - 5, 4, 0, TAU); g.fill(); g.fillRect(qx - 1, qy - 5, 2, 6); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 3, 0, TAU); g.fill();
  }
  function heli(g, x, y, s, t) {   // a helicopter from above, its rotor turning
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + s * 0.5, y + s * 0.6, s * 0.5, s * 0.25, 0, 0, TAU); g.fill();
    g.fillStyle = '#e8ecf2'; g.beginPath(); g.ellipse(x, y, s * 0.5, s * 0.26, 0, 0, TAU); g.fill(); g.fillRect(x - s * 1.1, y - s * 0.05, s * 0.7, s * 0.1); g.fillRect(x - s * 1.15, y - s * 0.2, s * 0.08, s * 0.4);
    g.fillStyle = '#2a4d7a'; g.beginPath(); g.ellipse(x + s * 0.22, y, s * 0.2, s * 0.17, 0, 0, TAU); g.fill();
    g.save(); g.translate(x, y); g.rotate(t * 20); g.strokeStyle = 'rgba(30,34,40,.75)'; g.lineWidth = Math.max(1.5, s * 0.06); g.beginPath(); g.moveTo(-s * 0.9, 0); g.lineTo(s * 0.9, 0); g.moveTo(0, -s * 0.9); g.lineTo(0, s * 0.9); g.stroke(); g.restore();
  }
  function lights(g, x, y, w, k) {   // five start lights coming on, then out: go
    const n = 5, r = Math.min(w / (n * 2.6), 12), on = Math.floor(clamp(k / 0.7, 0, 1) * 5.99), go = k > 0.78;
    g.fillStyle = '#14171c'; A.rr(g, x - n * r * 1.3 - 4, y - r * 1.6, n * r * 2.6 + 8, r * 3.2, r * 0.6); g.fill();
    for (let i = 0; i < n; i++) { const lit = !go && i < on; g.fillStyle = go ? '#2fd14a' : lit ? '#ff2a1a' : '#3b1512'; g.beginPath(); g.arc(x - (n - 1) * r * 1.3 + i * r * 2.6, y, r, 0, TAU); g.fill(); if (lit || go) { g.fillStyle = go ? 'rgba(47,209,74,.25)' : 'rgba(255,42,26,.25)'; g.beginPath(); g.arc(x - (n - 1) * r * 1.3 + i * r * 2.6, y, r * 1.8, 0, TAU); g.fill(); } }
  }
  A.globe = globe; A.heli = heli; A.lights = lights;
  A.def('intro', {
    opts: [0, 1, 2], dur: 0.8,
    P: (v) => { const L = INTRO[+v]; return { gl: L.includes('globe') ? 1 : 0, he: L.includes('heli') ? 1 : 0 }; },
    init(S) { S.t0 = 0; },
    onChange(S, v, prev, now) { S.t0 = now; },
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H, { floor: false });
      const L = [], wide = W / H > 2.6;
      if (p.gl > 0.01) L.push(['globe', STAGE_LEN.globe * p.gl]); if (p.he > 0.01) L.push(['heli', STAGE_LEN.heli * p.he]); L.push(['lights', STAGE_LEN.lights], ['race', STAGE_LEN.race]);
      const total = L.reduce((a, b) => a + b[1], 0), T = ((t - S.t0) % (total + 0.6) + total + 0.6) % (total + 0.6);
      let at = 0, cur = L[L.length - 1], k = 1; for (const s of L) { if (T < at + s[1]) { cur = s; k = (T - at) / s[1]; break; } at += s[1]; }
      // the picture of the stage now
      const sx = wide ? W * 0.3 : W * 0.5, sw = wide ? W * 0.44 : W * 0.86, sh = H * 0.62, sy = H * 0.06;
      g.save(); A.rr(g, sx - sw / 2, sy, sw, sh, 8); g.clip();
      g.fillStyle = '#0a1525'; g.fillRect(sx - sw / 2, sy, sw, sh);
      const cy = sy + sh / 2;
      if (cur[0] === 'globe') { g.fillStyle = '#050b16'; g.fillRect(sx - sw / 2, sy, sw, sh); for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,255,255,' + hash(i) * 0.7 + ')'; g.fillRect(sx - sw / 2 + hash(i * 3) * sw, sy + hash(i * 5) * sh, 1.2, 1.2); } globe(g, sx, cy + sh * 0.08, sh * 0.42 * (1 + k * 0.15), t, k); }
      else if (cur[0] === 'heli') {
        g.fillStyle = PAL.grass; g.fillRect(sx - sw / 2, sy, sw, sh);
        g.strokeStyle = PAL.asphalt; g.lineWidth = sh * 0.12; g.beginPath(); g.ellipse(sx + (0.5 - k) * sw * 0.3, cy, sw * 0.32, sh * 0.28, 0, 0, TAU); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.stroke();
        for (let i = 0; i < 8; i++) { const tx = sx - sw / 2 + fract(hash(i) - k * 0.3) * sw, ty = sy + hash(i * 7) * sh; g.fillStyle = '#2f7d32'; g.beginPath(); g.arc(tx, ty, sh * 0.05, 0, TAU); g.fill(); }
        heli(g, sx - sw * 0.25 + k * sw * 0.5, cy - sh * 0.1, sh * 0.2, t);
      } else if (cur[0] === 'lights') { g.fillStyle = '#2a2f38'; g.fillRect(sx - sw / 2, sy, sw, sh); for (let i = 0; i < 8; i++) { g.fillStyle = i & 1 ? '#f6f6f1' : '#14171c'; g.fillRect(sx - sw / 2 + i * sw / 8, sy + sh * 0.78, sw / 8, sh * 0.06); } lights(g, sx, cy - sh * 0.1, sw * 0.7, k); A.car2d(g, sx, sy + sh * 0.92, 0, sh * 0.3, PAL.player, {}); }
      else { g.fillStyle = PAL.asphalt; g.fillRect(sx - sw / 2, sy, sw, sh); g.fillStyle = 'rgba(255,255,255,.6)'; for (let y = sy - 20 + (k * 120) % 20; y < sy + sh; y += 20) g.fillRect(sx - 1, y, 2, 10); A.car2d(g, sx, sy + sh * (0.72 - k * 0.5), 0, sh * 0.3, PAL.player, {}); }
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; A.rr(g, sx - sw / 2, sy, sw, sh, 8); g.stroke();
      // the timeline: one segment per stage, as long as it lasts; the playhead
      const tx0 = wide ? W * 0.56 : W * 0.07, tw = wide ? W * 0.4 : W * 0.86, ty = wide ? H * 0.42 : H * 0.8, th = Math.max(8, H * 0.07), full = STAGE_LEN.globe + STAGE_LEN.heli + STAGE_LEN.lights + STAGE_LEN.race;
      let x = tx0;
      for (const s of L) { const w = tw * s[1] / full; g.fillStyle = A.rgba(STAGE_COL[s[0]], s === cur ? 0.95 : 0.55); A.rr(g, x, ty, Math.max(0, w - 2), th, th / 2); g.fill(); x += w; }
      const hx = tx0 + tw * T / full; if (T <= total) { g.fillStyle = '#fff'; g.fillRect(Math.min(hx, x) - 1, ty - 4, 2, th + 8); }
      if (wide) {   // the icons over the timeline
        let ix = tx0; for (const s of L) { const w = tw * s[1] / full; const c = ix + w / 2, iy = ty - H * 0.16;
          g.save(); g.globalAlpha = s === cur ? 1 : 0.6;
          if (s[0] === 'globe') { g.fillStyle = '#3a8bd8'; g.beginPath(); g.arc(c, iy, H * 0.07, 0, TAU); g.fill(); }
          else if (s[0] === 'heli') heli(g, c, iy, H * 0.07, t);
          else if (s[0] === 'lights') { g.fillStyle = '#e63b2e'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(c + i * H * 0.05, iy, H * 0.02, 0, TAU); g.fill(); } }
          else A.car2d(g, c, iy, 0, H * 0.12, PAL.player, {});
          g.restore(); ix += w; }
      }
    }
  });

  /* ---------------- Prelet proge pred startom (Pikes Peak, Katu-Jaryk): Izklop / Vklop ---------------- */
  A.def('pkFly', {
    opts: [0, 1], dur: 0.5,
    P: (v) => ({ on: +v }),
    init(S) { S.V = new A.View(); S.t0 = 0; },
    onChange(S, v, prev, now) { S.t0 = now; },
    draw(g, W, H, t, p, st, S) {
      const M = A.MTN, fly = p.on > 0.5 ? 3.4 : 0, PER = fly + 3.2, T = ((t - S.t0) % PER + PER) % PER;
      const start = M.at(4), car0 = { x: start.x, z: start.z, h: start.h, col: PAL.player, marker: true };
      let cam, car = car0, cap = 0, lightsK = -1;
      if (T < fly) {   // the flight along the road, start to top, high over it
        const u = ease(T / fly), q = M.at(4 + u * (M.len - 8)); cam = A.camAt(q.x, 0, q.z, 52, lerp(0, 0.6, Math.sin(u * Math.PI)), 0.95, 34); cap = 1;
      } else {
        const T2 = T - fly; lightsK = clamp(T2 / 1.8, 0, 1);
        const go = T2 > 1.5 ? (T2 - 1.5) : 0, q = M.at(4 + go * go * 6); car = { x: q.x, z: q.z, h: q.h, col: PAL.player, marker: true };
        cam = A.driveCam(car0, { Di: 36, ahi: 4, Dc: 24, ahc: 7 });
      }
      const V = S.V.set(cam, 0, 0, W, H);
      A.scene(g, V, { t, groundFn: A.mtnGround, roads: [{ P: M, w: 7.5, kerbs: false, centre: '#f2c230', shoulder: 1.2, shoulderCol: '#a69a86' }], things: A.MTN_THINGS, cars: [car] });
      if (cap) {   // the flyover's caption and its progress
        const s = Math.max(10, H * 0.08); g.fillStyle = 'rgba(8,13,22,.72)'; A.rr(g, 10, 10, s * 9, s * 2.2, 6); g.fill();
        A.text(g, 'PRELET PROGE', 18, 10 + s * 1.1, { size: s, col: PAL.gold, al: 'left', w: 900 });
        g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(10, H - 10, W - 20, 3); g.fillStyle = PAL.gold; g.fillRect(10, H - 10, (W - 20) * T / fly, 3);
        const fadeIn = 1 - sstep(0, 0.25, T), fadeOut = sstep(fly - 0.25, fly, T); if (fadeIn + fadeOut > 0.01) { g.fillStyle = 'rgba(8,18,31,' + (fadeIn + fadeOut) * 0.8 + ')'; g.fillRect(0, 0, W, H); }
      } else if (lightsK >= 0) lights(g, W / 2, H * 0.16, Math.min(W * 0.4, 150), lightsK);
    }
  });

  /* ---------------- Video najboljšega trenutka po dirki: Izklop / Vklop ---------------- */
  function chequer(g, x, y, w, h, t) {   // a waving chequered flag
    const n = 6, m = 4, cw = w / n, chh = h / m;
    g.strokeStyle = '#c9d1dc'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h * 1.9); g.stroke();
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const wv = Math.sin(t * 6 - i * 0.9) * h * 0.08 * (i / n); g.fillStyle = (i + j) & 1 ? '#14171c' : '#f6f6f1'; g.fillRect(x + i * cw, y + j * chh + wv, cw + 0.5, chh + 0.5); }
  }
  function results(g, x, y, w, h, k) {
    const rows = [['1.', 'TI', '4:12,3', true], ['2.', 'KOV', '+0,8'], ['3.', 'HAY', '+2,1']], rh = h / 3.4;
    rows.forEach((r, i) => { const a = clamp(k * 3 - i * 0.6, 0, 1); g.save(); g.globalAlpha = a; g.translate((1 - a) * 20, 0);
      g.fillStyle = r[3] ? 'rgba(255,210,63,.92)' : 'rgba(10,14,20,.75)'; A.rr(g, x, y + i * (rh + 3), w, rh, 4); g.fill();
      const c = r[3] ? '#16181c' : '#fff', s = rh * 0.5; A.text(g, r[0], x + s * 1.4, y + i * (rh + 3) + rh / 2, { size: s, col: c, al: 'right', w: 900 }); A.text(g, r[1], x + s * 2, y + i * (rh + 3) + rh / 2, { size: s, col: c, al: 'left', w: 800 }); A.text(g, r[2], x + w - s * 0.6, y + i * (rh + 3) + rh / 2, { size: s * 0.9, col: c, al: 'right', w: 700, it: false });
      g.restore(); });
  }
  A.def('hlv', {
    opts: [0, 1], dur: 0.5,
    P: (v) => ({ on: +v }),
    init(S) { S.t0 = 0; },
    onChange(S, v, prev, now) { S.t0 = now; },
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H);
      const vid = p.on > 0.5 ? 3.6 : 0, PER = 1.6 + vid + 2.4, T = ((t - S.t0) % PER + PER) % PER, wide = W / H > 2.6;
      const cx = W / 2, fw = Math.min(wide ? W * 0.5 : W * 0.86, H * 2.1), fh = H * 0.8, fx = cx - fw / 2, fy = H * 0.1;
      if (T < 1.6) {   // the finish: the car over the line, the flag
        const k = T / 1.6; g.fillStyle = PAL.asphalt; A.rr(g, fx, fy, fw, fh, 8); g.fill();
        for (let i = 0; i < 12; i++) { g.fillStyle = i & 1 ? '#f6f6f1' : '#14171c'; g.fillRect(fx + fw * 0.55, fy + i * fh / 12, fw * 0.04, fh / 12); g.fillStyle = i & 1 ? '#14171c' : '#f6f6f1'; g.fillRect(fx + fw * 0.59, fy + i * fh / 12, fw * 0.04, fh / 12); }
        A.car2d(g, fx + fw * (0.1 + k * 0.75), fy + fh * 0.55, Math.PI / 2, fh * 0.42, PAL.player, {});
        chequer(g, fx + fw * 0.12, fy + fh * 0.08, fh * 0.55, fh * 0.36, t);
      } else if (T < 1.6 + vid) {   // the best moment's video: a replay in a frame, its caption, its progress
        const k = (T - 1.6) / vid, z = A.back(clamp(k * 5, 0, 1));
        g.save(); g.translate(cx, fy + fh / 2); g.scale(0.7 + 0.3 * z, 0.7 + 0.3 * z); g.translate(-cx, -(fy + fh / 2));
        g.fillStyle = '#1d2533'; A.rr(g, fx, fy, fw, fh, 8); g.fill(); g.save(); A.rr(g, fx + 4, fy + 4, fw - 8, fh - 8, 6); g.clip();
        g.fillStyle = PAL.grass; g.fillRect(fx, fy, fw, fh); g.fillStyle = PAL.asphalt; g.fillRect(fx, fy + fh * 0.3, fw, fh * 0.45);
        g.fillStyle = 'rgba(255,255,255,.6)'; for (let x = fx - 40 + (k * 400) % 40; x < fx + fw; x += 40) g.fillRect(x, fy + fh * 0.52, 18, 2);
        const L = fh * 0.3; A.car2d(g, fx + fw * (0.25 + k * 0.45), fy + fh * 0.62, Math.PI / 2, L, PAL.player, {}); A.car2d(g, fx + fw * (0.55 - k * 0.1), fy + fh * 0.42, Math.PI / 2, L, PAL.rivals[1], { stripe: false });
        g.restore();
        const s = Math.max(9, fh * 0.1); g.fillStyle = 'rgba(8,13,22,.8)'; A.rr(g, fx + 10, fy + 10, s * 11.5, s * 1.9, s * 0.5); g.fill();
        g.fillStyle = '#ff2a1a'; g.beginPath(); g.arc(fx + 10 + s, fy + 10 + s * 0.95, s * 0.35, 0, TAU); g.fill();
        A.text(g, 'NAJBOLJŠI TRENUTEK', fx + 10 + s * 1.7, fy + 10 + s * 0.97, { size: s * 0.85, col: '#fff', al: 'left', w: 900 });
        g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(fx + 10, fy + fh - 12, fw - 20, 3); g.fillStyle = PAL.curb; g.fillRect(fx + 10, fy + fh - 12, (fw - 20) * k, 3);
        g.restore();
      } else {   // the results
        const k = (T - 1.6 - vid) / 2.4; results(g, fx + fw * 0.08, fy + fh * 0.08, fw * 0.84, fh * 0.84, k * 1.6);
      }
    }
  });

  /* ---------------- Gume v boksih (the pause): Samodejno / Mehke / Srednje / Trde ---------------- */
  const CMP = { S: '#e63b2e', M: '#f2c230', H: '#f6f6f1' };
  function tyre(g, x, y, r, col, rot, worn) {
    g.fillStyle = '#16191e'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = col; g.lineWidth = r * 0.09; g.beginPath(); g.arc(x, y, r * 0.78, 0, TAU); g.stroke();
    g.fillStyle = '#9aa3ae'; g.beginPath(); g.arc(x, y, r * 0.55, 0, TAU); g.fill();
    g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#6d7682'; for (let i = 0; i < 5; i++) { g.rotate(TAU / 5); g.fillRect(-r * 0.06, -r * 0.5, r * 0.12, r * 0.38); } g.fillStyle = '#c3c9d1'; g.beginPath(); g.arc(0, 0, r * 0.14, 0, TAU); g.fill(); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = r * 0.12; for (let i = 0; i < 16; i++) { const a = rot + i / 16 * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); g.lineTo(x + Math.cos(a) * r * 0.99, y + Math.sin(a) * r * 0.99); g.stroke(); }
    if (worn) { g.strokeStyle = 'rgba(255,255,255,' + worn * 0.25 + ')'; g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath(); g.arc(x, y, r * 0.95, 0, TAU); g.stroke(); g.setLineDash([]); }
  }
  A.def('pitCmp', {
    opts: ['auto', 'S', 'M', 'H'], dur: 0.5,
    P: (v) => ({ sp: { auto: 0.66, S: 1, M: 0.66, H: 0.36 }[v], wr: { auto: 0.6, S: 2.2, M: 1.2, H: 0.55 }[v], au: v === 'auto' ? 1 : 0 }),
    init(S) { S.w = 1; },
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H);
      const wide = W / H > 2.6, v = st.v, auto = v === 'auto';
      const col = auto ? ['S', 'M', 'H'].map(k => CMP[k])[Math.floor(t / 1.1) % 3] : CMP[v];
      const r = Math.min(H * 0.34, W * 0.12), tx = wide ? W * 0.14 : W * 0.17, ty = H * 0.5;
      tyre(g, tx, ty, r, col, t * 3 * (0.6 + p.sp), 1 - S.w);
      if (p.au > 0.01) { const rr = r * 0.32 * A.back(p.au); g.fillStyle = PAL.gold; g.beginPath(); g.arc(tx + r * 0.75, ty - r * 0.75, rr, 0, TAU); g.fill(); A.text(g, 'A', tx + r * 0.75, ty - r * 0.75 + 0.5, { size: rr * 1.15, col: '#1b1b1b', w: 900 }); }
      // two bars: the pace (a stopwatch) and how long the tyre lasts (it wears down as the laps go)
      S.w -= (st.dt || 0) * 0.1 * p.wr; if (S.w < 0.05) S.w = 1;
      const bx = wide ? W * 0.36 : W * 0.5, bw = wide ? W * 0.52 : W * 0.44, bh = Math.max(8, H * 0.09), y1 = H * 0.3, y2 = H * 0.64, ic = Math.max(9, H * 0.1);
      // the stopwatch
      g.strokeStyle = '#dfe6f1'; g.lineWidth = 2; g.beginPath(); g.arc(bx - ic * 1.5, y1 + bh / 2, ic * 0.7, 0, TAU); g.stroke(); g.fillStyle = '#dfe6f1'; g.fillRect(bx - ic * 1.5 - 2, y1 + bh / 2 - ic * 1.2, 4, ic * 0.4);
      const ha = t * 4; g.beginPath(); g.moveTo(bx - ic * 1.5, y1 + bh / 2); g.lineTo(bx - ic * 1.5 + Math.sin(ha) * ic * 0.5, y1 + bh / 2 - Math.cos(ha) * ic * 0.5); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.12)'; A.rr(g, bx, y1, bw, bh, bh / 2); g.fill(); g.fillStyle = PAL.lime; A.rr(g, bx, y1, bw * p.sp, bh, bh / 2); g.fill();
      // the tyre's life
      tyre(g, bx - ic * 1.5, y2 + bh / 2, ic * 0.75, col, 0, 0);
      g.fillStyle = 'rgba(255,255,255,.12)'; A.rr(g, bx, y2, bw, bh, bh / 2); g.fill(); g.fillStyle = S.w > 0.3 ? '#dfe6f1' : '#ff8a7a'; A.rr(g, bx, y2, bw * S.w, bh, bh / 2); g.fill();
    }
  });
})();
