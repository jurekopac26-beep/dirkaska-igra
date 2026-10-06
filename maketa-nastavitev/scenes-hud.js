/* SETTINGS ANIMATIONS — Prikaz: Idealna linija, Opozorila za ovinke, Opozorila na ovinke (Pikes Peak), Duh, Časovna tabela */
(function () {
  'use strict';
  const A = SetAnim, { TAU, clamp, lerp, sstep, ease, fract, hash, PAL } = A;
  const LOOP = A.LOOP, LOOP_THINGS = A.LOOP_THINGS;

  // the bends of a path: [{ s0, s1, mid, dir, k }] from its curvature
  function bends(P) {
    const out = []; let cur = null;
    for (let i = 1; i < P.n; i++) {
      const k = P.k[i];
      if (Math.abs(k) > 1e-4) { if (!cur || Math.sign(k) !== cur.dir) { cur = { s0: P.s[i - 1], s1: P.s[i], dir: Math.sign(k), k: Math.abs(k) }; out.push(cur); } else cur.s1 = P.s[i]; }
      else cur = null;
    }
    for (const b of out) b.mid = (b.s0 + b.s1) / 2;
    return out;
  }
  const LOOP_B = bends(LOOP);
  // the racing line round the loop: out wide before a bend, the apex inside, out wide after
  function lineD(s) {
    const L = LOOP.len; s = ((s % L) + L) % L; let m = 0;
    for (const b of LOOP_B) for (const off of [-L, 0, L]) { const u = (s - b.mid - off) / ((b.s1 - b.s0) * 0.95 + 6); if (Math.abs(u) < 1) m = Math.max(m, Math.cos(u * Math.PI / 2) ** 2); }
    return -3 + 6.2 * m;
  }
  // where on the loop: 'brake' before a bend, 'turn' in it, 'gas' else
  function zone(s) {
    const L = LOOP.len; s = ((s % L) + L) % L;
    for (const b of LOOP_B) for (const off of [-L, 0, L]) { const a = b.s0 + off, e = b.s1 + off; if (s > a - 15 && s <= a + 1) return 'brake'; if (s > a + 1 && s < e - 4) return 'turn'; }
    return 'gas';
  }
  const ZC = { gas: '#3fcf3a', brake: '#ee3b2b', turn: '#f1c21b' };

  /* ---------------- Idealna linija: Izklop / Vklop ---------------- */
  A.def('line', {
    opts: [0, 1], dur: 0.8,
    P: (v) => ({ on: +v }),
    init(S) { S.s = 6; S.v = 20; S.V = new A.View(); },
    draw(g, W, H, t, p, st, S) {
      const dt = st.dt || 0, z = zone(S.s + 4);
      const want = z === 'gas' ? 23 : 12.5;
      S.v += (want - S.v) * (1 - Math.exp(-dt * (want > S.v ? 1.4 : 3.2))); S.s += S.v * dt;
      const d = lineD(S.s), q = LOOP.at(S.s, d), q2 = LOOP.at(S.s + 1.5, lineD(S.s + 1.5));
      const car = { x: q.x, z: q.z, h: Math.atan2(q2.x - q.x, q2.z - q.z), col: PAL.player, marker: true, brakeLights: z === 'brake' };
      const V = S.V.set(A.gameCam('iso', car, { Di: 40, ahi: 9 }), 0, 0, W, H);
      const len = 46 * ease(p.on);
      A.scene(g, V, { t, roads: [{ P: LOOP, w: 10 }], things: LOOP_THINGS, cars: [car], under: (g2, V2) => {
        if (len < 0.5) return;
        const qq = {}, w = 0.75, step = 1.4;
        for (let a = 3; a < 3 + len; a += step) {
          const s0 = S.s + a, s1 = s0 + step + 0.05, zn = zone(s0), fade = 1 - sstep(len * 0.7, len, a);
          const A0 = LOOP.at(s0, lineD(s0) - w, {}), B0 = LOOP.at(s0, lineD(s0) + w, {}), A1 = LOOP.at(s1, lineD(s1) - w, qq), B1 = LOOP.at(s1, lineD(s1) + w, {});
          A.quad(g2, V2, A0.x, 0.03, A0.z, B0.x, 0.03, B0.z, B1.x, 0.03, B1.z, A1.x, 0.03, A1.z, A.rgba(ZC[zn], 0.88 * fade));
        }
      } });
      // the brake light's little stamp: the pedals' meaning, by the car (a tiny legend in the corner)
      if (p.on > 0.05) {
        g.save(); g.globalAlpha = p.on; const s = Math.max(9, H * 0.07), x = 10, y = H - s * 3.9;
        g.fillStyle = 'rgba(8,13,22,.72)'; A.rr(g, x - 5, y - s * 0.9, s * 6.6, s * 3.6, 6); g.fill();
        [['gas', 'plin'], ['brake', 'zavora'], ['turn', 'ovinek']].forEach(([k, l], i) => { g.fillStyle = ZC[k]; A.rr(g, x, y + i * s * 1.1 - s * 0.3, s * 1.4, s * 0.6, s * 0.3); g.fill(); A.text(g, l, x + s * 1.8, y + i * s * 1.1, { size: s * 0.9, col: '#e8eef6', al: 'left', w: 700, it: false }); });
        g.restore();
      }
    }
  });

  /* ---------------- Opozorila za ovinke: Izklop / Vklop (the arrow sign before each bend) ---------------- */
  const WIND = new A.Path(-60, 10, Math.PI / 2, [['s', 34], ['a', 36, 45], ['s', 24], ['a', 15, -95], ['s', 26], ['a', 8, 165], ['s', 40]], 1.2);
  const WIND_B = bends(WIND).map((b, i) => Object.assign(b, [{ kind: 'r1', sev: 1 }, { kind: 'l1', sev: 2 }, { kind: 'r3', sev: 3 }][i] || { kind: 'r1', sev: 1 }));
  const sideThings = (P, n, near, far, seed) => { const a = [], q = {}; for (let s = 0; s < P.len; s += n) for (const side of [-1, 1]) { const r = hash(s * 1.3 + side * 7 + seed); if (r > 0.6) continue; P.at(s, side * (near + hash(s + side * 3 + seed) * far), q); a.push({ kind: r < 0.18 ? 'pine' : 'tree', x: q.x, z: q.z, s: 0.7 + hash(s * 2 + seed) * 0.5, c: PAL.leaf[Math.floor(s / n) % 4] }); } return a; };
  const WIND_THINGS = sideThings(WIND, 6, 9, 22, 1);
  A.def('notes', {
    opts: [0, 1], dur: 0.6,
    P: (v) => ({ on: +v }),
    init(S) { S.s = 0; S.v = 20; S.V = new A.View(); S.shown = -1; S.at = 0; },
    draw(g, W, H, t, p, st, S) {
      const dt = st.dt || 0;
      let next = null; for (const b of WIND_B) if (b.s0 + 2 > S.s) { next = b; break; }
      const inB = WIND_B.find(b => S.s > b.s0 - 2 && S.s < b.s1);
      const want = inB ? (inB.sev === 3 ? 10 : inB.sev === 2 ? 14 : 19) : next && next.s0 - S.s < 18 ? (next.sev === 3 ? 11 : next.sev === 2 ? 15 : 20) : 22;
      S.v += (want - S.v) * (1 - Math.exp(-dt * 2.6)); S.s += S.v * dt;
      if (S.s > WIND.len - 4) { S.s = 0; S.shown = -1; }
      const q = WIND.at(S.s), car = { x: q.x, z: q.z, h: q.h + (inB ? inB.dir * 0.2 : 0), col: PAL.player, marker: true, steer: q.k * 6 };
      const V = S.V.set(A.gameCam('iso', car, { Di: 40, ahi: 10 }), 0, 0, W, H);
      A.scene(g, V, { t, roads: [{ P: WIND, w: 9 }], things: WIND_THINGS, cars: [car] });
      // the sign: from ~40 m before the bend until the car is in it
      const i = next ? WIND_B.indexOf(next) : -1, show = next && next.s0 - S.s < 44 && next.s0 - S.s > -1 ? i : -1;
      if (show !== S.shown) { S.shown = show; S.at = t; }
      if (show >= 0 && p.on > 0.01) {
        const b = WIND_B[show], k = clamp((t - S.at) / 0.25, 0, 1), out = 1 - sstep(-1, 4, -(b.s0 - S.s) + 4);
        A.noteSign(g, W / 2, H * 0.24, Math.min(H * 0.3, 56), b.kind, b.sev, p.on * Math.min(k, out), 0.8 + 0.2 * A.back(k));
      }
    }
  });

  /* ---------------- Opozorila na ovinke · Pikes Peak: the pace-note pill with the distance ---------------- */
  const MTN = new A.Path(-6, -60, 0, [['s', 26], ['a', 8, -172], ['s', 26], ['a', 8, 172], ['s', 24], ['a', 34, -40], ['s', 30]], 1.0);
  const MTN_B = bends(MTN).map((b, i) => Object.assign(b, [{ txt: 'LEVA LASNICA', ic: 'l3', sev: 3, hp: true }, { txt: 'DESNA LASNICA', ic: 'r3', sev: 3, hp: true }, { txt: 'LEVI 5', ic: 'l1', sev: 1 }][i] || {}));
  const MTN_THINGS = (() => { const a = []; for (let i = 0; i < 70; i++) { const x = (hash(i * 1.7) - 0.5) * 150, z = -70 + hash(i * 3.1) * 140; let near = false; const q = {}; for (let s = 0; s < MTN.len; s += 3) { MTN.at(s, 0, q); if (Math.hypot(q.x - x, q.z - z) < 9) { near = true; break; } } if (near) continue;
    a.push(z < -20 && hash(i) < 0.6 ? { kind: 'pine', x, z, s: 0.6 + hash(i * 5) * 0.4, c: PAL.pine[i % 3] } : { kind: 'rock', x, z, s: 0.8 + hash(i * 9) * 1.6, h: hash(i) * 3 }); } return a; })();
  function mtnGround(g, V) {
    A.ground(g, V, { col: '#8c8172', col2: '#857a6b', tuftCol: '#a39886', tuftP: 0.7 });
    for (let i = 0; i < 14; i++) A.disc(g, V, (hash(i * 4.1) - 0.5) * 160, 0.01, -20 + hash(i * 2.9) * 110, 5 + hash(i) * 7, '#eef3f6', 3 + hash(i * 7) * 4);
  }
  function pkPill(g, cx, cy, H, b, dist, alpha, k) {   // the game's #pk-note: a hairpin big and red, a medium bend orange, a fast one faint
    if (alpha <= 0.01) return;
    const hp = !!b.hp, s = Math.max(10, H * (hp ? 0.1 : 0.085));
    const bg = hp ? '#c92a22' : b.sev === 2 ? 'rgba(10,13,18,.72)' : b.sev === 3 ? 'rgba(10,13,18,.75)' : 'rgba(10,13,18,.5)';
    const bd = hp ? '#fff' : b.sev === 2 ? '#f0921a' : b.sev === 3 ? '#ff4d3d' : 'rgba(255,255,255,.22)';
    const ib = hp ? 'rgba(0,0,0,.28)' : b.sev === 2 ? '#e8840f' : b.sev === 3 ? '#d8342a' : 'rgba(255,255,255,.16)';
    g.save(); g.globalAlpha = alpha * (b.sev === 1 && !hp ? 0.8 : 1); g.translate(cx, cy); const sc = 0.85 + 0.15 * A.back(k) + (hp ? 0.05 * Math.max(0, Math.sin(k * Math.PI * 2)) : 0); g.scale(sc, sc);
    g.font = '800 italic ' + s + 'px ApexMenu, Roboto, sans-serif'; const tw = g.measureText(b.txt).width; g.font = '700 italic ' + s * 0.78 + 'px ApexMenu, Roboto, sans-serif'; const dw = Math.max(g.measureText(dist).width, s * 2.4);
    const w = s * 2.3 + tw + s * 0.5 + dw + s * 0.7, h = s * 2.05;
    if (hp) { g.fillStyle = 'rgba(201,42,34,.35)'; A.rr(g, -w / 2 - 3, -h / 2 - 3, w + 6, h + 6, h / 2 + 3); g.fill(); }
    g.fillStyle = bg; A.rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill();
    g.strokeStyle = bd; g.lineWidth = 2; g.stroke();
    g.save(); g.translate(-w / 2 + s * 1.15, 0); const r = s * 0.88; g.fillStyle = ib; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.scale(r * 1.55 / 64, r * 1.55 / 64); g.translate(-32, -34); g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(A.P2D(A.NOTE_PATHS[b.ic])); g.restore();
    A.text(g, b.txt, -w / 2 + s * 2.3, 0.5, { size: s, col: b.sev === 1 && !hp ? 'rgba(246,246,241,.86)' : '#fff', al: 'left', w: 800 });
    A.text(g, dist, w / 2 - s * 0.7, 0.5, { size: s * 0.78, col: 'rgba(255,255,255,.85)', al: 'right', w: 700 });
    g.restore();
  }
  A.def('pkNotes', {
    opts: [0, 1], dur: 0.6,
    P: (v) => ({ on: +v }),
    init(S) { S.s = 0; S.v = 18; S.V = new A.View(); S.shown = -1; S.at = 0; },
    draw(g, W, H, t, p, st, S) {
      const dt = st.dt || 0;
      let next = null; for (const b of MTN_B) if (b.s0 + 6 > S.s) { next = b; break; }
      const inB = MTN_B.find(b => S.s > b.s0 - 2 && S.s < b.s1);
      const want = inB ? (inB.hp ? 8.5 : 17) : next && next.s0 - S.s < 16 ? (next.hp ? 10 : 18) : 21;
      S.v += (want - S.v) * (1 - Math.exp(-dt * 2.6)); S.s += S.v * dt;
      if (S.s > MTN.len - 4) { S.s = 0; S.shown = -1; }
      const q = MTN.at(S.s), car = { x: q.x, z: q.z, h: q.h + (inB ? inB.dir * 0.25 : 0), col: PAL.player, marker: true, steer: q.k * 4 };
      const V = S.V.set(A.gameCam('iso', car, { Di: 40, ahi: 8 }), 0, 0, W, H);
      A.scene(g, V, { t, groundFn: mtnGround, roads: [{ P: MTN, w: 7.5, kerbs: false, centre: '#f2c230', shoulder: 1.2, shoulderCol: '#a69a86' }], things: MTN_THINGS, cars: [car] });
      const i = next ? MTN_B.indexOf(next) : -1, dist = next ? next.s0 - S.s : 1e9, show = next && dist < Math.max(40, S.v * 2.6) && dist > -6 ? i : -1;
      if (show !== S.shown) { S.shown = show; S.at = t; }
      if (show >= 0 && p.on > 0.01) {
        const b = MTN_B[show], d = Math.max(0, Math.round(dist / 10) * 10);
        pkPill(g, W / 2, H * 0.17, H, b, d ? d + ' m' : '', p.on, clamp((t - S.at) / 0.2, 0, 1));
      }
    }
  });

  /* ---------------- Duh najboljše vožnje: Izklop / Vklop ---------------- */
  A.def('ghost', {
    opts: [0, 1], dur: 0.9,
    P: (v) => ({ on: +v }),
    init(S) { S.V = new A.View(); },
    draw(g, W, H, t, p, st, S) {
      const s = t * 16, gap = 8 + 2.5 * Math.sin(t * 0.7);
      const car = A.loopCar(s, PAL.player, { marker: true, d: -0.6 }), gh = A.loopCar(s + gap, '#cfe4ff', { d: 0.4 });
      gh.ghost = 1; gh.stripe = false; gh.roof = '#cfe4ff';
      const V = S.V.set(A.gameCam('iso', car, { Di: 38, ahi: 3 }), 0, 0, W, H);
      const cars = p.on > 0.02 ? [Object.assign(gh, { ghostA: p.on }), car] : [car];
      A.scene(g, V, { t, roads: [{ P: LOOP, w: 10 }], things: LOOP_THINGS, cars: cars.filter(c => !c.ghost), over: (g2, V2) => {
        if (p.on <= 0.02) return;
        // the ghost: see-through, bluish, no shadow; a soft glow round it
        const T = [0, 0, 0, 0]; V2.p(gh.x, 0.8, gh.z, T);
        if (T[3]) { const r = V2.f * 4 / T[2], gr = g2.createRadialGradient(T[0], T[1], 0, T[0], T[1], r); gr.addColorStop(0, 'rgba(160,200,255,' + 0.35 * p.on + ')'); gr.addColorStop(1, 'rgba(160,200,255,0)'); g2.fillStyle = gr; g2.beginPath(); g2.arc(T[0], T[1], r, 0, TAU); g2.fill(); }
        const { parts } = A.carParts(gh);
        g2.save(); g2.globalAlpha = 0.5 * p.on; for (const pt of parts) pt.draw(g2, V2); g2.restore();
      } });
      if (p.on > 0.02) {   // the difference to it, under the clock
        const dtm = gap / 16, s2 = Math.max(10, H * 0.08);
        g.save(); g.globalAlpha = p.on;
        const w = A.pill(g, W / 2, H * 0.13, '+' + dtm.toFixed(2).replace('.', ','), { size: s2, bg: 'rgba(214,40,32,.88)', al: 'center' });
        // a little ghost by it
        const gx = W / 2 - w / 2 - s2 * 1.3, gy = H * 0.13, r = s2 * 0.7; g.fillStyle = '#cfe4ff';
        g.beginPath(); g.arc(gx, gy - r * 0.2, r, Math.PI, 0); g.lineTo(gx + r, gy + r * 0.9); for (let k = 0; k < 3; k++) { g.lineTo(gx + r - (k + 0.5) * r * 2 / 3, gy + r * 0.55); g.lineTo(gx + r - (k + 1) * r * 2 / 3, gy + r * 0.9); } g.closePath(); g.fill();
        g.fillStyle = '#0b192b'; g.beginPath(); g.arc(gx - r * 0.35, gy - r * 0.25, r * 0.18, 0, TAU); g.arc(gx + r * 0.35, gy - r * 0.25, r * 0.18, 0, TAU); g.fill();
        g.restore();
      }
    }
  });

  /* ---------------- Časovna tabela: Izklop / Vklop (the order with the gaps, rows that swap when someone passes) ---------------- */
  const FIELD = [
    { n: 'KOV', c: PAL.rivals[1], s0: 40, v: 15.6, a: 2.0, w: 0.5 }, { n: 'HAY', c: PAL.rivals[2], s0: 30, v: 15.6, a: 3.0, w: 0.7 },
    { n: 'TI', c: PAL.player, s0: 22, v: 15.6, a: 4.2, w: 0.42, me: true }, { n: 'ROS', c: PAL.rivals[3], s0: 18, v: 15.6, a: 2.5, w: 0.6 },
    { n: 'PET', c: PAL.rivals[4], s0: 6, v: 15.6, a: 2.0, w: 0.9 }, { n: 'LIN', c: PAL.rivals[0], s0: -4, v: 15.6, a: 1.5, w: 0.45 }];
  A.def('tower', {
    opts: [0, 1], dur: 0.7,
    P: (v) => ({ on: +v }),
    init(S) { S.V = new A.View(); S.y = {}; },
    draw(g, W, H, t, p, st, S) {
      const pos = FIELD.map((f, i) => ({ f, s: f.s0 + f.v * t + f.a * Math.sin(t * f.w + i * 1.7) }));
      const me = pos.find(x => x.f.me), cars = pos.map((x, i) => Object.assign(A.loopCar(x.s, x.f.c, { marker: !!x.f.me, d: ((i % 3) - 1) * 2.2, stripe: x.f.me ? undefined : false }), {}));
      const V = S.V.set(A.gameCam('iso', A.loopCar(me.s, PAL.player), { Di: 40, ahi: 6 }), 0, 0, W, H);
      A.scene(g, V, { t, roads: [{ P: LOOP, w: 11 }], things: LOOP_THINGS, cars });
      // the tower
      const order = pos.slice().sort((a, b) => b.s - a.s), rh = Math.min(H * 0.135, 22), rw = Math.max(rh * 5.4, 92), x0 = 8 - (rw + 14) * (1 - ease(p.on)), y0 = Math.max(6, (H - rh * 6 - 5) / 2);
      if (p.on > 0.01) order.forEach((x, i) => {
        const key = x.f.n, target = y0 + i * (rh + 1); if (S.y[key] == null) S.y[key] = target;
        S.y[key] += (target - S.y[key]) * (1 - Math.exp(-(st.dt || 0) * 8)); const y = S.y[key];
        const isMe = !!x.f.me;
        g.fillStyle = isMe ? 'rgba(255,210,63,.92)' : 'rgba(10,14,20,.72)'; A.rr(g, x0, y, rw, rh, 3); g.fill();
        const col = isMe ? '#16181c' : '#fff', fs = rh * 0.56;
        A.text(g, String(i + 1), x0 + rh * 0.7, y + rh / 2 + 0.5, { size: fs, col, w: 800, al: 'right' });
        g.fillStyle = x.f.c; g.fillRect(x0 + rh * 0.95, y + rh * 0.2, 3, rh * 0.6);
        A.text(g, x.f.n, x0 + rh * 1.3, y + rh / 2 + 0.5, { size: fs, col, w: 800, al: 'left', it: false });
        const gap = i === 0 ? 'VODI' : '+' + ((order[0].s - x.s) / 15.6).toFixed(1).replace('.', ',');
        A.text(g, gap, x0 + rw - rh * 0.3, y + rh / 2 + 0.5, { size: fs * 0.92, col: isMe ? '#16181c' : '#d6dee8', w: 600, al: 'right', it: false });
      });
    }
  });

  A.bends = bends; A.sideThings = sideThings; A.pkPill = pkPill; A.mtnGround = mtnGround; A.MTN = MTN; A.MTN_THINGS = MTN_THINGS;
})();
