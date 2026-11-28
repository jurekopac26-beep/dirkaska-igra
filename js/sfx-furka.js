/* Furka, Švica: zvok višine (dodelava proge, O-28-36). Lasten modul te proge, brez skupne predloge.
   - veter: od Gletscha (2045 m) do sedla (2416 m na cesti, def.alt) vse močnejši; na sedlu, kjer se zrak stisne med Furkastockom in
     Galenstockom, še piš (ozek pas šuma, ki poje s sunki); v ključih pod hotelom ga pobočje deloma zastre
   - talnica Ronskega ledenika: šum vode s ledeniškega jezera in potoka pod jezikom (kraj iz tools/furka-ledenik.py: najbližji led
     ~380 m od hotela, jezero ~440 m), na strani, kjer je ledenik, po kameri
   - svizci: redki opozorilni žvižgi na pašnikih nad 2100 m, podnevi (svizec je v Alpah nad gozdno mejo pogost; kraj ni iz vira: predpostavka)
   Splošni veter iz js/sfx-okolje.js za to progo utihne (SfxFurka.owns), da se ne podvaja. Fizika in drugi zvoki se ne spreminjajo. */
(function () {
  'use strict';
  const ID = 'furka';
  const MELT = { x: -850, z: -1020 };   // (iztok: med lednim jezikom in jezerom, koordinate igre; tools/furka-ledenik.py)
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let S = null;

  function noiseBuf(ctx, sec, tilt) {   // (šum, rahlo nagnjen k nizkim: tilt 0 bel, ~0.97 rjav)
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let y = 0; for (let i = 0; i < n; i++) { y = tilt * y + (1 - tilt) * (Math.random() * 2 - 1) * 3; d[i] = y; } }
    return b;
  }
  function loop(ctx, buf, dest) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = 0; s.connect(dest); s.start(ctx.currentTime + Math.random() * 0.1, Math.random() * buf.duration); return s; }
  const set = (p, v, tc) => p.setTargetAtTime(v, S.ctx.currentTime, tc);

  function build(ctx, bus) {
    const out = ctx.createGain(); out.gain.value = 0; out.connect(bus);
    // veter: rjav šum skozi nizko sito (bučanje) in ozko pasovno sito (piš na sedlu)
    const brown = noiseBuf(ctx, 5.3, 0.985), white = noiseBuf(ctx, 3.7, 0.4);
    const wg = ctx.createGain(); wg.gain.value = 0; wg.connect(out);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.5; lp.connect(wg); loop(ctx, brown, lp);
    const pg = ctx.createGain(); pg.gain.value = 0; pg.connect(out);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 9; bp.connect(pg); loop(ctx, white, bp);
    // talnica: šum, ki žubori (dve pasovni siti, rahlo nihajoči), na eno stran
    const mg = ctx.createGain(); mg.gain.value = 0;
    const mp = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (mp) { mg.connect(mp); mp.connect(out); } else mg.connect(out);
    const m1 = ctx.createBiquadFilter(); m1.type = 'bandpass'; m1.frequency.value = 520; m1.Q.value = 0.8; m1.connect(mg);
    const m2 = ctx.createBiquadFilter(); m2.type = 'bandpass'; m2.frequency.value = 2300; m2.Q.value = 1.6; m2.connect(mg);
    loop(ctx, white, m1); loop(ctx, brown, m2);
    return { ctx, out, wg, lp, pg, bp, mg, mp, m1, m2, g: 0.4, gGoal: 0.4, gNext: 0, t: 0, nextM: 0, T: null, h0: 0, h1: 1, on: false };
  }

  function whistle(at, pan, k) {   // (svizec: oster žvižg ~2,7 kHz, ki hitro pade; dva ali trije zapored)
    const { ctx, out } = S, o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const f = 2550 + Math.random() * 350;
    o.type = 'sine'; o.frequency.setValueAtTime(f * 1.12, at); o.frequency.exponentialRampToValueAtTime(f * 0.86, at + 0.16);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.05 * k, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0005, at + 0.2);
    o.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(out); } else g.connect(out);
    o.start(at); o.stop(at + 0.22);
  }

  function owns(def) { return !!(def && def.id === ID); }

  function step(ctx, bus, race, player, cam, live) {
    const T = race && race.track, on = !!(live && T && owns(T.def) && player);
    if (!on) { if (S && S.on) silence(); return; }
    if (!S || S.ctx !== ctx) S = build(ctx, bus);
    if (S.T !== T) {   // (višinski razpon ceste v igri: od Gletscha do sedla, def.alt)
      S.T = T; let a = Infinity, b = -Infinity; const H = T.hy || []; for (let i = 0; i < H.length; i++) { if (H[i] < a) a = H[i]; if (H[i] > b) b = H[i]; }
      S.h0 = Number.isFinite(a) ? a : 0; S.h1 = b > a ? b : S.h0 + 1;
    }
    const now = ctx.currentTime, dt = clamp(now - S.t, 0, 0.25), y = player.roadY || 0, spd = player.speed || 0;
    const A = T.def.alt || [2045, 2416], hn = clamp((y - S.h0) / (S.h1 - S.h0), 0, 1), alt = A[0] + hn * (A[1] - A[0]);
    S.t = now; if (!S.on) { S.on = true; set(S.out.gain, 1, 0.8); }
    // sunki: nov cilj vsakih 1,5–5 s, gor hitreje kot dol
    if (now >= S.gNext) { const r = Math.random(); S.gGoal = 0.2 + 0.8 * r * r; S.gNext = now + 1.5 + Math.random() * 3.5; }
    S.g += (S.gGoal - S.g) * (1 - Math.exp(-dt / (S.gGoal > S.g ? 0.8 : 2))); const g = S.g;
    const lift = sstep(2040, 2420, alt), saddle = sstep(2370, 2416, alt);
    const H = T.def.hotel, lee = H ? 1 - 0.35 * (1 - sstep(60, 260, Math.hypot(player.x - H[0], player.z - H[1]))) : 1;   // (ob hotelu v zavetju pobočja)
    set(S.wg.gain, (0.05 + 0.2 * lift) * (0.35 + 0.65 * g) * (1 + 0.4 * sstep(8, 40, spd)) * lee, 0.15);
    set(S.lp.frequency, 260 + 380 * g + 200 * lift, 0.2);
    set(S.pg.gain, 0.05 * saddle * g * g, 0.15); set(S.bp.frequency, 780 + 520 * g + 40 * Math.sin(now * 1.7), 0.15);
    // talnica: po razdalji od kamere (ali avta) do iztoka; stran po kameri
    const lx = cam ? cam.position.x : player.x, lz = cam ? cam.position.z : player.z, dx = MELT.x - lx, dz = MELT.z - lz, d = Math.hypot(dx, dz);
    const mv = Math.pow(1 - sstep(90, 520, d), 2);
    set(S.mg.gain, 0.16 * mv, 0.3);
    set(S.m1.frequency, 480 + 90 * Math.sin(now * 0.9), 0.2); set(S.m2.frequency, 2100 + 400 * Math.sin(now * 2.3 + 1), 0.1);
    if (S.mp && cam) { const e = cam.matrixWorld.elements; set(S.mp.pan, clamp((dx * e[0] + dz * e[2]) / Math.max(d, 1) * 1.3, -0.85, 0.85), 0.15); }
    // svizci: podnevi, na pašnikih nad 2100 m, ko avto ne drvi mimo; redko
    if (!S.nextM) S.nextM = now + 6 + Math.random() * 10;
    if (now >= S.nextM) {
      S.nextM = now + 9 + Math.random() * 22;
      const tod = (window.Render && Render.lookInfo && (Render.lookInfo() || {}).tod) || 'day';
      if (alt > 2100 && alt < 2400 && spd < 30 && tod !== 'night') { const pan = (Math.random() * 2 - 1) * 0.8, k = 0.6 + 0.4 * Math.random(), n = 1 + (Math.random() * 3 | 0); for (let j = 0; j < n; j++) whistle(now + 0.05 + j * (0.38 + Math.random() * 0.2), pan, k); }
    }
  }

  function silence() { if (!S) return; S.on = false; set(S.out.gain, 0, 0.05); S.nextM = 0; }

  window.SfxFurka = { step, silence, owns };
})();
