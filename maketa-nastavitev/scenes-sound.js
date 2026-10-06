/* SETTINGS ANIMATIONS — Zvok: Zvok, Glasba v uvodu, Komentator, Sovoznik na reliju, Vibracija; Splošno: Jezik, Ime voznika, Profil */
(function () {
  'use strict';
  const A = SetAnim, { TAU, clamp, lerp, sstep, ease, fract, hash, PAL } = A;

  function speaker(g, x, y, r, on, t) {
    g.fillStyle = '#dfe6f1'; g.beginPath(); g.moveTo(x - r * 0.75, y - r * 0.32); g.lineTo(x - r * 0.3, y - r * 0.32); g.lineTo(x + r * 0.2, y - r * 0.75); g.lineTo(x + r * 0.2, y + r * 0.75); g.lineTo(x - r * 0.3, y + r * 0.32); g.lineTo(x - r * 0.75, y + r * 0.32); g.closePath(); g.fill();
    if (on > 0.01) for (let i = 1; i <= 3; i++) { const a = on * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 9 - i * 1.2))); g.strokeStyle = 'rgba(255,198,41,' + a + ')'; g.lineWidth = Math.max(2, r * 0.12); g.lineCap = 'round'; g.beginPath(); g.arc(x + r * 0.2, y, r * 0.35 * i + r * 0.15, -0.75, 0.75); g.stroke(); }
    if (on < 0.99) { g.save(); g.globalAlpha = 1 - on; g.strokeStyle = PAL.curb; g.lineWidth = Math.max(2.5, r * 0.15); g.lineCap = 'round'; const cx = x + r * 0.85, s = r * 0.32; g.beginPath(); g.moveTo(cx - s, y - s); g.lineTo(cx + s, y + s); g.moveTo(cx + s, y - s); g.lineTo(cx - s, y + s); g.stroke(); g.restore(); }
  }
  function wave(g, x0, x1, y, amp, t, on, col) {   // an oscilloscope line: the engine's sound, flat when off
    g.strokeStyle = col || 'rgba(140,240,70,.9)'; g.lineWidth = 2; g.beginPath();
    for (let x = x0; x <= x1; x += 2) { const u = (x - x0) / (x1 - x0), e = Math.sin(u * Math.PI); const v = (Math.sin(x * 0.21 + t * 22) * 0.6 + Math.sin(x * 0.53 - t * 31) * 0.3 + Math.sin(x * 0.09 + t * 7) * 0.4) * amp * on * e; if (x === x0) g.moveTo(x, y + v); else g.lineTo(x, y + v); }
    g.stroke();
  }
  A.speaker = speaker;

  /* ---------------- Zvok ---------------- */
  A.def('sound', {
    opts: [0, 1], dur: 0.5,
    P: (v) => ({ on: +v }),
    draw(g, W, H, t, p) {
      A.studio(g, W, H);
      const wide = W / H > 2.6, r = Math.min(H * 0.3, W * 0.1), sx = wide ? W * 0.12 : W * 0.15;
      speaker(g, sx, H * 0.45, r, p.on, t);
      // a car going by, its sound coming off it in rings
      const x0 = wide ? W * 0.25 : W * 0.3, x1 = W - 14, ry = H * 0.42, cx = x0 + fract(t / 2.4) * (x1 - x0);
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x0, ry - H * 0.16, x1 - x0, H * 0.32);
      if (p.on > 0.01) for (let i = 0; i < 4; i++) { const k = fract(t * 1.6 + i / 4); g.strokeStyle = 'rgba(255,198,41,' + (1 - k) * 0.6 * p.on + ')'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx - k * 10, ry, 6 + k * H * 0.28, 0, TAU); g.stroke(); }
      A.car2d(g, cx, ry, Math.PI / 2, H * 0.24, PAL.player, {});
      wave(g, x0, x1, H * 0.82, H * 0.09, t, p.on);
    }
  });

  /* ---------------- Glasba v uvodu ---------------- */
  A.def('music', {
    opts: [0, 1], dur: 0.6,
    P: (v) => ({ on: +v }),
    draw(g, W, H, t, p) {
      A.studio(g, W, H, { floor: false });
      const wide = W / H > 2.6, fx = wide ? W * 0.3 : W * 0.32, fr = H * 0.32;
      g.fillStyle = '#050b16'; A.rr(g, fx - fr * 1.5, H * 0.5 - fr * 1.25, fr * 3, fr * 2.5, 8); g.fill();
      A.globe(g, fx, H * 0.52, fr * 0.95, t, fract(t / 3));
      // notes rising from the intro
      if (p.on > 0.01) for (let i = 0; i < 5; i++) {
        const k = fract(t / 2.2 + i / 5), x = fx + fr * 1.1 + k * W * 0.12 + Math.sin(k * 6 + i) * 8, y = H * 0.75 - k * H * 0.65, s = H * 0.09 * (0.8 + hash(i) * 0.4);
        g.save(); g.globalAlpha = p.on * Math.sin(k * Math.PI); g.fillStyle = i & 1 ? PAL.gold : '#dfe6f1'; g.beginPath(); g.ellipse(x, y, s * 0.42, s * 0.3, -0.4, 0, TAU); g.fill(); g.fillRect(x + s * 0.3, y - s * 1.2, s * 0.12, s * 1.2); if (i % 3 === 0) g.fillRect(x + s * 0.3, y - s * 1.2, s * 0.5, s * 0.14); g.restore();
      }
      // the equaliser: bars that jump with the music, flat without it
      const ex = wide ? W * 0.56 : W * 0.66, ew = wide ? W * 0.36 : W * 0.28, n = 9, bw = ew / n - 3, by = H * 0.82;
      for (let i = 0; i < n; i++) { const h = H * (0.06 + p.on * (0.12 + 0.42 * Math.abs(Math.sin(t * (3 + i * 0.7) + i * 1.3)) * (0.5 + 0.5 * Math.sin(t * 1.7 + i)))); g.fillStyle = i < 6 ? PAL.lime : i < 8 ? '#f1c21b' : '#ee3b2b'; g.fillRect(ex + i * (bw + 3), by - h, bw, h); }
      if (p.on < 0.99) { const nx = ex + ew / 2, ny = H * 0.3, s = H * 0.16; g.save(); g.globalAlpha = 1 - p.on; g.fillStyle = '#5d6b82'; g.beginPath(); g.ellipse(nx, ny, s * 0.42, s * 0.3, -0.4, 0, TAU); g.fill(); g.fillRect(nx + s * 0.3, ny - s * 1.2, s * 0.12, s * 1.2); g.restore(); A.slash(g, nx + s * 0.1, ny - s * 0.4, s * 0.9, 1 - p.on); }
    }
  });

  /* ---------------- Komentator (angleščina) ---------------- */
  const COMM = ['…and he takes the lead!', 'What a move into turn one!', 'Final lap — can he hold on?'];
  function mic(g, x, y, s, on) {
    g.fillStyle = on ? '#dfe6f1' : '#5d6b82'; A.rr(g, x - s * 0.28, y - s * 0.9, s * 0.56, s * 1.0, s * 0.28); g.fill();
    g.strokeStyle = on ? '#dfe6f1' : '#5d6b82'; g.lineWidth = s * 0.1; g.beginPath(); g.arc(x, y - s * 0.3, s * 0.45, 0.15, Math.PI - 0.15); g.stroke();
    g.beginPath(); g.moveTo(x, y + s * 0.15); g.lineTo(x, y + s * 0.55); g.moveTo(x - s * 0.3, y + s * 0.55); g.lineTo(x + s * 0.3, y + s * 0.55); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 3; i++) g.fillRect(x - s * 0.18, y - s * 0.75 + i * s * 0.18, s * 0.36, s * 0.05);
  }
  function bubble(g, x, y, w, h, tail, txt, s) {
    g.fillStyle = '#f6f6f1'; A.rr(g, x, y, w, h, h * 0.35); g.fill(); g.beginPath(); g.moveTo(tail[0], tail[1]); g.lineTo(x + Math.min(w * 0.18, 22), y + h - 1); g.lineTo(x + Math.min(w * 0.18, 22) + 12, y + h - 1); g.closePath(); g.fill();
    g.font = '800 italic ' + s + 'px ApexMenu, Roboto, sans-serif'; const fs = Math.min(s, s * (w - 20) / Math.max(1, g.measureText(txt.full).width));
    A.text(g, txt.now, x + 12, y + h / 2 + 0.5, { size: fs, col: '#14181f', al: 'left', w: 800 });
  }
  A.bubble = bubble;
  A.def('comm', {
    opts: [0, 1], dur: 0.6,
    P: (v) => ({ on: +v }),
    draw(g, W, H, t, p) {
      A.studio(g, W, H);
      const wide = W / H > 2.6, s = Math.min(H * 0.42, W * 0.14), mx = wide ? W * 0.13 : W * 0.15, my = H * 0.58;
      mic(g, mx, my, s, true);
      A.slash(g, mx, my - s * 0.3, s * 0.85, 1 - p.on);
      const i = Math.floor(t / 2.6) % COMM.length, f = fract(t / 2.6), full = COMM[i], now = full.slice(0, Math.ceil(full.length * clamp(f / 0.45, 0, 1)));
      if (p.on > 0.01) {
        for (let k = 1; k <= 3; k++) { const a = p.on * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 10 - k))) * (f < 0.55 ? 1 : 0.3); g.strokeStyle = 'rgba(255,198,41,' + a + ')'; g.lineWidth = 2; g.beginPath(); g.arc(mx, my - s * 0.4, s * 0.45 + k * s * 0.18, -0.8, 0.8); g.stroke(); }
        g.save(); g.globalAlpha = ease(p.on) * (f > 0.93 ? (1 - f) / 0.07 : 1);
        const bx = mx + s * 1.25, bw = W - bx - 12, bh = Math.min(H * 0.34, 54);
        bubble(g, bx, H * 0.2, bw, bh, [mx + s * 0.6, my - s * 0.75], { full, now }, Math.max(11, H * 0.1));
        g.restore();
      }
    }
  });

  /* ---------------- Sovoznik na reliju (angleščina) ---------------- */
  const RALLY = new A.Path(-40, -8, Math.PI / 2, [['s', 26], ['a', 22, -55], ['s', 12], ['a', 14, 95], ['s', 20], ['a', 30, -40], ['s', 40]], 1.2);
  const RALLY_THINGS = A.sideThings ? A.sideThings(RALLY, 5, 7, 18, 5).map(o => Object.assign(o, { kind: 'pine', c: PAL.pine[Math.floor(o.x) & 1] })) : [];
  const NOTES = ['Left 4 … 100', 'Right 2 tightens!', 'Over crest, keep left'];
  A.def('codrv', {
    opts: [0, 1], dur: 0.6,
    P: (v) => ({ on: +v }),
    init(S) { S.V = new A.View(); S.fx = new A.Particles(); S.s = 0; },
    draw(g, W, H, t, p, st, S) {
      const dt = st.dt || 0; S.s += dt * 17; if (S.s > RALLY.len - 4) S.s = 0;
      const q = RALLY.at(S.s), k = RALLY.at(S.s + 3).k, car = { x: q.x, z: q.z, h: q.h + k * 9, col: '#f2f2f2', stripeCol: '#1c5fd6', marker: true, steer: k * 6 };
      if (Math.random() < dt * 30) { const ch = Math.cos(car.h), sh = Math.sin(car.h); S.fx.add({ kind: 'smoke', x: car.x - sh * 2, z: car.z - ch * 2, y: 0.3, vx: (Math.random() - 0.5) * 3, vz: (Math.random() - 0.5) * 3, vy: 0.5, age: 0, life: 1.1, r0: 0.6, r1: 2.8, c: '196,170,120' }); }
      S.fx.step(dt);
      const V = S.V.set(A.gameCam('iso', car, { Di: 38, ahi: 6 }), 0, 0, W, H);
      A.scene(g, V, { t, ground: { col: '#5f8f3d', col2: '#679843' }, roads: [{ P: RALLY, w: 7, col: '#b09468', kerbs: false, lines: false }], things: RALLY_THINGS, cars: [car], over: (g2, V2) => S.fx.draw(g2, V2) });
      if (p.on > 0.01) {   // the co-driver: a helmet, the note being read
        const i = Math.floor(t / 2.2) % NOTES.length, f = fract(t / 2.2), full = NOTES[i], now = full.slice(0, Math.ceil(full.length * clamp(f / 0.4, 0, 1)));
        g.save(); g.globalAlpha = ease(p.on) * (f > 0.92 ? (1 - f) / 0.08 : 1);
        const hs = Math.max(14, H * 0.14), hx = 10 + hs, hy = 10 + hs;
        g.fillStyle = '#f6f6f1'; g.beginPath(); g.arc(hx, hy, hs, Math.PI * 0.9, Math.PI * 2.1); g.lineTo(hx + hs, hy + hs * 0.7); g.lineTo(hx - hs * 0.9, hy + hs * 0.7); g.closePath(); g.fill();
        g.fillStyle = '#1f2a37'; A.rr(g, hx - hs * 0.2, hy - hs * 0.3, hs * 1.15, hs * 0.55, hs * 0.2); g.fill();
        g.fillStyle = PAL.curb; g.fillRect(hx - hs * 0.9, hy + hs * 0.3, hs * 1.85, hs * 0.14);
        const bx = hx + hs * 1.5, bw = Math.min(W - bx - 10, Math.max(150, W * 0.55)), bh = Math.min(H * 0.3, 46);
        bubble(g, bx, hy - bh * 0.8, bw, bh, [hx + hs * 0.9, hy - bh * 0.05], { full, now }, Math.max(11, H * 0.1));
        g.restore();
      }
    }
  });

  /* ---------------- Vibracija ---------------- */
  A.def('vibrate', {
    opts: [0, 1], dur: 0.5,
    P: (v) => ({ on: +v }),
    draw(g, W, H, t, p) {
      A.studio(g, W, H);
      const PER = 2.6, T = fract(t / PER) * PER, hitT = 1.0, after = T - hitT;
      const shake = after > 0 ? Math.exp(-after * 5) * p.on : 0, jx = shake * Math.sin(T * 90) * H * 0.04, jr = shake * Math.sin(T * 70) * 0.03;
      const pw = Math.min(W * 0.62, H * 1.62), ph = pw * 0.47, cx = W / 2 + jx, cy = H * 0.5;
      A.phone(g, cx, cy, pw, ph, jr, (g2, w, h) => {
        g2.fillStyle = PAL.grass; g2.fillRect(0, 0, w, h); g2.fillStyle = PAL.asphalt; g2.fillRect(0, h * 0.22, w, h * 0.56);
        for (let i = 0; i < 10; i++) { g2.fillStyle = i & 1 ? PAL.kerbR : PAL.kerbW; g2.fillRect(i * w / 10, h * 0.16, w / 10, h * 0.06); }
        const x = after < 0 ? w * (0.15 + 0.55 * T / hitT) : w * 0.7 - Math.min(after, 0.4) * w * 0.15, y = after < 0 ? h * (0.55 - 0.3 * sstep(0.5, 1, T / hitT)) : h * 0.28 + Math.min(after, 0.4) * h * 0.4;
        A.car2d(g2, x, y, Math.PI / 2 - (after < 0 ? 0.4 * sstep(0.5, 1, T / hitT) : 0.4 * Math.exp(-after * 4)), h * 0.34, PAL.player, {});
        if (after > 0 && after < 0.35) { g2.fillStyle = 'rgba(255,240,180,' + (1 - after / 0.35) + ')'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g2.fillRect(w * 0.76 + Math.cos(a) * after * 60, h * 0.2 + Math.sin(a) * after * 40, 3, 3); } }
      });
      if (shake > 0.02) for (const s of [-1, 1]) for (let i = 1; i <= 3; i++) { g.strokeStyle = 'rgba(255,198,41,' + shake * (1 - i * 0.22) + ')'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx + s * (pw / 2 + 4), cy, i * H * 0.07, s > 0 ? -0.6 : Math.PI - 0.6, s > 0 ? 0.6 : Math.PI + 0.6); g.stroke(); }
    }
  });

  /* ---------------- Jezik · Language ---------------- */
  const LANG_ROWS = [['KROG 2/3', 'LAP 2/3'], ['MESTO 3', 'POS 3'], ['NADALJUJ', 'RESUME']];
  A.def('lang', {
    opts: ['sl', 'en'], dur: 1.2,
    P: () => ({}),
    draw(g, W, H, t, p, st) {
      A.studio(g, W, H);
      const en = st.v === 'en', was = st.prev === 'en', since = st.since, wide = W / H > 2.6;
      const cs = Math.min(H * 0.17, (wide ? W * 0.62 : W * 0.92) / 11.6), x0 = W / 2 - cs * 4.6 + cs * 1.15, y0 = H / 2 - cs * 1.75;
      LANG_ROWS.forEach((row, r) => {
        const a = row[was ? 1 : 0], b = row[en ? 1 : 0];
        for (let i = 0; i < 9; i++) {
          const ca = a[i] || ' ', cb = b[i] || ' ', delay = i * 0.06 + r * 0.12, u = clamp((since - delay) / 0.22, 0, 1);
          const ch = u < 0.5 ? ca : cb, sq = Math.abs(Math.cos(u * Math.PI)), x = x0 + i * cs * 1.02, y = y0 + r * cs * 1.25;
          g.fillStyle = '#141b26'; A.rr(g, x, y, cs * 0.94, cs * 1.12, 3); g.fill();
          g.save(); g.translate(x + cs * 0.47, y + cs * 0.56); g.scale(1, Math.max(0.05, sq));
          g.fillStyle = r === 2 ? '#2a3546' : '#1d2735'; A.rr(g, -cs * 0.47, -cs * 0.56, cs * 0.94, cs * 1.12, 3); g.fill();
          A.text(g, ch, 0, 1, { size: cs * 0.8, col: r === 2 ? PAL.gold : '#f6f6f1', w: 900 });
          g.restore();
          g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, y + cs * 0.55, cs * 0.94, 1);
        }
      });
      const gx = x0 - cs * 1.3, gy = H / 2, gr = cs * 0.75;   // a little globe: the language
      g.strokeStyle = '#9fb3d6'; g.lineWidth = 1.5; g.beginPath(); g.arc(gx, gy, gr, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(gx, gy, gr * 0.45, gr, 0, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(gx - gr, gy); g.lineTo(gx + gr, gy); g.stroke();
      A.text(g, en ? 'EN' : 'SL', gx, gy + gr * 1.6, { size: cs * 0.55, col: PAL.gold, w: 900 });
    }
  });

  /* ---------------- Ime voznika ---------------- */
  A.def('name', {
    draw(g, W, H, t, p, st) {
      A.studio(g, W, H);
      const name = String((A.env && A.env.get && A.env.get('name')) || st.v || 'Igralec').toUpperCase().slice(0, 16), wide = W / H > 2.6;
      const rw = wide ? W * 0.56 : W * 0.86, rh = Math.min(H * 0.22, 30), x = W / 2 - rw / 2, y0 = H / 2 - rh * 1.65;
      const rows = [['1.', name, '1:23,456', true], ['2.', 'KOVAČ', '1:24,102'], ['3.', 'HAYES', '1:24,870']];
      rows.forEach((r, i) => {
        const y = y0 + i * (rh + 4); g.fillStyle = r[3] ? 'rgba(255,210,63,.94)' : 'rgba(10,14,20,.72)'; A.rr(g, x, y, rw, rh, 5); g.fill();
        const c = r[3] ? '#16181c' : '#fff', s = rh * 0.52;
        A.text(g, r[0], x + s * 1.5, y + rh / 2 + 0.5, { size: s, col: c, al: 'right', w: 900 });
        A.text(g, r[1], x + s * 2.1, y + rh / 2 + 0.5, { size: s, col: c, al: 'left', w: 900 });
        if (r[3] && fract(t * 1.1) < 0.55) { g.font = '900 italic ' + s + 'px ApexMenu, Roboto, sans-serif'; const w = g.measureText(r[1]).width; g.fillStyle = '#16181c'; g.fillRect(x + s * 2.1 + w + 3, y + rh * 0.22, 2, rh * 0.56); }
        A.text(g, r[2], x + rw - s * 0.7, y + rh / 2 + 0.5, { size: s * 0.9, col: c, al: 'right', w: 700, it: false });
      });
      // a little crown over the first
      const cx = x - 4, cy = y0 + rh / 2, cs = rh * 0.4; g.fillStyle = PAL.gold; g.beginPath(); g.moveTo(cx - cs * 2, cy + cs * 0.6); g.lineTo(cx - cs * 2, cy - cs * 0.5); g.lineTo(cx - cs * 1.5, cy); g.lineTo(cx - cs, cy - cs * 0.7); g.lineTo(cx - cs * 0.5, cy); g.lineTo(cx, cy - cs * 0.5); g.lineTo(cx, cy + cs * 0.6); g.closePath(); g.fill();
    }
  });

  /* ---------------- Profil: izvozi, uvozi ---------------- */
  A.def('profile', {
    draw(g, W, H, t) {
      A.studio(g, W, H);
      const wide = W / H > 2.6, px = wide ? W * 0.3 : W * 0.24, fx = wide ? W * 0.7 : W * 0.76, cy = H * 0.5;
      // the phone (upright) and the folder
      const ph = H * 0.72, pw = ph * 0.5; A.phone(g, px, cy, pw, ph, 0, (g2, w, h) => { g2.fillStyle = '#12233a'; g2.fillRect(0, 0, w, h); A.car2d(g2, w / 2, h * 0.4, 0, h * 0.3, PAL.player, {}); g2.fillStyle = PAL.gold; g2.fillRect(w * 0.2, h * 0.72, w * 0.6, h * 0.05); g2.fillRect(w * 0.3, h * 0.8, w * 0.4, h * 0.04); });
      const fw = H * 0.62, fh = fw * 0.72; g.fillStyle = '#c99a3a'; A.rr(g, fx - fw / 2, cy - fh / 2 - fh * 0.12, fw * 0.42, fh * 0.2, 4); g.fill(); g.fillStyle = '#f0b84a'; A.rr(g, fx - fw / 2, cy - fh / 2, fw, fh, 6); g.fill();
      // the file going over: out (export), then back (import)
      const PER = 3.4, k = fract(t / PER) * 2, out = k < 1, u = ease(clamp((out ? k : k - 1) * 1.25, 0, 1));
      const a = out ? [px, cy] : [fx, cy - fh * 0.1], b = out ? [fx, cy - fh * 0.1] : [px, cy], x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * H * 0.3;
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.setLineDash([4, 4]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(px, cy - H * 0.05); g.quadraticCurveTo((px + fx) / 2, cy - H * 0.62, fx, cy - fh * 0.15); g.stroke(); g.setLineDash([]);
      const s = H * 0.2; g.save(); g.translate(x, y); g.rotate((out ? 1 : -1) * 0.2 * Math.sin(u * Math.PI));
      g.fillStyle = '#f6f6f1'; g.beginPath(); g.moveTo(-s * 0.4, -s * 0.5); g.lineTo(s * 0.18, -s * 0.5); g.lineTo(s * 0.4, -s * 0.28); g.lineTo(s * 0.4, s * 0.5); g.lineTo(-s * 0.4, s * 0.5); g.closePath(); g.fill();
      g.fillStyle = PAL.gold; g.beginPath(); g.moveTo(-s * 0.15, -s * 0.12); g.lineTo(s * 0.15, -s * 0.12); g.lineTo(s * 0.1, s * 0.1); g.lineTo(-s * 0.1, s * 0.1); g.closePath(); g.fill(); g.fillRect(-s * 0.03, s * 0.1, s * 0.06, s * 0.12); g.fillRect(-s * 0.12, s * 0.22, s * 0.24, s * 0.05);
      g.restore();
      A.arrow(g, (px + fx) / 2 - H * 0.12 * (out ? 1 : -1), H * 0.88, (px + fx) / 2 + H * 0.12 * (out ? 1 : -1), H * 0.88, PAL.gold, 2.5, 8);
    }
  });
})();
