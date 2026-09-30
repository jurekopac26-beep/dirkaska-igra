/* =========================================================================
   AUDIO — fully synthesized (Web Audio): engines, tyres, surfaces, hits
   ========================================================================= */
const Sfx = (function () {
  'use strict';
  const { clamp } = Core;
  let ctx = null, master = null, bus = null, enabled = true, volume = 0.8;
  let noiseBuf = null;
  let eng = null, ai = [], squeal = null, rumble = null, wind = null, curbV = null, rainV = null, hiss = null, heli = null, echo = null;
  let gravel = null, spray = null, crowd = null, lastT = 0, pudPrev = false;
  let stands = null, jet = null, tun = null;   // the grandstands' crowd (every circuit), the Red Bull Ring's jets before the start, a tunnel's ring
  let sirenV = null;   // the open road: the police siren (the nearest patrol car chasing)
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
    rainV = noiseVoice('bandpass', 3200, 0.35);   // rain: the steady patter, and the hiss of the tyres through the water
    hiss = noiseVoice('bandpass', 1400, 0.8);
    heli = heliVoice(); echo = echoFx();
    gravel = noiseVoice('bandpass', 2600, 0.7); spray = noiseVoice('highpass', 1500, 0.5); crowd = crowdVoice();
    stands = standsVoice(); jet = noiseVoice('lowpass', 500, 0.7); tun = tunnelFx(); sirenV = sirenVoice();
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
  // the crowd in the grandstands and on the grass (a world with World's crowdPts: the Red Bull Ring): the roar of many voices (noise in
  // two bands, swelling slowly), with drums and air horns from the orange fans now and then (standsStep)
  function standsVoice() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.9;
    const b1 = ctx.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = 650; b1.Q.value = 0.8;
    const b2 = ctx.createBiquadFilter(); b2.type = 'bandpass'; b2.frequency.value = 1900; b2.Q.value = 1.4;
    const g2 = ctx.createGain(); g2.gain.value = 0.45;
    const vca = ctx.createGain(); vca.gain.value = 0.72;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.23; const lg = ctx.createGain(); lg.gain.value = 0.26; lfo.connect(lg); lg.connect(vca.gain);
    const out = ctx.createGain(); out.gain.value = 0;
    let pn = null; if (ctx.createStereoPanner) { pn = ctx.createStereoPanner(); out.connect(pn); pn.connect(bus); } else out.connect(bus);
    src.connect(b1); src.connect(b2); b1.connect(vca); b2.connect(g2); g2.connect(vca); vca.connect(out);
    src.start(); lfo.start();
    return { out, pn, lev: 0, cheer: 0, pan: 0, tHorn: 0, tDrum: 0, pos: 0, state: '' };
  }
  function sirenVoice() {   // the police siren: a two-tone wail (a saw and a square, filtered), its tone switched by siren()
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; const o2 = ctx.createOscillator(); o2.type = 'square';
    const g2 = ctx.createGain(); g2.gain.value = 0.35; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 1.2;
    const out = ctx.createGain(); out.gain.value = 0; o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(out);
    let pn = null; if (ctx.createStereoPanner) { pn = ctx.createStereoPanner(); out.connect(pn); pn.connect(bus); } else out.connect(bus);
    o1.frequency.value = 435; o2.frequency.value = 870; o1.start(); o2.start();
    return { o1, o2, out, pn, hi: false };
  }
  // the police siren by the nearest chasing patrol car (lev 0..1, pan -1..1): the European two-tone, 0.55 s a tone
  function siren(lev, pan) {
    if (!ctx || ctx.state !== 'running' || !sirenV) return;
    const S = sirenV, hi = Math.floor(ctx.currentTime / 0.55) % 2 === 1, f = hi ? 580 : 435;
    if (hi !== S.hi) { S.hi = hi; S.o1.frequency.setTargetAtTime(f, ctx.currentTime, 0.012); S.o2.frequency.setTargetAtTime(f * 2, ctx.currentTime, 0.012); }
    set(S.out.gain, running ? 0.16 * clamp(lev, 0, 1) : 0, 0.08); if (S.pn) set(S.pn.pan, clamp(pan || 0, -1, 1), 0.1);
  }
  // a car of the traffic sounding its horn (two squares a third apart), by its distance and side
  function carHorn(vol, pan, big) {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime, dur = 0.35 + Math.random() * 0.45, f0 = big ? 220 : 390 + Math.random() * 60;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.09 * vol, now + 0.02); g.gain.setValueAtTime(0.09 * vol, now + dur); g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.06);
    for (const f of [f0, f0 * 1.25]) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(lp); o.start(now); o.stop(now + dur + 0.08); }
    lp.connect(g); if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = clamp(pan || 0, -1, 1); g.connect(pn); pn.connect(bus); } else g.connect(bus);
  }
  // someone on foot (or on a bicycle) knocked down: a dull, soft thump
  function thud(v) {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime, vol = clamp(v, 0.1, 1);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(95, now); o.frequency.exponentialRampToValueAtTime(42, now + 0.16);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5 * vol, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    o.connect(g); g.connect(bus); o.start(now); o.stop(now + 0.26);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.35 * vol, now); g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    src.connect(lp); lp.connect(g2); g2.connect(bus); src.start(now, Math.random()); src.stop(now + 0.14);
  }
  // a tyre over the spikes: a sharp pop, then the air hissing out
  function pop() {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.7, now + 0.004); g.gain.exponentialRampToValueAtTime(0.06, now + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    src.connect(hp); hp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + 0.95);
  }
  function horn(vol, pan) {   // an air horn: two detuned saws a third apart, a short blast
    const now = ctx.currentTime, dur = 0.3 + Math.random() * 0.55, f0 = [370, 415, 466, 494][Math.floor(Math.random() * 4)];
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.03); g.gain.setValueAtTime(vol, now + dur); g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.1);
    for (const f of [f0, f0 * 1.26, f0 * 1.005]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(now); o.stop(now + dur + 0.12); }
    lp.connect(g);
    if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = pan; g.connect(pn); pn.connect(bus); } else g.connect(bus);
  }
  function drum(vol, t) {   // a big drum: a thump falling in pitch, a slap on top
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.42);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(vol * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(bp); bp.connect(ng); ng.connect(bus); src.start(t, Math.random()); src.stop(t + 0.08);
  }
  // per frame: the crowd's level from the nearest stands (W.crowdPts: x, z, weight), louder for a while after the start, an overtake by the
  // player or the finish; horns and drum rolls more often the louder it is
  function standsStep(race, player, W, cam) {
    const C = stands, P = W && W.crowdPts, now = ctx.currentTime;
    if (!P || !race) { set(C.out.gain, 0, 0.3); C.lev = 0; return; }
    const lx = cam ? cam.position.x : player.x, lz = cam ? cam.position.z : player.z;
    let lev = 0, bx = 0, bz = 0;
    for (let k = 0; k < P.length; k += 3) { const dx = P[k] - lx, dz = P[k + 1] - lz, d = Math.sqrt(dx * dx + dz * dz), a = P[k + 2] * clamp(1 - d / 130, 0, 1) ** 1.6; if (a > lev) { lev = a; bx = dx; bz = dz; } }
    if (race.state !== C.state) { if (race.state === 'racing') C.cheer = 1; C.state = race.state; }   // the lights go out
    if (race.state === 'racing' && player.pos < C.pos && !player.finished) { C.cheer = 1; C.tHorn = Math.min(C.tHorn, now + 0.15); }   // the player passes a car
    if (player.finished && !C.fin) { C.fin = true; C.cheer = 1; } else if (!player.finished) C.fin = false;
    C.pos = player.pos || 0;
    const dt = clamp(now - (C.tPrev || now), 0, 0.1); C.tPrev = now;
    C.cheer = Math.max(0, C.cheer - dt / 4); C.lev += (lev - C.lev) * Math.min(1, dt * 5);
    if (cam) { const e = cam.matrixWorld.elements, dl = Math.hypot(bx, bz) || 1; C.pan = clamp((bx * e[0] + bz * e[2]) / dl, -0.7, 0.7); }
    set(C.out.gain, C.lev * (0.13 + 0.24 * C.cheer), 0.15); if (C.pn) set(C.pn.pan, C.pan, 0.3);
    const L = C.lev * (0.5 + 0.8 * C.cheer);
    if (L < 0.08) return;
    if (now >= C.tHorn) { horn(0.03 + 0.05 * L, clamp(C.pan + (Math.random() - 0.5) * 0.6, -0.9, 0.9)); C.tHorn = now + (0.6 + Math.random() * 3.5) / (0.4 + L); }
    if (now >= C.tDrum) { const n = 3 + Math.floor(Math.random() * 4), st = 0.24 + Math.random() * 0.08; for (let k = 0; k < n; k++) drum(0.1 + 0.16 * L, now + 0.05 + k * st * (k === n - 1 ? 1.5 : 1)); C.tDrum = now + n * st + (3 + Math.random() * 6) / (0.4 + L); }
  }
  // the fans along a rally stage: a roar of many voices (noise in two broad bands, swelling and ebbing slowly)
  function crowdVoice() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.9;
    const b1 = ctx.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = 900; b1.Q.value = 0.7;
    const b2 = ctx.createBiquadFilter(); b2.type = 'bandpass'; b2.frequency.value = 2300; b2.Q.value = 1.2; const g2 = ctx.createGain(); g2.gain.value = 0.5;
    const vca = ctx.createGain(); vca.gain.value = 0.7;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.35; const lg = ctx.createGain(); lg.gain.value = 0.3; lfo.connect(lg); lg.connect(vca.gain);
    const out = ctx.createGain(); out.gain.value = 0;
    src.connect(b1); src.connect(b2); b2.connect(g2); b1.connect(vca); g2.connect(vca); vca.connect(out); out.connect(bus);
    src.start(); lfo.start();
    return { out };
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
  // the crowd's loop and the cowbell clanks, made in small slices (~16k samples, one clapper, one whoop, one bell partial) while the car waits on the
  // start line, as many a frame as fit in ~2 ms (a slow phone: one); then the crowd starts
  function* atmoGen(A) {
    const sr = AT_SR, n = Math.floor(4.3 * sr), R = Core.rng(7141), rn = () => R() * 2 - 1, { sstep, lerp } = Core;
    // 4.3 s of a crowd that loops without a seam: a babbling roar in vowel formants, applause and many overlapping whoops, swelling a little
    const roar = new Float32Array(n), clap = new Float32Array(n), voc = new Float32Array(n), w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = rn();
    for (const [f, q, a] of [[480, 1.2, 1], [1120, 1.5, 0.75], [2400, 2, 0.2]]) {   // (each filter warmed up on the loop's end, so it joins without a click; each band flickers at syllable pace)
      const [b0, a1, a2] = bpf(f, q, sr), K = 22, cp = []; for (let k = 0; k < K; k++) cp.push(0.3 + 0.7 * R());
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let j = -1024; j < n; j++) { const x = w[j < 0 ? n + j : j], y = b0 * (x - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y;
        if (j >= 0) { const u = j / n * K, k = Math.floor(u), t = u - k; roar[j] += y * a * (cp[k] + (cp[(k + 1) % K] - cp[k]) * t * t * (3 - 2 * t)); }
        if ((j & 16383) === 16383) yield; }
      yield;
    }
    for (let c = 0; c < 28; c++) {   // clappers, 2.8-4.6 claps a second: each clap a short burst of noise with the clapper's own brightness
      const rate = 2.8 + R() * 1.8, [b0, a1, a2] = bpf(900 + R() * 1600, 0.8 + R() * 0.7, sr), k = Math.exp(-1 / ((0.005 + R() * 0.007) * sr)), L = Math.floor(0.045 * sr), amp = 0.4 + R() * 0.6;
      for (let t = R() / rate; t < 4.3; t += (0.92 + R() * 0.16) / rate) {
        let i = Math.floor(t * sr), e = amp * (0.6 + R() * 0.4), x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (let j = 0; j < L; j++, i++) { const x = rn() * e * (j < 14 ? j / 14 : 1), y = b0 * (x - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; if (j >= 14) e *= k; clap[i % n] += y; }
      }
      yield;
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
      yield;
    }
    rmsTo(roar, 0.05); rmsTo(clap, 0.085); rmsTo(voc, 0.06);
    const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), p0 = R() * 6.28, p1 = R() * 6.28; let pk = 0;
    for (let b = 0; b < n; b += 64) { const u = b / n * 6.2832, kc = 0.75 + 0.25 * Math.sin(3 * u + p1), sw = 0.82 + 0.12 * Math.sin(2 * u + p0) + 0.06 * Math.sin(7 * u + p1);
      for (let i = b; i < b + 64 && i < n; i++) { d[i] = (roar[i] + clap[i] * kc + voc[i]) * sw; pk = Math.max(pk, Math.abs(d[i])); }
      if ((b & 16383) === 16320) yield; }
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
          yield;
        }
      for (let i = 0, g = 0.35; i < 45; i++, g *= 0.9) e[i] += (Rb() * 2 - 1) * g;
      let pb = 0; for (let i = 0; i < m; i++) pb = Math.max(pb, Math.abs(e[i]));
      for (let i = 0; i < m; i++) e[i] *= 0.8 / pb * Math.min(1, (m - i) / (0.3 * m));   // (faded out at the end)
      A.bells.push(bb); yield;
    }
    for (const [g, rate, off] of [[A.cL, 0.97, 0], [A.cR, 1.03, 2.1]]) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.connect(g); s.start(0, off); }   // (one loop on each side)
    pk7Start(A, buf);   // (round 7: the cheer's layer)
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
    atmo.gen = atmoGen(atmo); pkxBuild(atmo); pk7Build(atmo);   // (round 5: the verge's crunch, the rock echo, the summit wind)
  }
  function atmoSpots(T) {   // where the spectators stand, on both sides of the road: every hairpin, the checkpoints, the start and the finish areas
    const G = pk7Spots(T); if (G) { atmo.T = T; atmo.spots = G; return; }   // (round 7: World's own crowd groups)
    const S = [], put = (s, w) => { const i = T.idx(s); for (const sd of [-1, 1]) { const o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + 4); S.push({ x: T.px[i] + T.nx[i] * o, y: T.hy ? T.hy[i] : 0, z: T.pz[i] + T.nz[i] * o, w }); } };
    for (const c of T.corners) if (c.sev >= 3) put((c.i0 + c.i1) / 2 * T.ds, 1);
    for (const s of T.cpS) put(s, 0.85);
    put(T.startS + 20, 1.1); put(T.startS + 85, 0.9); put(T.finishS - 60, 1); put(T.finishS, 1.1);
    atmo.T = T; atmo.spots = S;
  }
  function atmoUpdate(race, player, pikes, cam) {
    if (!pikes || !enabled) { if (atmo && atmo.on) atmoOff(0.3); return; }
    if (!atmo) atmoBuild();
    if (atmo.gen) { const t0 = performance.now(); do { if (atmo.gen.next().done) { atmo.gen = null; break; } } while (performance.now() - t0 < 2); }   // (the next slices of its buffers: ~2 ms a frame)
    else if (atmo.x.gen) { const t0 = performance.now(); do { if (atmo.x.gen.next().done) { atmo.x.gen = null; break; } } while (performance.now() - t0 < 2); }   // (then the crunch's, the same way)
    if (atmo.T !== race.track || atmo.W !== pk7World()) atmoSpots(race.track);
    const { sstep, lerp } = Core, now = ctx.currentTime, dt = clamp(now - atmo.t, 0, 0.25), y = player.roadY || 0, spd = player.speed || 0;
    atmo.t = now; atmo.on = true;
    // wind: the gusts ease towards a new goal every 1-4 s (faster up than down); louder with the altitude, almost nothing below the treeline (~186 m)
    if (now >= atmo.gNext) { const r = Math.random(); atmo.gGoal = 0.15 + 0.85 * r * r; atmo.gNext = now + 1 + Math.random() * 3; }
    atmo.g += (atmo.gGoal - atmo.g) * (1 - Math.exp(-dt / (atmo.gGoal > atmo.g ? 0.7 : 1.6)));
    const g = atmo.g, alt = sstep(150, 440, y), open = lerp(0.25, 1, sstep(172, 215, y));
    set(atmo.wo.gain, AT_WIND * (0.1 + 0.9 * alt * open) * (0.3 + 0.7 * g) * (1 + 0.5 * sstep(8, 50, spd)) * (1 - 0.3 * sstep(360, 405, y)), 0.12);   // (at the summit the squalls take over: pkxUpdate)
    set(atmo.lp.frequency, 240 + 460 * g + 220 * alt, 0.15); set(atmo.bp.frequency, 620 + 700 * g + 60 * Math.sin(now * 1.3), 0.15); set(atmo.wh.gain, 0.6 * alt * g * g, 0.15);
    if (atmo.wp.pan) set(atmo.wp.pan, 0.3 * Math.sin(now * 0.11) + 0.15 * Math.sin(now * 0.37 + 1), 0.3);
    // crowd: each group by its distance to the car, split between the sides by where it is on the screen; livelier with the car's speed
    // (a murmur while it stands on the start line) and when it slides
    let wl = 0, wr = 0;
    const e = cam ? cam.matrixWorld.elements : null, cp = cam ? cam.position : null;
    for (const q of atmo.spots) {
      const dx = q.x - player.x, dz = q.z - player.z; if (dx > 150 || dx < -150 || dz > 150 || dz < -150) continue;
      const dy = q.y - y, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d >= 150) continue;
      const a = q.w * (1 - sstep(12, q.r || 150, d)) ** 2;
      let p = clamp(dx / 40, -1, 1);
      if (e) { const lx = q.x - cp.x, ly = q.y - cp.y, lz = q.z - cp.z; p = clamp((lx * e[0] + ly * e[1] + lz * e[2]) / Math.max(1, Math.hypot(lx, ly, lz)) * 1.6, -1, 1); }
      wl += a * (1 - p) / 2; wr += a * (1 + p) / 2;
    }
    const exc = Math.min(1.2, 0.35 + 0.65 * sstep(1.5, 14, spd) + 0.2 * sstep(0.2, 0.6, Math.abs(player.beta || 0)));
    pk7Update(player, y, spd, e, cp, dt, now); const P7 = atmo.p7, swl = P7.sl, swr = P7.sr;   // (round 7: the cheer as the car goes by)
    set(atmo.cL.gain, AT_CROWD * Math.min(1.3, wl) * exc, 0.25); set(atmo.cR.gain, AT_CROWD * Math.min(1.3, wr) * exc, 0.25);
    // cowbells: up to three ringers near a crowd, each shaking a bell in bursts of 2-6 clanks, more often on the louder side
    const c = Math.min(1, (wl + wr) * 0.8 + (swl + swr) * 0.6), nR = atmo.gen ? 0 : c > 0.55 ? 3 : c > 0.25 ? 2 : c > 0.06 ? 1 : 0;
    for (let k = 0; k < nR; k++) {
      const r = atmo.ring[k];
      if (r.next < now - 0.3) { r.next = now + Math.random() * 0.4; r.left = 0; }   // (was idle, or the game was paused)
      while (r.next < now + 0.12) {
        if (r.left > 0) { clank(r, AT_BELL * c * (0.5 + 0.4 * exc) * (0.55 + 0.45 * Math.random())); r.left--; r.next += r.ivl * (0.85 + Math.random() * 0.3); }
        else { r.left = 2 + Math.floor(Math.random() * 5); r.ivl = 0.1 + Math.random() * 0.09; r.next += 0.4 + Math.random() * 1.6; r.side = Math.random() * (wl + wr + swl + swr) < wr + swr ? 1 : -1; r.bell = Math.floor(Math.random() * atmo.bells.length); }
      }
    }
    pkxUpdate(race, player, cam, dt, now);   // (round 5)
  }
  function clank(r, v) {   // one cowbell clank at r.next (the nodes go when it has played)
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = atmo.bells[r.bell]; s.playbackRate.value = 0.98 + Math.random() * 0.04; g.gain.value = v;
    s.connect(g); g.connect(r.side > 0 ? atmo.pR : atmo.pL); s.start(Math.max(r.next, ctx.currentTime));
  }
  function atmoOff(tc) { atmo.on = false; set(atmo.wo.gain, 0, tc); set(atmo.cL.gain, 0, tc); set(atmo.cR.gain, 0, tc); pkxOff(tc); pk7Off(tc); }
  /* ---- Pikes Peak, round 5 (extends the atmosphere block above): the gravel verge crunching under the wheels, the engine slapping back off the
     rocks (Devil's Playground, the Bottomless Pit, Double Cut, Boulder Park) and a harder, gustier wind at the summit (above ~380 m) ---- */
  const PX_CRUNCH = 0.34, PX_WIND = 0.42;
  // where the engine echoes: [from, to (m after the start line), the slap's delay (s), the slap's level, the far echo's level] (the Bottomless Pit: a
  // long echo off the far side of the drop, no near wall)
  const PX_ROCK = [[3990, 4250, 0.085, 0.42, 0], [4400, 4545, 0.09, 0, 0.3], [4585, 4700, 0.052, 0.55, 0], [5240, 5600, 0.07, 0.45, 0]];
  function pkxBuild(A) {
    const X = A.x = { gen: null, cr: [], cf: null, sG: null, sD: null, fG: null, zone: -1, G: 0.3, gGoal: 0.3, gNext: 0, fl: 0, flNext: 0, t: 0 };
    // crunch: one grain loop per side of the car (filled by pkxGen), panned to that side on the screen, darker at a crawl
    const cf = ctx.createBiquadFilter(); cf.type = 'lowpass'; cf.frequency.value = 2000; cf.Q.value = 0.5; cf.connect(bus); X.cf = cf;
    for (const p of [-0.5, 0.5]) { const g = ctx.createGain(), pn = mkPan(p); g.gain.value = 0; g.connect(pn); pn.connect(cf); X.cr.push({ g, pn, src: null }); }
    // the rock echo: the engine through a band (the rock sends back no deep rumble, no fizz), a short slap with a little feedback and a far echo
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 170; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    eng.out.connect(hp); hp.connect(lp);
    const sD = ctx.createDelay(0.5), sF = ctx.createGain(), sG = ctx.createGain(); sD.delayTime.value = 0.07; sF.gain.value = 0.2; sG.gain.value = 0;
    lp.connect(sD); sD.connect(sF); sF.connect(sD); sD.connect(sG); sG.connect(bus);
    const fD = ctx.createDelay(1), fL = ctx.createBiquadFilter(), fF = ctx.createGain(), fG = ctx.createGain(); fD.delayTime.value = 0.38; fL.type = 'lowpass'; fL.frequency.value = 900; fF.gain.value = 0.34; fG.gain.value = 0;
    lp.connect(fD); fD.connect(fL); fL.connect(fF); fF.connect(fD); fL.connect(fG); fG.connect(bus);
    Object.assign(X, { sG, sD, fG });
    // the summit wind: a low buffeting of the car (flutter), two howling tones that rise with each gust and the hiss of a squall; its own pan
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.83;
    const out = ctx.createGain(), pn = mkPan(0); out.gain.value = 0; out.connect(pn); pn.connect(bus);
    const bl = ctx.createBiquadFilter(); bl.type = 'lowpass'; bl.frequency.value = 120; bl.Q.value = 0.9; const bg = ctx.createGain(); bg.gain.value = 0;
    const h1 = ctx.createBiquadFilter(); h1.type = 'bandpass'; h1.frequency.value = 480; h1.Q.value = 16; const h2 = ctx.createBiquadFilter(); h2.type = 'bandpass'; h2.frequency.value = 740; h2.Q.value = 22; const hg = ctx.createGain(); hg.gain.value = 0;
    const sh = ctx.createBiquadFilter(); sh.type = 'bandpass'; sh.frequency.value = 3000; sh.Q.value = 0.6; const sg = ctx.createGain(); sg.gain.value = 0;
    src.connect(bl); bl.connect(bg); bg.connect(out); src.connect(h1); src.connect(h2); h1.connect(hg); h2.connect(hg); hg.connect(out); src.connect(sh); sh.connect(sg); sg.connect(out); src.start();
    Object.assign(X, { wo: out, wp: pn, bg, h1, h2, hg, sg, sh });
    X.gen = pkxGen(X);
  }
  // the crunch's loop (1.6 s, seamless): stones crushed under the tread (low knocks, 7-22 ms) and grit (short high ticks), in clumps
  function* pkxGen(X) {
    const sr = AT_SR, n = Math.floor(1.6 * sr), R = Core.rng(5303), d = new Float32Array(n), K = 16, cl = []; for (let k = 0; k < K; k++) cl.push(0.35 + 0.65 * R());
    const clump = (i) => { const u = i / n * K, k = Math.floor(u), t = u - k; return cl[k] + (cl[(k + 1) % K] - cl[k]) * t; };
    for (const [cnt, f0, f1, q0, t0, t1, a0] of [[720, 180, 950, 3, 0.007, 0.022, 1], [1500, 1800, 4600, 5, 0.0015, 0.005, 0.45]]) {
      for (let c = 0; c < cnt; c++) {
        let i = Math.floor(R() * n); if (R() > clump(i)) i = Math.floor(R() * n);   // (more grains where the clump is thick)
        const [b0, a1, a2] = bpf(f0 + (f1 - f0) * R() * R(), q0 * (0.6 + R() * 0.8), sr), k = Math.exp(-1 / ((t0 + (t1 - t0) * R()) * sr)), L = Math.floor(0.06 * sr);
        let e = a0 * (0.3 + 0.7 * R()) * clump(i), x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (let j = 0; j < L && e > 0.002; j++, e *= k) { const x = (R() * 2 - 1) * e, y = b0 * (x - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; d[(i + j) % n] += y; }
        if (c % 60 === 59) yield;
      }
      yield;
    }
    rmsTo(d, 0.2); yield; let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])); if (pk > 0.95) for (let i = 0; i < n; i++) d[i] *= 0.95 / pk;
    const buf = ctx.createBuffer(1, n, sr); buf.getChannelData(0).set(d); yield;
    X.cr.forEach((c, k) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(c.g); s.start(0, k * 0.71); c.src = s; });
  }
  function pkxUpdate(race, player, cam, dt, now) {
    const X = atmo.x, { sstep } = Core, T = race.track, spd = player.speed || 0, y = player.roadY || 0, wet = race.rain || 0;
    // crunch: the wheels on the verge (surface 3) on each side of the car, louder and denser with the speed (nothing in the air or at a standstill)
    let dot = 1; if (cam) { const e = cam.matrixWorld.elements, h = player.h || 0; dot = clamp(-Math.sin(h) * e[0] + Math.cos(h) * e[2], -1, 1); }   // (the car's +side on the screen)
    const v = player.air ? 0 : PX_CRUNCH * (0.12 + 0.88 * sstep(2, 38, spd)) * Math.min(1, spd / 2.5) * (1 - 0.4 * wet), W = player.ws || [];
    for (let k = 0; k < 2; k++) { const c = X.cr[k], nw = (W[k] === 3 ? 1 : 0) + (W[k + 2] === 3 ? 1 : 0);   // (k 0: the -side wheels 0 and 2, k 1: the +side ones)
      set(c.g.gain, c.src ? v * nw / 2 : 0, 0.04); if (c.src) set(c.src.playbackRate, 0.7 + 0.55 * sstep(3, 40, spd), 0.1); if (c.pn.pan) set(c.pn.pan, (k ? 0.55 : -0.55) * dot, 0.1); }
    set(X.cf.frequency, 900 + 2600 * sstep(3, 35, spd), 0.1);
    // the rock echo: fades in and out along the road; the slap's delay changes only while it is silent (no pitch glide)
    const d = (player.q ? player.q.s : 0) - T.startS; let zs = 0, zf = 0, zi = -1;
    for (let k = 0; k < PX_ROCK.length; k++) { const z = PX_ROCK[k], w = sstep(z[0] - 25, z[0], d) * (1 - sstep(z[1], z[1] + 25, d)); if (w > 0) { zi = k; zs = z[3] * w; zf = z[4] * w; } }
    if (zi >= 0 && zi !== X.zone && PX_ROCK[zi][3] > 0 && X.sG.gain.value < 0.02) { X.sD.delayTime.setValueAtTime(PX_ROCK[zi][2], now); X.zone = zi; }
    set(X.sG.gain, zi === X.zone ? zs : 0, 0.25); set(X.fG.gain, zf, 0.4);
    // the summit wind: squalls every 0.6-2.6 s (up fast, down slower, now and then a big one), the car buffeted 5-11 times a second in them
    if (now >= X.gNext) { const r = Math.random(); X.gGoal = r < 0.15 ? 1 : 0.2 + 0.65 * r; X.gNext = now + 0.6 + Math.random() * 2; }
    X.G += (X.gGoal - X.G) * (1 - Math.exp(-dt / (X.gGoal > X.G ? 0.28 : 0.9)));
    const su = sstep(360, 405, y), G = X.G;
    set(X.wo.gain, PX_WIND * su * (0.55 + 0.45 * sstep(5, 45, spd)), 0.2);
    if (now >= X.flNext) { X.fl = 0.45 + 0.55 * Math.random(); X.flNext = now + 0.09 + Math.random() * 0.1; }
    set(X.bg.gain, 1.6 * G * X.fl, 0.035); set(X.hg.gain, 3.2 * G * G, 0.12); set(X.sg.gain, 0.3 * sstep(0.45, 1, G), 0.1);
    const hf = 400 + 520 * G + 30 * Math.sin(now * 2.3); set(X.h1.frequency, hf, 0.2); set(X.h2.frequency, hf * 1.52 + 25 * Math.sin(now * 1.7), 0.2); set(X.sh.frequency, 2400 + 1400 * G, 0.2);
    if (X.wp.pan) set(X.wp.pan, 0.45 * Math.sin(now * 0.29 + 2) + 0.2 * (G - 0.5), 0.3);
  }
  function pkxOff(tc) { const X = atmo.x; if (!X) return; for (const c of X.cr) set(c.g.gain, 0, tc); set(X.sG.gain, 0, tc); set(X.fG.gain, 0, tc); set(X.wo.gain, 0, tc); }
  /* ---- Pikes Peak, round 7 (extends the atmosphere block above): the cheer. The spectators are World's own crowd groups (dyn.pkCheer: one per
     40 m cell, weighted by how many stand there, heavier at the hairpins, the W's and the summit; the old list of spots without it). Each group
     erupts as the car comes within ~45 m (not for a crawl) and calms down over a few seconds once it has gone: a second, brighter copy of the
     crowd's loop swells on that group's side of the screen, with more cowbells (atmoUpdate), two-finger whistles and the air horns of the
     grandstands (horn, as standsStep's). Nothing is generated: the loop is atmoGen's (time-budgeted), the rest are a few short-lived nodes ---- */
  const P7_CHEER = 0.28, P7_HORN = 0.055, P7_WHISTLE = 0.05;
  function pk7World() { return typeof Render !== 'undefined' ? Render.world : null; }
  function pk7Build(A) {   // the swell's layer: the crowd's loop a little faster (higher, more excited voices), a presence boost, one per side (atmo's pans)
    const P = A.p7 = { L: [], sl: 0, sr: 0, tH: 0, tW: 0, nH: 0, nW: 0 };
    for (const pn of [A.pL, A.pR]) { const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'peaking'; f.frequency.value = 1600; f.Q.value = 0.7; f.gain.value = 5; g.gain.value = 0; f.connect(g); g.connect(pn); P.L.push({ f, g }); }
  }
  function pk7Start(A, buf) { A.p7.L.forEach((l, k) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = k ? 1.12 : 1.08; s.connect(l.f); s.start(0, 1.3 + k * 1.7); }); }
  function pk7Spots(T) {   // World's crowd groups -> atmo's spots (x, y, z, w, r: the range of their murmur; sw: their cheer now); null without them
    const W = pk7World(), G = W && W.dyn && W.dyn.pkCheer; atmo.W = W; if (!G) return null;
    const S = [], A = G.spots; for (let k = 0; k < A.length; k += 4) S.push({ x: A[k], y: A[k + 1], z: A[k + 2], w: A[k + 3] * 0.45, cw: A[k + 3], r: 130, sw: 0 });
    return S;
  }
  function pk7Update(player, y, spd, e, cp, dt, now) {   // -> the cheer on each side (atmo.p7.sl, sr)
    const P = atmo.p7, { sstep } = Core, go = sstep(2, 9, spd); let sl = 0, sr = 0;
    for (const q of atmo.spots) {
      const dx = q.x - player.x, dz = q.z - player.z, cw = q.cw || q.w;
      if (dx > 160 || dx < -160 || dz > 160 || dz < -160) { q.sw = 0; continue; }
      const dy = q.y - y, d = Math.sqrt(dx * dx + dy * dy + dz * dz), goal = cw * (1 - sstep(10, 48, d)) * go, sw = q.sw || 0;
      q.sw = goal > sw ? sw + (goal - sw) * Math.min(1, dt / 0.35) : Math.max(goal, sw - dt * 0.35 * cw);   // (up in ~0.3 s, down over ~3 s once the car has gone)
      if (q.sw < 0.004 || d >= 160) continue;
      const a = q.sw * (1 - sstep(20, 160, d));
      let p = clamp(dx / 40, -1, 1);
      if (e) { const lx = q.x - cp.x, ly = q.y - cp.y, lz = q.z - cp.z; p = clamp((lx * e[0] + ly * e[1] + lz * e[2]) / Math.max(1, Math.hypot(lx, ly, lz)) * 1.6, -1, 1); }
      sl += a * (1 - p) / 2; sr += a * (1 + p) / 2;
    }
    P.sl = sl; P.sr = sr;
    const on = !atmo.gen; set(P.L[0].g.gain, on ? P7_CHEER * Math.min(1.4, sl) : 0, 0.12); set(P.L[1].g.gain, on ? P7_CHEER * Math.min(1.4, sr) : 0, 0.12);
    // whistles and air horns from the louder side, the more often the louder it is
    const L = Math.min(1.5, sl + sr); if (L < 0.18 || !on) return;
    const pan = () => (Math.random() * (sl + sr) < sr ? 1 : -1) * (0.3 + 0.5 * Math.random());
    if (P.tH < now - 1) P.tH = now + Math.random() * 0.6;
    if (P.tW < now - 1) P.tW = now + Math.random() * 0.4;
    if (now >= P.tH) { horn(P7_HORN * Math.min(1, 0.4 + 0.6 * L), pan()); P.nH++; P.tH = now + (1.2 + Math.random() * 4) / (0.3 + L); }
    if (now >= P.tW) { pk7Whistle(P7_WHISTLE * Math.min(1, 0.45 + 0.55 * L) * (0.6 + 0.4 * Math.random()), pan()); P.nW++; P.tW = now + (0.6 + Math.random() * 2.6) / (0.3 + L); }
  }
  function pk7Whistle(v, pan) {   // a two-finger whistle: a wolf whistle, a long wobbling blast or quick chirps (a sine and a breath of noise at its pitch)
    const now = ctx.currentTime, k = Math.random(), f0 = 2100 + Math.random() * 900, o = ctx.createOscillator(), F = o.frequency, g = ctx.createGain(), G = g.gain, lo = 0.0001;
    let end;
    G.setValueAtTime(lo, now);
    if (k < 0.4) {   // wolf whistle: up; then up and a long swoop down
      F.setValueAtTime(f0 * 0.62, now); F.exponentialRampToValueAtTime(f0 * 1.12, now + 0.2); F.setValueAtTime(f0 * 0.66, now + 0.3); F.exponentialRampToValueAtTime(f0 * 1.1, now + 0.46); F.exponentialRampToValueAtTime(f0 * 0.55, now + 0.9);
      G.exponentialRampToValueAtTime(v, now + 0.03); G.setValueAtTime(v, now + 0.19); G.exponentialRampToValueAtTime(lo, now + 0.25); G.exponentialRampToValueAtTime(v, now + 0.33); G.setValueAtTime(v, now + 0.74); G.exponentialRampToValueAtTime(lo, now + 0.92); end = now + 0.95;
    } else if (k < 0.72) {   // a long blast, wobbling
      const dur = 0.45 + Math.random() * 0.5, lf = ctx.createOscillator(), lg = ctx.createGain(); lf.frequency.value = 5 + Math.random() * 3; lg.gain.value = f0 * 0.012; lf.connect(lg); lg.connect(F); lf.start(now); lf.stop(now + dur + 0.1);
      F.setValueAtTime(f0 * 0.9, now); F.linearRampToValueAtTime(f0 * 1.05, now + 0.07); F.linearRampToValueAtTime(f0, now + dur);
      G.exponentialRampToValueAtTime(v, now + 0.04); G.setValueAtTime(v, now + dur - 0.06); G.exponentialRampToValueAtTime(lo, now + dur); end = now + dur + 0.02;
    } else {   // chirps
      const n = 2 + Math.floor(Math.random() * 2); let t = now;
      for (let c = 0; c < n; c++, t += 0.17) { F.setValueAtTime(f0 * 0.8, t); F.exponentialRampToValueAtTime(f0 * 1.15, t + 0.1); G.setValueAtTime(lo, t); G.exponentialRampToValueAtTime(v, t + 0.02); G.setValueAtTime(v, t + 0.09); G.exponentialRampToValueAtTime(lo, t + 0.12); }
      end = t;
    }
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain(); s.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = f0; bp.Q.value = 4; ng.gain.value = 0.35;
    s.connect(bp); bp.connect(ng); ng.connect(g); o.connect(g); const pn = mkPan(clamp(pan, -1, 1)); g.connect(pn); pn.connect(bus);
    o.start(now); o.stop(end + 0.02); s.start(now, Math.random()); s.stop(end + 0.02);
  }
  function pk7Off(tc) { const P = atmo.p7; if (!P) return; for (const l of P.L) set(l.g.gain, 0, tc); P.sl = P.sr = 0; }
  // a tunnel (World's dyn.tunnel: Monaco's under the hotel, the short one under Suzuka's bridge): the engine rings off the walls and the roof,
  // three short feedback delays (a small, hard room) behind a low-pass, fed by the player's engine and the nearest rivals'
  function tunnelFx() {
    const send = ctx.createGain(); send.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; send.connect(lp);
    const out = ctx.createGain(); out.gain.value = 0.7; out.connect(bus);
    for (const [t, f] of [[0.029, 0.52], [0.043, 0.48], [0.061, 0.44]]) { const d = ctx.createDelay(0.2), fb = ctx.createGain(); d.delayTime.value = t; fb.gain.value = f; lp.connect(d); d.connect(fb); fb.connect(d); d.connect(out); }
    eng.out.connect(send); for (const v of ai) v.out.connect(send);
    return { send };
  }

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
    const tNow = ctx.currentTime, dt = clamp(tNow - lastT, 0, 0.1); lastT = tNow;
    const M = player.m;
    // player engine
    let rpm = player.rpm;
    if (player.locked) rpm = M.idle + (M.redline * 0.82 - M.idle) * (revInput || 0) + Math.random() * 60 * (revInput || 0);
    const r = clamp(rpm / M.redline, 0.08, 1.05);
    const base = (22 + r * 205) * (M.engHz || 1); // firing freq Hz (the formula screams higher)
    set(eng.o1.frequency, base, 0.015); set(eng.o2.frequency, base * 0.5, 0.015); set(eng.o3.frequency, base * 2.01, 0.015);
    const load = player.locked ? (revInput || 0) : player.inThr;
    set(eng.lp.frequency, (380 + r * 1700 + load * 1300) * (M.engHz ? 1.35 : 1), 0.03);
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
        const f = (22 + rr * 205) * (c.m.engHz || 1);
        set(v.o1.frequency, f); set(v.o2.frequency, f * 0.5); set(v.o3.frequency, f * 2.02);
        set(v.lp.frequency, 400 + rr * 1500 + c.inThr * 800);
        const att = clamp(1 - d / 70, 0, 1);
        set(v.out.gain, att * att * (0.06 + 0.1 * rr) * v.level * 3, 0.05);
        if (v.pn) set(v.pn.pan, clamp(o[2] / 40, -0.9, 0.9), 0.05);
      }
    }
    // tyres
    const spd = player.speed;
    const hardW = (w) => w <= 1 || w >= 7, onHard = hardW(player.ws[2]) && hardW(player.ws[3]);   // (asphalt, a kerb, the cobbles)
    const slide = Math.max(0, player.latR - 2.2) / 5 + player.spin * 0.8 + (player.lock ? 0.6 : 0) + (player.inHand > 0.5 && spd > 5 ? 0.5 : 0);
    const sq = onHard && spd > 3 ? clamp(slide, 0, 1.2) : 0, wet = race ? race.rain || 0 : 0;
    set(squeal.out.gain, sq * 0.09 * (1 - 0.7 * wet), 0.04);   // (a wet road hardly squeals)
    set(rainV.out.gain, wet * 0.05, 0.4);
    set(hiss.out.gain, onHard ? wet * clamp(spd / 45, 0, 1) * 0.1 : 0, 0.08);
    set(squeal.bp.frequency, 980 + clamp(spd, 0, 50) * 6, 0.1);
    // offroad rumble
    let off = 0, cob = 0; for (let k = 0; k < 4; k++) { const w = player.ws[k]; if (w >= 7) cob++; else if (w >= 2) off++; }
    set(rumble.out.gain, off / 4 * clamp(spd / 18, 0, 1) * 0.5, 0.05);
    set(rumble.flt.frequency, (player.ws.indexOf(3) >= 0 || player.ws.some(w => w === 5 || w === 6)) ? 520 : 240, 0.1);
    // a kerb: a hard buzz; the cobbles (the setts in the hairpins of Vršič): a softer, quicker drumming under the tyres
    set(curbV.out.gain, player.onCurb ? clamp(spd / 20, 0, 1) * 0.35 : player.air ? 0 : cob / 4 * clamp(spd / 22, 0, 1) * 0.2, 0.03);
    set(curbV.flt.frequency, player.onCurb || !cob ? 40 + spd * 3.5 : 60 + spd * 6, 0.05);
    set(wind.out.gain, clamp(spd / 70, 0, 1) ** 2 * 0.12, 0.1);
    // loose gravel (gravel traps, makadam): the crunch, louder in a slide, and stones pinging off the underbody; in the rain the crunch muffled by
    // a hiss of water off the tyres (the hard roads' is above), and a splash into each puddle
    let loose = 0, pud = false;
    for (let k = 0; k < 4; k++) { const w = player.ws[k]; if (w === 3 || w === 5 || w === 6) loose++; if (w === 6) pud = true; }
    const air = !!player.air, spf = clamp(spd / 25, 0, 1.3);
    set(gravel.out.gain, air ? 0 : loose / 4 * spf * (0.05 + 0.09 * clamp(slide, 0, 1)) * (1 - 0.6 * wet), 0.05);
    set(gravel.flt.frequency, 1900 + clamp(spd, 0, 50) * 30, 0.1);
    if (!air && loose >= 2 && spd > 8 && Math.random() < dt * spd / 40 * 7 * (1 - 0.5 * wet)) ping(0.4 + Math.random() * 0.6);
    set(spray.out.gain, air ? 0 : loose / 4 * spf * 0.14 * wet, 0.05);
    if (pud && !pudPrev && !air && spd > 5) splash(clamp(spd / 30, 0.3, 1));
    pudPrev = pud;
    // the fans (a rally stage: World's crowdCells, the fans per 24 m square round the car): a roar that swells as the car comes by (more
    // over a jump), with whoops and air horns
    const Wd = typeof Render !== 'undefined' ? Render.world : null, cc = race && race.track.def.rally && Wd ? Wd.crowdCells : null;
    let cl = 0;
    if (cc) {
      const cx = Math.floor(player.x / 24), cz = Math.floor(player.z / 24); let n = 0;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const c = cc.get((cx + a) + ',' + (cz + b)); if (c) n += c * clamp(1 - Math.hypot((cx + a + 0.5) * 24 - player.x, (cz + b + 0.5) * 24 - player.z) / 60, 0, 1); }
      cl = clamp(n / 120, 0, 1);
    }
    const ex = cl * (0.5 + 0.5 * clamp(spd / 30, 0, 1)) * (air ? 1.4 : 1);
    set(crowd.out.gain, ex * 0.16, 0.3);
    if (ex > 0.25 && Math.random() < dt * ex * 3) cheer(Math.min(1, ex));
    // Pikes Peak: the engine echoes among the rocks above the treeline; the TV helicopter (World's dyn.pk: Pikes Peak's, and Ouninpohja's
    // that follows the car the whole run) by its distance to the camera
    const pikes = !!(race && race.track && race.track.def && race.track.def.id === 'pikes');
    set(echo.send.gain, pikes ? Core.sstep(186, 198, player.roadY || 0) * 0.32 : 0, 0.6);
    { const tn = Wd && Wd.dyn && Wd.dyn.tunnel, sq = player.q ? player.q.s : -1e9;   // (in a tunnel: the ring of its walls)
      set(tun.send.gain, tn && sq > tn.s0 - 3 && sq < tn.s1 + 3 ? 0.85 : 0, 0.08); }
    const W = Wd, pk = W && W.dyn ? W.dyn.pk || W.dyn.air : null, cam = typeof Render !== 'undefined' ? Render.camera : null;   // (the Red Bull Ring's: dyn.air)
    let hv = 0, hp = 0;
    if (pk && pk.heli && (pk.on || (pk.follow && pk.heli.visible))) {
      const q = pk.heli.position, lx = cam ? cam.position.x : player.x, ly = cam ? cam.position.y : (player.roadY || 0), lz = cam ? cam.position.z : player.z;
      const d = Math.hypot(q.x - lx, q.y - ly, q.z - lz), a = clamp(1 - d / (pk.follow ? 360 : 280), 0, 1);
      hv = a * a * 0.5;
      if (cam) { const e = cam.matrixWorld.elements; hp = clamp(((q.x - lx) * e[0] + (q.y - ly) * e[1] + (q.z - lz) * e[2]) / Math.max(d, 1) * 1.2, -0.8, 0.8); }
    }
    set(heli.out.gain, hv, 0.35);
    if (heli.pn) set(heli.pn.pan, hp, 0.1);
    standsStep(race, player, W, cam);
    // the Red Bull Ring's jets before the start: a roar by the distance to the nearest one
    let jv = 0; const A = W && W.dyn && W.dyn.air;
    if (A && A.t0 >= 0) for (const m of A.jets) if (m.visible) { const q = m.position, lx = cam ? cam.position.x : player.x, ly = cam ? cam.position.y : 0, lz = cam ? cam.position.z : player.z; jv = Math.max(jv, clamp(1 - Math.hypot(q.x - lx, q.y - ly, q.z - lz) / 420, 0, 1) ** 2); }
    set(jet.out.gain, jv * 0.55, 0.12); set(jet.flt.frequency, 300 + jv * 900, 0.12);
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
  // a stone off the underbody: a short metallic tink and a click of grit
  function ping(v) {
    if (!running) return;
    const now = ctx.currentTime, f = 2600 + Math.random() * 3400;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, now); o.frequency.exponentialRampToValueAtTime(f * 0.8, now + 0.05);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.05 * v, now + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    o.connect(g); g.connect(bus); o.start(now); o.stop(now + 0.07);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 6;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.12 * v, now); g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    src.connect(bp); bp.connect(g2); g2.connect(bus); src.start(now, Math.random() * 1.5); src.stop(now + 0.04);
  }
  // the car into a puddle: a burst of water, darkening as it falls
  function splash(v) {
    if (!running) return;
    const now = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = 0.8;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, now); lp.frequency.exponentialRampToValueAtTime(500, now + 0.35);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5 * v, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    src.connect(lp); lp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + 0.5);
  }
  // one of the fans: a whoop (a voice through a vowel-like band, gliding up and back) or, now and then, an air horn
  function cheer(v) {
    if (!running) return;
    const now = ctx.currentTime;
    if (Math.random() < 0.25) {
      const f = [392, 440, 494][Math.floor(Math.random() * 3)], dur = 0.35 + Math.random() * 0.4;
      for (const m of [1, 1.26]) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f * m; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.03 * v, now + 0.02); g.gain.setValueAtTime(0.03 * v, now + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        o.connect(lp); lp.connect(g); g.connect(bus); o.start(now); o.stop(now + dur + 0.02); }
      return;
    }
    const f0 = 260 + Math.random() * 200, dur = 0.5 + Math.random() * 0.4;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, now); o.frequency.linearRampToValueAtTime(f0 * 1.6, now + dur * 0.4); o.frequency.linearRampToValueAtTime(f0 * 1.2, now + dur);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.05 * v, now + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(bp); bp.connect(g); g.connect(bus); o.start(now); o.stop(now + dur + 0.02);
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
    for (const v of [squeal, rumble, wind, curbV, rainV, hiss, heli, gravel, spray, crowd, stands, jet, sirenV]) set(v.out.gain, 0, 0.02);
    set(echo.send.gain, 0, 0.02); set(tun.send.gain, 0, 0.02);
    if (atmo) atmoOff(0.02);
  }

  const levels = () => ctx ? { stands: stands.lev, standsGain: stands.out.gain.value, tunnel: tun.send.gain.value, pk: atmo && atmo.x ? { ready: !atmo.gen && !atmo.x.gen, crunch: atmo.x.cr.map(c => +c.g.gain.value.toFixed(4)), slap: atmo.x.sG.gain.value, far: atmo.x.fG.gain.value, gust: atmo.x.wo.gain.value, wind: atmo.wo.gain.value, crowd: [atmo.cL.gain.value, atmo.cR.gain.value], cheer: atmo.p7.L.map(l => l.g.gain.value), cheerEv: [atmo.p7.nH, atmo.p7.nW] } : null } : null;   // (tests: the crowd's and the tunnel's levels now)
  const api = { resume, setEnabled, setRunning, suspend, update, crash, beep, click, shiftPop, knock, wrench, silence, levels, siren, carHorn, thud, pop, get ready() { return !!ctx && ctx.state === 'running'; } };
  window.Sfx = api;
  return api;
})();

