/* =========================================================================
   AUDIO — fully synthesized (Web Audio): engines, tyres, surfaces, hits
   ========================================================================= */
const Sfx = (function () {
  'use strict';
  const { clamp } = Core;
  let ctx = null, master = null, bus = null, enabled = true, volume = 0.8;
  let noiseBuf = null;
  let eng = null, ai = [], squeal = null, rumble = null, wind = null, curbV = null, heli = null, echo = null, crowd = null, jet = null;
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
    heli = heliVoice(); echo = echoFx(); crowd = crowdVoice(); jet = noiseVoice('lowpass', 500, 0.7);
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
  // two bands, swelling slowly), with drums and air horns from the orange fans now and then (crowdStep)
  function crowdVoice() {
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
  function crowdStep(race, player, W, cam) {
    const C = crowd, P = W && W.crowdPts, now = ctx.currentTime;
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
    const W = typeof Render !== 'undefined' ? Render.world : null, pk = W && W.dyn ? (pikes ? W.dyn.pk : W.dyn.air) : null, cam = typeof Render !== 'undefined' ? Render.camera : null;   // (the Red Bull Ring's: dyn.air)
    let hv = 0, hp = 0;
    if (pk && pk.on && pk.heli) {
      const q = pk.heli.position, lx = cam ? cam.position.x : player.x, ly = cam ? cam.position.y : (player.roadY || 0), lz = cam ? cam.position.z : player.z;
      const d = Math.hypot(q.x - lx, q.y - ly, q.z - lz), a = clamp(1 - d / 280, 0, 1);
      hv = a * a * 0.5;
      if (cam) { const e = cam.matrixWorld.elements; hp = clamp(((q.x - lx) * e[0] + (q.y - ly) * e[1] + (q.z - lz) * e[2]) / Math.max(d, 1) * 1.2, -0.8, 0.8); }
    }
    set(heli.out.gain, hv, 0.35);
    if (heli.pn) set(heli.pn.pan, hp, 0.1);
    crowdStep(race, player, W, cam);
    // the Red Bull Ring's jets before the start: a roar by the distance to the nearest one
    let jv = 0; const A = W && W.dyn && W.dyn.air;
    if (A && A.t0 >= 0) for (const m of A.jets) if (m.visible) { const q = m.position, lx = cam ? cam.position.x : player.x, ly = cam ? cam.position.y : 0, lz = cam ? cam.position.z : player.z; jv = Math.max(jv, clamp(1 - Math.hypot(q.x - lx, q.y - ly, q.z - lz) / 420, 0, 1) ** 2); }
    set(jet.out.gain, jv * 0.55, 0.12); set(jet.flt.frequency, 300 + jv * 900, 0.12);
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
    for (const v of [squeal, rumble, wind, curbV, heli, crowd, jet]) set(v.out.gain, 0, 0.02);
    set(echo.send.gain, 0, 0.02);
  }

  const api = { resume, setEnabled, setRunning, suspend, update, crash, beep, click, shiftPop, knock, wrench, silence, get ready() { return !!ctx && ctx.state === 'running'; } };
  window.Sfx = api;
  return api;
})();

