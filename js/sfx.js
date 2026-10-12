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
  let sirenV = null, radioV = null;   // the open road: the police siren (the nearest patrol car chasing), the police radio's static
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
    ai = [engineVoice(0.28, true), engineVoice(0.22, true), engineVoice(0.18, true)];
    squeal = squealVoice();
    rumble = noiseVoice('lowpass', 220, 0.8);
    curbV = noiseVoice('bandpass', 90, 4);
    wind = noiseVoice('bandpass', 700, 0.6);
    rainV = noiseVoice('bandpass', 3200, 0.35);   // rain: the steady patter, and the hiss of the tyres through the water
    hiss = noiseVoice('bandpass', 1400, 0.8);
    heli = heliVoice(); echo = echoFx();
    gravel = noiseVoice('bandpass', 2600, 0.7); spray = noiseVoice('highpass', 1500, 0.5); crowd = crowdVoice();
    stands = standsVoice(); jet = noiseVoice('lowpass', 500, 0.7); tun = tunnelFx(); sirenV = sirenVoice(); radioV = radioBedVoice();
    return true;
  }
  function shaperCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
    return c;
  }
  /* ---------------- engines: each car's own character ----------------
     An engine type (ENG, by the car's model: CAR_ENG; the police cars a V8): its cylinders and how evenly they fire. One oscillator runs
     at the engine's cycle (two turns of the crank: rpm / 120) with a wave of its first 48 harmonics: the firing order leaves the multiples
     of the cylinder count strong (the firing frequency: cylinders x rpm / 120), an uneven one (a boxer's, a cross-plane V8's) the half
     orders too, the burble. Over it a band of noise pulsed at the firing frequency (the exhaust's rasp), a turbo's whistle with its boost
     and its blow-off when the throttle shuts, pops and bangs on the overrun (the rally car's anti-lag whenever it is off the throttle), a
     clack at every gear change and a blip on the way down. The electric car (ev) has no engine: only its motors' whine, rising with the
     speed. The other cars' engines (the three nearest) with the Doppler shift of their speed towards or away from the camera. */
  const ENG = {
    i4: { cyl: 4, odd: 0.16, rasp: 0.55, lp: 1, turbo: 0, pops: 0.3 },                    // a four-cylinder (the retired hatch, p206): buzzy, rasping at the top
    i4t: { cyl: 4, odd: 0.14, rasp: 0.4, lp: 0.9, turbo: 0.9, pops: 0.35 },               // a small turbo four (PICO TURBO): the whistle, the blow-off
    b4t: { cyl: 4, odd: 0.4, rasp: 0.3, lp: 0.8, turbo: 1, pops: 0.35, burble: 0.75 },    // a turbo boxer (VORTEX 4WD): the flat-four's uneven burble
    i6t: { cyl: 6, odd: 0.08, rasp: 0.3, lp: 1.1, turbo: 0.7, pops: 0.25 },               // a straight six with a turbo (KAZE RS): smooth, silky
    v6: { cyl: 6, odd: 0.28, rasp: 0.6, lp: 1.25, turbo: 0, pops: 0.2 },                  // a mid-engined V6 (STREGA MR): a howl
    al4: { cyl: 4, odd: 0.2, rasp: 0.65, lp: 0.95, turbo: 1.2, pops: 1, antiLag: 1 },     // the 80s rally car (BURJA R7): turbo and anti-lag bangs
    v10: { cyl: 10, odd: 0.06, rasp: 0.85, lp: 1.5, turbo: 0, pops: 0.15 },               // the formula (ORKAN): a V10's scream
    v8: { cyl: 8, odd: 0.55, rasp: 0.45, lp: 0.7, turbo: 0, pops: 0.45, burble: 0.9 },    // a cross-plane V8 (the police, VIHAR V8): its burble
    v8t: { cyl: 8, odd: 0.5, rasp: 0.35, lp: 0.55, turbo: 0, pops: 0.3, burble: 0.8 },    // the trophy truck's big V8 (SAMUM 4x4): heavier, duller
    v8r: { cyl: 8, odd: 0.08, rasp: 0.8, lp: 1.4, turbo: 0, pops: 0.2 },                  // a flat-plane racing V8 (TAIFUN LM): even firing, a hard scream
    ev: { cyl: 1, ev: 1, odd: 0, rasp: 0, lp: 1, turbo: 0, pops: 0 },                     // the electric motors (STRELA EV): no engine, their whine
  };
  const CAR_ENG = { p206: 'i4', pico: 'i4t', vortex: 'b4t', kaze: 'i6t', strega: 'v6', rally: 'al4', formula: 'v10', muscle: 'v8', truck: 'v8t', lm: 'v8r', ev: 'ev' };
  const engKind = (c) => c.police ? 'v8' : CAR_ENG[c.m.id] || (c.m.ev ? 'ev' : c.m.snd === 'v8' ? 'v8' : 'i4');
  const waves = {};
  function engWave(k) {   // the wave of one engine cycle (cached per type)
    if (waves[k]) return waves[k];
    const E = ENG[k], H = 48, re = new Float32Array(H + 1), im = new Float32Array(H + 1), R = Core.rng(k.length * 131 + E.cyl * 7);
    if (E.ev) { im[2] = 1; im[3] = 0.3; im[6] = 0.35; return (waves[k] = ctx.createPeriodicWave(re, im)); }   // (the whine: its note, a fifth over it and near its third harmonic; the oscillator runs at half the note)
    for (let h = 1; h <= H; h++) {
      const fire = h % E.cyl === 0, half = E.burble && h % (E.cyl / 2) === 0;
      const a = (fire ? 1 : half ? E.burble * 0.7 : E.odd * (0.25 + 0.5 * R())) * (h <= E.cyl ? 1 : Math.pow(h / E.cyl, -1.15)), ph = R() * Math.PI * 2;
      re[h] = a * Math.sin(ph); im[h] = a * Math.cos(ph);
    }
    return (waves[k] = ctx.createPeriodicWave(re, im));
  }
  function engineVoice(level, pan) {
    const o = ctx.createOscillator(); o.setPeriodicWave(engWave('i4'));
    const sh = ctx.createWaveShaper(); sh.curve = shaperCurve(1.8);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 1.6;
    const out = ctx.createGain(); out.gain.value = 0;
    // the rasp: noise round three times the firing frequency, pulsed at it
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true; ns.playbackRate.value = 0.8 + Math.random() * 0.3;
    const nb = ctx.createBiquadFilter(); nb.type = 'bandpass'; nb.frequency.value = 600; nb.Q.value = 0.9;
    const nv = ctx.createGain(); nv.gain.value = 0.5;
    const pm = ctx.createOscillator(); pm.type = 'sine'; pm.frequency.value = 100; const pg = ctx.createGain(); pg.gain.value = 0.5; pm.connect(pg); pg.connect(nv.gain);
    const rg = ctx.createGain(); rg.gain.value = 0;
    ns.connect(nb); nb.connect(nv); nv.connect(rg); rg.connect(lp);
    // the turbo's whistle
    const tw = ctx.createOscillator(); tw.type = 'sine'; tw.frequency.value = 2600; const tg = ctx.createGain(); tg.gain.value = 0; tw.connect(tg); tg.connect(out);
    const pre = ctx.createGain(); pre.gain.value = 1;   // (into the shaper: the electric motors' whine only lightly)
    o.connect(pre); pre.connect(sh); sh.connect(lp); lp.connect(out);
    const fx = ctx.createGain(); fx.gain.value = 1;   // (the one-shots of this engine: pops, the blow-off, the gear clack)
    let pn = null;
    if (pan && ctx.createStereoPanner) { pn = ctx.createStereoPanner(); out.connect(pn); fx.connect(pn); pn.connect(bus); } else { out.connect(bus); fx.connect(bus); }
    o.start(); ns.start(0, Math.random()); pm.start(); tw.start();
    return { o, pre, lp, out, pn, fx, nb, pm, rg, tw, tg, level, kind: 'i4', car: null, boost: 0, thrHi: 9, thrP: 0, popT: 0, pops: 0, dop: 1 };
  }
  function engKindSet(v, k) { if (v.kind !== k) { v.kind = k; v.o.setPeriodicWave(engWave(k)); v.pre.gain.value = ENG[k].ev ? 0.3 : 1; } }   // (the motors' whine clean: hardly through the shaper)
  // one engine this frame: its revs, throttle, pitch (the Doppler factor), level; the turbo's boost, what the throttle shutting does
  function engSet(v, c, rpm, thr, dop, gain, dt, now) {
    const E = ENG[v.kind], R = c.m.redline || 7500, r = clamp(rpm / R, 0.05, 1.08);
    if (E.ev) {   // the electric motors: they turn with the wheels, so the whine rises with the speed (no revving, no gear changes), louder under power
      const sp = c.speed || 0;
      set(v.o.frequency, (110 + sp * 21) * dop / 2, 0.015); set(v.lp.frequency, 5200, 0.05); set(v.rg.gain, 0, 0.04); set(v.tg.gain, 0, 0.05); v.boost = 0;
      set(v.out.gain, gain * (0.3 + 0.6 * clamp(sp / 40, 0, 1) + (c.locked ? 0 : 0.5 * thr)), 0.03); v.thrP = thr;   // (on the grid nothing to rev)
      return;
    }
    const fc = Math.max(4, rpm / 120) * dop, fire = fc * E.cyl;
    set(v.o.frequency, fc, 0.012); set(v.pm.frequency, fire, 0.012);
    set(v.lp.frequency, clamp(fire * (2 + thr * 2.6) * E.lp + 220, 180, 9000), 0.03);
    set(v.nb.frequency, clamp(fire * 3, 120, 8000), 0.03);
    set(v.rg.gain, E.rasp * (0.12 + 0.55 * thr) * (0.3 + r) * 0.3, 0.04);
    const bt = E.turbo ? clamp(thr, 0, 1) * clamp((r - 0.28) / 0.45, 0, 1) : 0;   // (the boost builds with the throttle and the revs, lags behind)
    v.boost += (bt - v.boost) * clamp(dt * (bt > v.boost ? 2.2 : E.antiLag ? 1.5 : 6), 0, 1);
    set(v.tw.frequency, (2300 + v.boost * 5400) * dop, 0.05); set(v.tg.gain, E.turbo * v.boost * v.boost * 0.045, 0.05);
    // the throttle shut: the blow-off (a boost built up), pops on the overrun for ~0.7 s from high revs; anti-lag: bangs whenever off it
    v.thrHi = thr > 0.55 ? 0 : v.thrHi + dt;
    if (thr < 0.2 && v.thrP >= 0.5 && v.boost > 0.4 && E.turbo) blowOff(v, v.boost, now);
    const over = thr < 0.12 && r > 0.45 && (v.thrHi < 0.75 || E.antiLag);
    if (over && now >= v.popT) { v.popT = now + (E.antiLag ? 0.07 + Math.random() * 0.2 : 0.05 + Math.random() * 0.25); if (Math.random() < (E.antiLag ? 0.8 : E.pops)) crack(v, E.antiLag ? 0.7 + Math.random() * 0.5 : 0.35 + Math.random() * 0.4, now); }
    v.thrP = thr;
    set(v.out.gain, gain, 0.02);
  }
  // a pop on the overrun: a crack of noise and a low thump, through the engine's own panner
  function crack(v, vol, now) {
    v.pops++;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = 0.7 + Math.random() * 0.5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400 + Math.random() * 1800;
    const g = ctx.createGain(), d = 0.025 + Math.random() * 0.04; g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.32 * vol * v.level, now + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    src.connect(lp); lp.connect(g); g.connect(v.fx); src.start(now, Math.random() * 1.5); src.stop(now + d + 0.02);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(95 + Math.random() * 40, now); o.frequency.exponentialRampToValueAtTime(45, now + 0.07);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, now); og.gain.exponentialRampToValueAtTime(0.35 * vol * v.level, now + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    o.connect(og); og.connect(v.fx); o.start(now); o.stop(now + 0.1);
  }
  // the blow-off valve: a hiss of the boost let out, falling
  function blowOff(v, b, now) {
    if (now - (v.bovT || 0) < 0.6) return; v.bovT = now; v.bov = (v.bov || 0) + 1;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(3600, now); bp.frequency.exponentialRampToValueAtTime(1300, now + 0.35);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.14 * b * v.level, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    src.connect(bp); bp.connect(g); g.connect(v.fx); src.start(now, Math.random()); src.stop(now + 0.42);
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
    if (!ctx || ctx.state !== 'running' || !running || !Number.isFinite(vol)) return;
    const now = ctx.currentTime, dur = 0.35 + Math.random() * 0.45, f0 = big ? 220 : 390 + Math.random() * 60;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.09 * vol, now + 0.02); g.gain.setValueAtTime(0.09 * vol, now + dur); g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.06);
    for (const f of [f0, f0 * 1.25]) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(lp); o.start(now); o.stop(now + dur + 0.08); }
    lp.connect(g); if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = clamp(pan || 0, -1, 1); g.connect(pn); pn.connect(bus); } else g.connect(bus);
  }
  // someone on foot (or on a bicycle) knocked down: a dull, soft thump
  function thud(v) {
    if (!ctx || ctx.state !== 'running' || !running || !Number.isFinite(v)) return;
    const now = ctx.currentTime, vol = clamp(v, 0.1, 1);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(95, now); o.frequency.exponentialRampToValueAtTime(42, now + 0.16);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5 * vol, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    o.connect(g); g.connect(bus); o.start(now); o.stop(now + 0.26);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.35 * vol, now); g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    src.connect(lp); lp.connect(g2); g2.connect(bus); src.start(now, Math.random()); src.stop(now + 0.14);
  }
  // the police radio (the run from the police; the speech itself cannot go through Web Audio's filters, so these carry the radio's sound):
  // the squelch opening (a burst of band-passed noise and the click of the key), the roger beep and a short tail as it closes, and a bed of
  // thin static (radioV, fluttering) while a line plays
  function radioOpen() {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.3;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.12, now + 0.008); g.gain.setValueAtTime(0.1, now + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + 0.18);
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 2300;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, now); g2.gain.exponentialRampToValueAtTime(0.025, now + 0.002); g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
    o.connect(g2); g2.connect(bus); o.start(now); o.stop(now + 0.03);
  }
  function radioClose() {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime, o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 1250;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.05, now + 0.008); g.gain.setValueAtTime(0.05, now + 0.07); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
    o.connect(g); g.connect(bus); o.start(now); o.stop(now + 0.1);
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(); src.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 1.1;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, now + 0.09); g2.gain.exponentialRampToValueAtTime(0.09, now + 0.1); g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    src.connect(bp); bp.connect(g2); g2.connect(bus); src.start(now + 0.09, Math.random()); src.stop(now + 0.26);
  }
  function radioBedVoice() {
    const v = noiseVoice('bandpass', 1900, 0.8), lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.type = 'triangle'; lfo.frequency.value = 5.3; lg.gain.value = 260; lfo.connect(lg); lg.connect(v.flt.frequency); lfo.start();   // (the static fluttering)
    return v;
  }
  function radioBed(on) { if (ctx && radioV) set(radioV.out.gain, on && running ? 0.024 : 0, on ? 0.04 : 0.07); }
  // thunder after a lightning (delay: the sound's way from where it struck, vol: nearer is louder, with a crack): a low roll, swelling and fading
  function thunder(delay, vol) {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime + Math.max(0, delay || 0), v = clamp(vol || 0.5, 0.1, 1), dur = 2.5 + v * 2.5 + Math.random();
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.3 + Math.random() * 0.1;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(v > 0.7 ? 1500 : 520, now); lp.frequency.exponentialRampToValueAtTime(110, now + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.55 * v, now + (v > 0.7 ? 0.03 : 0.45));
    for (let k = 1; k < 4; k++) g.gain.exponentialRampToValueAtTime(0.55 * v * (0.3 + Math.random() * 0.55), now + dur * k / 4);   // (it rolls)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(lp); lp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + dur + 0.1);
    thunders++;
  }
  let thunders = 0;
  // a tyre over the spikes: a sharp pop, then the air hissing out
  function pop() {
    if (!ctx || ctx.state !== 'running' || !running) return;
    const now = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.7, now + 0.004); g.gain.exponentialRampToValueAtTime(0.06, now + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    src.connect(hp); hp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + 0.95);
  }
  function horn(vol, pan) {   // an air horn: two detuned saws a third apart, a short blast
    if (!Number.isFinite(vol) || !Number.isFinite(pan)) return;
    const now = ctx.currentTime, dur = 0.3 + Math.random() * 0.55, f0 = [370, 415, 466, 494][Math.floor(Math.random() * 4)];
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.03); g.gain.setValueAtTime(vol, now + dur); g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.1);
    for (const f of [f0, f0 * 1.26, f0 * 1.005]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(now); o.stop(now + dur + 0.12); }
    lp.connect(g);
    if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = pan; g.connect(pn); pn.connect(bus); } else g.connect(bus);
  }
  function drum(vol, t) {   // a big drum: a thump falling in pitch, a slap on top
    if (!Number.isFinite(vol) || !Number.isFinite(t)) return;
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
  // a samba group by the main stand (Rio: World's samba, [x, z]): the batucada at ~104 beats a minute, scheduled a little ahead in sixteenths:
  // the two surdos (the low one on the second beat), the snare's sixteenths with their accents, the tamborim's figure, the agogô's two bells;
  // louder as the camera comes near (none past 170 m), from its side of the screen
  let samba = null;
  const SB_T = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0], SB_A = [2, 0, 0, 2, 0, 0, 1, 0, 2, 0, 0, 2, 0, 1, 0, 0];   // tamborim hits; agogô (1 low, 2 high)
  function sambaHit(f0, f1, dur, vol, t, type) {   // a pitched hit falling from f0 to f1 (the surdos; the agogô's bells: square, short)
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(samba.out); o.start(t); o.stop(t + dur + 0.02);
  }
  function sambaNoise(f, q, dur, vol, t) {   // a snare's or a tamborim's crack: band-passed noise
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(samba.out); src.start(t, Math.random()); src.stop(t + dur + 0.02);
  }
  function sambaStep(race, player, W, cam) {
    const S = W && W.samba;
    if (!S || !race || !running) { if (samba) { set(samba.out.gain, 0, 0.2); samba.next = 0; } return; }
    if (!samba) { const out = ctx.createGain(); out.gain.value = 0; let pn = null; if (ctx.createStereoPanner) { pn = ctx.createStereoPanner(); out.connect(pn); pn.connect(bus); } else out.connect(bus); samba = { out, pn, next: 0, k: 0, lev: 0 }; }
    const B = samba, lx = cam ? cam.position.x : player.x, lz = cam ? cam.position.z : player.z, dx = S[0] - lx, dz = S[1] - lz, d = Math.hypot(dx, dz), lev = clamp(1 - d / 170, 0, 1) ** 1.5;
    B.lev = lev; set(B.out.gain, lev * 0.55, 0.25);
    if (cam && B.pn) { const e = cam.matrixWorld.elements; set(B.pn.pan, clamp((dx * e[0] + dz * e[2]) / Math.max(d, 1), -0.75, 0.75), 0.3); }
    if (lev < 0.01) { B.next = 0; return; }
    const now = ctx.currentTime, st = 60 / 104 / 4;
    if (B.next < now) B.next = now + 0.05;
    while (B.next < now + 0.25) {
      const k = B.k++ % 16, t = B.next;
      if (k === 0) sambaHit(95, 62, 0.45, 0.5, t); if (k === 8) sambaHit(72, 48, 0.6, 0.6, t); if (k === 14 || k === 15) sambaHit(72, 52, 0.18, 0.18, t);   // the surdos (the answer on 2, the low one's pickups)
      sambaNoise(2600, 0.9, 0.05, k % 4 === 2 ? 0.16 : 0.06, t);   // the snare
      if (SB_T[k]) sambaNoise(5200, 2.5, 0.035, 0.1, t);   // the tamborim
      if (SB_A[k]) sambaHit(SB_A[k] === 2 ? 920 : 690, SB_A[k] === 2 ? 920 : 690, 0.12, 0.05, t, 'square');   // the agogô
      B.next += st * (k % 2 ? 0.94 : 1.06);   // (the swing)
    }
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
    if (!Number.isFinite(v) || !Number.isFinite(r.next)) return;
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
    eng.out.connect(hp); hp.connect(lp); if (kitPl) kitPl.out.connect(hp);   // (a registered vehicle's voice too: engTaps)
    const sD = ctx.createDelay(0.5), sF = ctx.createGain(), sG = ctx.createGain(); sD.delayTime.value = 0.07; sF.gain.value = 0.2; sG.gain.value = 0;
    lp.connect(sD); sD.connect(sF); sF.connect(sD); sD.connect(sG); sG.connect(bus);
    const fD = ctx.createDelay(1), fL = ctx.createBiquadFilter(), fF = ctx.createGain(), fG = ctx.createGain(); fD.delayTime.value = 0.38; fL.type = 'lowpass'; fL.frequency.value = 900; fF.gain.value = 0.34; fG.gain.value = 0;
    lp.connect(fD); fD.connect(fL); fL.connect(fF); fF.connect(fD); fL.connect(fG); fG.connect(bus);
    Object.assign(X, { sG, sD, fG, hp });
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
    // crunch: the wheels on the verge (surface 3), and on the historic gravel road on the road itself (5, 6), on each side of the car, louder and denser
    // with the speed (nothing in the air or at a standstill)
    let dot = 1; if (cam) { const e = cam.matrixWorld.elements, h = player.h || 0; dot = clamp(-Math.sin(h) * e[0] + Math.cos(h) * e[2], -1, 1); }   // (the car's +side on the screen)
    const v = player.air ? 0 : PX_CRUNCH * (0.12 + 0.88 * sstep(2, 38, spd)) * Math.min(1, spd / 2.5) * (1 - 0.4 * wet), W = player.ws || [];
    for (let k = 0; k < 2; k++) { const c = X.cr[k], lz = (w) => w === 3 || w === 5 || w === 6 ? 1 : 0, nw = lz(W[k]) + lz(W[k + 2]);   // (k 0: the -side wheels 0 and 2, k 1: the +side ones)
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
    if (!Number.isFinite(v) || !Number.isFinite(pan)) return;
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

  /* ---- FLEET: the engine presets (Core.SND_KINDS; a registered vehicle's model.sndP = { kind, hz, turbo 0..1, loud }). A preset is one
     engine cycle (720 degrees of crank on a four-stroke, two turns of a two-stroke's, three turns of a rotary's shaft: every face of both
     rotors) drawn as exhaust pulses: each firing at its crank angle with its own strength (a bank's longer pipe, a manifold's uneven
     runners), a sharp rise and dying away. Its harmonics, a PeriodicWave at the cycle's frequency (rpm/120 on a four-stroke, x snd.hz),
     are the orders the engine sounds in: an even engine only at its firing frequency (cylinders/2 x rpm/60; cylinders x rpm/60 on a
     two-stroke; two rotors: 2 x rpm/60) and its multiples, a cross-plane V8's banks, a five's manifold, a boxer's pipes also at the
     orders between (its burble, warble, chug). Two such waves per voice, crossfaded with the throttle (on it: sharper, even pulses; off
     it: softer, lumpier ones), into a soft clipper, a low-pass that opens with the revs and the throttle, and the exhaust's resonance (a
     peaking filter); then the kind's own layers: a clatter of noise pulsed by the firings (a diesel's knock, an air-cooled engine's
     valves, a flat six's rasp, a two-stroke's ring), a blower's whine (v8s, i8s), a hybrid's motor, a lumpy cam's lope; on any kind
     snd.turbo's whistle, its blow-off on a lift and, from 0.9, a rally anti-lag's bangs; overrun pops; a truck's air brakes. snd.loud:
     the gain (and how far a rival is heard). The 11 models without a preset keep their own voices untouched (engineVoice, their engine
     type: ENG, CAR_ENG): these are separate voices (kitVoice: the player's and three for the nearest rivals, made the first time a vehicle
     with a preset is heard), the old ones silent while one plays: a rival's with the old voices' Doppler shift (update's dop, by its speed
     to or from the camera, on every pitch of it), the player's gear changes with their clack and blip (kitGear). Their random numbers are
     their own (KR), never Math.random ---- */
  const KR = Core.rng(0x5fd1e7), num = (v, d) => (Number.isFinite(v) ? v : d);
  // a cycle's firings ([crank angle, strength]) in this order of cylinders, deg/n apart; bank B's (bOf) weaker (bAmp) and a little later
  // (bDel: its longer pipe); each cylinder a little different (vary). lumpy: the same firings off the throttle, less even (k: how much)
  const kitFire = (deg, order, bOf, bAmp, bDel, vary) => order.map((cy, i) => { const b = bOf(cy); return [i * deg / order.length + (b ? bDel : 0), (b ? bAmp : 1) * (vary ? vary[(cy - 1) % vary.length] : 1)]; });
  const KV = [1, 0.96, 1.02, 0.97, 1.01, 0.95, 1.03, 0.98, 0.99, 1.02, 0.97, 1];
  const KJ = [[0, 0], [3, 0.3], [-2, 0.1], [4, 0.35], [-1, 0.05], [2, 0.25], [-3, 0.15], [1, 0.3], [2, 0.08], [-2, 0.22], [3, 0.12], [-1, 0.28]];
  const lumpy = (F, k) => F.map(([a, s], i) => [a + KJ[i % 12][0] * k, s * (1 - KJ[i % 12][1] * k)]);
  const none = () => false, X8 = [1, 8, 4, 3, 6, 5, 7, 2], FP8 = [1, 5, 3, 7, 4, 8, 2, 6], even = (c) => c % 2 === 0;
  // the firing patterns (cylinder orders and their banks): straight 2, 3, 4, 5, 6, 8; boxer 4 and 6; the rotary's six faces; V8 cross-plane
  // (its banks firing unevenly: the burble), flat-plane (an even four each), 1960s (eight open stacks, each its own), V10, V12
  const P2 = [[0, 1], [360, 0.82]], P3 = [[0, 1], [246, 0.8], [482, 0.9]], P4 = kitFire(720, [1, 3, 4, 2], none, 1, 0, [1, 0.96, 0.98, 0.94]);
  const P5 = [[0, 1], [150, 0.72], [284, 0.95], [438, 0.66], [570, 0.88]], P6 = kitFire(720, [1, 5, 3, 6, 2, 4], (c) => c > 3, 0.97, 1, KV);
  const B4 = [[0, 1], [190, 0.66], [360, 0.94], [548, 0.6]], B6 = kitFire(720, [1, 6, 2, 4, 3, 5], (c) => c > 3, 0.8, 5, KV), PR = kitFire(1080, [1, 2, 3, 4, 5, 6], none, 1, 0, [1, 0.9, 0.84, 0.95, 0.97, 0.88]);
  const VFP = kitFire(720, FP8, (c) => c > 4, 0.9, 3, KV), VHI = kitFire(720, FP8, (c) => c > 4, 0.88, 2, [1, 0.78, 0.95, 0.7, 0.9, 0.75, 0.86, 0.94]);
  const V10 = kitFire(720, [1, 6, 5, 10, 2, 7, 3, 8, 4, 9], (c) => c > 5, 0.75, 2, [1, 0.85, 0.95, 0.8, 0.9, 0.88, 0.8, 0.9, 0.84, 0.86]), V12 = kitFire(720, [1, 7, 5, 11, 3, 9, 6, 12, 2, 8, 4, 10], (c) => c > 6, 0.95, 1, KV);
  const S8 = kitFire(720, [1, 6, 2, 5, 8, 3, 7, 4], (c) => c > 4, 0.88, 2, [1, 0.86, 0.95, 0.8, 0.92, 0.84, 0.9, 0.97]), D6 = kitFire(720, [1, 5, 3, 6, 2, 4], (c) => c > 3, 0.97, 1, KV);
  // per kind: deg the cycle, F / Fo the firings on / off the throttle, w / wo their pulses' decay (a share of the cycle: shorter = brighter)
  // and rise (ri x w), drive the clipper, q the low-pass's resonance and l0 + l1 x firing frequency its cut-off (x 1 + lL x throttle), pk
  // the exhaust's resonance [Hz, dB, Q] (pkR: a multiple of the firing frequency instead: a two-stroke's expansion chamber), nz / nF / nQ /
  // nAm the clatter's level / band / Q / how much the firings pulse it, lope [x the cycle's frequency, depth] a lumpy cam, blow [x the firing
  // frequency, level, throttle exponent] a blower's whine, motor a hybrid's motor whine, pop overrun pops a second, sp the shift pop, tf
  // the turbo whistle's pitch, air an air-braked truck, vol its loudness (the kinds equally loud, measured)
  const KITS = {
    i2: { deg: 720, F: P2, Fo: lumpy(P2, 0.9), w: 0.05, wo: 0.07, ri: 0.15, drive: 2.6, q: 1.4, l0: 300, l1: 7, lL: 0.7, pk: [850, 4, 1.2], nz: 0.16, nF: 2300, nQ: 1.1, nAm: 0.9, lope: [1, 0.22], pop: 0.15, sp: 0.25, vol: 1.51 },
    i3: { deg: 720, F: P3, Fo: lumpy(P3, 0.8), w: 0.05, wo: 0.066, ri: 0.15, drive: 2.4, q: 1.8, l0: 320, l1: 6.5, lL: 0.65, pk: [1300, 3, 1], nz: 0.05, nF: 2600, nQ: 1.2, nAm: 0.6, lope: [1, 0.1], pop: 0.2, sp: 0.3, tf: 1.15, vol: 1.19 },
    i4: { deg: 720, F: P4, Fo: lumpy(P4, 0.5), w: 0.05, wo: 0.066, ri: 0.12, drive: 2.5, q: 2, l0: 340, l1: 6, lL: 0.7, pk: [1700, 3, 1], nz: 0.04, nF: 3000, nQ: 1, nAm: 0.5, pop: 0.25, sp: 0.35, vol: 0.89 },
    i5: { deg: 720, F: P5, Fo: lumpy(P5, 0.6), w: 0.048, wo: 0.062, ri: 0.12, drive: 2.7, q: 2.2, l0: 320, l1: 5.5, lL: 0.7, pk: [1500, 3, 1], nz: 0.05, nF: 2800, nQ: 1.1, nAm: 0.6, lope: [1, 0.12], pop: 0.4, sp: 0.45, tf: 0.9, vol: 0.78 },
    i6: { deg: 720, F: P6, Fo: lumpy(P6, 0.3), w: 0.045, wo: 0.06, ri: 0.4, drive: 1.8, q: 1.3, l0: 380, l1: 5, lL: 0.6, pk: [2200, 2, 0.8], nz: 0.02, nF: 3200, nQ: 1, nAm: 0.4, pop: 0.1, sp: 0.25, vol: 0.79 },
    flat4: { deg: 720, F: B4, Fo: lumpy(B4, 0.6), w: 0.05, wo: 0.066, ri: 0.15, drive: 3, q: 1.5, l0: 280, l1: 5.5, lL: 0.7, pk: [650, 5, 1.1], nz: 0.24, nF: 2600, nQ: 1, nAm: 1, lope: [1, 0.12], pop: 0.1, sp: 0.2, vol: 0.8 },
    flat6: { deg: 720, F: B6, Fo: lumpy(B6, 0.5), w: 0.036, wo: 0.05, ri: 0.06, drive: 3.1, q: 2, l0: 420, l1: 6.5, lL: 0.75, pk: [2500, 5, 1.2], nz: 0.12, nF: 3400, nQ: 1.4, nAm: 0.8, pop: 0.4, sp: 0.45, tf: 0.95, vol: 0.67 },
    rotary: { deg: 1080, F: PR, Fo: lumpy(PR, 1), w: 0.022, wo: 0.034, ri: 0.03, drive: 3.6, q: 1.2, l0: 600, l1: 8, lL: 0.6, pk: [3200, 4, 1.1], nz: 0.06, nF: 3800, nQ: 1.2, nAm: 0.6, lope: [1, 0.4, 2.5], pop: 1.2, sp: 0.6, tf: 1.05, vol: 0.99 },
    v8: { deg: 720, F: kitFire(720, X8, even, 0.72, 6, KV), Fo: lumpy(kitFire(720, X8, even, 0.6, 8, KV), 0.3), w: 0.05, wo: 0.066, ri: 0.15, drive: 2.6, q: 1.7, l0: 280, l1: 4.2, lL: 0.8, pk: [220, 4, 1], nz: 0.03, nF: 2400, nQ: 1, nAm: 0.5, lope: [1, 0.3], pop: 0.3, sp: 0.4, vol: 0.57 },
    v8fp: { deg: 720, F: VFP, Fo: lumpy(VFP, 0.3), w: 0.04, wo: 0.052, ri: 0.1, drive: 2.9, q: 2.1, l0: 380, l1: 4.6, lL: 0.75, pk: [1600, 3, 1], nz: 0.04, nF: 3200, nQ: 1, nAm: 0.5, pop: 0.6, sp: 0.5, vol: 0.53 },
    v8hi: { deg: 720, F: lumpy(VHI, 0.4), Fo: lumpy(VHI, 0.8), w: 0.03, wo: 0.042, ri: 0.05, drive: 3.6, q: 2.6, l0: 520, l1: 6, lL: 0.6, pk: [2800, 7, 1.3], nz: 0.1, nF: 4200, nQ: 1.6, nAm: 0.5, pop: 0.8, sp: 0.5, vol: 0.54 },
    v8s: { deg: 720, F: lumpy(kitFire(720, X8, even, 0.76, 5, KV), 0.3), Fo: lumpy(kitFire(720, X8, even, 0.62, 7, KV), 0.5), w: 0.045, wo: 0.058, ri: 0.08, drive: 3.6, q: 1.6, l0: 300, l1: 3.8, lL: 0.9, pk: [160, 5, 1], nz: 0.1, nF: 2600, nQ: 1, nAm: 0.6, lope: [1, 0.42], blow: [4.2, 0.2, 1], pop: 0.5, sp: 0.5, vol: 0.51 },
    v10: { deg: 720, F: V10, Fo: lumpy(V10, 0.4), w: 0.04, wo: 0.05, ri: 0.1, drive: 2.8, q: 2.3, l0: 420, l1: 4.2, lL: 0.7, pk: [1900, 4, 1], nz: 0.03, nF: 3400, nQ: 1, nAm: 0.4, pop: 0.45, sp: 0.5, vol: 0.49 },
    v12: { deg: 720, F: V12, Fo: lumpy(V12, 0.2), w: 0.03, wo: 0.038, ri: 0.3, drive: 1.7, q: 2.5, l0: 450, l1: 4.2, lL: 0.6, pk: [2600, 3, 0.9], nz: 0.015, nF: 3600, nQ: 1, nAm: 0.3, pop: 0.15, sp: 0.35, vol: 0.47 },
    i8s: { deg: 720, F: S8, Fo: lumpy(S8, 0.5), w: 0.045, wo: 0.06, ri: 0.1, drive: 3, q: 1.6, l0: 260, l1: 4, lL: 0.75, pk: [700, 4, 1.1], nz: 0.07, nF: 3000, nQ: 1, nAm: 0.6, blow: [2.6, 0.16, 1.5], pop: 0.4, sp: 0.4, vol: 0.48 },
    diesel: { deg: 720, F: D6, Fo: lumpy(D6, 0.2), w: 0.06, wo: 0.08, ri: 0.2, drive: 3.2, q: 1.2, l0: 220, l1: 4, lL: 0.5, pk: [120, 5, 1], nz: 0.3, nF: 1400, nQ: 1.1, nAm: 1, pop: 0, sp: 0, tf: 0.55, air: true, vol: 0.6 },
    kart2t: { deg: 720, F: [[0, 1], [360, 0.97]], Fo: [[0, 1], [360, 0.35]], w: 0.03, wo: 0.036, ri: 0.05, drive: 3.8, q: 3.2, l0: 900, l1: 4, lL: 0.5, pkR: [4, 7, 3], nz: 0.14, nF: 3200, nQ: 2, nAm: 0.9, pop: 0.3, sp: 0, vol: 1.38 },
    hybrid: { deg: 720, F: kitFire(720, X8, even, 0.74, 5, KV), Fo: lumpy(kitFire(720, X8, even, 0.64, 7, KV), 0.3), w: 0.045, wo: 0.06, ri: 0.12, drive: 2.9, q: 1.9, l0: 340, l1: 5.4, lL: 0.8, pk: [1800, 4, 1.1], nz: 0.03, nF: 2600, nQ: 1, nAm: 0.5, lope: [1, 0.1], motor: 0.25, pop: 0.3, sp: 0.3, vol: 0.52 },
    ev: { ev: true },
  };
  // work made ahead in slices (prep, below: in the menus' idle time, a little in each race frame): a generator that yields every few
  // thousand samples and returns what it made. slice(key, make, until) runs it until it is done (true) or performance.now() passes until;
  // made(key, make) finishes it now (it is wanted before its turn); a maker that throws leaves null (its sound is then skipped)
  const jobs = {}, done = {};
  function slice(key, make, until) {
    if (key in done) return true;
    try {
      const g = jobs[key] || (jobs[key] = make());
      for (;;) { const r = g.next(); if (r.done) { done[key] = r.value || null; delete jobs[key]; return true; } if (until != null && performance.now() >= until) return false; }
    } catch (e) { done[key] = null; delete jobs[key]; return true; }
  }
  const made = (key, make) => { slice(key, make, null); return done[key]; };
  const runAll = (g) => { let r; do r = g.next(); while (!r.done); return r.value; };
  // the cycle's harmonics 1..H (a PeriodicWave's real / imag) from its firings: a sum of pulses, each a sharp rise (time constant ri x w)
  // and a decay (w), wrapping round the cycle; its mean taken away (the harmonics by an FFT of KN samples); a slice per firing
  const KN = 2048;
  function* kitSpecGen(kind, off) {
    const K = KITS[kind], F = off ? K.Fo : K.F, deg = K.deg, w = off ? K.wo : K.w, H = Math.min(320, 64 + 24 * F.length);
    const re = new Float64Array(KN), im = new Float64Array(KN), wr = w * K.ri;
    for (const [a, s] of F) { const ph = a / deg; for (let n = 0; n < KN; n++) { let u = n / KN - ph; u -= Math.floor(u); re[n] += s * (1 - Math.exp(-u / wr)) * Math.exp(-u / w); } yield; }
    for (let i = 1, j = 0; i < KN; i++) { let b = KN >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; } }   // (bit reversal; im all 0)
    for (let len = 2; len <= KN; len <<= 1) {
      const a = -2 * Math.PI / len, wr0 = Math.cos(a), wi0 = Math.sin(a), h = len >> 1;
      for (let i = 0; i < KN; i += len) for (let k = 0, cr = 1, ci = 0; k < h; k++) {
        const p = i + k, q = p + h, vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr;
        re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; const t = cr * wr0 - ci * wi0; ci = cr * wi0 + ci * wr0; cr = t;
      }
    }
    const R = new Float32Array(H + 1), I = new Float32Array(H + 1);
    for (let k = 1; k <= H; k++) { R[k] = re[k] * 2 / KN; I[k] = -im[k] * 2 / KN; }   // (x = sum of R cos + I sin; the mean, k = 0, left out)
    return { re: R, im: I };
  }
  const wkey = (kind, off) => kind + (off ? '|1' : '|0'), specJob = (kind, off) => () => kitSpecGen(kind, off);
  const kitWaves = new WeakMap(), kitCurves = {}, kitNoises = new WeakMap();
  function kitWave(ac, kind, off) {   // the kind's wave (on / off the throttle) for this context (made once; its harmonics made ahead: prep)
    const key = wkey(kind, off), S = made('spec:' + key, specJob(kind, off));
    let W = kitWaves.get(ac); if (!W) kitWaves.set(ac, W = {});
    return W[key] || (W[key] = ac.createPeriodicWave(S.re, S.im));
  }
  const kitCurve = (k) => kitCurves[k] || (kitCurves[k] = shaperCurve(k));
  function* kitNoiseGen(ac) {   // 2 s of white noise (its own random numbers, not Math.random)
    const R = Core.rng(0x2c1b3), b = ac.createBuffer(1, Math.round(ac.sampleRate * 2), ac.sampleRate), d = b.getChannelData(0);
    yield* dRun({ d, R }, kWhite, 0, d.length, 0.25);
    return b;
  }
  function kWhite(S, p, e) { const d = S.d, R = S.R; for (let i = p; i < e; i++) d[i] = R() * 2 - 1; }
  function kitNoise(ac) {   // the game's context: made ahead (prep), null until it is; a probe's: now
    if (ac === ctx) return done.noise || null;
    let b = kitNoises.get(ac); if (!b) kitNoises.set(ac, b = runAll(kitNoiseGen(ac)));
    return b;
  }
  // a voice: the two waves (gA on, gB off the throttle) -> clipper -> low-pass -> resonance -> out; oC (gC) the turbo whistle (the
  // electric motor's third partial on 'ev'), the clatter (noise -> band-pass -> nG, its gain pulsed by wave A through nm), wA (wG) a
  // blower's or a hybrid motor's whine, the lope (amplitude, as engineVoice's); out -> a panner (the rivals') -> dest, and the effects' taps
  function kitVoice(ac, dest, level, pan, taps) {
    const gain = () => { const g = ac.createGain(); g.gain.value = 0; return g; }, osc = (t) => { const o = ac.createOscillator(); o.type = t; return o; };
    const oA = osc('sawtooth'), oB = osc('sawtooth'), oC = osc('sine'), wA = osc('triangle'), lope = osc('triangle');
    const gA = gain(), gB = gain(), gC = gain(), nG = gain(), nm = gain(), wG = gain(), lopeG = gain(), out = gain();
    const sh = ac.createWaveShaper(); sh.curve = kitCurve(2.2);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 1;
    const pk = ac.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1000; pk.Q.value = 1; pk.gain.value = 0;
    const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2500; nf.Q.value = 1;
    oA.connect(gA); oB.connect(gB); gA.connect(sh); gB.connect(sh); sh.connect(lp); lp.connect(pk); pk.connect(out);
    oC.connect(gC); gC.connect(out); nf.connect(nG); nG.connect(out); oA.connect(nm); nm.connect(nG.gain);
    wA.connect(wG); wG.connect(out); lope.connect(lopeG); lopeG.connect(out.gain);
    let pn = null;
    if (pan && ac.createStereoPanner) { pn = ac.createStereoPanner(); out.connect(pn); pn.connect(dest); } else out.connect(dest);
    for (const t of taps || []) if (t) out.connect(t);
    const t0 = ac.currentTime; for (const o of [oA, oB, oC, wA, lope]) o.start(t0);
    const V = { ac, oA, oB, oC, gA, gB, gC, sh, lp, pk, ns: null, nf, nG, nm, wA, wG, lope, lopeG, out, pn, dst: pn || dest, level, kind: '', car: null, on: false, tg: null,
      b: 0, lm: 0, al: 0, hb: 0, mv: 0, stopped: true, tShot: 0, tBov: 0, n: { bov: 0, pop: 0, air: 0, gear: 0, blip: 0 } };
    kitNoiseOn(V); return V;
  }
  function kitNoiseOn(V) {   // the clatter's noise into the voice (the game's: once prep has made it; until then the clatter is silent)
    const b = kitNoise(V.ac); if (!b) return;
    const ns = V.ac.createBufferSource(); ns.buffer = b; ns.loop = true; ns.connect(V.nf); ns.start(V.ac.currentTime, KR() * 1.9); V.ns = ns;
  }
  const vset = (V, p, v, tc) => { if (Number.isFinite(v)) p.setTargetAtTime(v, V.t == null ? V.ac.currentTime : V.t, tc || 0.03); };   // (set(), on the voice's own context; V.t: a probe's sweep)
  function kitKind(V, kind) {   // the voice takes a kind: its waves, clipper, resonance, clatter's band
    if (V.kind === kind) return;
    V.kind = kind; const K = KITS[kind], ac = V.ac;
    if (K.ev) { V.oA.type = 'sine'; V.oB.type = 'triangle'; V.sh.curve = kitCurve(2.2); V.lp.Q.value = 2.2; V.pk.gain.value = 0; }
    else { V.oA.setPeriodicWave(kitWave(ac, kind, false)); V.oB.setPeriodicWave(kitWave(ac, kind, true)); V.sh.curve = kitCurve(K.drive); V.lp.Q.value = K.q;
      if (K.pk) { V.pk.frequency.value = K.pk[0]; V.pk.gain.value = K.pk[1]; V.pk.Q.value = K.pk[2]; } else { V.pk.gain.value = K.pkR[1]; V.pk.Q.value = K.pkR[2]; }
      V.nf.frequency.value = K.nF; V.nf.Q.value = K.nQ; }
    for (const g of [V.nG, V.nm, V.wG, V.lopeG, V.gC]) g.gain.value = 0;
  }
  function kitReset(V, c) { V.car = c; V.b = 0; V.lm = 0; V.al = 0; V.hb = 0; V.mv = 0; V.stopped = true; }
  function kitOff(V, tc) { for (const g of [V.out, V.lopeG, V.gC, V.wG, V.nG, V.nm]) vset(V, g.gain, 0, tc || 0.03); V.on = false; }
  // one engine frame on a voice: M the model (M.sndP), s = { rpm, load, speed, brk, cut (a gear change), pl (the player's: its level
  // formula), att (a rival's distance, 0..1), dop (a rival's Doppler factor, as the old voices': every pitch of it times it), dt, tc (the
  // pitch's time constant), locked (on the grid), probe (Sfx.probe: settled at once, no one-shots) }. Leaves the targets in V.tg (Sfx.levels)
  function kitStep(V, M, s) {
    const P = M.sndP, kind = KITS[P.kind] ? P.kind : 'i4', K = KITS[kind], hz = clamp(num(P.hz, 1), 0.3, 3), loud = clamp(num(P.loud, 1), 0.1, 3), tb = clamp(num(P.turbo, 0), 0, 1);
    kitKind(V, kind); V.on = true; if (!V.ns) kitNoiseOn(V);
    const load = clamp(num(s.load, 0), 0, 1), sp = Math.max(0, num(s.speed, 0)), dt = clamp(num(s.dt, 0.016), 0, 0.1), tc = s.tc, sstep = Core.sstep, dop = clamp(num(s.dop, 1), 0.5, 2);
    V.dop = dop;
    if (K.ev) {   // the electric motors (as evWhine), at the preset's pitch and loudness
      const f = (110 + sp * 21) * hz * dop, g = (s.pl ? V.level : num(s.att, 0) ** 2 * V.level * 2.4) * loud * (0.02 + 0.06 * clamp(sp / 40, 0, 1) + 0.05 * load);
      vset(V, V.oA.frequency, f, tc); vset(V, V.oB.frequency, f * 1.5, tc); vset(V, V.oC.frequency, f * 2.98, tc);
      vset(V, V.gA.gain, 0.34, 0.05); vset(V, V.gB.gain, 0.1, 0.05); vset(V, V.gC.gain, 0.12, 0.05);
      vset(V, V.lp.frequency, 5200, 0.05); vset(V, V.out.gain, g, 0.03);
      V.tg = { ff: f, fc: f, lp: 5200, gain: g, lope: 0, dop, fs: [f, f * 1.5, f * 2.98] };
      return;
    }
    const red = M.redline > 0 ? M.redline : 7000, idle = clamp(num(M.idle, red * 0.12), 0, red * 0.9);
    const rpm = clamp(num(s.rpm, idle), Math.max(300, idle * 0.6), red * 1.08), r = clamp(rpm / red, 0.05, 1.08);
    const fc = rpm / 60 * 360 / K.deg * hz * dop, ff = fc * K.F.length, sr = V.ac.sampleRate;   // (a rival's: its Doppler factor on every pitch below)
    // the two waves (one cycle each, locked in step), harder into the clipper under load; the low-pass, the resonance
    const on = sstep(0.04, 0.75, load), pre = 0.62 + 0.36 * load;
    vset(V, V.oA.frequency, fc, tc); vset(V, V.oB.frequency, fc, tc);
    vset(V, V.gA.gain, pre * on, 0.04); vset(V, V.gB.gain, pre * (1 - on), 0.04);
    const lpf = clamp((K.l0 * dop + K.l1 * ff) * Math.sqrt(hz) * (1 + K.lL * load), 150, sr * 0.45);
    vset(V, V.lp.frequency, lpf, 0.03);
    if (K.pk) vset(V, V.pk.frequency, K.pk[0] * Math.sqrt(hz) * dop, 0.1); else vset(V, V.pk.frequency, clamp(K.pkR[0] * ff, 120, sr * 0.4), 0.03);
    // the level (the old voices' formulas: the player's, a rival's by its distance), x the preset's loudness
    const gq = (s.pl ? (0.1 + 0.1 * r + 0.1 * load) * num(s.cut, 1) * V.level : num(s.att, 0) ** 2 * (0.05 + 0.08 * r + 0.04 * load) * V.level * 3) * loud * (K.vol || 1);
    vset(V, V.out.gain, gq, 0.02);
    // the clatter, pulsed by the firings (wave A drives nm into its gain)
    const nz = K.nz * 2 * (0.35 + 0.65 * load);
    vset(V, V.nG.gain, nz * (1 - K.nAm), 0.05); vset(V, V.nm.gain, nz * K.nAm * 1.2, 0.05); vset(V, V.nf.frequency, K.nF * Math.sqrt(hz) * dop, 0.1);
    // a lumpy cam: the loudness beating at the cycle's rate, strongest at idle and off the throttle (the rotary's brap: at idle only)
    let lg = 0;
    if (K.lope) { vset(V, V.lope.frequency, fc * K.lope[0], tc); lg = gq * K.lope[1] * (K.lope[2] ? clamp(1 - K.lope[2] * r, 0, 1) : clamp(1 - r * 1.4, 0.15, 1) * (1 - 0.5 * load)); }
    vset(V, V.lopeG.gain, lg, 0.05);
    // a blower's whine (a multiple of the firing frequency, with the throttle) or a hybrid's motor (with the speed)
    let wf = 0, wg = 0;
    if (K.blow) { wf = ff * K.blow[0]; wg = K.blow[1] * (0.12 + 0.88 * Math.pow(load, K.blow[2])) * sstep(0.03, 0.4, r); }
    else if (K.motor) { wf = (260 + sp * 38) * hz * dop; wg = K.motor * (0.3 + 0.7 * load) * clamp(sp / 20, 0.12, 1); }
    if (wf) vset(V, V.wA.frequency, clamp(wf, 40, sr * 0.45), tc);
    vset(V, V.wG.gain, wg, 0.06);
    // the turbo: boost builds with the revs under load (lag), falls on a lift; its whistle; the blow-off when the throttle snaps shut on boost
    // (shut: under 0.2, from over half open a moment ago; not a driver easing off to hold a speed), at most one in 0.3 s (a gear change's
    // chuff, kitShift, dumps the boost as well); from 0.9 (a rally car's anti-lag) bangs for a second after it, until the throttle opens
    let tf = 0;
    if (tb > 0) {
      const goal = load * sstep(0.18, 0.7, r);
      V.b = s.probe ? goal : V.b + (goal - V.b) * (1 - Math.exp(-dt / (goal > V.b ? 0.5 : 0.14)));
      tf = (K.tf || 1) * (1600 + 4200 * V.b) * (0.92 + 0.16 * r) * dop;
      vset(V, V.oC.frequency, Math.min(tf, sr * 0.45), 0.05); vset(V, V.gC.gain, tb * 0.16 * Math.pow(V.b, 1.5), 0.04);
    } else vset(V, V.gC.gain, 0, 0.05);
    V.lm = Math.max(load, V.lm - dt * 2.5);
    if (!s.probe && !s.locked) {
      const att = s.pl ? 1 : num(s.att, 0) ** 2, lev = (s.pl ? 1 : V.level * 3) * loud * att;
      if (V.lm - load > 0.5 && load < 0.2) {   // the throttle snapped shut
        const now = V.ac.currentTime;
        if (tb > 0 && V.b > 0.4 && now >= V.tBov) { kitShot(V, 'bov', lev * tb * (0.25 + 0.3 * V.b), 0.92 + 0.16 * KR(), 0); V.b *= 0.3; V.tBov = now + 0.3; }
        if (tb >= 0.9 && r > 0.45) V.al = 0.7 + 0.8 * KR();
        V.lm = load;
      }
      V.al = load > 0.3 ? 0 : Math.max(0, V.al - dt);   // (back on the throttle: the anti-lag's bangs stop)
      const over = load < 0.08 && r > 0.38 ? (K.pop || 0) * (r - 0.3) * 2.5 : 0, rate = over + (V.al > 0 ? 11 : 0);
      if (rate > 0 && KR() < rate * dt) kitShot(V, 'pop' + Math.floor(KR() * 3), lev * (V.al > 0 ? 0.3 + 0.25 * KR() : 0.12 + 0.12 * KR()), 0.85 + 0.3 * KR(), 0);
      if (K.air) {   // air brakes: a short hiss as hard braking lets off, the long one when the truck comes to a stop
        const brk = clamp(num(s.brk, 0), 0, 1);
        if (brk > 0.55 && sp > 5) V.hb = Math.min(3, V.hb + dt); else if (V.hb > 0.4 && brk < 0.15) { kitShot(V, 'air0', lev * 0.3, 0.95 + 0.1 * KR(), 0); V.hb = 0; } else if (brk < 0.15) V.hb = 0;
        V.mv = sp > 3 ? 2.5 : Math.max(0, V.mv - dt);
        if (sp < 0.5) { if (!V.stopped && V.mv > 0) kitShot(V, 'air1', lev * 0.42, 0.95 + 0.1 * KR(), 0); V.stopped = true; } else if (sp > 2) V.stopped = false;
      }
    }
    V.tg = { ff, fc, lp: lpf, gain: gq, lope: lg, whine: wf, turbo: tf, boost: V.b, dop, fs: [fc, ff, lpf, wf, tf, fc * (K.lope ? K.lope[0] : 1)] };
  }
  // a one-shot on a voice's side (its panner; the player's: the bus): a buffer of the destruction / exhaust set (dBuf)
  function kitShot(V, name, vol, rate, t, also) {   // (also: one more right after the last, not held off by it: a gear change's bang after its chuff)
    if (!enabled || !running || !(vol > 1e-3) || V.ac !== ctx) return;
    const now = ctx.currentTime; if (now < V.tShot && !also) return;
    const b = dBuf(name); if (!b) return; V.tShot = now + 0.03;
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.playbackRate.value = rate; g.gain.value = Math.min(1, vol);
    s.connect(g); g.connect(V.dst); s.start(now + (t || 0));
    const k = name.slice(0, 3); if (k in V.n) V.n[k]++;   // (Sfx.levels: the player's blow-offs, bangs, air brakes)
  }
  // a vehicle with a preset changing up (kitGear, with the gearbox's clack): a turbo's chuff (the boost dumped, as a lift's: no second
  // blow-off right after it), an anti-lag's bang, an exhaust's pop
  function kitShift() {
    const V = kitPl; if (!V || !V.on) return;
    const K = KITS[V.kind], P = plM && plM.sndP; if (!K || K.ev || !P) return;
    const tb = clamp(num(P.turbo, 0), 0, 1), loud = clamp(num(P.loud, 1), 0.1, 3), now = ctx.currentTime;
    if (tb > 0 && V.b > 0.35 && now >= V.tBov) { kitShot(V, 'bov', loud * tb * 0.2 * V.b, 1.25 + 0.15 * KR(), 0); V.b *= 0.3; V.tBov = now + 0.3; }
    if (tb >= 0.9) kitShot(V, 'pop' + Math.floor(KR() * 3), loud * (0.35 + 0.2 * KR()), 0.9 + 0.2 * KR(), 0.02, true);
    else if (K.sp) kitShot(V, 'pop' + Math.floor(KR() * 3), loud * K.sp * 0.35, 0.75 + 0.3 * KR(), 0.01);
  }
  let kitPl = null, plM = null;   // the player's voice with a preset (and its model while it plays)
  const kitAI = [null, null, null];   // the nearest rivals' (pinned to their cars while they stay among the three nearest)
  const kitW = [], aiSeen = [null, null, null];   // (update's list of the rivals with a preset among the three nearest; what each one plays: Sfx.levels)
  const engTaps = () => [echo && echo.send, tun && tun.send, atmo && atmo.x && atmo.x.hp];   // (the player's engine feeds the Pikes echo, a tunnel's ring, the rock slap)
  function kitPlayer(P, M, revInput, dt) {
    set(eng.out.gain, 0, 0.02); set(eng.tg.gain, 0, 0.02);   // (the old voice silent)
    if (!kitPl) kitPl = kitVoice(ctx, bus, 1.0, false, engTaps());
    if (kitPl.car !== P) kitReset(kitPl, P);
    const thr = clamp(num(revInput, 0), 0, 1), locked = !!P.locked;
    let rpm = P.rpm;
    if (locked) rpm = M.idle + (M.redline * 0.82 - M.idle) * thr + KR() * 60 * thr;   // (on the grid: revving with the throttle, as the old voice)
    kitStep(kitPl, M, { rpm, load: locked ? thr : P.inThr, speed: P.speed, brk: P.inBrk, cut: P.shiftT > 0 ? 0.35 : 1, pl: true, dt, tc: 0.015, locked });
    plM = M;
  }
  // the rivals with a preset among the three nearest (W: [car, its engine slot k, distance, pan (its side of the camera; null: none)]): each
  // keeps its voice while it stays there, at its slot's Doppler factor (update: as the old voices')
  function kitRivals(W, dt) {
    for (const V of kitAI) if (V) V.keep = false;
    for (const w of W) { const V = kitAI.find(V => V && V.car === w[0]); if (V && !V.keep) { V.keep = true; w[4] = V; } }
    for (const w of W) if (!w[4]) {
      let j = kitAI.findIndex(V => V && !V.keep); if (j < 0) j = kitAI.indexOf(null); if (j < 0) continue;
      if (!kitAI[j]) kitAI[j] = kitVoice(ctx, bus, 0.25, true, [tun && tun.send]);
      const V = kitAI[j]; V.keep = true; kitReset(V, w[0]); w[4] = V;
    }
    for (const V of kitAI) if (V && !V.keep && V.on) kitOff(V, 0.05);
    for (const [c, k, d, pan, V] of W) {
      if (!V) continue;
      const M = c.m, loud = clamp(num(M.sndP.loud, 1), 0.1, 3), att = clamp(1 - d / (70 * (0.5 + 0.5 * loud)), 0, 1);
      V.level = ai[k].level;
      kitStep(V, M, { rpm: c.rpm, load: c.inThr || 0, speed: c.speed, brk: c.inBrk, cut: 1, pl: false, att, dop: ai[k].dop, dt, tc: 0.03, locked: !!c.locked });
      aiSeen[k] = [M.id, V.kind, V.dop, V.tg ? V.tg.ff : null];
      if (V.pn && pan != null) set(V.pn.pan, pan, 0.05);
    }
  }
  // tests: one preset rendered offline (no one-shots): o = { kind, hz, turbo, loud, rpm, redline, idle, load, speed, dur, sr }, settled at
  // once; or sweep: [[t, rpm, load, speed], ...], each step a frame at its time (the turbo spooling as it would) -> Promise of the samples
  // (Float32Array, .tg: the voice's last targets). shot: a one-shot's buffer instead (its samples; the sound running)
  function probe(o) {
    if (o.shot) { const b = ctx && dBuf(o.shot); return Promise.resolve(b ? b.getChannelData(0).slice() : null); }
    const sr = o.sr || 44100, n = Math.round((o.dur || 0.5) * sr), OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return Promise.resolve(null);
    const ac = new OAC(1, n, sr), V = kitVoice(ac, ac.destination, 1, false, null);
    const M = { sndP: { kind: o.kind, hz: o.hz == null ? 1 : o.hz, loud: o.loud == null ? 1 : o.loud, turbo: o.turbo || 0 }, redline: o.redline || 7000, idle: o.idle == null ? 900 : o.idle };
    if (o.sweep) for (let i = 0; i < o.sweep.length; i++) {   // (a sweep: [t, rpm, load, speed], each step scheduled at its time, as a frame would set it)
      const [t, rpm, load, speed] = o.sweep[i]; V.t = t;
      kitStep(V, M, { rpm, load, speed: speed || 0, brk: 0, cut: 1, pl: true, dt: i ? t - o.sweep[i - 1][0] : 0.016, tc: 0.015, probe: !!o.settle });
    }
    else kitStep(V, M, { rpm: o.rpm, load: o.load || 0, speed: o.speed || 0, brk: 0, cut: 1, pl: true, dt: 0.016, tc: 0.002, probe: true });
    const tg = V.tg;
    return ac.startRendering().then(b => { const d = b.getChannelData(0); d.tg = tg; return d; });
  }

  /* ---- FLEET: destruction, heard (the player's car and the cars near it, by their distance and side, as the rivals' engines): a panel
     off (a clang as it tears away and lands, then its scrape along the road: metal, plastic or carbon by the part, bigger by its mass), a
     window shattering, a wheel knocked off (the hub letting go, then the wheel bouncing away), a hub scraping the road while that car
     moves on (louder on asphalt, beating with the hub's turn), a fire's crackle while it burns (render's rule: dmg >= 0.9, or the bonnet /
     engine cover off and dmg >= 0.75; 20 s from when it starts), a wreck's crunch at dmg 0.98. Nothing in game.js: update compares every
     car's state with what it was last frame (c.lost, winOut, wreck.wl, dmg); a repair (repairN) or the marshals' refit (wreck.fix) resets
     what it remembers. The one-shots and the loops are buffers made ahead (prep, below), each with its own random numbers (never
     Math.random). At most DS_MAX one-shots play at a time; in one frame a buffer plays at most twice (a pile-up's: the loudest, then the
     rest as one, a little later), every kind's first before any second (dPlays); the loops a small pool (the nearest cars). Nothing is
     made or played with the sound off ---- */
  const DS_SR = 22050, DS_MAX = 8, D_R = 120, D_RL = 70, D_FIRE = 20;
  const dMem = new WeakMap(), dLive = [], dEv = [], dQ = [], dFireC = [], dScrC = [], dFireV = [null, null, null], dScrV = [null, null], dLast = [];
  const dN = { clang: 0, glass: 0, wheel: 0, crunch: 0, seen: 0, merged: 0, dropped: 0, frame: null };
  // a part's material: plastic (mirrors, bumpers, skirts, a deflector...), carbon (a wing, a nose, scoops, covers, pods), else metal
  const D_MAT = { mirrorL: 'p', mirrorR: 'p', bumperF: 'p', bumperR: 'p', skirtL: 'p', skirtR: 'p', deflector: 'p', lightbar: 'p', grille: 'p', spare: 'p', wing: 'c', nose: 'c', scoop: 'c', cover: 'c', podL: 'c', podR: 'c' };
  // (the makers are generators, so prep can stop between two slices of a buffer: dRun drives a kernel, a plain function over the samples
  // p..e of a sound (S: its state between two calls), CH samples a call, and yields after each DY samples' work. The sample loops are in
  // the kernels, not in the generators: V8 optimises a hot loop in a plain function at once, a generator's hardly. R: the buffer's own
  // random numbers)
  const CH = 1024, DY = 4096; let dW = 0;
  function* dRun(S, k, p, n, w) {   // kernel k over the samples p..n (w: a sample's work, 1 = a filtered noise's); false from k: done early
    while (p < n) { const e = Math.min(n, p + CH); if (k(S, p, e) === false) return; dW += (e - p) * w; p = e; if (dW >= DY) { dW = 0; yield; } }
  }
  function kPeak(S, p, e) { const d = S.d; let pk = S.pk; for (let i = p; i < e; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; } S.pk = pk; }
  function kScale(S, p, e) { const d = S.d, o = S.o, k = S.k; for (let i = p; i < e; i++) o[i] = d[i] * k; }
  function* dOut(d) {   // -> an AudioBuffer (DS_SR), its peak at 0.9
    const S = { d, pk: 0, o: null, k: 0 }; yield* dRun(S, kPeak, 0, d.length, 0.25);
    const b = ctx.createBuffer(1, d.length, DS_SR); S.o = b.getChannelData(0); S.k = S.pk > 0 ? 0.9 / S.pk : 0;
    yield* dRun(S, kScale, 0, d.length, 0.25);
    return b;
  }
  // a struck partial (a sine by recursion, as the cowbells'): f Hz from sample i0, amplitude a, dying with time constant tau
  function kPart(S, p, e) {
    const d = S.d, c2 = S.c2, k = S.k; let s1 = S.s1, s2 = S.s2, g = S.g, j = S.j;
    for (let i = p; i < e && g > 1e-4; i++, j++) { const s = c2 * s1 - s2; s2 = s1; s1 = s; d[i] += s * g * (j < 10 ? j / 10 : 1); g *= k; }
    S.s1 = s1; S.s2 = s2; S.g = g; S.j = j; return g > 1e-4;
  }
  function* dPart(d, i0, f, a, tau) {
    const w = 2 * Math.PI * f / DS_SR; if (!(w > 0 && w < 2.9)) return;
    yield* dRun({ d, c2: 2 * Math.cos(w), k: Math.exp(-1 / (tau * DS_SR)), s1: Math.sin(-w), s2: Math.sin(-2 * w), g: a, j: 0 }, kPart, Math.max(0, i0), d.length, 1);
  }
  // a burst of band-passed noise from i0 (len samples, decay tau, attack att samples)
  function kNoise(S, p, e) {
    const d = S.d, R = S.R, b0 = S.b0, a1 = S.a1, a2 = S.a2, k = S.k, A = S.A; let x1 = S.x1, x2 = S.x2, y1 = S.y1, y2 = S.y2, g = S.g, j = S.j;
    for (let i = p; i < e; i++, j++) { const x = R() * 2 - 1, y = b0 * (x - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; d[i] += y * g * (j < A ? j / A : 1); g *= k; }
    S.x1 = x1; S.x2 = x2; S.y1 = y1; S.y2 = y2; S.g = g; S.j = j;
  }
  function* dNoise(R, d, i0, f, q, a, tau, len, att) {
    const [b0, a1, a2] = bpf(Math.min(f, DS_SR * 0.45), q, DS_SR);
    yield* dRun({ d, R, b0, a1, a2, k: Math.exp(-1 / (tau * DS_SR)), A: att || 3, x1: 0, x2: 0, y1: 0, y2: 0, g: a, j: 0 }, kNoise, Math.max(0, i0), Math.min(d.length, i0 + len), 1);
  }
  // a thump: a sine falling from f0 to f1, dying (tau)
  function kThump(S, p, e) {
    const d = S.d, f0 = S.f0, f1 = S.f1, a = S.a, tau = S.tau; let ph = S.ph, j = S.j;
    for (let i = p; i < e; i++, j++) { const u = j / DS_SR, f = f1 + (f0 - f1) * Math.exp(-u / 0.05); ph += 2 * Math.PI * f / DS_SR; d[i] += Math.sin(ph) * a * Math.exp(-u / tau) * Math.min(1, j / 24); }
    S.ph = ph; S.j = j;
  }
  function* dThump(d, i0, f0, f1, a, tau, len) { yield* dRun({ d, f0, f1, a, tau, ph: 0, j: 0 }, kThump, Math.max(0, i0), Math.min(d.length, i0 + len), 2); }
  // a struck panel: inharmonic modes (paired on metal, so it shimmers), the upper ones dying sooner; plastic and carbon dull and short, cracking
  function* dPanel(R, d, i0, f0, a, mat, size) {
    const RT = [1, 1.52, 2.11, 2.73, 3.37, 4.18, 5.4], A = [1, 0.75, 0.6, 0.45, 0.32, 0.22, 0.14], T = [0.42, 0.3, 0.22, 0.16, 0.12, 0.09, 0.06];
    const td = mat === 'm' ? 0.5 + 0.5 * size : mat === 'p' ? 0.16 : 0.12, nP = mat === 'm' ? 7 : mat === 'p' ? 4 : 5;
    for (let p = 0; p < nP; p++) for (const dt of mat === 'm' ? [-0.004, 0.004] : [0]) yield* dPart(d, i0, f0 * RT[p] * (1 + dt + (R() - 0.5) * 0.01), a * A[p] * (mat === 'm' ? 0.5 : 1), T[p] * td * (0.8 + 0.4 * R()));
    yield* dNoise(R, d, i0, mat === 'c' ? 3800 : mat === 'p' ? 1600 : f0 * 3, mat === 'm' ? 1.5 : 0.7, a * (mat === 'm' ? 0.5 : 1.1), mat === 'c' ? 0.006 : 0.012, Math.round(0.06 * DS_SR));
  }
  function* dClang(R, mat, size) {   // a panel off: struck as it tears away, struck again as it lands, then scraping along the road, tumbling
    const d = new Float32Array(Math.round((0.65 + 0.35 * size) * DS_SR)), f0 = (mat === 'm' ? [1150, 440, 240] : mat === 'p' ? [760, 330, 210] : [900, 520, 380])[size];
    yield* dPanel(R, d, 0, f0, 1, mat, size);
    yield* dPanel(R, d, Math.round((0.07 + 0.06 * R()) * DS_SR), f0 * (1.1 + 0.2 * R()), 0.45, mat, size);
    const i0 = Math.round(0.05 * DS_SR), L = d.length - i0, fl = 9 + 8 * R(), [b0, a1, a2] = bpf(mat === 'm' ? 2600 : 1900, 1.6, DS_SR);
    yield* dRun({ d, R, b0, a1, a2, L, i0, amp: 0.28 + 0.1 * size, fl, x1: 0, x2: 0, y1: 0, y2: 0 }, kTumble, 0, L, 2);
    return yield* dOut(d);
  }
  function kTumble(S, p, e) {   // (dClang's: the panel scraping along the road, tumbling; the samples p..e after i0)
    const d = S.d, R = S.R, b0 = S.b0, a1 = S.a1, a2 = S.a2, L = S.L, i0 = S.i0, amp = S.amp, fl = S.fl; let x1 = S.x1, x2 = S.x2, y1 = S.y1, y2 = S.y2;
    for (let j = p; j < e; j++) {
      const u = j / L, x = R() * 2 - 1, y = b0 * (x - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y;
      d[i0 + j] += y * amp * Math.sin(Math.PI * Math.min(1, u * 6)) * (1 - u) * (0.6 + 0.4 * Math.sin(2 * Math.PI * fl * j / DS_SR + 3 * u));
    }
    S.x1 = x1; S.x2 = x2; S.y1 = y1; S.y2 = y2;
  }
  function* dGlass(R) {   // the crack, then the shards: a crowd of short high pings, dense at first, a few still falling
    const d = new Float32Array(Math.round(0.95 * DS_SR));
    yield* dNoise(R, d, 0, 4200, 0.6, 1, 0.012, Math.round(0.05 * DS_SR), 2); yield* dNoise(R, d, 0, 1500, 0.9, 0.5, 0.02, Math.round(0.06 * DS_SR), 2);
    for (let k = 0; k < 42; k++) {
      const t = Math.min(0.85, 0.008 - Math.log(1 - R() * 0.98) * 0.13), a = 0.55 * Math.exp(-t / 0.35) * (0.3 + 0.7 * R()), f = 2600 + R() * 6200, i = Math.round(t * DS_SR);
      yield* dPart(d, i, f, a, 0.008 + 0.03 * R()); if (R() < 0.4) yield* dPart(d, i, f * (1.4 + 0.3 * R()), a * 0.5, 0.006);
    }
    return yield* dOut(d);
  }
  function* dWheel(R) {   // the hub letting go (a clunk), the wheel bouncing away (each bounce lower and sooner), rolling off
    const d = new Float32Array(Math.round(1.9 * DS_SR));
    yield* dPanel(R, d, 0, 170, 0.8, 'p', 1); yield* dPart(d, 0, 340, 0.25, 0.12); yield* dThump(d, 0, 95, 48, 1, 0.12, Math.round(0.4 * DS_SR)); yield* dNoise(R, d, 0, 500, 1, 0.7, 0.03, Math.round(0.1 * DS_SR));
    let t = 0.16;
    for (let k = 0, iv = 0.3; k < 7; k++, iv *= 0.78) {
      t += iv; const a = 0.85 * Math.pow(0.72, k), i = Math.round(t * DS_SR);
      yield* dThump(d, i, 120 + 15 * R(), 62, a, 0.07, Math.round(0.2 * DS_SR)); yield* dNoise(R, d, i, 420, 1, a * 0.35, 0.025, Math.round(0.06 * DS_SR));
    }
    const i1 = Math.round((t + 0.05) * DS_SR); yield* dNoise(R, d, i1, 260, 0.8, 0.25, 0.28, d.length - i1, Math.round(0.08 * DS_SR));
    return yield* dOut(d);
  }
  function* dCrunch(R) {   // a wreck: a deep boom and a crash, panels struck and glass, the shell settling with a creak
    const d = new Float32Array(Math.round(1.6 * DS_SR));
    yield* dThump(d, 0, 75, 36, 1, 0.3, d.length); yield* dNoise(R, d, 0, 1800, 0.5, 0.9, 0.16, Math.round(0.6 * DS_SR), 2); yield* dNoise(R, d, 0, 450, 0.7, 0.9, 0.25, Math.round(0.8 * DS_SR), 2);
    for (let k = 0; k < 5; k++) yield* dPanel(R, d, Math.round(R() * 0.45 * DS_SR), 280 + R() * 800, 0.35 + 0.3 * R(), k < 2 ? 'm' : 'p', 0);
    for (let k = 0; k < 14; k++) yield* dPart(d, Math.round((0.03 + R() * 0.6) * DS_SR), 2800 + R() * 5500, 0.18 * (0.4 + 0.6 * R()), 0.01 + 0.02 * R());
    yield* dNoise(R, d, Math.round(0.55 * DS_SR), 700, 6, 0.2, 0.3, Math.round(0.9 * DS_SR), Math.round(0.1 * DS_SR));
    return yield* dOut(d);
  }
  // a loop without a seam: dur s of fill's sound (a generator), its start blended (equal power) with what follows its end
  function* dLoop(dur, fill) {
    const n = Math.round(dur * DS_SR), m = Math.round(0.12 * DS_SR), d = new Float32Array(n + m); yield* fill(d);
    for (let i = 0; i < m; i++) { const u = i / m; d[i] = d[i] * Math.sqrt(u) + d[n + i] * Math.sqrt(1 - u); }
    return yield* dOut(d.subarray(0, n));
  }
  function dScrapeBuf(R) {   // a hub on the road: grinding metal in three bands, a squeal wandering in pitch, grit
    return dLoop(1.6, function* (d) {
      const n = d.length;
      for (const [f, q, a] of [[1900, 4, 0.9], [3700, 6, 0.6], [900, 2, 0.4]]) { const [b0, a1, a2] = bpf(f, q, DS_SR); yield* dRun({ d, R, b0, a1, a2, a, x1: 0, x2: 0, y1: 0, y2: 0, en: 0.8, eg: 0.8 }, kBand, 0, n, 1.2); }
      yield* dRun({ d, R, f: 2500, fg: 2500, ph: 0 }, kSqueal, 0, n, 1);
      for (let k = 0; k < 70; k++) yield* dNoise(R, d, Math.floor(R() * n), 3000 + R() * 3000, 2, 0.3 + 0.4 * R(), 0.004, 200);
    });
  }
  function kBand(S, p, e) {   // (dScrapeBuf's grinding: a band of noise, its loudness wandering)
    const d = S.d, R = S.R, b0 = S.b0, a1 = S.a1, a2 = S.a2, a = S.a; let x1 = S.x1, x2 = S.x2, y1 = S.y1, y2 = S.y2, en = S.en, eg = S.eg;
    for (let i = p; i < e; i++) { if ((i & 255) === 0) eg = 0.55 + 0.45 * R(); en += (eg - en) * 0.004; const x = R() * 2 - 1, y = b0 * (x - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; d[i] += y * a * en; }
    S.x1 = x1; S.x2 = x2; S.y1 = y1; S.y2 = y2; S.en = en; S.eg = eg;
  }
  function kSqueal(S, p, e) {   // (and its squeal, wandering in pitch)
    const d = S.d, R = S.R; let f = S.f, fg = S.fg, ph = S.ph;
    for (let i = p; i < e; i++) { if ((i & 127) === 0) fg = clamp(fg + (R() - 0.5) * 90, 2200, 2900); f += (fg - f) * 0.01; ph += 2 * Math.PI * f / DS_SR; d[i] += Math.sin(ph) * 0.05; }
    S.f = f; S.fg = fg; S.ph = ph;
  }
  function dFireBuf(R) {   // a car on fire: the roar (dark noise swelling and ebbing) and the crackle (many small snaps, a few louder pops)
    return dLoop(3.2, function* (d) {
      const n = d.length;
      yield* dRun({ d, R, k1: 1 - Math.exp(-2 * Math.PI * 260 / DS_SR), l1: 0, l2: 0, en: 0.5, eg: 0.5 }, kRoar, 0, n, 0.5);
      for (let k = 0, nT = Math.round(38 * n / DS_SR); k < nT; k++) yield* dNoise(R, d, Math.floor(R() * n), 1500 + R() * 4500, 1.2, 0.08 + 0.5 * Math.pow(R(), 3), 0.002 + 0.004 * R(), 160, 1);
      for (let k = 0, nP = Math.round(3 * n / DS_SR); k < nP; k++) { const i = Math.floor(R() * n); yield* dNoise(R, d, i, 500 + R() * 500, 1, 0.5 + 0.4 * R(), 0.012, 600, 2); yield* dThump(d, i, 150, 80, 0.25, 0.03, 900); }
    });
  }
  function kRoar(S, p, e) {   // (dFireBuf's roar: dark noise, swelling and ebbing)
    const d = S.d, R = S.R, k1 = S.k1; let l1 = S.l1, l2 = S.l2, en = S.en, eg = S.eg;
    for (let i = p; i < e; i++) { if ((i & 511) === 0) eg = 0.25 + 0.75 * R(); en += (eg - en) * 0.002; l1 += (R() * 2 - 1 - l1) * k1; l2 += (l1 - l2) * k1; d[i] += l2 * 2.2 * en; }
    S.l1 = l1; S.l2 = l2; S.en = en; S.eg = eg;
  }
  function* dPop(R, k) {   // an exhaust's bang (overrun, anti-lag, a gear change)
    const d = new Float32Array(Math.round(0.14 * DS_SR));
    yield* dThump(d, 0, 140 - 20 * k, 60, 0.9, 0.035, d.length); yield* dNoise(R, d, 0, 2300 + 700 * k, 0.6, 1, 0.009 + 0.003 * k, d.length, 1); yield* dNoise(R, d, 0, 700, 0.9, 0.5, 0.02, d.length, 2);
    return yield* dOut(d);
  }
  function* dBov(R) {   // a turbo's blow-off valve: a hiss of air, fluttering as it opens
    const d = new Float32Array(Math.round(0.5 * DS_SR));
    yield* dNoise(R, d, 0, 3300, 0.6, 1, 0.13, d.length, Math.round(0.012 * DS_SR)); yield* dNoise(R, d, 0, 1300, 0.8, 0.45, 0.09, d.length, Math.round(0.01 * DS_SR));
    yield* dRun({ d }, kFlutter, 0, d.length, 1);
    return yield* dOut(d);
  }
  function kFlutter(S, p, e) { const d = S.d; for (let i = p; i < e; i++) { const u = i / DS_SR; d[i] *= 1 - 0.35 * Math.max(0, 1 - u / 0.25) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 23 * u)); } }   // (dBov's flutter)
  function* dAir(R, long) {   // a truck's air brakes: the short hiss as they let off, the long one at a stop
    const d = new Float32Array(Math.round((long ? 1.2 : 0.45) * DS_SR));
    yield* dNoise(R, d, 0, 4800, 0.7, 1, long ? 0.42 : 0.12, d.length, 40); yield* dNoise(R, d, 0, 2600, 1, 0.45, long ? 0.3 : 0.1, d.length, 40); yield* dPart(d, 0, 5200, 0.05, long ? 0.35 : 0.1);
    return yield* dOut(d);
  }
  const D_MAKE = { glass: dGlass, wheel: dWheel, crunch: dCrunch, scrape: dScrapeBuf, fire: dFireBuf, bov: dBov, air0: (R) => dAir(R, false), air1: (R) => dAir(R, true), pop0: (R) => dPop(R, 0), pop1: (R) => dPop(R, 1), pop2: (R) => dPop(R, 2) };
  // the order prep makes them in (the exhaust's small ones first: a lift can come at once; then what breaks most often)
  const D_ORDER = ['pop0', 'pop1', 'pop2', 'bov', 'air0', 'air1', 'clangp1', 'clangm1', 'glass', 'clangm2', 'clangp0', 'wheel', 'crunch', 'fire', 'scrape', 'clangm0', 'clangp2', 'clangc0', 'clangc1', 'clangc2'];
  function dMake(name) {   // name's maker (clang<m|p|c><0..2>: a panel's, by material and size), its random numbers seeded by the name
    let h = 0x5fd1e7; for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x9e3779b1);
    const R = Core.rng(h >>> 0), m = /^clang([mpc])([0-2])$/.exec(name);
    return m ? dClang(R, m[1], +m[2]) : D_MAKE[name](R);
  }
  const dBuf = (name) => made('d:' + name, () => dMake(name));   // a one-shot's or a loop's buffer (made now if prep has not made it yet)
  const dBurning = (c) => c.dmg >= 0.9 || (!!c.lost && (c.lost.hood || c.lost.cover) && c.dmg >= 0.75);
  function dSnap(c, t) {   // what a car is like now (its first frame, or after a repair: nothing to tell)
    const L = {}, W = c.wreck; let n = 0; if (c.lost) for (const k in c.lost) { L[k] = 1; n++; }
    return { rep: c.repairN || 0, fix: W ? W.fix : 0, wl: W ? W.wl : 0, n, L, win: [0, 1, 2, 3].map(k => (c.winOut && c.winOut[k] ? 1 : 0)), crunch: c.dmg >= 0.98, fire: dBurning(c) ? t : null, fired: false };
  }
  // every car of a list against what it was: the new events onto dEv ([car, kind, part, size, count]); the burning ones onto dFireC, the
  // ones moving on a hub onto dScrC
  function dScan(cars, t) {
    for (const c of cars) {
      if (!c || !c.lost) continue;
      let S = dMem.get(c);
      if (!S || (c.repairN || 0) !== S.rep) { dMem.set(c, S = dSnap(c, t)); if (S.fire != null) dFireC.push([c, S]); continue; }
      const W = c.wreck;
      if (W && W.fix !== S.fix) { S.fix = W.fix; S.wl = W.wl; for (const k in S.L) if (!c.lost[k]) { delete S.L[k]; S.n--; } }   // (the marshals' refit: the wheels back on)
      let n = 0; for (const k in c.lost) n++;
      if (n !== S.n) {   // parts off: the heaviest one tells (a wheel by wreck.wl below)
        const PT = Core.partsOf(c.m); let best = null, cnt = 0;
        for (const k in c.lost) {
          if (S.L[k]) continue; S.L[k] = 1; S.n++;
          const p = PT[k]; if (p && p.wh != null) continue;
          const m = p && p.m > 0 ? p.m : 3; cnt++; if (!best || m > best[1]) best = [k, m];
        }
        if (best) dEv.push([c, 'clang', best[0], best[1], cnt]);
      }
      let g = 0; const wo = c.winOut; if (wo) for (let k = 0; k < 4; k++) if (wo[k] && !S.win[k]) { S.win[k] = 1; g++; }
      if (g) dEv.push([c, 'glass', '', g, g]);
      if (W) { const nw = W.wl & ~S.wl; S.wl = W.wl; if (nw) { let b = 0; for (let k = 0; k < 4; k++) if (nw & (1 << k)) b++; dEv.push([c, 'wheel', '', b, b]); } }
      if (!S.crunch && c.dmg >= 0.98) { S.crunch = true; dEv.push([c, 'crunch', '', 1, 1]); }
      if (S.fire == null && !S.fired && dBurning(c)) S.fire = t;
      if (S.fire != null && t - S.fire > D_FIRE) { S.fire = null; S.fired = true; }
      if (S.fire != null) dFireC.push([c, S]);
      if (W && W.wl && c.speed > 2) dScrC.push([c, S]);
    }
  }
  // where a car is heard from the player's: [loudness (1 - d / R)^2, pan (its side on the screen)], null beyond R
  function dWhere(c, P, cam, R) {
    const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz); if (!(d < R)) return null;
    let pan = 0;
    if (c !== P) { pan = clamp(dx / 40, -0.9, 0.9); if (cam) { const e = cam.matrixWorld.elements, lx = c.x - cam.position.x, lz = c.z - cam.position.z; pan = clamp((lx * e[0] + lz * e[2]) / Math.max(3, Math.hypot(lx, lz)) * 1.2, -0.85, 0.85); } }
    const a = 1 - d / R; return [a * a, pan];
  }
  function dPlay(name, vol, pan, rate, delay) {   // a one-shot, if fewer than DS_MAX are playing
    if (!(vol > 1e-3)) return false;
    const now = ctx.currentTime;
    for (let i = dLive.length - 1; i >= 0; i--) if (dLive[i] <= now) dLive.splice(i, 1);
    if (dLive.length >= DS_MAX) { dN.dropped++; return false; }
    const b = dBuf(name); if (!b) return false;
    const s = ctx.createBufferSource(), g = ctx.createGain(), pn = mkPan(clamp(num(pan, 0), -1, 1)), t = now + (delay || 0);
    s.buffer = b; s.playbackRate.value = rate; g.gain.value = Math.min(1, vol); s.connect(g); g.connect(pn); pn.connect(bus); s.start(t);
    dLive.push(t + b.duration / rate);
    return true;
  }
  const D_VOL = { clang: 0.42, glass: 0.36, wheel: 0.55, crunch: 0.75 };
  // one frame's one-shots (Q: [buffer, gain, pan, rate, delay, kind, events, label]): a buffer at most twice, the loudest and then the
  // rest as one, 10-40 ms later (not one smeared, doubled copy: the gains summed as unrelated noises sum, the root of the squares, and no
  // louder than the first); every kind's first play before the other first plays, those before the seconds, the loudest first within
  // each (a pile-up's glass and panels heard, not eight crunches); DS_MAX drops the rest
  function dPlays(Q) {
    const G = new Map(), L = [], first = {};
    for (const q of Q) { const g = G.get(q[0]); if (g) g.push(q); else G.set(q[0], [q]); }
    for (const g of G.values()) {
      g.sort((a, b) => b[1] - a[1]); L.push({ q: g[0], r: 0 });
      if (g.length < 2) continue;
      let e2 = 0, ev = 0; for (let i = 1; i < g.length; i++) { e2 += g[i][1] * g[i][1]; ev += g[i][6]; }
      const A = g[0], B = g[1];
      L.push({ q: [B[0], Math.min(A[1], Math.sqrt(e2)), B[2], B[3], Math.max(B[4], A[4] + 0.01 + 0.03 * KR()), B[5], ev, B[7]], r: 2 });
      dN.merged += g.length - 2;
    }
    L.sort((a, b) => b.q[1] - a.q[1]);
    for (const x of L) if (!x.r) { if (first[x.q[5]]) x.r = 1; else first[x.q[5]] = 1; }
    L.sort((a, b) => a.r - b.r || b.q[1] - a.q[1]);
    const F = dN.frame = { events: 0, plays: {} };
    for (const { q } of L) {
      F.events += q[6];
      if (!dPlay(q[0], q[1], q[2], q[3], q[4])) continue;
      F.plays[q[0]] = (F.plays[q[0]] || 0) + 1; dN[q[5]] += q[6];
      if (q[7]) { dLast.push(q[7]); if (dLast.length > 12) dLast.shift(); }
    }
  }
  // a loop's voice (fire: the crackle; scrape: a hub's grinding, beating with the hub's turn through am)
  function dLoopVoice(name) {
    const b = dBuf(name); if (!b) return null;
    const s = ctx.createBufferSource(), g = ctx.createGain(), pn = mkPan(0); s.buffer = b; s.loop = true; s.playbackRate.value = 0.9 + 0.2 * KR(); g.gain.value = 0;
    s.connect(g); g.connect(pn); pn.connect(bus);
    let am = null, amg = null;
    if (name === 'scrape') { am = ctx.createOscillator(); am.type = 'sine'; am.frequency.value = 8; amg = ctx.createGain(); amg.gain.value = 0; am.connect(amg); amg.connect(g.gain); am.start(); }
    s.start(ctx.currentTime, KR() * b.duration * 0.9); return { s, g, pn, am, amg, car: null, keep: false };
  }
  // the loops' pool: the loudest cars (C: [car, gain, pan, extra]) each keep their voice while they stay among them; the rest fall silent
  function dPool(V, C, name, apply) {
    C.sort((a, b) => b[1] - a[1]); if (C.length > V.length) C.length = V.length;
    for (const v of V) if (v) v.keep = false;
    for (const e of C) { const v = V.find(v => v && v.car === e[0] && !v.keep); if (v) { v.keep = true; e[4] = v; } }
    for (const e of C) if (!e[4]) { let j = V.findIndex(v => v && !v.keep); if (j < 0) j = V.indexOf(null); if (j < 0) continue; if (!V[j]) V[j] = dLoopVoice(name); if (!V[j]) continue; V[j].keep = true; V[j].car = e[0]; e[4] = V[j]; }
    for (const v of V) if (v && !v.keep && v.car) { set(v.g.gain, 0, 0.12); if (v.amg) set(v.amg.gain, 0, 0.1); v.car = null; }
    for (const e of C) if (e[4]) { set(e[4].g.gain, e[1], 0.1); if (e[4].pn.pan) set(e[4].pn.pan, e[2], 0.1); apply(e[4], e); }
  }
  function dStep(race, P) {
    const t = Number.isFinite(race.time) ? race.time : ctx.currentTime, cam = typeof Render !== 'undefined' ? Render.camera : null;
    dEv.length = 0; dFireC.length = 0; dScrC.length = 0;
    dScan(race.cars, t); if (race.pol && race.pol.cars) dScan(race.pol.cars, t);
    // the one-shots: each event's play (and a second for several panels or wheels at once), by its distance and side; dPlays
    const Q = dQ; Q.length = 0;
    for (const [c, k, part, m, cnt] of dEv) {
      const w = dWhere(c, P, cam, D_R), v = w ? w[0] * D_VOL[k] : 0;
      if (!w || v < 0.002) continue;
      dN.seen++; if (!enabled || !running) continue;
      const lab = k + ':' + (c.isPlayer ? 'player' : c.name || c.id) + (part ? ':' + part : '');
      if (k === 'clang') {
        const mat = /^bumper/.test(part) && (c.m.cat === 'klasika' || c.m.chrome) ? 'm' : D_MAT[part] || 'm', size = m < 3 ? 0 : m < 10 ? 1 : 2;   // (a classic's bumpers: chrome)
        Q.push(['clang' + mat + size, v * (0.75 + 0.03 * Math.min(14, m)), w[1], 0.9 + 0.2 * KR(), 0, k, 1, lab]);
        if (cnt >= 3) Q.push(['clang' + (KR() < 0.6 ? 'm' : 'p') + 1, v * 0.6, clamp(w[1] + (KR() - 0.5) * 0.3, -0.9, 0.9), 0.95 + 0.25 * KR(), 0.08 + 0.1 * KR(), k, 0, '']);   // (several at once)
      } else if (k === 'glass') Q.push(['glass', v * Math.min(1.3, 0.85 + 0.15 * cnt), w[1], 0.9 + 0.25 * KR(), 0.01, k, 1, lab]);
      else if (k === 'wheel') { Q.push(['wheel', v, w[1], 0.92 + 0.16 * KR(), 0, k, 1, lab]); if (cnt >= 2) Q.push(['wheel', v * 0.8, clamp(w[1] + 0.2, -0.9, 0.9), 1.05 + 0.15 * KR(), 0.12, k, 0, '']); }
      else Q.push(['crunch', v, w[1], 0.95 + 0.1 * KR(), 0, k, 1, lab]);
    }
    if (Q.length) dPlays(Q);
    if (!enabled) return;
    // the loops: fire (fading in, and out at the end of its 20 s), the hubs (louder with the speed, on a hard surface, two wheels gone)
    const F = [];
    for (const [c, S] of dFireC) { const w = dWhere(c, P, cam, D_RL); if (!w) continue; const u = t - S.fire; F.push([c, w[0] * 0.22 * Core.sstep(0, 1.2, u) * (1 - Core.sstep(D_FIRE - 3, D_FIRE, u)), w[1]]); }
    if (F.length || dFireV.some(v => v && v.car)) dPool(dFireV, F, 'fire', () => {});
    const G = [];
    for (const [c] of dScrC) {
      const w = dWhere(c, P, cam, D_RL); if (!w) continue;
      const W = c.wreck; let hard = 0, nl = 0; for (let k = 0; k < 4; k++) if (W.wl & (1 << k)) { nl++; const s = c.ws ? c.ws[k] : 0; if (s <= 1 || s === 4 || s >= 7) hard = 1; }
      G.push([c, w[0] * 0.18 * Core.sstep(1.5, 10, c.speed) * (hard ? 1 : 0.35) * (nl > 1 ? 1.25 : 1), w[1]]);
    }
    if (G.length || dScrV.some(v => v && v.car)) dPool(dScrV, G, 'scrape', (v, e) => { const c = e[0], f = c.speed / (2 * Math.PI * (c.m.rw || 0.32)); set(v.am.frequency, clamp(f, 0.5, 60), 0.1); set(v.amg.gain, e[1] * 0.5, 0.1); set(v.s.playbackRate, 0.75 + 0.5 * clamp(c.speed / 35, 0, 1), 0.1); });
  }

  /* ---- FLEET: prep, what is made ahead so that no frame waits for it: the kit voices' noise, every preset's two waves' harmonics, the
     one-shots and the loops (jobs, slice). In the menus a slice each time the browser is idle (requestIdleCallback, else a timer; up to
     PREP_IDLE ms); in a race what the frame's sound has left of PREP_FRAME ms (update; at most PREP_RACE, none after a frame that made
     voices and waves, none while the Pikes Peak atmosphere is being made), the waves of the race's presets first (the player's own and the
     nearest rivals' are made when first heard), and the waves of presets no longer in the race and on no voice let go (each is ~0.6 MB in
     the browser). Nothing with the sound off ---- */
  const PREP_IDLE = 3, PREP_RACE = 1.5, PREP_FRAME = 2.5;
  let prepQ = null, waveQ = [], idleT = 0;
  const prepRaces = new WeakSet();   // (the races already seen: raceKinds once each; not kept alive by it)
  const prepS = { slices: 0, ms: 0, max: 0 };   // (Sfx.levels: how it went)
  function prepInit() {
    prepQ = [['noise', () => kitNoiseGen(ctx)]];
    for (const kind in KITS) if (!KITS[kind].ev) for (const off of [false, true]) prepQ.push(['spec:' + wkey(kind, off), specJob(kind, off)]);
    for (const n of D_ORDER) prepQ.push(['d:' + n, () => dMake(n)]);
  }
  const prepLeft = () => !prepQ || prepQ.length > 0 || waveQ.length > 0;
  function prepRun(ms) {   // the next slices of what is left, for about ms; true when all of it is made
    if (!prepQ) prepInit();
    const t0 = performance.now(), until = t0 + ms;
    while (waveQ.length || prepQ.length) {
      if (waveQ.length) { const [kind, off] = waveQ[0]; if (!slice('spec:' + wkey(kind, off), specJob(kind, off), until) || performance.now() >= until) break; kitWave(ctx, kind, off); waveQ.shift(); }
      else { if (!slice(prepQ[0][0], prepQ[0][1], until)) break; prepQ.shift(); }
      if (performance.now() >= until) break;
    }
    const t = performance.now() - t0; prepS.slices++; prepS.ms += t; if (t > prepS.max) prepS.max = t;
    return !prepLeft();
  }
  function idleKick() {   // the menus (no race sounds running): the next slice when the browser is idle
    if (idleT || !ctx || !enabled || running || !prepLeft()) return;
    const tick = (dl) => { idleT = 0; if (!ctx || !enabled || running) return;
      if (!prepRun(dl && dl.timeRemaining ? clamp(dl.timeRemaining() - 1.5, 1, PREP_IDLE) : PREP_IDLE)) idleKick(); };
    if (typeof window.requestIdleCallback === 'function') idleT = window.requestIdleCallback(tick, { timeout: 400 });
    else if (typeof window.setTimeout === 'function') idleT = window.setTimeout(tick, 30);
  }
  function raceKinds(race, P) {   // a new race: its presets' waves to be made first (the player's first); the other presets' waves let go
    const want = [], add = (M) => { const k = M && M.sndP && M.sndP.kind; if (k && KITS[k] && !KITS[k].ev && !want.includes(k)) want.push(k); };
    add(P && P.m); for (const c of race.cars || []) add(c && c.m);
    const W = kitWaves.get(ctx);
    if (W) for (const key of Object.keys(W)) { const k = key.split('|')[0]; if (!want.includes(k) && ![kitPl, ...kitAI].some(V => V && V.kind === k)) delete W[key]; }
    waveQ = []; for (const k of want) for (const off of [false, true]) waveQ.push([k, off]);
  }

  function resume() {
    if (!ctx && !create()) return;
    if (ctx.state !== 'running') { try { ctx.resume(); } catch (_) { } }
    idleKick();
  }
  function setEnabled(v) { enabled = !!v; if (master) master.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.05); idleKick(); }
  function setRunning(v) { // race sounds audible?
    running = !!v;
    if (bus) bus.gain.setTargetAtTime(running ? 1 : 0, ctx.currentTime, running ? 0.08 : 0.03);
    idleKick();
  }
  function suspend() { if (ctx && ctx.state === 'running') { try { ctx.suspend(); } catch (_) { } } }

  // (a value that is not a number never reaches a param: setTargetAtTime throws on one, and update would stop halfway every frame)
  const set = (p, v, tc) => { if (Number.isFinite(v)) p.setTargetAtTime(v, ctx.currentTime, tc || 0.03); };

  // per-frame update
  function update(race, player, view, revInput) {
    if (!ctx || ctx.state !== 'running' || !player) return;
    const tNow = ctx.currentTime, dt = clamp(tNow - lastT, 0, 0.1), tU = performance.now(); lastT = tNow;
    const M = player.m;
    if (race && !prepRaces.has(race)) { prepRaces.add(race); raceKinds(race, player); }   // (a new race: its presets' waves made first, prep)
    // player engine (a registered vehicle, model.sndP: its preset's own voice, kitPlayer; the 11 others: their engine type, engSet)
    if (M.sndP) kitPlayer(player, M, revInput, dt);
    else {
      if (kitPl && kitPl.on) kitOff(kitPl, 0.02);
      plM = null;
      let rpm = player.rpm;
      if (player.locked) rpm = M.idle + (M.redline * 0.82 - M.idle) * (revInput || 0) + Math.random() * 60 * (revInput || 0);
      const r = clamp(rpm / M.redline, 0.08, 1.05);
      const load = player.locked ? (revInput || 0) : player.inThr;
      const cut = player.shiftT > 0 ? 0.35 : 1;
      engKindSet(eng, engKind(player));
      engSet(eng, player, rpm, clamp(load, 0, 1), 1, (0.1 + 0.1 * r + 0.1 * load) * cut * eng.level, dt, tNow);
    }
    // the three nearest other engines, each kept on its car while it stays among them; the Doppler shift of their speed along the line to
    // the camera (the listener moves with the player's car). A registered vehicle among them: its preset's own voice (kitRivals, the old
    // one silent); then what breaks (dStep)
    if (race) {
      const cam = typeof Render !== 'undefined' ? Render.camera : null, lx = cam ? cam.position.x : player.x, lz = cam ? cam.position.z : player.z;
      const near = [], kw = kitW; kw.length = 0;
      for (const c of race.cars) { if (c === player || c.x === 1e5) continue; const dx = c.x - lx, dz = c.z - lz; near.push([dx * dx + dz * dz, c]); }
      near.sort((a, b) => a[0] - b[0]); near.length = Math.min(near.length, ai.length);
      const cars = near.map(e => e[1]);
      for (const v of ai) if (v.car && cars.indexOf(v.car) < 0) v.car = null;
      for (const c of cars) if (!ai.some(v => v.car === c)) { const v = ai.find(w => !w.car); if (v) { v.car = c; v.dop = 1; v.boost = 0; v.thrHi = 9; } }
      for (let k = 0; k < ai.length; k++) {
        const v = ai[k], c = v.car; if (!c) { set(v.out.gain, 0); set(v.tg.gain, 0); aiSeen[k] = null; continue; }
        const dx = c.x - lx, dz = c.z - lz, d = Math.max(1, Math.hypot(dx, dz));
        const vr = ((c.vx || 0) - (player.vx || 0)) * dx / d + ((c.vz || 0) - (player.vz || 0)) * dz / d;   // (+: away from the listener)
        v.dop += (clamp(343 / (343 + vr), 0.75, 1.3) - v.dop) * clamp(dt * 12, 0, 1);   // (every rival's, a preset's too: kitRivals)
        const e = cam ? cam.matrixWorld.elements : null, pan = e ? clamp((dx * e[0] + dz * e[2]) / Math.max(d, 12) * 1.2, -0.9, 0.9) : null;   // (its side of the camera)
        if (c.m.sndP) { set(v.out.gain, 0); set(v.tg.gain, 0); kw.push([c, k, d, pan, null]); continue; }   // (a registered vehicle: kitRivals)
        engKindSet(v, engKind(c)); aiSeen[k] = [c.m.id, v.kind, v.dop];
        const rr = clamp(c.rpm / c.m.redline, 0.1, 1.05);
        const att = clamp(1 - d / 80, 0, 1);
        engSet(v, c, c.rpm, clamp(c.inThr || 0, 0, 1), v.dop, att * att * (0.06 + 0.1 * rr) * v.level * 3, dt, tNow);
        v.fx.gain.value = att;
        if (v.pn && pan != null) set(v.pn.pan, pan, 0.05);
      }
      if (kw.length || kitAI.some(Boolean)) kitRivals(kw, dt);
      dStep(race, player);
      const left = PREP_FRAME - (performance.now() - tU);   // (prep: what is still to be made ahead, in what is left of the frame's budget)
      if (enabled && running && left > 0.3 && prepLeft() && !(atmo && (atmo.gen || (atmo.x && atmo.x.gen)))) prepRun(Math.min(PREP_RACE, left));
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
    // the fans (a rally stage, a descent: World's crowdCells, the fans per 24 m square round the car): a roar that swells as the car comes by
    // (more over a jump), with whoops and air horns
    const Wd = typeof Render !== 'undefined' ? Render.world : null, cc = race && (race.track.def.rally || race.track.def.descent) && Wd ? Wd.crowdCells : null;
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
    const pikes = !!(race && race.track && race.track.def && race.track.def.theme === 'pikes');   // (on asphalt and on the historic gravel road)
    set(echo.send.gain, pikes ? Core.sstep(186, 198, player.roadY || 0) * 0.32 : race && race.track && race.track.def && race.track.def.id === 'caracoles' ? 0.16 : 0, 0.6);   // (Los Caracoles: off the rock walls of the ladder)
    { const tn = Wd && Wd.dyn && Wd.dyn.tunnel, sq = player.q ? player.q.s : -1e9;   // (in a tunnel: the ring of its walls)
      set(tun.send.gain, tn && (tn.ranges ? tn.ranges.some(r => sq > r[0] - 3 && sq < r[1] + 3) : sq > tn.s0 - 3 && sq < tn.s1 + 3) ? 0.85 : 0, 0.08); }   // (Los Caracoles: two galleries, tn.ranges)
    const W = Wd, pk = W && W.dyn ? W.dyn.pk || W.dyn.air : null, cam = typeof Render !== 'undefined' ? Render.camera : null;   // (the Red Bull Ring's: dyn.air)
    let hv = 0, hp = 0;
    if (pk && pk.heli && (pk.on || (pk.follow && pk.heli.visible))) {
      const q = pk.heli.position, lx = cam ? cam.position.x : player.x, ly = cam ? cam.position.y : (player.roadY || 0), lz = cam ? cam.position.z : player.z;
      const d = Math.hypot(q.x - lx, q.y - ly, q.z - lz), a = clamp(1 - d / (pk.follow ? 360 : 280), 0, 1);
      hv = a * a * 0.5;
      if (cam) { const e = cam.matrixWorld.elements; hp = clamp(((q.x - lx) * e[0] + (q.y - ly) * e[1] + (q.z - lz) * e[2]) / Math.max(d, 1) * 1.2, -0.8, 0.8); }
    }
    const PH = race && race.pol && race.pol.heli;   // (Vršič, the run from the police: their helicopter)
    if (PH) { const lx = cam ? cam.position.x : player.x, ly = cam ? cam.position.y : (player.roadY || 0), lz = cam ? cam.position.z : player.z, d = Math.hypot(PH.x - lx, PH.y - ly, PH.z - lz), a = clamp(1 - d / 380, 0, 1);
      if (a * a * 0.55 > hv) { hv = a * a * 0.55; if (cam) { const e = cam.matrixWorld.elements; hp = clamp(((PH.x - lx) * e[0] + (PH.y - ly) * e[1] + (PH.z - lz) * e[2]) / Math.max(d, 1) * 1.2, -0.8, 0.8); } } }
    set(heli.out.gain, hv, 0.35);
    if (heli.pn) set(heli.pn.pan, hp, 0.1);
    standsStep(race, player, W, cam);
    sambaStep(race, player, W, cam);   // (Rio: the samba group by the main stand)
    // the Red Bull Ring's jets before the start: a roar by the distance to the nearest one
    let jv = 0; const A = W && W.dyn && W.dyn.air;
    if (A && A.t0 >= 0) for (const m of A.jets) if (m.visible) { const q = m.position, lx = cam ? cam.position.x : player.x, ly = cam ? cam.position.y : 0, lz = cam ? cam.position.z : player.z; jv = Math.max(jv, clamp(1 - Math.hypot(q.x - lx, q.y - ly, q.z - lz) / 420, 0, 1) ** 2); }
    set(jet.out.gain, jv * 0.55, 0.12); set(jet.flt.frequency, 300 + jv * 900, 0.12);
    atmoUpdate(race, player, pikes, cam);   // (Pikes Peak: wind, crowds, cowbells)
  }

  function crash(imp) {
    if (!ctx || ctx.state !== 'running' || !running || !Number.isFinite(imp)) return;
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
    if (!running || !Number.isFinite(v)) return;
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
    if (!running || !Number.isFinite(v)) return;
    const now = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = 0.8;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, now); lp.frequency.exponentialRampToValueAtTime(500, now + 0.35);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5 * v, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    src.connect(lp); lp.connect(g); g.connect(bus); src.start(now, Math.random()); src.stop(now + 0.5);
  }
  // one of the fans: a whoop (a voice through a vowel-like band, gliding up and back) or, now and then, an air horn
  function cheer(v) {
    if (!running || !Number.isFinite(v)) return;
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
    if (!ctx || ctx.state !== 'running' || !Number.isFinite(freq) || !Number.isFinite(dur)) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = freq;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol || 0.18, now + 0.01); g.gain.setValueAtTime(vol || 0.18, now + dur - 0.03); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(f); f.connect(g); g.connect(master); o.start(now); o.stop(now + dur + 0.02);
  }
  function click() { beep(1400, 0.04, 0.06); }
  // the team radio: the squelch of the radio opening (a short burst of band-passed noise) and its beep
  function radio() {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.1, now + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    src.connect(bp); bp.connect(g); g.connect(master); src.start(now, Math.random()); src.stop(now + 0.18);
    beep(1250, 0.07, 0.05);
  }
  function shiftPop() { shift(true); }
  // a gear change of the player's car: the gearbox's clack (a racing sequential's bang for the formula and the rally car), the turbo's
  // flutter on the way up, a blip of the throttle with a pop on the way down. A registered vehicle (a preset): kitGear
  let shifts = 0;
  function shift(up) {
    if (!ctx || ctx.state !== 'running' || !running || !eng) return;
    if (plM) { kitGear(up); return; }
    const now = ctx.currentTime, E = ENG[eng.kind], seq = eng.kind === 'v10' || eng.kind === 'al4'; shifts++;
    gearClack(seq, now, Math.random);
    if (up && E.turbo && eng.boost > 0.3) {   // (the flutter: the boost chattering against the closed throttle)
      const f = ctx.createBufferSource(); f.buffer = noiseBuf; const fb = ctx.createBiquadFilter(); fb.type = 'bandpass'; fb.frequency.value = 2400; fb.Q.value = 2;
      const fg = ctx.createGain(); fg.gain.setValueAtTime(0.0001, now);
      for (let i = 0; i < 4; i++) { const t = now + 0.01 + i * 0.03; fg.gain.exponentialRampToValueAtTime(0.06 * eng.boost, t); fg.gain.exponentialRampToValueAtTime(0.004, t + 0.02); }
      fg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      f.connect(fb); fb.connect(fg); fg.connect(bus); f.start(now, Math.random()); f.stop(now + 0.18);
    }
    if (!up) { crack(eng, 0.45, now + 0.04); set(eng.out.gain, 0.34 * eng.level, 0.01); }   // (the blip)
  }
  // the gearbox's clack: a short knock of noise and a click (seq: a racing sequential's sharper, louder bang); rnd: where in the noise it
  // starts (the old voices' Math.random, as ever; a preset's its own numbers, KR)
  function gearClack(seq, now, rnd) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = seq ? 900 : 320; bp.Q.value = seq ? 2.5 : 1.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(seq ? 0.32 : 0.25, now); g.gain.exponentialRampToValueAtTime(0.001, now + (seq ? 0.05 : 0.09));
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(now, rnd()); src.stop(now + 0.12);
    const k = ctx.createOscillator(); k.type = 'square'; k.frequency.setValueAtTime(seq ? 180 : 120, now); k.frequency.exponentialRampToValueAtTime(60, now + 0.03);
    const kg = ctx.createGain(); kg.gain.setValueAtTime(0.0001, now); kg.gain.exponentialRampToValueAtTime(seq ? 0.12 : 0.07, now + 0.002); kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    k.connect(kg); kg.connect(bus); k.start(now); k.stop(now + 0.05);
  }
  // a gear change of a vehicle with a preset, as the old voices' (shift): the gearbox's clack (a racing sequential's bang for the racers and
  // the rally cars: categories dirkalni, reli), on the way up the preset's own (kitShift: a turbo's chuff, an anti-lag's bang, a pop), on
  // the way down a blip of the throttle (the voice louder for a moment) with a pop where the preset pops (none from a diesel). No gearbox,
  // none of it: the electric motors (ev) and the kart (kart2t: one gear each, so game.js never changes one)
  function kitGear(up) {
    const V = kitPl, P = plM.sndP, K = V && KITS[V.kind]; if (!V || !V.on || !K || K.ev || V.kind === 'kart2t') return;
    const now = ctx.currentTime, loud = clamp(num(P.loud, 1), 0.1, 3); shifts++; V.n.gear++;
    gearClack(plM.cat === 'dirkalni' || plM.cat === 'reli', now, KR);
    if (up) { kitShift(); return; }
    if (K.pop > 0) kitShot(V, 'pop' + Math.floor(KR() * 3), loud * Math.min(1, K.pop) * 0.3, 0.8 + 0.3 * KR(), 0.04);
    vset(V, V.out.gain, 0.34 * V.level * loud * (K.vol || 1), 0.01); V.n.blip++;   // (the blip: back to its level at the next frame, kitPlayer)
  }
  // a knocked-over trackside prop: hollow plastic 'tock' for a cone, rubbery thump for tyres, soft thud for straw, woody knock for a crate
  let lastKnock = 0;
  const POLES = new Set(['bollard', 'lamp', 'sign', 'bsign', 'nsign', 'zaprta', 'vboard', 'flagp', 'cflag']);   // (Medvode's bollards, lamps, signs and flag poles: the same hollow 'tock' as a post)
  function knock(kind, v) {
    if (!ctx || ctx.state !== 'running' || !running || !Number.isFinite(v)) return;
    const now = ctx.currentTime; if (now - lastKnock < 0.05) return; lastKnock = now;
    const vol = clamp(v / 18, 0.12, 0.8), cone = kind === 'cone' || kind === 'pylon' || kind === 'post' || POLES.has(kind), straw = kind === 'bale' || kind === 'bstack' || kind === 'rbale' || kind === 'rbstack', wood = kind === 'crate' || kind === 'bench';
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
    for (const v of [eng, ...ai]) { set(v.out.gain, 0, 0.02); set(v.tg.gain, 0, 0.02); v.car = null; }
    for (const v of [squeal, rumble, wind, curbV, rainV, hiss, heli, gravel, spray, crowd, stands, jet, sirenV, radioV]) set(v.out.gain, 0, 0.02);
    set(echo.send.gain, 0, 0.02); set(tun.send.gain, 0, 0.02);
    if (samba) { set(samba.out.gain, 0, 0.02); samba.next = 0; }
    if (atmo) atmoOff(0.02);
    for (const V of [kitPl, ...kitAI]) if (V) kitOff(V, 0.02);   // (the fleet's: the engines with a preset, the fires and the hubs)
    for (const v of [...dFireV, ...dScrV]) if (v) { set(v.g.gain, 0, 0.02); if (v.amg) set(v.amg.gain, 0, 0.02); v.car = null; }
  }

  const levels = () => ctx ? { samba: samba ? +samba.lev.toFixed(3) : 0, stands: stands.lev, standsGain: stands.out.gain.value, tunnel: tun.send.gain.value, radio: radioV.out.gain.value, pk: atmo && atmo.x ? { ready: !atmo.gen && !atmo.x.gen, crunch: atmo.x.cr.map(c => +c.g.gain.value.toFixed(4)), slap: atmo.x.sG.gain.value, far: atmo.x.fG.gain.value, gust: atmo.x.wo.gain.value, wind: atmo.wo.gain.value, crowd: [atmo.cL.gain.value, atmo.cR.gain.value], cheer: atmo.p7.L.map(l => l.g.gain.value), cheerEv: [atmo.p7.nH, atmo.p7.nW] } : null,   // (tests: the crowd's and the tunnel's levels now,
    engine: plM && kitPl && kitPl.tg ? { kind: 'kit', preset: kitPl.kind, wave: 'custom', f: kitPl.tg.ff, gain: kitPl.tg.gain, lope: kitPl.tg.lope, lp: kitPl.tg.lp, fs: kitPl.tg.fs.slice(), boost: kitPl.tg.boost || 0, shots: Object.assign({}, kitPl.n) }
      : eng ? { kind: eng.kind, preset: eng.kind, f: eng.o.frequency.value, gain: eng.out.gain.value, fs: [eng.o, eng.pm, eng.tw].map(o => o.frequency.value).concat(eng.lp.frequency.value, eng.nb.frequency.value) } : null,   // Pikes Peak's sounds, the player's engine note: preset its
    ai: aiSeen.map(a => a && { id: a[0], preset: a[1], dop: +a[2].toFixed(3), f: a[3] == null ? null : +a[3].toFixed(2) }), dest: Object.assign({ live: dLive.filter(t => t > ctx.currentTime).length, fire: dFireV.filter(v => v && v.car).length, scrape: dScrV.filter(v => v && v.car).length, last: dLast.slice() }, dN),   // engine type (ENG) / model.sndP.kind, a kit
    prep: { left: prepQ ? prepQ.length + waveQ.length : -1, slices: prepS.slices, ms: +prepS.ms.toFixed(1), max: +prepS.max.toFixed(2) } } : null;   // player's one-shots; ai: the three nearest rivals' (their Doppler factor; a preset's firing pitch, f); dest: what broke, heard; prep: what is still to be made ahead)
  // (tests: the engines as they sound now; a rival in a registered vehicle: its preset)
  const engines = () => ctx && eng ? { player: { kind: eng.kind, f: +eng.o.frequency.value.toFixed(1), boost: +eng.boost.toFixed(2), pops: eng.pops, bov: eng.bov || 0 }, shifts,
    ai: ai.map(v => ({ kind: v.car && v.car.m.sndP ? v.car.m.sndP.kind : v.kind, car: v.car ? v.car.name : null, dop: +v.dop.toFixed(3), gain: +v.out.gain.value.toFixed(4) })) } : null;
  const api = { resume, setEnabled, setRunning, suspend, update, crash, beep, click, radio, shiftPop, shift, engines, thunder, get thunders() { return thunders; }, knock, wrench, silence, levels, siren, carHorn, thud, pop, radioOpen, radioClose, radioBed, probe, KINDS: Object.keys(KITS), get ready() { return !!ctx && ctx.state === 'running'; } };
  window.Sfx = api;
  return api;
})();

