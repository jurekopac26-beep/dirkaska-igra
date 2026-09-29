/* =========================================================================
   AUDIO — fully synthesized (Web Audio): engines, tyres, surfaces, hits
   ========================================================================= */
const Sfx = (function () {
  'use strict';
  const { clamp } = Core;
  let ctx = null, master = null, bus = null, enabled = true, volume = 0.8;
  let noiseBuf = null;
  let eng = null, ai = [], squeal = null, rumble = null, wind = null, curbV = null, heli = null, echo = null;
  let lastCrash = 0, running = false;

  function create() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (_) { try { ctx = new AC(); } catch (e) { return false; } }
    master = ctx.createGain(); master.gain.value = enabled ? volume : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    master.connect(comp); comp.connect(ctx.destination);
    bus = ctx.createGain(); bus.gain.value = 0; bus.connect(master); // race sounds (muted when paused)
    // noise buffer
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    eng = engineVoice(1.0, false);
    ai = [engineVoice(0.28, true), engineVoice(0.22, true)];
    squeal = squealVoice();
    rumble = noiseVoice('lowpass', 220, 0.8);
    curbV = noiseVoice('bandpass', 90, 4);
    wind = noiseVoice('bandpass', 700, 0.6);
    heli = heliVoice(); echo = echoFx();
    return true;
  }
  function shaperCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
    return c;
  }
  function engineVoice(level, pan) {
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
    const o2 = ctx.createOscillator(); o2.type = 'square';
    const o3 = ctx.createOscillator(); o3.type = 'sawtooth';
    const g1 = ctx.createGain(), g2 = ctx.createGain(), g3 = ctx.createGain();
    g1.gain.value = 0.5; g2.gain.value = 0.32; g3.gain.value = 0.16;
    const sh = ctx.createWaveShaper(); sh.curve = shaperCurve(2.2);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 2.2;
    const out = ctx.createGain(); out.gain.value = 0;
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    g1.connect(sh); g2.connect(sh); g3.connect(sh);
    sh.connect(lp); lp.connect(out);
    let pn = null;
    if (pan && ctx.createStereoPanner) { pn = ctx.createStereoPanner(); out.connect(pn); pn.connect(bus); } else out.connect(bus);
    o1.start(); o2.start(); o3.start();
    return { o1, o2, o3, lp, out, pn, level };
  }
  function squealVoice() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 14;
    const bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 1750; bp2.Q.value = 18;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 7; const lg = ctx.createGain(); lg.gain.value = 70;
    lfo.connect(lg); lg.connect(bp.frequency); lg.connect(bp2.frequency);
    const out = ctx.createGain(); out.gain.value = 0;
    src.connect(bp); src.connect(bp2); bp.connect(out); bp2.connect(out); out.connect(bus);
    src.start(); lfo.start();
    return { bp, bp2, out };
  }
  function noiseVoice(type, f, q) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    src.playbackRate.value = 0.7 + Math.random() * 0.3;
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
    const out = ctx.createGain(); out.gain.value = 0;
    src.connect(flt); flt.connect(out); out.connect(bus); src.start();
    return { flt, out };
  }

  // the TV helicopter: a low noise thump pulsed by the two blades (~12 per second, sawtooth -> sharp pulses), a body tone and a faint turbine whine
  function heliVoice() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.6;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.9;
    const body = ctx.createOscillator(); body.type = 'triangle'; body.frequency.value = 62; const bg = ctx.createGain(); bg.gain.value = 0.5;
    const vca = ctx.createGain(); vca.gain.value = 0.08;
    const mod = ctx.createOscillator(); mod.type = 'sawtooth'; mod.frequency.value = 12.5;
    const sh = ctx.createWaveShaper(), n = 512, c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = Math.pow(1 - i / (n - 1), 5); sh.curve = c;   // (a pulse on each reset of the ramp)
    const mg = ctx.createGain(); mg.gain.value = 1.1; mod.connect(sh); sh.connect(mg); mg.connect(vca.gain);
    const wh = ctx.createOscillator(); wh.type = 'sine'; wh.frequency.value = 1580; const wg = ctx.createGain(); wg.gain.value = 0.012;
    const out = ctx.createGain(); out.gain.value = 0;
    src.connect(lp); lp.connect(vca); body.connect(bg); bg.connect(vca); vca.connect(out); wh.connect(wg); wg.connect(out);
    let pn = null; if (ctx.createStereoPanner) { pn = ctx.createStereoPanner(); out.connect(pn); pn.connect(bus); } else out.connect(bus);
    src.start(); body.start(); mod.start(); wh.start();
    return { out, pn };
  }
  // an echo of the player's engine off the rock walls (Pikes Peak above the treeline): two short delays, one fed back, dulled
  function echoFx() {
    const send = ctx.createGain(); send.gain.value = 0;
    const d1 = ctx.createDelay(1), d2 = ctx.createDelay(1); d1.delayTime.value = 0.14; d2.delayTime.value = 0.31;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300;
    const fb = ctx.createGain(); fb.gain.value = 0.28; const g2 = ctx.createGain(); g2.gain.value = 0.6;
    send.connect(lp); lp.connect(d1); lp.connect(d2); d2.connect(g2); d2.connect(fb); fb.connect(d2); d1.connect(bus); g2.connect(bus);
    eng.out.connect(send);
    return { send };
  }

  /* ---- Pikes Peak atmosphere, set up on the first Pikes Peak frame with the sound on (nothing on the other tracks, nothing with the sound off):
     a gusty mountain wind that grows with the altitude (hardly a breath in the forest) and a little with speed, and the spectators at the hairpins,
     the checkpoints, the start and the finish, who cheer as the car goes by (from their side of the screen) and ring cowbells ---- */
  let atmo = null;
  const AT_WIND = 0.25, AT_CROWD = 0.3, AT_BELL = 0.18, AT_SR = 22050;   // levels (the buffers below are normalised); the buffers' rate (nothing in them above ~5 kHz)
  const bpf = (f, q, sr) => { const w = 2 * Math.PI * f / sr, al = Math.sin(w) / (2 * q), a0 = 1 + al; return [al / a0, -2 * Math.cos(w) / a0, (1 - al) / a0]; };   // band-pass biquad: b0 (b1 = 0, b2 = -b0), a1, a2
  const rmsTo = (a, v) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; const k = v / Math.sqrt(s / a.length + 1e-12); for (let i = 0; i < a.length; i++) a[i] *= k; };
  const mkPan = (v) => { if (!ctx.createStereoPanner) return ctx.createGain(); const p = ctx.createStereoPanner(); p.pan.value = v; return p; };
  // the crowd's loop and the cowbell clanks, made a slice per frame (a few ms each) while the car waits on the start line; then the crowd starts
  function* atmoGen(A) {
    const sr = AT_SR, n = Math.floor(4.3 * sr), R = Core.rng(7141), rn = () => R() * 2 - 1, { sstep, lerp } = Core;
    // 4.3 s of a crowd that loops without a seam: a babbling roar in vowel formants, applause and many overlapping whoops, swelling a little
    const roar = new Float32Array(n), clap = new Float32Array(n), voc = new Float32Array(n), w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = rn();
    for (const [f, q, a] of [[480, 1.2, 1], [1120, 1.5, 0.75], [2400, 2, 0.2]]) {   // (each filter warmed up on the loop's end, so it joins without a click; each band flickers at syllable pace)
      const [b0, a1, a2] = bpf(f, q, sr), K = 22, cp = []; for (let k = 0; k < K; k++) cp.push(0.3 + 0.7 * R());
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let j = -1024; j < n; j++) { const x = w[j < 0 ? n + j : j], y = b0 * (x - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y;
        if (j >= 0) { const u = j / n * K, k = Math.floor(u), t = u - k; roar[j] += y * a * (cp[k] + (cp[(k + 1) % K] - cp[k]) * t * t * (3 - 2 * t)); } }
      yield;
    }
    for (let c = 0; c < 28; c++) {   // clappers, 2.8-4.6 claps a second: each clap a short burst of noise with the clapper's own brightness
      const rate = 2.8 + R() * 1.8, [b0, a1, a2] = bpf(900 + R() * 1600, 0.8 + R() * 0.7, sr), k = Math.exp(-1 / ((0.005 + R() * 0.007) * sr)), L = Math.floor(0.045 * sr), amp = 0.4 + R() * 0.6;
      for (let t = R() / rate; t < 4.3; t += (0.92 + R() * 0.16) / rate) {
        let i = Math.floor(t * sr), e = amp * (0.6 + R() * 0.4), x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (let j = 0; j < L; j++, i++) { const x = rn() * e * (j < 14 ? j / 14 : 1), y = b0 * (x - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; if (j >= 14) e *= k; clap[i % n] += y; }
      }
      if (c % 7 === 6) yield;
    }
    for (let v = 0; v < 26; v++) {   // whoops ("woo", "yeah", "hey"): a buzz gliding up and down through two moving vowel formants, with some breath
      const i0 = Math.floor(R() * n), L = Math.floor((0.35 + R() * 0.8) * sr), f0 = R() < 0.6 ? 160 + R() * 130 : 270 + R() * 180, up = 0.15 + R() * 0.35, a = 0.5 + R() * 0.5, vr = R();
      const V = vr < 0.4 ? [330, 800, 720, 1150] : vr < 0.75 ? [420, 2000, 660, 1650] : [480, 2100, 560, 1900];
      let ph = 0, f = f0, F = null, G = null, x1 = 0, x2 = 0, y1 = 0, y2 = 0, z1 = 0, z2 = 0;
      for (let j = 0; j < L; j++) {
        const u = j / L;
        if (j % 16 === 0) { f = f0 * (1 + up * Math.sin(Math.min(1, u / 0.4) * 1.571) - 0.12 * sstep(0.55, 1, u) + 0.012 * Math.sin(j * 36 / sr)) / sr;
          if (j % 64 === 0) { const m = sstep(0.1, 0.6, u); F = bpf(lerp(V[0], V[2], m), 4, sr); G = bpf(lerp(V[1], V[3], m), 8, sr); } }
        ph += f; ph -= Math.floor(ph);
        const x = 2 * ph - 1 + 0.3 * rn(), y = F[0] * (x - x2) - F[1] * y1 - F[2] * y2, z = G[0] * (x - x2) - G[1] * z1 - G[2] * z2;
        x2 = x1; x1 = x; y2 = y1; y1 = y; z2 = z1; z1 = z;
        voc[(i0 + j) % n] += (y + 0.5 * z) * a * Math.min(1, u / 0.08, (1 - u) / 0.3);
      }
      if (v % 7 === 6) yield;
    }
    rmsTo(roar, 0.05); rmsTo(clap, 0.085); rmsTo(voc, 0.06);
    const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), p0 = R() * 6.28, p1 = R() * 6.28; let pk = 0;
    for (let b = 0; b < n; b += 64) { const u = b / n * 6.2832, kc = 0.75 + 0.25 * Math.sin(3 * u + p1), sw = 0.82 + 0.12 * Math.sin(2 * u + p0) + 0.06 * Math.sin(7 * u + p1);
      for (let i = b; i < b + 64 && i < n; i++) { d[i] = (roar[i] + clap[i] * kc + voc[i]) * sw; pk = Math.max(pk, Math.abs(d[i])); } }
    if (pk > 0.95) for (let i = 0; i < n; i++) d[i] *= 0.95 / pk;
    yield;
    // cowbell clanks, four sizes: inharmonic partials (the lower ones slightly detuned pairs: the metal shimmers), the upper ones dying faster, the clapper's click
    const Rb = Core.rng(2291);
    for (const f0 of [540, 640, 760, 890]) {
      const m = Math.floor(0.45 * sr), bb = ctx.createBuffer(1, m, sr), e = bb.getChannelData(0), fb = f0 * (0.97 + Rb() * 0.06);
      for (const [r, a, tau, np] of [[1, 1, 0.24, 2], [1.48, 0.7, 0.17, 2], [2.03, 0.36, 0.1, 2], [2.71, 0.25, 0.075, 1], [3.56, 0.14, 0.05, 1], [4.42, 0.08, 0.035, 1]])
        for (let q = 0; q < np; q++) {
          const wq = 2 * Math.PI * fb * r * (1 + (np > 1 ? (q ? 0.003 : -0.003) : 0) + (Rb() - 0.5) * 0.008) / sr, c2 = 2 * Math.cos(wq), k = Math.exp(-1 / (tau * (0.8 + Rb() * 0.4) * sr));
          let s1 = Math.sin(-wq), s2 = Math.sin(-2 * wq), g = a / np;
          for (let i = 0; i < m; i++) { const s = c2 * s1 - s2; s2 = s1; s1 = s; e[i] += s * g * (i < 12 ? i / 12 : 1); g *= k; }   // (a sine by recursion)
        }
      for (let i = 0, g = 0.35; i < 45; i++, g *= 0.9) e[i] += (Rb() * 2 - 1) * g;
      let pb = 0; for (let i = 0; i < m; i++) pb = Math.max(pb, Math.abs(e[i]));
      for (let i = 0; i < m; i++) e[i] *= 0.8 / pb * Math.min(1, (m - i) / (0.3 * m));   // (faded out at the end)
      A.bells.push(bb); yield;
    }
    for (const [g, rate, off] of [[A.cL, 0.97, 0], [A.cR, 1.03, 2.1]]) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.connect(g); s.start(0, off); }   // (one loop on each side)
  }
  function atmoBuild() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.5;   // wind: darkened noise, a body and a whistle
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; lp.Q.value = 0.5;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 7;
    const wh = ctx.createGain(), wo = ctx.createGain(), wp = mkPan(0); wh.gain.value = 0; wo.gain.value = 0;
    src.connect(lp); lp.connect(wo); src.connect(bp); bp.connect(wh); wh.connect(wo); wo.connect(wp); wp.connect(bus); src.start();
    const lo = ctx.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = 5200; lo.Q.value = 0.5; lo.connect(bus);   // crowd and cowbells: a side each, nothing shrill
    const side = (pan) => { const g = ctx.createGain(), pn = mkPan(pan); g.gain.value = 0; g.connect(pn); pn.connect(lo); return [g, pn]; };
    const [cL, pL] = side(-0.6), [cR, pR] = side(0.6);
    atmo = { wo, lp, bp, wh, wp, cL, cR, pL, pR, bells: [], ring: [0, 1, 2].map(() => ({ next: 0, left: 0, ivl: 0.14, side: 1, bell: 0 })), g: 0.5, gGoal: 0.5, gNext: 0, t: 0, T: null, spots: null, on: false };
    atmo.gen = atmoGen(atmo);
  }
  function atmoSpots(T) {   // where the spectators stand, on both sides of the road: every hairpin, the checkpoints, the start and the finish areas
    const S = [], put = (s, w) => { const i = T.idx(s); for (const sd of [-1, 1]) { const o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + 4); S.push({ x: T.px[i] + T.nx[i] * o, y: T.hy ? T.hy[i] : 0, z: T.pz[i] + T.nz[i] * o, w }); } };
    for (const c of T.corners) if (c.sev >= 3) put((c.i0 + c.i1) / 2 * T.ds, 1);
    for (const s of T.cpS) put(s, 0.85);
    put(T.startS + 20, 1.1); put(T.startS + 85, 0.9); put(T.finishS - 60, 1); put(T.finishS, 1.1);
    atmo.T = T; atmo.spots = S;
  }
  function atmoUpdate(race, player, pikes, cam) {
    if (!pikes || !enabled) { if (atmo && atmo.on) atmoOff(0.3); return; }
    if (!atmo) atmoBuild();
    if (atmo.gen && atmo.gen.next().done) atmo.gen = null;   // (the next slice of its buffers)
    if (atmo.T !== race.track) atmoSpots(race.track);
    const { sstep, lerp } = Core, now = ctx.currentTime, dt = clamp(now - atmo.t, 0, 0.25), y = player.roadY || 0, spd = player.speed || 0;
    atmo.t = now; atmo.on = true;
    // wind: the gusts ease towards a new goal every 1-4 s (faster up than down); louder with the altitude, almost nothing below the treeline (~186 m)
    if (now >= atmo.gNext) { const r = Math.random(); atmo.gGoal = 0.15 + 0.85 * r * r; atmo.gNext = now + 1 + Math.random() * 3; }
    atmo.g += (atmo.gGoal - atmo.g) * (1 - Math.exp(-dt / (atmo.gGoal > atmo.g ? 0.7 : 1.6)));
    const g = atmo.g, alt = sstep(150, 440, y), open = lerp(0.25, 1, sstep(172, 215, y));
    set(atmo.wo.gain, AT_WIND * (0.1 + 0.9 * alt * open) * (0.3 + 0.7 * g) * (1 + 0.5 * sstep(8, 50, spd)), 0.12);
    set(atmo.lp.frequency, 240 + 460 * g + 220 * alt, 0.15); set(atmo.bp.frequency, 620 + 700 * g + 60 * Math.sin(now * 1.3), 0.15); set(atmo.wh.gain, 0.6 * alt * g * g, 0.15);
    if (atmo.wp.pan) set(atmo.wp.pan, 0.3 * Math.sin(now * 0.11) + 0.15 * Math.sin(now * 0.37 + 1), 0.3);
    // crowd: each group by its distance to the car, split between the sides by where it is on the screen; livelier with the car's speed
    // (a murmur while it stands on the start line) and when it slides
    let wl = 0, wr = 0;
    const e = cam ? cam.matrixWorld.elements : null, cp = cam ? cam.position : null;
    for (const q of atmo.spots) {
      const dx = q.x - player.x, dz = q.z - player.z; if (dx > 150 || dx < -150 || dz > 150 || dz < -150) continue;
      const dy = q.y - y, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d >= 150) continue;
      const a = q.w * (1 - sstep(12, 150, d)) ** 2;
      let p = clamp(dx / 40, -1, 1);
      if (e) { const lx = q.x - cp.x, ly = q.y - cp.y, lz = q.z - cp.z; p = clamp((lx * e[0] + ly * e[1] + lz * e[2]) / Math.max(1, Math.hypot(lx, ly, lz)) * 1.6, -1, 1); }
      wl += a * (1 - p) / 2; wr += a * (1 + p) / 2;
    }
    const exc = Math.min(1.2, 0.35 + 0.65 * sstep(1.5, 14, spd) + 0.2 * sstep(0.2, 0.6, Math.abs(player.beta || 0)));
    set(atmo.cL.gain, AT_CROWD * Math.min(1.3, wl) * exc, 0.25); set(atmo.cR.gain, AT_CROWD * Math.min(1.3, wr) * exc, 0.25);
    // cowbells: up to three ringers near a crowd, each shaking a bell in bursts of 2-6 clanks, more often on the louder side
    const c = Math.min(1, (wl + wr) * 0.8), nR = atmo.gen ? 0 : c > 0.55 ? 3 : c > 0.25 ? 2 : c > 0.06 ? 1 : 0;
    for (let k = 0; k < nR; k++) {
      const r = atmo.ring[k];
      if (r.next < now - 0.3) { r.next = now + Math.random() * 0.4; r.left = 0; }   // (was idle, or the game was paused)
      while (r.next < now + 0.12) {
        if (r.left > 0) { clank(r, AT_BELL * c * (0.5 + 0.4 * exc) * (0.55 + 0.45 * Math.random())); r.left--; r.next += r.ivl * (0.85 + Math.random() * 0.3); }
        else { r.left = 2 + Math.floor(Math.random() * 5); r.ivl = 0.1 + Math.random() * 0.09; r.next += 0.4 + Math.random() * 1.6; r.side = Math.random() * (wl + wr) < wr ? 1 : -1; r.bell = Math.floor(Math.random() * atmo.bells.length); }
      }
    }
  }
  function clank(r, v) {   // one cowbell clank at r.next (the nodes go when it has played)
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = atmo.bells[r.bell]; s.playbackRate.value = 0.98 + Math.random() * 0.04; g.gain.value = v;
    s.connect(g); g.connect(r.side > 0 ? atmo.pR : atmo.pL); s.start(Math.max(r.next, ctx.currentTime));
  }
  function atmoOff(tc) { atmo.on = false; set(atmo.wo.gain, 0, tc); set(atmo.cL.gain, 0, tc); set(atmo.cR.gain, 0, tc); }

  function resume() {
    if (!ctx && !create()) return;
    if (ctx.state !== 'running') { try { ctx.resume(); } catch (_) { } }
  }
  function setEnabled(v) { enabled = !!v; if (master) master.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.05); }
  function setRunning(v) { // race sounds audible?
    running = !!v;
    if (bus) bus.gain.setTargetAtTime(running ? 1 : 0, ctx.currentTime, running ? 0.08 : 0.03);
  }
  function suspend() { if (ctx && ctx.state === 'running') { try { ctx.suspend(); } catch (_) { } } }

  const set = (p, v, tc) => p.setTargetAtTime(v, ctx.currentTime, tc || 0.03);

  // per-frame update
  function update(race, player, view, revInput) {
    if (!ctx || ctx.state !== 'running' || !player) return;
    const M = player.m;
    // player engine
    let rpm = player.rpm;
    if (player.locked) rpm = M.idle + (M.redline * 0.82 - M.idle) * (revInput || 0) + Math.random() * 60 * (revInput || 0);
    const r = clamp(rpm / M.redline, 0.08, 1.05);
    const base = 22 + r * 205; // firing freq Hz
    set(eng.o1.frequency, base, 0.015); set(eng.o2.frequency, base * 0.5, 0.015); set(eng.o3.frequency, base * 2.01, 0.015);
    const load = player.locked ? (revInput || 0) : player.inThr;
    set(eng.lp.frequency, 380 + r * 1700 + load * 1300, 0.03);
    const cut = player.shiftT > 0 ? 0.35 : 1;
    set(eng.out.gain, (0.1 + 0.1 * r + 0.1 * load) * cut * eng.level, 0.02);
    // two nearest AI engines
    if (race) {
      const others = [];
      for (const c of race.cars) { if (c === player) continue; const dx = c.x - player.x, dz = c.z - player.z; others.push([dx * dx + dz * dz, c, dx]); }
      others.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < ai.length; k++) {
        const v = ai[k], o = others[k];
        if (!o) { set(v.out.gain, 0); continue; }
        const c = o[1], d = Math.sqrt(o[0]);
        const rr = clamp(c.rpm / c.m.redline, 0.1, 1.05);
        const f = 22 + rr * 205;
        set(v.o1.frequency, f); set(v.o2.frequency, f * 0.5); set(v.o3.frequency, f * 2.02);
        set(v.lp.frequency, 400 + rr * 1500 + c.inThr * 800);
        const att = clamp(1 - d / 70, 0, 1);
        set(v.out.gain, att * att * (0.06 + 0.1 * rr) * v.level * 3, 0.05);
        if (v.pn) set(v.pn.pan, clamp(o[2] / 40, -0.9, 0.9), 0.05);
      }
    }
    // tyres
    const spd = player.speed;
    const onHard = player.ws[2] <= 1 && player.ws[3] <= 1;
    const slide = (player.arcade ? Core.sstep(0.18, 0.55, Math.abs(player.beta || 0)) : Math.max(0, player.latR - 2.2) / 5) + player.spin * 0.8 + (player.lock ? 0.6 : 0) + (player.inHand > 0.5 && spd > 5 ? 0.5 : 0);
    const sq = onHard && spd > 3 ? clamp(slide, 0, 1.2) : 0;
    set(squeal.out.gain, sq * 0.09, 0.04);
    set(squeal.bp.frequency, 980 + clamp(spd, 0, 50) * 6, 0.1);
    // offroad rumble
    let off = 0; for (let k = 0; k < 4; k++) if (player.ws[k] >= 2) off++;
    set(rumble.out.gain, off / 4 * clamp(spd / 18, 0, 1) * 0.5, 0.05);
    set(rumble.flt.frequency, (player.ws.indexOf(3) >= 0 || player.ws.indexOf(5) >= 0) ? 520 : 240, 0.1);
    set(curbV.out.gain, player.onCurb ? clamp(spd / 20, 0, 1) * 0.35 : 0, 0.02);
    set(curbV.flt.frequency, 40 + spd * 3.5, 0.05);
    set(wind.out.gain, clamp(spd / 70, 0, 1) ** 2 * 0.12, 0.1);
    // Pikes Peak: the engine echoes among the rocks above the treeline; the TV helicopter (World's dyn.pk) by its distance to the camera
    const pikes = !!(race && race.track && race.track.def && race.track.def.id === 'pikes');
    set(echo.send.gain, pikes ? Core.sstep(186, 198, player.roadY || 0) * 0.32 : 0, 0.6);
    const W = typeof Render !== 'undefined' ? Render.world : null, pk = pikes && W && W.dyn ? W.dyn.pk : null, cam = typeof Render !== 'undefined' ? Render.camera : null;
    let hv = 0, hp = 0;
    if (pk && pk.on && pk.heli) {
      const q = pk.heli.position, lx = cam ? cam.position.x : player.x, ly = cam ? cam.position.y : (player.roadY || 0), lz = cam ? cam.position.z : player.z;
      const d = Math.hypot(q.x - lx, q.y - ly, q.z - lz), a = clamp(1 - d / 280, 0, 1);
      hv = a * a * 0.5;
      if (cam) { const e = cam.matrixWorld.elements; hp = clamp(((q.x - lx) * e[0] + (q.y - ly) * e[1] + (q.z - lz) * e[2]) / Math.max(d, 1) * 1.2, -0.8, 0.8); }
    }
    set(heli.out.gain, hv, 0.35);
    if (heli.pn) set(heli.pn.pan, hp, 0.1);
    atmoUpdate(race, player, pikes, cam);   // (Pikes Peak: wind, crowds, cowbells)
  }

  function crash(imp) {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime;
    if (now - lastCrash < 0.08) return; lastCrash = now;
    const vol = clamp(imp / 12, 0.08, 1);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = 0.5 + Math.random() * 0.3;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 + vol * 1400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.75 * vol, now + 0.008); g.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + vol * 0.3);
    src.connect(lp); lp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + 0.6);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(140, now); o.frequency.exponentialRampToValueAtTime(45, now + 0.2);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.5 * vol, now); og.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    o.connect(og); og.connect(bus); o.start(now); o.stop(now + 0.25);
  }
  function beep(freq, dur, vol) {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = freq;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol || 0.18, now + 0.01); g.gain.setValueAtTime(vol || 0.18, now + dur - 0.03); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(f); f.connect(g); g.connect(master); o.start(now); o.stop(now + dur + 0.02);
  }
  function click() { beep(1400, 0.04, 0.06); }
  function shiftPop() {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 1.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + 0.12);
  }
  // a knocked-over trackside prop: hollow plastic 'tock' for a cone, rubbery thump for tyres, soft thud for straw, woody knock for a crate
  let lastKnock = 0;
  function knock(kind, v) {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime; if (now - lastKnock < 0.05) return; lastKnock = now;
    const vol = clamp(v / 18, 0.12, 0.8), cone = kind === 'cone' || kind === 'pylon' || kind === 'post', straw = kind === 'bale' || kind === 'bstack' || kind === 'rbale' || kind === 'rbstack', wood = kind === 'crate';
    const o = ctx.createOscillator(); o.type = cone ? 'square' : 'triangle';
    const f0 = cone ? 520 + Math.random() * 120 : straw ? 90 : wood ? 260 : 150;
    o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f0 * (cone ? 0.55 : 0.4), now + (cone ? 0.06 : 0.14));
    const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, now); og.gain.exponentialRampToValueAtTime((cone ? 0.16 : 0.42) * vol, now + 0.005); og.gain.exponentialRampToValueAtTime(0.001, now + (cone ? 0.08 : 0.18));
    o.connect(og); og.connect(bus); o.start(now); o.stop(now + 0.22);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = straw ? 0.6 : 1;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = cone ? 2400 : straw ? 1800 : wood ? 900 : 500; bp.Q.value = straw ? 0.6 : 1.2;
    const g = ctx.createGain(); g.gain.setValueAtTime((straw ? 0.5 : 0.28) * vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + (straw ? 0.35 : 0.1));
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + 0.4);
  }
  // impact wrench in the pits: a short, buzzing rattle
  function wrench() {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime, dur = 0.16 + Math.random() * 0.12;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(760 + Math.random() * 120, now); o.frequency.linearRampToValueAtTime(980, now + dur);
    const trem = ctx.createOscillator(), tg = ctx.createGain(); trem.frequency.value = 55; tg.gain.value = 0.5; trem.connect(tg);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.06, now + 0.01); g.gain.setValueAtTime(0.06, now + dur - 0.03); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    tg.connect(g.gain); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.8;
    o.connect(bp); bp.connect(g); g.connect(bus); o.start(now); o.stop(now + dur + 0.02); trem.start(now); trem.stop(now + dur + 0.02);
  }
  function silence() {
    if (!ctx) return;
    for (const v of [eng, ...ai]) set(v.out.gain, 0, 0.02);
    for (const v of [squeal, rumble, wind, curbV, heli]) set(v.out.gain, 0, 0.02);
    set(echo.send.gain, 0, 0.02);
    if (atmo) atmoOff(0.02);
  }

  const api = { resume, setEnabled, setRunning, suspend, update, crash, beep, click, shiftPop, knock, wrench, silence, get ready() { return !!ctx && ctx.state === 'running'; } };
  window.Sfx = api;
  return api;
})();

