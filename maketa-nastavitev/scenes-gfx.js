/* SETTINGS ANIMATIONS — Grafika: Grafika (Retro / Normalno / Visoko), Podrobnosti, Sence, Varčevanje z baterijo */
(function () {
  'use strict';
  const A = SetAnim, { TAU, clamp, lerp, sstep, ease, fract, hash, PAL } = A;
  const LOOP = A.LOOP, LOOP_THINGS = A.LOOP_THINGS;
  const off = (S, k, w, h) => { let c = S[k]; if (!c) c = S[k] = document.createElement('canvas'); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c; };

  /* ---------------- Grafika: the same corner drawn three ways; a change sweeps over the picture ---------------- */
  function drawQ(g, W, H, mode, t, S, car, rival) {
    if (mode === 'retro') {   // a few big pixels: the picture drawn small and blown up without smoothing
      const k = 4.2, w = Math.max(8, Math.round(W / k)), h = Math.max(6, Math.round(H / k)), c = off(S, 'lo', w, h), x = c.getContext('2d');
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
      const V = S.V2.set(A.gameCam('iso', car, { Di: 34, ahi: 5 }), 0, 0, w, h);
      A.scene(x, V, { t, roads: [{ P: LOOP, w: 10 }], things: LOOP_THINGS, cars: [rival, car], shadows: 0.8 });
      g.save(); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W, H); g.restore();
      return;
    }
    const V = S.V.set(A.gameCam('iso', car, { Di: 34, ahi: 5 }), 0, 0, W, H);
    const hi = mode === 'high';
    A.scene(g, V, { t, roads: [{ P: LOOP, w: 10 }], things: LOOP_THINGS, cars: [rival, car], softShadow: hi });
    if (!hi) return;
    // high: cloud shadows drifting over the ground, a warm sun from the top left, a soft (tilt-shift) top and bottom, a vignette
    for (let i = 0; i < 3; i++) { const cx = ((t * 9 + i * 170) % (W + 300)) - 150, cy = H * (0.25 + i * 0.3), r = Math.max(W, H) * 0.35, gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(10,20,30,.13)'); gr.addColorStop(1, 'rgba(10,20,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    const c = off(S, 'blur', Math.max(4, Math.round(W / 6)), Math.max(4, Math.round(H / 6))), x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.imageSmoothingEnabled = true; x.drawImage(g.canvas, 0, 0, c.width, c.height);
    const m = off(S, 'mask', Math.round(W), Math.round(H)), y = m.getContext('2d');
    y.setTransform(1, 0, 0, 1, 0, 0); y.globalCompositeOperation = 'source-over'; y.clearRect(0, 0, m.width, m.height); y.imageSmoothingEnabled = true; y.drawImage(c, 0, 0, m.width, m.height);
    y.globalCompositeOperation = 'destination-in'; const mg = y.createLinearGradient(0, 0, 0, m.height);
    mg.addColorStop(0, 'rgba(0,0,0,.95)'); mg.addColorStop(0.2, 'rgba(0,0,0,0)'); mg.addColorStop(0.8, 'rgba(0,0,0,0)'); mg.addColorStop(1, 'rgba(0,0,0,.95)'); y.fillStyle = mg; y.fillRect(0, 0, m.width, m.height);
    g.drawImage(m, 0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'soft-light'; const sun = g.createRadialGradient(W * 0.1, -H * 0.2, 0, W * 0.1, -H * 0.2, Math.max(W, H) * 1.1); sun.addColorStop(0, 'rgba(255,214,140,.55)'); sun.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = sun; g.fillRect(0, 0, W, H); g.restore();
    g.save(); g.globalCompositeOperation = 'screen'; const glow = g.createRadialGradient(W * 0.08, 0, 0, W * 0.08, 0, H * 0.9); glow.addColorStop(0, 'rgba(255,236,190,.3)'); glow.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H); g.restore();
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.32)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  A.def('quality', {
    opts: ['retro', 'normal', 'high'], dur: 1.1,
    P: () => ({}),
    init(S) { S.V = new A.View(); S.V2 = new A.View(); },
    draw(g, W, H, t, p, st, S) {
      const s = 30 + t * 7, car = A.loopCar(s, PAL.player, { marker: true }), rival = A.loopCar(s + 16, PAL.rivals[2], { d: 2 });
      if (p.k < 1 && st.prev !== st.v) {   // the sweep: the old look to the right of the line, the new to the left
        drawQ(g, W, H, st.prev, t, S, car, rival);
        const x = W * ease(p.k);
        const c = off(S, 'wipe', g.canvas.width, g.canvas.height), y = c.getContext('2d'), dpr = g.canvas.width / W;
        y.setTransform(dpr, 0, 0, dpr, 0, 0); y.clearRect(0, 0, W, H); drawQ(y, W, H, st.v, t, S, car, rival);
        g.save(); g.beginPath(); g.rect(0, 0, x, H); g.clip(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, 0, 0); g.restore();
        const gl = g.createLinearGradient(x - 14, 0, x + 2, 0); gl.addColorStop(0, 'rgba(255,198,41,0)'); gl.addColorStop(1, 'rgba(255,198,41,.55)'); g.fillStyle = gl; g.fillRect(x - 14, 0, 16, H);
        g.fillStyle = '#fff'; g.fillRect(x - 1, 0, 2, H);
      } else drawQ(g, W, H, st.v, t, S, car, rival);
    }
  });

  /* ---------------- Podrobnosti: Nizka / Srednja / Visoka / Samodejno ---------------- */
  // the things by an endless straight, each with its tier (0 always, 1 from Srednja, 2 only Visoka) and its distance from the road
  function detailThings(x0, x1) {
    const a = [];
    for (let x = Math.floor(x0 / 5) * 5; x < x1; x += 5) {
      const id = Math.round(x / 5);
      for (const side of [-1, 1]) for (let row = 0; row < 5; row++) {
        const r = hash(id * 1.7 + side * 3.1 + row * 7.3); if (r > [0.3, 0.42, 0.55, 0.62, 0.7][row]) continue;
        const dist = 9 + row * 8 + hash(id + row) * 6, tier = row === 0 ? (r < 0.15 ? 0 : 1) : row < 2 ? 1 : 2;
        a.push({ id: id * 31 + side * 7 + row, kind: hash(id * 3 + row) < 0.3 ? 'pine' : 'tree', x: x + hash(id * 5 + side) * 4, z: side * dist, s: 0.7 + hash(id + side * 2 + row) * 0.5, c: PAL.leaf[(id + row) & 3], tier, dist });
      }
      if (id % 9 === 0) a.push({ id: id * 31 + 1000, kind: 'stand', x: x + 2, z: -13, w: 16, d: 4.5, hgt: 2.6, h: Math.PI, tier: 1, dist: 13, crowdT: true, wave: true });
      if (id % 4 === 1) a.push({ id: id * 31 + 2000, kind: 'tyres', x, z: 7.2, dx: 1, tier: 1, dist: 7 });
      if (id % 3 === 2) a.push({ id: id * 31 + 3000, kind: 'rock', x: x + 1, z: 9 + hash(id) * 5, s: 0.8 + hash(id * 2), h: id, tier: 2, dist: 10 });
      if (id % 4 === 3) a.push({ id: id * 31 + 4000, kind: 'flag', x: x + 1, z: 7.5, c: PAL.rivals[id % 6], tier: 2, dist: 8 });
      if (id % 6 === 0) a.push({ id: id * 31 + 5000, kind: 'person', x: x + 3, z: 7.8, c: '#ff8a3d', wave: true, tier: 2, dist: 8 });
      if (id % 5 === 2) a.push({ id: id * 31 + 6000, kind: 'cone', x: x + 2, z: -6.6, tier: 2, dist: 7 });
    }
    return a;
  }
  const CULL = [18, 34, 1e9];
  A.def('detail', {
    opts: ['low', 'med', 'high', 'auto'], dur: 0.6,
    P: (v) => ({ au: v === 'auto' ? 1 : 0 }),
    init(S) { S.V = new A.View(); S.gr = {}; S.fps = []; S.lvl = 2; },
    draw(g, W, H, t, p, st, S) {
      const dt = st.dt || 0, v = st.v;
      // Samodejno: the phone's meter decides; heavy scenery makes the frames stutter, so it steps down, then up again
      let lvl = v === 'low' ? 0 : v === 'med' ? 1 : 2;
      if (v === 'auto') { const ph = fract(t / 7); lvl = ph < 0.42 ? 2 : ph < 0.82 ? 1 : 2; }
      const fpsNow = v === 'auto' ? (fract(t / 7) < 0.42 ? lerp(58, 34, sstep(0.1, 0.4, fract(t / 7))) : 57 + Math.sin(t * 3) * 2) : 60;
      S.fps.push(fpsNow); if (S.fps.length > 60) S.fps.shift();
      const x = t * 14, car = { x, z: -1.8, h: Math.PI / 2, col: PAL.player, marker: true };
      const things = detailThings(x - 60, x + 80);
      for (const o of things) {   // each grows or sinks into the ground by itself, a little apart from the others
        const want = o.tier <= lvl && o.dist <= CULL[lvl] ? 1 : 0, k = S.gr[o.id] == null ? want : S.gr[o.id];
        const rate = 3 + hash(o.id) * 4; S.gr[o.id] = k + (want - k) * (1 - Math.exp(-dt * rate));
        o.grow = A.back(S.gr[o.id]); if (o.crowdT) o.crowd = lvl >= 2 ? 1 : lvl >= 1 ? 0.5 : 0;
      }
      const asp = W / H, D = Math.max(40 * Math.sin(0.82) / (2 * Math.tan(15 * A.D2R)), 52 / (2 * Math.tan(15 * A.D2R) * asp));
      const V = S.V.set(A.camAt(x + 6, 0, 2, D, 0, 0.82, 30), 0, 0, W, H);
      A.scene(g, V, { t, things: things.filter(o => o.grow > 0.02), cars: [car], under: (g2, V2) => A.straight(g2, V2, x - 80, x + 90, { w: 11, kerbs: true }) });
      if (p.au > 0.01) {   // the phone's meter: an "A", the frame rate's line (green, red when it stutters)
        g.save(); g.globalAlpha = p.au; const bw = Math.max(70, W * 0.22), bh = Math.max(30, H * 0.22), bx = W - bw - 8, by = 8;
        g.fillStyle = 'rgba(8,13,22,.78)'; A.rr(g, bx, by, bw, bh, 7); g.fill();
        const r = bh * 0.32; g.fillStyle = PAL.gold; g.beginPath(); g.arc(bx + r + 6, by + bh / 2, r, 0, TAU); g.fill(); A.text(g, 'A', bx + r + 6, by + bh / 2 + 0.5, { size: r * 1.2, col: '#1b1b1b', w: 900 });
        const lx = bx + r * 2 + 12, lw = bw - r * 2 - 18; g.lineWidth = 2; g.beginPath();
        S.fps.forEach((f, i) => { const xx = lx + i / 59 * lw, yy = by + bh - 5 - (f - 25) / 40 * (bh - 10); if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); });
        g.strokeStyle = fpsNow < 45 ? '#ff6a5a' : PAL.lime; g.stroke();
        g.restore();
      }
    }
  });

  /* ---------------- Sence: Izklop / Vklop ---------------- */
  A.def('shadows', {
    opts: [0, 1], dur: 0.7,
    P: (v) => ({ on: +v }),
    init(S) { S.V = new A.View(); },
    draw(g, W, H, t, p, st, S) {
      const s = 12 + t * 12, car = A.loopCar(s, PAL.player, { marker: true }), rival = A.loopCar(s - 13, PAL.rivals[1], { d: 2 });
      const V = S.V.set(A.gameCam('iso', car, { Di: 30, ahi: 4 }), 0, 0, W, H);
      A.scene(g, V, { t, roads: [{ P: LOOP, w: 10 }], things: LOOP_THINGS, cars: [rival, car], shadows: ease(p.on) });
      // the sun in the corner, its rays to the ground
      const r = Math.max(8, H * 0.07), x = r * 2, y = r * 2;
      g.fillStyle = 'rgba(255,214,90,' + (0.5 + 0.5 * p.on) + ')'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,214,90,' + (0.4 + 0.5 * p.on) + ')'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.3; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); g.lineTo(x + Math.cos(a) * r * 1.85, y + Math.sin(a) * r * 1.85); g.stroke(); }
    }
  });

  /* ---------------- Varčevanje z baterijo: Izklop / Samodejno / Vklop ---------------- */
  function battery(g, x, y, w, h, lvl, charging, leaf) {
    g.strokeStyle = '#dfe6f1'; g.lineWidth = 2; A.rr(g, x, y, w, h, 4); g.stroke(); g.fillStyle = '#dfe6f1'; g.fillRect(x + w, y + h * 0.3, 4, h * 0.4);
    const c = lvl > 0.5 ? '#5fd13a' : lvl > 0.2 ? '#f1c21b' : '#ee3b2b'; g.fillStyle = c; A.rr(g, x + 3, y + 3, Math.max(0, (w - 6) * lvl), h - 6, 2); g.fill();
    A.text(g, Math.round(lvl * 100) + ' %', x + w / 2, y + h + h * 0.55, { size: h * 0.5, col: '#dfe6f1', w: 800 });
    if (charging) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + w * 0.55, y + h * 0.12); g.lineTo(x + w * 0.38, y + h * 0.55); g.lineTo(x + w * 0.5, y + h * 0.55); g.lineTo(x + w * 0.44, y + h * 0.9); g.lineTo(x + w * 0.64, y + h * 0.42); g.lineTo(x + w * 0.52, y + h * 0.42); g.closePath(); g.fill(); }
    if (leaf > 0.01) { g.save(); g.globalAlpha = leaf; g.translate(x + w + 16, y - 4); g.rotate(-0.5); g.fillStyle = '#5fd13a'; g.beginPath(); g.ellipse(0, 0, h * 0.28 * A.back(leaf), h * 0.55 * A.back(leaf), 0, 0, TAU); g.fill(); g.strokeStyle = '#1e5a1c'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -h * 0.45); g.lineTo(0, h * 0.5); g.stroke(); g.restore(); }
  }
  A.def('saver', {
    opts: ['off', 'auto', 'on'], dur: 0.5,
    P: () => ({}),
    init(S) { S.b = null; S.t0 = 0; },
    onChange(S, v, prev, now) { S.b = v === 'auto' ? 0.42 : 0.9; S.t0 = now; },
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H);
      const v = st.v, dt = st.dt || 0, wide = W / H > 2.6;
      // the battery: fast down without saving, slowly with it; 'auto' saves from 20 %, a charger takes it back up and saving stops
      if (S.chg == null) S.chg = false; if (S.b == null) S.b = v === 'auto' ? 0.3 : 0.9;
      let saving = v === 'on' || (v === 'auto' && S.b <= 0.2 && !S.chg);
      if (v === 'auto') { if (!S.chg && S.b <= 0.12) S.chg = true; if (S.chg && S.b >= 0.6) S.chg = false; }
      S.b += dt * (S.chg ? 0.16 : saving ? -0.025 : -0.08); if (S.b < 0.08 && v !== 'auto') S.b = 0.9; S.b = clamp(S.b, 0, 1);
      saving = v === 'on' || (v === 'auto' && S.b <= 0.2 && !S.chg) || (v === 'auto' && S.chg && S.b < 0.2);
      if (S.sv == null) S.sv = saving ? 1 : 0; S.sv += ((saving ? 1 : 0) - S.sv) * (1 - Math.exp(-dt * 6));
      // the phone: the picture at 30 frames (in steps) and a lower resolution while saving
      const tq = saving ? Math.floor(t * 10) / 10 : t;
      const pw = Math.min(W * (wide ? 0.4 : 0.56), H * 1.6), ph = pw * 0.47, px = wide ? W * 0.36 : W * 0.36;
      A.phone(g, px, H * 0.47, pw, ph, 0, (g2, w, h) => {
        if (saving) { const c = S.lo || (S.lo = document.createElement('canvas')), k = 3; c.width = Math.max(4, Math.round(w / k)); c.height = Math.max(4, Math.round(h / k)); const x = c.getContext('2d'); x.setTransform(1 / k, 0, 0, 1 / k, 0, 0); A.roadScreen(x, w, h, tq, A.steerWave(tq), { rw: 0.4 }); g2.save(); g2.imageSmoothingEnabled = false; g2.drawImage(c, 0, 0, w, h); g2.restore(); }
        else A.roadScreen(g2, w, h, tq, A.steerWave(tq), { rw: 0.4 });
      });
      A.text(g, saving ? '30 FPS' : '60 FPS', px, H * 0.47 + ph / 2 + H * 0.1, { size: Math.max(10, H * 0.08), col: saving ? '#9fd88a' : '#dfe6f1', w: 900 });
      const bw = Math.min(W * 0.16, H * 0.6), bh = bw * 0.45, bx = wide ? W * 0.66 : W * 0.72, by = H * 0.32;
      battery(g, bx, by, bw, bh, S.b, S.chg, S.sv);
      if (v === 'auto' && S.chg) { g.strokeStyle = '#dfe6f1'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx + bw + 4, by + bh / 2); g.bezierCurveTo(bx + bw + 30, by + bh / 2, bx + bw + 10, by + bh * 2.2, bx + bw + 34, by + bh * 2.4); g.stroke(); g.fillStyle = '#dfe6f1'; A.rr(g, bx + bw + 28, by + bh * 2.3, 14, 9, 2); g.fill(); }
    }
  });
})();
