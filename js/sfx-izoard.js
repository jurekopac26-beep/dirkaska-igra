/* SFX — Izoard, France: its own sound (docs/proge/izoard.md, »Zvok«). Above the forest, in the pastures and on the scree under the col,
   the alpine marmots' alarm: a sharp whistle falling a little, one or a few in a row, from the slopes beside the road, now and then (more
   often as the car comes, they whistle at what nears them). Made here (an oscillator, no recording), on top of the shared sounds of the
   surroundings (js/sfx-okolje.js, its step wrapped for this track alone: the beds, the birds and the wind as they are); its loudness
   follows their setting (Zvoki okolja: Izklop / Tiho / Normalno / Glasno) and the car's speed as theirs does. Only in a race that runs,
   by day, not in rain or snow, not with the battery saver; higher than ~280 m over the start (~2250 m: the pastures over the larches). */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.SfxOkolje) return;
  const O = window.SfxOkolje, step0 = O.step, silence0 = O.silence;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const M = { live: [], tNext: 0, ctx: null, n: 0 };   // (the whistles playing; when the next may come; how many so far: the tests)
  const RISE = 280;   // m over the start (its height 1973 m): the whistles from here up

  function whistle(ctx, bus, t0, gain, pan) {   // one: ~2.6-3.1 kHz falling ~15 % in 0.12-0.2 s, a quick onset, a short tail
    const o = ctx.createOscillator(), h = ctx.createOscillator(), hg = ctx.createGain(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const f0 = 2600 + 500 * Math.random(), d = 0.12 + 0.08 * Math.random();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f0 * 1.04, t0 + 0.02); o.frequency.exponentialRampToValueAtTime(f0 * 0.85, t0 + d);
    h.type = 'sine'; h.frequency.setValueAtTime(2 * f0, t0); h.frequency.exponentialRampToValueAtTime(1.7 * f0, t0 + d); hg.gain.value = 0.12;   // (a faint overtone: not a pure tone)
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.012); g.gain.setValueAtTime(gain * 0.9, t0 + d * 0.7); g.gain.exponentialRampToValueAtTime(1e-4, t0 + d + 0.05);
    o.connect(g); h.connect(hg); hg.connect(g);
    if (p) { p.pan.value = pan; g.connect(p); p.connect(bus); } else g.connect(bus);
    const it = { nodes: [o, h, hg, g].concat(p ? [p] : []) }; M.live.push(it);
    o.onended = () => { for (const n of it.nodes) { try { n.disconnect(); } catch (_) { } } const k = M.live.indexOf(it); if (k >= 0) M.live.splice(k, 1); };
    o.start(t0); h.start(t0); o.stop(t0 + d + 0.08); h.stop(t0 + d + 0.08); M.n++;
  }

  function tick(ctx, bus, race, player, cam) {
    const T = race && race.track; if (!T || !T.def || T.def.id !== 'izoard' || !T.hy || race.state !== 'racing' || race.nv) return;
    const now = ctx.currentTime; if (M.ctx !== ctx) { M.ctx = ctx; M.tNext = now + 4; } if (now < M.tNext || M.live.length > 6) return;
    const L = O.levels(); if (!L.on || !L.ready || !L.run || L.saver || !(L.full > 0)) return;
    const at = (typeof Render !== 'undefined' && Render.atmos) || null, tod = at && at.tod;   // (as js/sfx-okolje.js reads it)
    if ((tod && tod !== 'day' && tod !== 'dawn') || clamp(race.rain || 0, 0, 1) > 0.05 || (at && at.season === 'winter')) { M.tNext = now + 5; return; }
    const s = player.q && Number.isFinite(player.q.s) ? player.q.s : null; if (s == null) return;
    const up = sstep(RISE - 30, RISE + 60, T.hy[T.idx(s)] - T.hy[0]); if (up <= 0) { M.tNext = now + 3; return; }
    // (now and then: on average every ~9 s up there; a series of 1-4, 0.5-1.1 s apart, from one side, 25-120 m off)
    M.tNext = now + 4 + 10 * Math.random() / up;
    const kmh = Math.abs(player.speed || 0) * 3.6, dist = 25 + 95 * Math.random() * Math.random(), side = Math.random() < 0.5 ? -1 : 1;
    const gain = L.full * 1.1 * up * Math.min(1, Math.pow(30 / dist, 0.9)) * (1 - 0.6 * sstep(30, 160, kmh));
    const pan = clamp(side * (0.35 + 0.45 * Math.random()), -0.85, 0.85), nw = 1 + Math.floor(Math.random() * Math.random() * 4);
    for (let k = 0, t = now + 0.02; k < nw; k++, t += 0.5 + 0.6 * Math.random()) whistle(ctx, bus, t, gain * (1 - 0.08 * k), pan);
  }

  O.step = function (ctx, bus, race, player, cam, lv) {
    const r = step0.apply(this, arguments);
    try { if (ctx && bus && player && (!lv || lv.en !== false)) tick(ctx, bus, race, player, cam); } catch (_) { }
    return r;
  };
  O.silence = function () { for (const it of M.live.slice()) for (const n of it.nodes) { try { n.disconnect(); } catch (_) { } } M.live.length = 0; return silence0.apply(this, arguments); };
  O.izoard = { get n() { return M.n; }, get live() { return M.live.length; }, RISE };
})();
