/* SETTINGS ANIMATIONS — Vožnja: Upravljanje, Občutljivost nagiba, Smer nagiba, Samodejni plin, Pomoč pri driftu, Kontrole */
(function () {
  'use strict';
  const A = SetAnim, { TAU, clamp, lerp, sstep, ease, easeOut, fract, hash, PAL } = A;

  // the steering the drawings share: -1 left .. 1 right, holding a moment at each side
  const steerWave = (t) => { const x = Math.sin(t * 1.45); return Math.sign(x) * Math.min(1, Math.abs(x) * 1.6); };
  // the phone's picture while driving: grass and a road going up the screen, the car on it steering with s
  function roadScreen(g, w, h, t, s, o) {
    o = o || {};
    g.fillStyle = PAL.grass; g.fillRect(0, 0, w, h);
    const v = (o.speed == null ? 1 : o.speed) * h * 1.6, off = (t * v) % (h * 0.5);
    g.fillStyle = PAL.grass2; for (let y = -h * 0.5 + off; y < h; y += h * 0.5) g.fillRect(0, y, w, h * 0.25);
    const rw = w * (o.rw || 0.34), rx = w / 2 - rw / 2;
    g.fillStyle = PAL.asphalt; g.fillRect(rx, 0, rw, h);
    const kh = h * 0.12, ko = (t * v) % (kh * 2);
    for (let y = -kh * 2 + ko; y < h; y += kh * 2) { g.fillStyle = PAL.kerbR; g.fillRect(rx - w * 0.025, y, w * 0.025, kh); g.fillRect(rx + rw, y, w * 0.025, kh); g.fillStyle = PAL.kerbW; g.fillRect(rx - w * 0.025, y + kh, w * 0.025, kh); g.fillRect(rx + rw, y + kh, w * 0.025, kh); }
    g.fillStyle = 'rgba(255,255,255,.55)'; for (let y = -kh * 2 + ko; y < h; y += kh * 2) g.fillRect(w / 2 - 1, y, 2, kh);
    const L = Math.min(h * 0.3, rw * 0.62), cxp = w / 2 + s * rw * 0.28;
    A.car2d(g, cxp, h * (o.cy || 0.56), s * 0.42, L, PAL.player, { steer: s * 0.5 });
    return { cx: cxp };
  }
  // the touch controls as the game draws them: the arrows, the wheel, the pedals
  function arrowsUI(g, sw, sh, s, a) {
    const r = sh * 0.135, y = sh * 0.76;
    for (const [x, dir] of [[sw * 0.1, -1], [sw * 0.25, 1]]) {
      const on = dir * s > 0.25;
      g.globalAlpha = a; g.fillStyle = on ? 'rgba(255,255,255,.42)' : 'rgba(16,20,27,.45)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(1, r * 0.1); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.2, r * 0.16); g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(x - dir * r * 0.15 + dir * -r * 0.12, y - r * 0.38); g.lineTo(x + dir * r * 0.25, y); g.lineTo(x - dir * r * 0.15 + dir * -r * 0.12, y + r * 0.38); g.stroke();
    }
    g.globalAlpha = 1;
  }
  function pedalsUI(g, sw, sh, gas, brake, a, o) {
    o = o || {};
    const ph = sh * 0.42, pw = sw * 0.115, y = sh * 0.94 - ph;
    const draw = (x, col, on, lbl) => {
      g.globalAlpha = a; g.fillStyle = A.rgba(col, on ? 0.75 : 0.28); A.rr(g, x, y, pw, ph, pw * 0.22); g.fill();
      g.strokeStyle = A.rgba(col, on ? 1 : 0.7); g.lineWidth = Math.max(1, pw * 0.05); g.stroke();
      if (on) { g.fillStyle = A.rgba(col, 0.25 * on); A.rr(g, x - pw * 0.12, y - pw * 0.12, pw * 1.24, ph + pw * 0.24, pw * 0.3); g.fill(); }
      A.text(g, lbl, x + pw / 2, y + ph / 2, { size: Math.max(5, pw * 0.2), col: '#fff', w: 900 });
    };
    draw(sw * 0.66, '#e4402f', brake, 'ZAVORA'); draw(sw * 0.83, '#3fae3a', gas, 'PLIN');
    if (o.auto > 0.01) {   // the "A" of the throttle that presses itself
      const x = sw * 0.83 + pw, yy = y; g.globalAlpha = a * o.auto; g.fillStyle = PAL.gold; g.beginPath(); g.arc(x, yy, pw * 0.3 * A.back(o.auto), 0, TAU); g.fill();
      A.text(g, 'A', x, yy + 0.5, { size: pw * 0.36, col: '#1b1b1b', w: 900 });
    }
    g.globalAlpha = 1;
    return { gas: [sw * 0.83 + pw / 2, y + ph * 0.55], brake: [sw * 0.66 + pw / 2, y + ph * 0.55] };
  }
  function wheelUI(g, sw, sh, s, a) {
    const r = sh * 0.3, x = sw * 0.17, y = sh * 0.66, ang = s * 1.5;
    g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(ang);
    g.strokeStyle = 'rgba(20,24,30,.8)'; g.lineWidth = r * 0.24; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = Math.max(1, r * 0.04); g.setLineDash([r * 0.08, r * 0.12]); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(20,24,30,.8)'; g.lineWidth = r * 0.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(-r * 0.86, r * 0.1); g.moveTo(0, 0); g.lineTo(r * 0.86, r * 0.1); g.moveTo(0, 0); g.lineTo(0, r * 0.86); g.stroke();
    g.fillStyle = 'rgba(20,24,30,.9)'; g.beginPath(); g.arc(0, 0, r * 0.26, 0, TAU); g.fill();
    g.fillStyle = '#e63b2e'; g.fillRect(-r * 0.07, -r * 1.12, r * 0.14, r * 0.24);
    g.restore();
    return { tip: [x + Math.sin(ang) * r, y - Math.cos(ang) * r] };
  }
  function tiltUI(g, sw, sh, s, a) {
    g.globalAlpha = a * 0.9;
    g.fillStyle = 'rgba(228,64,47,.2)'; g.fillRect(0, sh * 0.3, sw * 0.5, sh * 0.7);
    g.fillStyle = 'rgba(63,174,58,.24)'; g.fillRect(sw * 0.5, sh * 0.3, sw * 0.5, sh * 0.7);
    g.globalAlpha = a;
    A.text(g, 'ZAVORA', sw * 0.12, sh * 0.9, { size: Math.max(5, sh * 0.075), col: 'rgba(255,255,255,.85)', w: 900 });
    A.text(g, 'PLIN', sw * 0.88, sh * 0.9, { size: Math.max(5, sh * 0.075), col: 'rgba(255,255,255,.85)', w: 900 });
    // the tilt meter at the top (#tilt-ind)
    const bw = sw * 0.26, bx = sw / 2 - bw / 2, by = sh * 0.07;
    g.fillStyle = 'rgba(10,14,20,.6)'; A.rr(g, bx, by, bw, sh * 0.06, sh * 0.03); g.fill();
    g.fillStyle = PAL.gold; const f = s * bw / 2; g.fillRect(Math.min(sw / 2, sw / 2 + f), by + sh * 0.012, Math.abs(f), sh * 0.036);
    g.fillStyle = '#fff'; g.fillRect(sw / 2 - 0.5, by - sh * 0.01, 1, sh * 0.08);
    g.globalAlpha = 1;
  }
  const local = (cx, cy, rot, x, y) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];

  /* ---------------- Upravljanje: Tipke / Volan / Nagib ---------------- */
  A.def('control', {
    opts: ['buttons', 'wheel', 'tilt'], dur: 0.75,
    P: (v) => ({ b: v === 'buttons' ? 1 : 0, w: v === 'wheel' ? 1 : 0, ti: v === 'tilt' ? 1 : 0 }),
    draw(g, W, H, t, p) {
      A.studio(g, W, H);
      const s = steerWave(t), pw = Math.min(W * 0.7, H * 1.62), ph = pw * 0.47, cx = W / 2, cy = H * 0.45;
      const rot = p.ti * s * 0.26;
      if (p.ti > 0.02) {   // tilting: the turn arrows at both ends of the phone
        g.save(); g.globalAlpha = p.ti * (0.45 + 0.55 * Math.abs(s));
        const r = pw * 0.56, dir = s >= 0 ? 1 : -1, lw = Math.max(2, H * 0.024);
        A.arrowArc(g, cx, cy, r, Math.PI - dir * 0.05 + rot, Math.PI - dir * 0.42 + rot, PAL.gold, lw);
        A.arrowArc(g, cx, cy, r, -dir * 0.05 + rot, -dir * 0.42 + rot, PAL.gold, lw);
        g.restore();
      }
      const sw = pw - Math.min(pw, ph) * 0.12, sh = ph - Math.min(pw, ph) * 0.12;
      let wtip = null, pd = null;
      A.phone(g, cx, cy, pw, ph, rot, (g2, w2, h2) => {
        roadScreen(g2, w2, h2, t, s * (p.b > 0.5 ? 1 : 1));
        if (p.b > 0.01) arrowsUI(g2, w2, h2, s, p.b);
        if (p.w > 0.01) wheelUI(g2, w2, h2, s, p.w);
        if (p.ti > 0.01) tiltUI(g2, w2, h2, s, p.ti);
        if (p.ti < 0.99) pd = pedalsUI(g2, w2, h2, true, false, 1 - p.ti);
        const wt = wheelUI; void wt;
      });
      // the thumbs: where each way of steering puts them (the screen's own coordinates, then turned with the phone)
      const S = (x, y) => [x * sw - sw / 2, y * sh - sh / 2];
      const lb = s < -0.25 ? S(0.1, 0.76) : s > 0.25 ? S(0.25, 0.76) : S(0.175, 0.86);
      const ang = s * 1.5, wr = sh * 0.3;
      const lw = [0.17 * sw - sw / 2 + Math.sin(ang) * wr, 0.66 * sh - sh / 2 - Math.cos(ang) * wr];
      const lt = [-sw * 0.47, sh * 0.25];
      const L = [lb[0] * p.b + lw[0] * p.w + lt[0] * p.ti, lb[1] * p.b + lw[1] * p.w + lt[1] * p.ti];
      const R = [lerp(0.83 * sw + sw * 0.0575 - sw / 2, sw * 0.34, p.ti), lerp(sh * 0.94 - sh * 0.42 * 0.45 - sh / 2, sh * 0.25, p.ti)];
      const lp = p.b * (Math.abs(s) > 0.25 ? 1 : 0) + p.w + p.ti * 0.2;
      const ts = ph * 0.29;
      const Lc = local(cx, cy, rot, L[0], L[1]), Rc = local(cx, cy, rot, R[0], R[1]);
      A.thumb(g, Lc[0], Lc[1], 0.42 + rot, ts, lp);
      A.thumb(g, Rc[0], Rc[1], -0.42 + rot, ts, 1);
      void wtip; void pd;
    }
  });

  /* ---------------- Občutljivost nagiba: how far to tilt for the full turn (10° .. 40°) ---------------- */
  A.def('tiltSens', {
    dur: 0.35,
    P: (v) => ({ a: +v }),
    draw(g, W, H, t, p) {
      A.studio(g, W, H);
      const deg = p.a, ph0 = fract(t / 3.6);
      // the tilt: up to the angle and a little past it (the steering stays full), back, the other way
      const wave = (x) => { const s = Math.sin(x * TAU); return Math.sign(s) * Math.min(1, Math.abs(s) * 1.35); };
      const tilt = wave(ph0) * deg * 1.08;
      const steer = clamp(tilt / deg, -1, 1), full = Math.abs(steer) > 0.995;
      const wide = W / H > 2.6, pcx = wide ? W * 0.38 : W * 0.36, pcy = H * 0.56;
      const pw = Math.min(H * 0.86, W * 0.4), ph = pw * 0.47;
      // the fan of the angle
      const R = Math.min(pw * 0.62, H * 0.44), a0 = -Math.PI / 2;
      g.fillStyle = 'rgba(255,198,41,.13)'; g.beginPath(); g.moveTo(pcx, pcy); g.arc(pcx, pcy, R, a0 - deg * A.D2R, a0 + deg * A.D2R); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,198,41,.75)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(pcx + Math.cos(a0 - deg * A.D2R) * R, pcy + Math.sin(a0 - deg * A.D2R) * R); g.lineTo(pcx, pcy); g.lineTo(pcx + Math.cos(a0 + deg * A.D2R) * R, pcy + Math.sin(a0 + deg * A.D2R) * R); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(pcx, pcy); g.lineTo(pcx, pcy - R * 1.05); g.stroke(); g.setLineDash([]);
      for (let d = -40; d <= 40; d += 10) { const a = a0 + d * A.D2R; g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(pcx + Math.cos(a) * R * 1.02, pcy + Math.sin(a) * R * 1.02); g.lineTo(pcx + Math.cos(a) * R * 1.09, pcy + Math.sin(a) * R * 1.09); g.stroke(); }
      A.text(g, Math.round(deg) + '°', pcx + Math.cos(a0 + deg * A.D2R) * R * 1.12 + 10, pcy + Math.sin(a0 + deg * A.D2R) * R * 1.12, { size: H * 0.1, col: PAL.gold, w: 900, al: 'left' });
      A.phone(g, pcx, pcy, pw, ph, tilt * A.D2R, (g2, w2, h2) => { roadScreen(g2, w2, h2, t, steer, { rw: 0.4 }); });
      // the steering it gives: a wheel and a bar, full at the angle
      const wx = wide ? W * 0.74 : W * 0.8, wy = H * 0.42, wr = Math.min(H * 0.22, W * 0.11);
      g.save(); g.translate(wx, wy); g.rotate(steer * 1.6);
      g.strokeStyle = full ? PAL.gold : '#dfe6f1'; g.lineWidth = wr * 0.2; g.beginPath(); g.arc(0, 0, wr, 0, TAU); g.stroke();
      g.lineWidth = wr * 0.18; g.beginPath(); g.moveTo(-wr, 0); g.lineTo(wr, 0); g.moveTo(0, 0); g.lineTo(0, wr); g.stroke();
      g.fillStyle = PAL.curb; g.fillRect(-wr * 0.08, -wr * 1.12, wr * 0.16, wr * 0.26); g.restore();
      const bw = wr * 2.6, bx = wx - bw / 2, by = wy + wr * 1.55, bh = Math.max(5, H * 0.045);
      g.fillStyle = 'rgba(255,255,255,.12)'; A.rr(g, bx, by, bw, bh, bh / 2); g.fill();
      g.fillStyle = full ? PAL.gold : '#dfe6f1'; const f = steer * bw / 2; A.rr(g, Math.min(wx, wx + f), by, Math.abs(f), bh, bh / 2); g.fill();
      g.fillStyle = '#fff'; g.fillRect(wx - 0.75, by - 2, 1.5, bh + 4);
      A.text(g, Math.round(Math.abs(steer) * 100) + ' %', wx, by + bh + H * 0.085, { size: H * 0.085, col: full ? PAL.gold : '#c9d3e2', w: 800 });
    }
  });

  /* ---------------- Smer nagiba: Običajna / Obrnjena ---------------- */
  A.def('tiltInvert', {
    opts: [0, 1], dur: 0.7,
    P: (v) => ({ d: +v ? -1 : 1 }),
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H);
      const live = A.env && A.env.tilt ? A.env.tilt() : null;   // (the phone's real tilt, when the sensor sends it)
      const tl = live != null ? clamp(live, -1, 1) : steerWave(t * 0.9);
      const steer = tl * p.d, wide = W / H > 2.6;
      const pcx = wide ? W * 0.4 : W * 0.38, pcy = H * 0.5, pw = Math.min(H * 0.9, W * 0.44), ph = pw * 0.47;
      // the phone's tilt: the white arrows at both ends of it
      const dir = tl >= 0 ? 1 : -1, ta = Math.abs(tl), rot = tl * 0.3;
      g.save(); g.globalAlpha = 0.3 + 0.7 * ta;
      { const r = pw * 0.56, lw = Math.max(2, H * 0.026); A.arrowArc(g, pcx, pcy, r, Math.PI - dir * 0.05 + rot, Math.PI - dir * 0.45 + rot, '#fff', lw); A.arrowArc(g, pcx, pcy, r, -dir * 0.05 + rot, -dir * 0.45 + rot, '#fff', lw); }
      g.restore();
      A.phone(g, pcx, pcy, pw, ph, tl * 0.3, (g2, w2, h2) => { roadScreen(g2, w2, h2, t, steer, { rw: 0.4 }); });
      // the car's turn: the gold arrow (with the phone's way: the same; turned round: the other)
      const ax = wide ? W * 0.78 : W * 0.82, ay = H * 0.46, al = Math.min(W * 0.11, H * 0.32);
      A.car2d(g, ax, ay + al * 0.35, steer * 0.5, al * 0.9, PAL.player, { steer: steer * 0.5 });
      const sd = Math.sign(steer) || 1, sa = Math.abs(steer);
      g.save(); g.globalAlpha = 0.3 + 0.7 * sa;
      g.strokeStyle = PAL.gold; g.lineWidth = Math.max(2.5, H * 0.035); g.lineCap = 'round';
      g.beginPath(); g.moveTo(ax, ay - al * 0.2); g.quadraticCurveTo(ax, ay - al * 0.75, ax + sd * al * 0.55, ay - al * 0.8); g.stroke();
      A.arrow(g, ax + sd * al * 0.4, ay - al * 0.8, ax + sd * al * 0.68, ay - al * 0.8, PAL.gold, Math.max(2.5, H * 0.035));
      g.restore();
      // same way / the other way: a tick or a swap sign between the two arrows
      const same = p.d > 0, mx = (pcx + pw * 0.62 + ax - al * 0.6) / 2;
      g.save(); g.globalAlpha = Math.abs(p.d);
      if (same) { g.strokeStyle = PAL.lime; g.lineWidth = Math.max(2, H * 0.03); g.lineCap = 'round'; g.beginPath(); g.moveTo(mx - H * 0.05, H * 0.5); g.lineTo(mx - H * 0.01, H * 0.55); g.lineTo(mx + H * 0.06, H * 0.43); g.stroke(); }
      else { g.strokeStyle = PAL.gold; g.lineWidth = Math.max(2, H * 0.028); A.arrow(g, mx - H * 0.07, H * 0.44, mx + H * 0.07, H * 0.44, PAL.gold, Math.max(2, H * 0.025)); A.arrow(g, mx + H * 0.07, H * 0.56, mx - H * 0.07, H * 0.56, PAL.gold, Math.max(2, H * 0.025)); }
      g.restore();
      if (live != null) A.text(g, '● V ŽIVO', W - 8, 12, { size: H * 0.07, col: PAL.lime, al: 'right', w: 800 });
      void S; void st;
    }
  });

  /* ---------------- Samodejni plin: Izklop / Vklop ---------------- */
  A.def('autoGas', {
    opts: [0, 1], dur: 0.6,
    P: (v) => ({ on: +v }),
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H);
      const T = fract(t / 5.2) * 5.2;
      // off: the thumb holds the throttle, lets go (the car slows), holds it again; a dab of the brake
      const offGas = T < 2.3 || T > 3.7 ? 1 : 0, offBrake = 0;
      // on: the throttle presses itself (the "A"); the thumb only dabs the brake, and the throttle waits for it
      const onBrake = T > 3.0 && T < 3.8 ? 1 : 0, onGas = onBrake ? 0 : 1;
      const gas = lerp(offGas, onGas, p.on), brake = lerp(offBrake, onBrake, p.on);
      // the speed follows the pedals (simulated, kept between frames)
      const target = gas > 0.5 ? 1 : brake > 0.5 ? 0.45 : 0.3;
      if (S.v == null) S.v = 0.8; S.v += (target - S.v) * (1 - Math.exp(-(st.dt || 0) * (target > S.v ? 1.2 : 1.6)));
      const wide = W / H > 2.6;
      // left: the speedometer; middle: the car on its road
      const sR = Math.min(H * 0.3, W * 0.12), sx = wide ? W * 0.1 : W * 0.14, sy = H * 0.52;
      A.speedo(g, sx, sy, sR, S.v * 0.9, 40 + S.v * 180);
      const rx0 = sx + sR * 1.5, rx1 = wide ? W * 0.62 : W * 0.56, ry = H * 0.5, rh = H * 0.34;
      g.fillStyle = PAL.asphalt; g.fillRect(rx0, ry - rh / 2, rx1 - rx0, rh);
      g.fillStyle = 'rgba(255,255,255,.7)'; S.x = ((S.x || 0) + (st.dt || 0) * S.v * 260) % 60;
      for (let x = rx1 - S.x; x > rx0; x -= 60) g.fillRect(Math.max(rx0, x - 26), ry - 1, Math.min(26, x - rx0), 2);
      g.fillStyle = PAL.kerbW; g.fillRect(rx0, ry - rh / 2, rx1 - rx0, 2); g.fillRect(rx0, ry + rh / 2 - 2, rx1 - rx0, 2);
      const carL = Math.min(rh * 1.55, (rx1 - rx0) * 0.3);
      for (let i = 0; i < 4; i++) { const a = clamp((S.v - 0.35) * 1.6, 0, 1) * (0.7 - i * 0.15); g.strokeStyle = 'rgba(255,255,255,' + a + ')'; g.lineWidth = 1.5; const y = ry - rh * 0.3 + i * rh * 0.2, x = (rx0 + rx1) / 2 - carL * 0.6; g.beginPath(); g.moveTo(x - 6 - i * 5, y); g.lineTo(x - 6 - i * 5 - 14 * S.v - 6, y); g.stroke(); }
      A.car2d(g, (rx0 + rx1) / 2, ry, Math.PI / 2, carL, PAL.player, {});
      // right: the pedals and the thumb
      const px0 = wide ? W * 0.7 : W * 0.63, pw = Math.min(W * 0.11, H * 0.36), phh = H * 0.62, py = H * 0.16;
      const pedal = (x, col, on, lbl) => {
        g.fillStyle = A.rgba(col, 0.25 + 0.55 * on); A.rr(g, x, py, pw, phh, pw * 0.22); g.fill();
        g.strokeStyle = A.rgba(col, 0.6 + 0.4 * on); g.lineWidth = 2; g.stroke();
        if (on > 0.05) { g.save(); g.globalAlpha = on; g.shadowColor = col; g.shadowBlur = 16; g.strokeStyle = A.rgba(col, 0.9); g.stroke(); g.restore(); }
        A.text(g, lbl, x + pw / 2, py + phh / 2, { size: Math.min(pw * 0.2, H * 0.08), col: '#fff', w: 900 });
      };
      const bx = px0, gx = px0 + pw * 1.3;
      pedal(bx, '#e4402f', brake, 'ZAVORA'); pedal(gx, '#3fae3a', gas, 'PLIN');
      if (p.on > 0.01) { const r = pw * 0.26 * A.back(p.on); g.fillStyle = PAL.gold; g.beginPath(); g.arc(gx + pw, py, r, 0, TAU); g.fill(); A.text(g, 'A', gx + pw, py + 0.5, { size: r * 1.2, col: '#1b1b1b', w: 900 }); }
      // the thumb: on the throttle (off), else resting beside the pedals and dabbing the brake
      const onGasPos = [gx + pw * 0.5, py + phh * 0.74], liftPos = [gx + pw * 0.62, py + phh * 0.5], restPos = [gx - pw * 0.15, py + phh * 1.02], brakePos = [bx + pw * 0.5, py + phh * 0.74];
      const offPos = offGas ? onGasPos : liftPos, onPos = onBrake ? brakePos : restPos;
      if (!S.th) S.th = offPos.slice();
      const tgt = [lerp(offPos[0], onPos[0], p.on), lerp(offPos[1], onPos[1], p.on)];
      const kk = 1 - Math.exp(-(st.dt || 0.016) * 10); S.th[0] += (tgt[0] - S.th[0]) * kk; S.th[1] += (tgt[1] - S.th[1]) * kk;
      const pressed = lerp(offGas, onBrake, p.on);
      A.thumb(g, S.th[0], S.th[1], -0.3, Math.min(H * 0.24, pw * 0.72), pressed);
    }
  });

  /* ---------------- Pomoč pri driftu: Nizka / Srednja / Visoka (a hairpin, the drift through it) ---------------- */
  const HP = new A.Path(-10, -34, 0, [['s', 30], ['a', 10, 180], ['s', 40]], 1);
  const HP_IN = 30, HP_OUT = 30 + Math.PI * 10;
  const HP_THINGS = (() => { const a = [];
    for (let i = 0; i < 16; i++) { const x = (hash(i * 3.3) - 0.5) * 120, z = -40 + hash(i * 7.7) * 60; if (Math.abs(x) < 26 && z > -40 && z < 16) continue; a.push({ kind: 'tree', x, z, s: 0.8 + hash(i) * 0.5, c: PAL.leaf[i % 4] }); }
    a.push({ kind: 'tyres', x: -2, z: 14, dx: 1, s: 1 }, { kind: 'tyres', x: 16, z: 11, dx: 0.7, dz: -0.7, s: 1 }, { kind: 'tyres', x: -19, z: 11, dx: 0.7, dz: 0.7, s: 1 }, { kind: 'stand', x: 0, z: 26, w: 30, d: 5, hgt: 3, crowd: 0.8 });
    a.push({ kind: 'tree', x: 0, z: -12, s: 0.9, c: PAL.leaf[1] }, { kind: 'tree', x: -1, z: -24, s: 0.8, c: PAL.leaf[2] });
    return a; })();
  const AS = [   // per level: the peak angle (rad), how far out (m), the swing after it (rad), its swings, over how many metres, how late it straightens
    { B: 1.0, D: 3.4, Wb: 0.46, Wn: 2.5, Wl: 26, lag: 9 },
    { B: 0.7, D: 1.9, Wb: 0.2, Wn: 1.5, Wl: 15, lag: 4 },
    { B: 0.45, D: 0.7, Wb: 0.04, Wn: 1, Wl: 7, lag: 0 }];
  A.def('assist', {
    opts: [0, 1, 2], dur: 0.6,
    P: (v) => Object.assign({}, AS[+v]),
    init(S) { S.s = 0; S.marks = new A.Marks(); S.fx = new A.Particles(); S.V = new A.View(); S.fade = 1; },
    onChange(S) { S.s = 0; S.marks = new A.Marks(); S.fx = new A.Particles(); },
    draw(g, W, H, t, p, st, S) {
      const dt = st.dt || 0;
      // along the road: fast on the straights, slower through the bend, a pause at the end
      const v = S.s < HP_IN - 8 ? 24 : S.s < HP_OUT + 6 ? 13 : 22;
      S.s += v * dt;
      if (S.s > HP.len + 22) { S.s = 0; S.marks = new A.Marks(); }
      const s = Math.min(S.s, HP.len);
      const up = sstep(HP_IN - 5, HP_IN + 9, s), down = 1 - sstep(HP_OUT - 6 + p.lag * 0.4, HP_OUT + 4 + p.lag, s);
      let beta = p.B * up * down, d = -p.D * sstep(HP_IN + 2, HP_IN + 18, s) * (1 - sstep(HP_OUT + 2, HP_OUT + 14 + p.lag, s));
      if (s > HP_OUT) { const x = (s - HP_OUT) / p.Wl; beta += p.Wb * Math.sin(x * p.Wn * TAU) * Math.exp(-x * 1.6) * (x < 1.6 ? 1 : 0); d += p.Wb * 2.2 * Math.sin(x * p.Wn * TAU - 0.8) * Math.exp(-x * 1.6); }
      const q = HP.at(s, d), car = { x: q.x, z: q.z, h: q.h + beta, col: PAL.player, marker: true, steer: clamp(-beta * 0.8, -0.5, 0.5) };
      if (Math.abs(beta) > 0.16 && S.s < HP.len) S.marks.add(car, clamp((Math.abs(beta) - 0.12) * 2.2, 0, 1)); else S.marks.cut();
      if (Math.abs(beta) > 0.42 && S.s < HP.len && Math.random() < dt * 16) { const ch = Math.cos(car.h), sh = Math.sin(car.h); for (const b of [-0.9, 0.9]) S.fx.add({ kind: 'smoke', x: car.x - sh * 1.8 + ch * b, z: car.z - ch * 1.8 - sh * b, y: 0.4, vx: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2, vy: 0.6, age: 0, life: 0.7, r0: 0.4, r1: 1.4 + Math.abs(beta) * 1.1 }); }
      S.fx.step(dt);
      const asp = W / H, pitch = 0.82, fov = 30;
      const D = Math.max(33 * Math.sin(pitch) / (2 * Math.tan(fov * A.D2R / 2)), 46 / (2 * Math.tan(fov * A.D2R / 2) * asp));
      const V = S.V.set(A.camAt(0, 0, -5, D, 0, pitch, fov), 0, 0, W, H);
      // the car's path: a white line that fades behind it (wide and wavy with little help, a clean arc with a lot); a still shows all of it
      if (!S.trail || S.s < 1) S.trail = [];
      if (S.s < HP.len) S.trail.push({ x: car.x, z: car.z, h: car.h, t });
      while (S.trail.length && !A.still && t - S.trail[0].t > 2.2) S.trail.shift();
      const ghosts = A.still ? S.trail.filter((q, i) => i % 9 === 0 && i < S.trail.length - 6).map(q => ({ x: q.x, z: q.z, h: q.h, col: PAL.player, ghost: 1 })) : [];
      A.scene(g, V, { t, roads: [{ P: HP, w: 9 }], things: HP_THINGS, cars: [car],
        under: (g2, V2) => {
          S.marks.draw(g2, V2);
          const T = [0, 0, 0, 0]; g2.lineCap = 'round'; g2.lineJoin = 'round';
          for (let i = 1; i < S.trail.length; i++) {
            const a = S.trail[i - 1], b = S.trail[i], al = A.still ? 0.75 : clamp(1 - (t - b.t) / 2.2, 0, 1) * 0.85;
            V2.p(a.x, 0.05, a.z, T); const x0 = T[0], y0 = T[1]; V2.p(b.x, 0.05, b.z, T);
            g2.strokeStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')'; g2.lineWidth = Math.max(1.5, H * 0.012); g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(T[0], T[1]); g2.stroke();
          }
          if (ghosts.length) { g2.save(); g2.globalAlpha = 0.28; for (const c of ghosts) for (const pt of A.carParts(c).parts) pt.draw(g2, V2); g2.restore(); }
        }, over: (g2, V2) => S.fx.draw(g2, V2) });
      const fade = S.s > HP.len + 12 ? sstep(HP.len + 12, HP.len + 22, S.s) : S.s < 3 ? 1 - S.s / 3 : 0;
      if (fade > 0) { g.fillStyle = 'rgba(8,18,31,' + (fade * 0.8) + ')'; g.fillRect(0, 0, W, H); }
    }
  });

  /* ---------------- Kontrole: the keys, the pad and the wheel (a link to their own screen) ---------------- */
  A.def('kontrole', {
    draw(g, W, H, t) {
      A.studio(g, W, H);
      const k = Math.floor(t / 1.6) % 3, f = fract(t / 1.6), sp = Math.min(W / 3.4, H * 1.15), y = H * 0.5;
      const xs = [W / 2 - sp, W / 2, W / 2 + sp];
      const on = (i) => i === k ? sstep(0, 0.15, f) * (1 - sstep(0.85, 1, f)) : 0;
      const s = Math.min(H * 0.32, sp * 0.36);
      // the keyboard: the arrow keys, one pressed
      { const x = xs[0], a = on(0), u = s * 0.42; g.save(); g.globalAlpha = 0.55 + 0.45 * a;
        const key = (dx, dy, pr) => { g.fillStyle = pr ? PAL.gold : '#dfe6f1'; A.rr(g, x + dx * u * 1.1 - u / 2, y + dy * u * 1.1 - u / 2 + (pr ? 2 : 0), u, u, u * 0.2); g.fill(); g.fillStyle = pr ? '#5e4800' : '#8794a7'; A.rr(g, x + dx * u * 1.1 - u / 2, y + dy * u * 1.1 + u / 2 - u * 0.14 + (pr ? 2 : 0), u, u * 0.14, u * 0.07); g.fill(); };
        const pk = a > 0.3 ? Math.floor(t * 3) % 3 : -1;
        key(0, -0.5, pk === 1); key(-1, 0.6, pk === 0); key(0, 0.6, false); key(1, 0.6, pk === 2); g.restore(); }
      // the pad: a stick that moves, a button that is pressed
      { const x = xs[1], a = on(1); g.save(); g.globalAlpha = 0.55 + 0.45 * a; g.fillStyle = '#dfe6f1';
        g.beginPath(); g.ellipse(x - s * 0.55, y + s * 0.1, s * 0.45, s * 0.6, 0.35, 0, TAU); g.ellipse(x + s * 0.55, y + s * 0.1, s * 0.45, s * 0.6, -0.35, 0, TAU); g.fill(); A.rr(g, x - s * 0.7, y - s * 0.42, s * 1.4, s * 0.8, s * 0.3); g.fill();
        const sx = Math.sin(t * 4) * s * 0.12 * a; g.fillStyle = '#5d6b82'; g.beginPath(); g.arc(x - s * 0.42 + sx, y - s * 0.05, s * 0.17, 0, TAU); g.fill();
        g.fillStyle = a > 0.3 && fract(t * 2) < 0.5 ? PAL.gold : '#5d6b82'; g.beginPath(); g.arc(x + s * 0.45, y - s * 0.12, s * 0.09, 0, TAU); g.fill(); g.fillStyle = '#5d6b82'; g.beginPath(); g.arc(x + s * 0.3, y + s * 0.02, s * 0.09, 0, TAU); g.fill(); g.restore(); }
      // the wheel: it turns
      { const x = xs[2], a = on(2); g.save(); g.globalAlpha = 0.55 + 0.45 * a; g.translate(x, y); g.rotate(Math.sin(t * 2.4) * 0.6 * a);
        g.strokeStyle = '#dfe6f1'; g.lineWidth = s * 0.16; g.beginPath(); g.arc(0, 0, s * 0.62, 0, TAU); g.stroke(); g.lineWidth = s * 0.14; g.beginPath(); g.moveTo(-s * 0.62, 0); g.lineTo(s * 0.62, 0); g.moveTo(0, 0); g.lineTo(0, s * 0.62); g.stroke();
        g.fillStyle = PAL.curb; g.fillRect(-s * 0.05, -s * 0.72, s * 0.1, s * 0.18); g.restore(); }
      for (let i = 0; i < 3; i++) { const a = on(i); if (a > 0.01) { g.strokeStyle = 'rgba(255,198,41,' + (0.8 * a) + ')'; g.lineWidth = 2; A.rr(g, xs[i] - s * 1.05, y - s * 1.0, s * 2.1, s * 2.0, s * 0.3); g.stroke(); } }
    }
  });

  A.steerWave = steerWave; A.roadScreen = roadScreen; A.pedalsUI = pedalsUI;
})();
