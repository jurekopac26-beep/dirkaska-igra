// Zabava · 8 · Drag dirka (I20, docs/drag-dirka.md): a mode of its own (drag, in the menu Drag race) on a real track's straight (Core.DRAG:
// Montréal's past the hairpin). Two cars side by side over 402 m (a quarter mile) from a standing start, the lights as a race's; the gas
// before they go out is a red light (the run is lost, it is still driven to the line). The gears by hand (car.man in js/core.js): Space, E
// or Shift, the pad's RB or B, the PRESTAVA button on the screen; the panel's shift light (yellow: soon, green: now, red: the limiter) and
// a word for each shift. The rival: the same car or a truck (Race options: Rival, zbDrag); the slower of the two a head start in metres,
// so that both perfect runs cross the line together (headStart: each car alone over the strip, the automatic gearbox's run as a perfect
// one); the rival's reaction and shifts by the difficulty, its own lane held (c.ctl) up to the line.
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  const K = {
    len: 402.336, ft60: 18.288, eighth: 201.168,   // (a quarter mile, 60 ft, an eighth of a mile, m)
    limit: 40,   // (s after the lights: the run is over all the same)
    warn: 0.85, ok: 0.92, red: 0.99,   // (the shift light: yellow, green (Core.MAN.ok), red on the limiter, x the redline)
    early: 0.85, perfT: 0.06, lateT: 0.25,   // (the words: a shift under early PREZGODAJ, more than lateT s on the limiter PREPOZNO, from ok and at most perfT s POPOLNO, else DOBRO)
    // the rival by the difficulty (lahka, srednja, težka, super težka): its reaction (s) and the revs it shifts at (x the redline), drawn
    AI: [{ re: [0.30, 0.50], u: [0.78, 0.95] }, { re: [0.22, 0.38], u: [0.86, 0.98] }, { re: [0.16, 0.28], u: [0.91, 0.99] }, { re: [0.12, 0.22], u: [0.93, 0.99] }],
    truck: 'titan', truck2: 'kamen',   // (the rival truck; the other one when the player drives that one)
    keys: ['Space', 'KeyE', 'ShiftLeft', 'ShiftRight'], pads: [5, 1],   // (a shift up: the keys, the pad's RB and B)
  };
  const DT = 1 / 120;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const wrapPi = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const CC = () => feat.core || (typeof Core !== 'undefined' ? Core : null);   // (Node's tests give it: drag.core)
  const dec3 = (t) => (Number.isFinite(t) ? Z.dec(t.toFixed(3)) + ' s' : '–');

  // the strip: the start line's point on the centre line, along the chord to past the finish (u), across it (n: the track's normal side,
  // the player's lane), the heading the cars stand in
  function strip(T, D) {
    const i0 = T.idx(D.s), i1 = T.idx(D.s + K.len + 20), ax = T.px[i0], az = T.pz[i0];
    let ux = T.px[i1] - ax, uz = T.pz[i1] - az; const L = Math.hypot(ux, uz) || 1; ux /= L; uz /= L;
    let nx = -uz, nz = ux; if (nx * T.nx[i0] + nz * T.nz[i0] < 0) { nx = -nx; nz = -nz; }
    return { s0: D.s, ax, az, ux, uz, nx, nz, h: Math.atan2(uz, ux), lane: D.lane };
  }
  const along = (G, c) => (c.x - G.ax) * G.ux + (c.z - G.az) * G.uz;   // (m from the start line)
  const across = (G, c) => (c.x - G.ax) * G.nx + (c.z - G.az) * G.nz;   // (m from the centre line, + the player's side)
  // a car standing in its lane (side +1 the player's, -1 the rival's) a m up the strip
  function put(T, c, G, a, side) {
    const x = G.ax + G.ux * a + G.nx * side * G.lane, z = G.az + G.uz * a + G.nz * side * G.lane, i = T.idx(G.s0 + a);
    c.place(x, z, G.h); if (T.hasElev) c.y = c.py = T.hy[i];
    c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.vx = c.vz = 0; c.steer = 0; c.gear = 1; c.shiftT = 0;
    c.dist = c.q.s - T.len;   // (the race's own count: from behind its line, which is never crossed in the run)
  }
  // the steering that holds the lane: at a point ~10 m ahead in it
  function holdLane(c, G, side) {
    const a = along(G, c) + 8 + Math.max(0, c.speed) * 0.3, tx = G.ax + G.ux * a + G.nx * side * G.lane, tz = G.az + G.uz * a + G.nz * side * G.lane;
    c.inSteer = clamp(wrapPi(Math.atan2(tz - c.z, tx - c.x) - c.h) * 4, -1, 1);
  }

  const feat = {
    id: 'drag', K, strip, along, across,
    st: null, core: null, hs: new Map(),
    modes: (d) => { const C = CC(); return C && C.DRAG && d && C.DRAG[d.id] ? ['drag'] : []; },
    mine: (ctx) => { const C = CC(); return ctx.md === 'drag' && !ctx.on && !(ctx.cr >= 0) && !ctx.mis && !ctx.school && !ctx.chal && !ctx.nv && !ctx.tt && !ctx.quali && !ctx.prvi && !!(C && C.DRAG && ctx.track && C.DRAG[ctx.track.def.id]); },
    // the rival's vehicle: the player's own, or a truck (the other truck when the player drives that one)
    rivalOf(pm, truck) {
      const C = CC(), by = (id) => C.MODELS.find(m => m.id === id);
      if (!truck) return pm;
      return pm && pm.id === K.truck ? by(K.truck2) || pm : by(K.truck) || pm;
    },
    opts(ctx) {
      if (!this.mine(ctx)) return null;
      const C = CC(), S = Z.G && Z.G.S, pm = ctx.pm || C.MODELS[(S && S.car) || 0] || C.MODELS[0];
      return { numAI: 1, numSet: true, playerGrid: 1, laps: 1, duelModel: this.rivalOf(pm, !!(S && +S.zbDrag === 1)), launch: true, flying: 0, traffic: false, police: false,
        fuel: false, strat: false, flags: false, chars: false, slip: false, faults: false, radio: false, tyres: false, rival: undefined, wheelRule: undefined };
    },
    made(race, ctx) { if (this.mine(ctx)) race.zbMode = 'drag'; },

    // the head start (m) of the slower of the two, so that both perfect runs are over the line together: each car alone on the strip (a
    // copy, as the race built it), full throttle, the automatic gearbox (as quick as perfect shifts); kept per track, cars and settings
    headStart(race, P, o, G) {
      const C = CC(), T = race.track, O = race.opts, base = (id) => C.MODELS.find(m => m.id === id);
      const key = [T.def.id, G.s0, O.phys || 'cs', P.m.id, JSON.stringify(O.playerUpg || null), JSON.stringify(O.playerSetup || null), JSON.stringify(O.playerDeli || null), O.assist, P.wet != null ? P.wet.toFixed(2) : '', o.m.id, o.assist].join('|');
      let m = this.hs.get(key);
      if (m == null) { const kept = Z.part('drag'); if (kept.hs && Number.isFinite(kept.hs[key])) m = kept.hs[key]; }
      if (m == null) {
        const dP = this.solo(T, G, base(P.m.id) || P.m, { isPlayer: true, phys: O.phys, assist: O.assist, upg: O.playerUpg, setup: O.playerSetup, slide: O.playerSlide, deli: O.playerDeli }, 1, P.wet);
        const dO = this.solo(T, G, base(o.m.id) || o.m, { phys: O.phys, assist: o.assist, skill: o.skill }, -1, o.wet);
        const tP = this.timeAt(dP, K.len), tO = this.timeAt(dO, K.len);
        m = !(Math.abs(tP - tO) > 0.005) ? 0 : tP > tO ? K.len - this.distAt(dP, tO) : -(K.len - this.distAt(dO, tP));   // (+: the player's, -: the rival's)
        m = Math.round(clamp(m, -K.len + 50, K.len - 50) * 10) / 10;
        this.hs.set(key, m);
        const kept = Z.part('drag'), hs = kept.hs || (kept.hs = {}), ks = Object.keys(hs); if (ks.length >= 40) delete hs[ks[0]]; hs[key] = m; Z.save();
      } else this.hs.set(key, m);
      return m;
    },
    // one car alone over the strip: its distance from the line each 1/120 s (the race's step), up to past the finish
    solo(T, G, M, opts, side, wet) {
      const C = CC(), c = new C.Car(M, opts), d = [0];
      if (wet != null) c.wet = wet;
      put(T, c, G, 0, side); c.locked = false;
      for (let k = 0; k < K.limit * 120; k++) {
        T.query(c.x, c.z, c.q.i, c.q); holdLane(c, G, side); c.inThr = 1; c.inBrk = 0;
        c.steer += clamp(c.inSteer - c.steer, -10 * DT, 10 * DT);   // (as the race smooths an AI car's)
        c.step(DT, T);
        const a = along(G, c); d.push(a);
        if (a >= K.len + 1) break;
      }
      return d;
    },
    timeAt(d, m) { for (let k = 1; k < d.length; k++) if (d[k] >= m) return (k - 1 + (m - d[k - 1]) / Math.max(1e-9, d[k] - d[k - 1])) * DT; return Infinity; },
    distAt(d, t) { const f = t / DT, k = Math.floor(f); if (k + 1 >= d.length) return d[d.length - 1]; return d[k] + (d[k + 1] - d[k]) * (f - k); },

    begin(race) {
      this.ui(null);
      this.st = null;
      if (race.zbMode !== 'drag') return;
      const C = CC(), T = race.track, D = C && C.DRAG[T.def.id], P = race.player, o = race.cars.find(c => c !== P), G0 = Z.G;
      if (!D || !P || !o) return;
      const G = strip(T, D), hs = this.headStart(race, P, o, G), aP = hs > 0 ? hs : 0, aO = hs < 0 ? -hs : 0;
      put(T, P, G, aP, 1); put(T, o, G, aO, -1);
      if (race.putBack) { race.putBack(P); race.putBack(o); }
      const S0 = G0 && G0.S, lvl = clamp(Math.round(S0 ? +S0.difficulty || 0 : 1), 0, 3), A = K.AI[lvl];
      const R = C.rng((((G0 && G0.repro && G0.repro() ? 1 : (Math.random() * 1e9) >>> 0) + (race.opts.seed || 0)) * 7919 + 13) >>> 0);
      const draw = (r) => r[0] + (r[1] - r[0]) * R();
      if (o.lch) o.lch.re = draw(A.re);   // (the race's start: the rival let go at its reaction, Race.start)
      for (const c of [P, o]) if (c.m.gears.length > 1) c.man = { up: 0, log: [] };   // (the manual gearbox: not an electric car's one gear)
      o.ctl = (c, r, dt) => this.aiDrive(c, r, dt);
      const run = (c, a0) => ({ a0, a: a0, t: 0, re: NaN, marks: {}, fin: null, v: 0, lat: 0, uAt: draw(A.u) });
      this.st = { G, P, o, hs, aP, aO, A, R, draw, lvl, runs: new Map([[P, run(P, aP)], [o, run(o, aO)]]), red: false, hint: false, end: null, ended: false, seen: 0, words: [], pad: [], hud: {}, t0: 0 };
      if (typeof Render !== 'undefined' && Render.resetCam) Render.resetCam();   // (the camera at the strip at once, not flying in from the grid)
      if (typeof Input !== 'undefined' && Input.setOptions) Input.setOptions({ autoGas: false });   // (the reaction and the red light: the player's own foot)
      this.ui(race);
      if (G0) {
        G0.showMsg(tr('DRAG DIRKA · 402 m'), 'gold', 1.8);
        G0.say('zbDragIntro', { rival: o.m.name }, 2);
        if (hs) G0.toast(hs > 0 ? tr('Tvoja prednost: {0} m (počasnejše vozilo).', Z.dec(hs.toFixed(1))) : tr('Prednost tekmeca: {0} m (počasnejše vozilo).', Z.dec((-hs).toFixed(1))), 3600);
      }
    },
    // the rival up to its finish: its lane, full throttle, its shifts at its revs (then the race's AI, braking for the chicane)
    aiDrive(c, race, dt) {
      const S = this.st, run = S && S.runs.get(c), C = CC();
      if (!S || !run || run.fin != null) { c.ctl = null; c.man = null; C.aiControl(c, race, dt); return; }
      holdLane(c, S.G, -1); c.inThr = 1; c.inBrk = 0; c.inHand = 0;
      if (c.man && c.gear < c.m.gears.length && !(c.shiftT > 0) && !(c.man.up > 0) && C.manRev(c, c.m, c.speed) >= run.uAt) { c.man.up = 1; run.uAt = S.draw(S.A.u); }
    },
    // the player's shift up (the key, the pad, the button): one gear a press, at most two waiting
    shift() {
      const S = this.st, G = Z.G; if (!S || !S.P.man || (G && (G.phase() !== 'racing' || G.paused()))) return false;
      const P = S.P; if (P.gear >= P.m.gears.length || S.runs.get(P).fin != null) return false;
      P.man.up = Math.min(2, (P.man.up || 0) + 1);
      return true;
    },
    word(e) { return e.t > K.lateT ? 'late' : e.u < K.early ? 'early' : e.u >= K.ok && e.t <= K.perfT ? 'perfect' : 'good'; },

    step(race, dt) {
      const S = this.st; if (!S || race.zbMode !== 'drag') return;
      const G = Z.G, ph = G ? G.phase() : 'racing', P = S.P, o = S.o;
      this.padPoll();
      if (ph === 'intro' || ph === 'lights') {
        if (ph === 'lights' && !S.red && P.inThr > 0.5) { S.red = true; if (G) G.showMsg(tr('RDEČA LUČ!'), 'slow', 2.2); if (typeof Sfx !== 'undefined' && Sfx.beep) Sfx.beep(220, 0.4, 0.2); }
        else if (ph === 'intro' && P.inThr > 0.5 && !S.hint) { S.hint = true; if (G) G.showMsg(tr('SPUSTI PLIN, POČAKAJ NA LUČI'), 'slow', 1.6); }
        this.hud(race, S);
        return;
      }
      if (!(race.time > 0)) return;
      for (const c of [P, o]) this.track(c, S.runs.get(c), race, dt);
      const L = P.man && P.man.log;
      while (L && S.seen < L.length) { const w = this.word(L[S.seen++]); S.words.push(w); S.hud.word = w; S.hud.wordT = race.time; }
      if (!S.end && ph === 'racing') {
        const rp = S.runs.get(P), ro = S.runs.get(o);
        if (rp.fin != null) {
          const win = !S.red && !(ro.fin != null && ro.fin < rp.fin);
          S.end = { msg: S.red ? tr('RDEČA LUČ · PORAZ') : win ? tr('ZMAGA!') : tr('PORAZ'), cls: win ? 'fast' : 'slow', say: S.red ? 'zbDragRed' : win ? 'zbDragWin' : 'zbDragLose', vars: { rival: o.m.name }, win };
        } else if (race.time > K.limit) S.end = { msg: tr('ČAS JE POTEKEL'), cls: 'slow', say: 'zbDragLose', vars: { rival: o.m.name }, win: false, out: true };
      }
      this.hud(race, S);
    },
    // a car's run: its splits from its own start (60 ft, 1/8 mile), over the line (the race's clock: with the reaction), the speed there
    track(c, run, race, dt) {
      const S = this.st, a = along(S.G, c), d = a - run.a0;
      if (c.lch && c.lch.t >= 0 && c.lch.re >= 0) run.re = c.lch.re;   // (the reaction: the race's launch, LAUNCH; a press held through the lights let go and pressed again: the new one)
      if (run.fin == null) {
        const tAt = (m) => race.time - (a - m) / Math.max(1e-6, a - run.a) * dt;   // (when it was at m, inside this step)
        if (!(K.ft60 in run.marks) && d >= K.ft60) run.marks[K.ft60] = tAt(run.a0 + K.ft60);
        if (!(K.eighth in run.marks) && d >= K.eighth && run.a0 + K.eighth < K.len) run.marks[K.eighth] = tAt(run.a0 + K.eighth);
        if (a >= K.len) {
          run.fin = tAt(K.len); run.v = c.speed * 3.6;
          if (c.man) c.man = null;   // (over the line: the gearbox by itself again, the autopilot brakes and changes down)
        }
        run.lat = Math.max(run.lat, Math.abs(across(S.G, c) - (c.isPlayer ? 1 : -1) * S.G.lane));
      }
      run.a = a;
    },
    over() { const S = this.st; if (!S || S.ended || !S.end) return null; S.ended = true; return S.end; },
    noPodium(race) { return !!race && race.zbMode === 'drag'; },

    /* ---- the panel and the button (the browser) ---- */
    ui(race) {
      if (typeof document === 'undefined') return;
      const hud = Z.el('hud'), was = Z.el('zb-drag'), btn = Z.el('zb-shift');
      if (was) was.remove(); if (btn) btn.remove();
      if (this.onKey) { window.removeEventListener('keydown', this.onKey, true); this.onKey = null; }
      if (hud) hud.classList.toggle('zb-drag', !!race);
      if (!race || !hud) return;
      const S = this.st, man = !!S.P.man;
      const el = document.createElement('div'); el.id = 'zb-drag'; el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<div class="zd-top"><span class="zd-lt"></span><b class="zd-g">1</b><div class="zd-rev"><i></i><em></em></div><b class="zd-t"></b></div>' +
        '<div class="zd-run"><i class="zd-op"></i><i class="zd-me"></i></div><span class="zd-w"></span>';
      hud.appendChild(el);
      const em = el.querySelector('.zd-rev em'); if (em) { em.style.left = (K.ok * 100) + '%'; em.style.width = ((K.red - K.ok) * 100) + '%'; }
      if (man) {
        const t = Z.el('touch'), b = document.createElement('div'); b.id = 'zb-shift'; b.className = 'tb'; b.setAttribute('role', 'button'); b.setAttribute('aria-label', tr('Prestava gor'));
        b.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 25 L20 13 L30 25" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>' + Z.esc(tr('PRESTAVA')) + '</span>';
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.shift()) { b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 120); } });
        if (t) t.appendChild(b);
        this.onKey = (e) => {
          if (!this.st || e.repeat || K.keys.indexOf(e.code) < 0 || (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName))) return;
          const map = typeof Input !== 'undefined' && Input.keyMap; if (map && Object.keys(map).some(k => (map[k] || []).indexOf(e.code) >= 0)) return;   // (a key the player gave another action, Kontrole)
          if (Z.G && Z.G.phase() !== 'racing' && Z.G.phase() !== 'lights' && Z.G.phase() !== 'intro') return;
          e.preventDefault(); this.shift();
        };
        window.addEventListener('keydown', this.onKey, true);
      }
    },
    padPoll() {
      if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
      const S = this.st, gp = [...navigator.getGamepads()].find(p => p && p.connected); if (!gp) return;
      const b = K.pads.map(i => !!(gp.buttons[i] && gp.buttons[i].pressed));
      if (b.some((x, i) => x && !S.pad[i])) this.shift();
      S.pad = b;
    },
    hud(race, S) {
      if (typeof document === 'undefined') return;
      const el = Z.el('zb-drag'); if (!el) return;
      const C = CC(), P = S.P, H = S.hud, man = !!P.man, top = P.gear >= P.m.gears.length;
      const u = man || P.m.gears.length > 1 ? C.manRev(P, P.m, P.speed) : 0;
      const lt = !man || top ? '' : u >= K.red ? 'r' : u >= K.ok ? 'g' : u >= K.warn ? 'y' : '';
      if (lt !== H.lt) { H.lt = lt; el.querySelector('.zd-lt').className = 'zd-lt' + (lt ? ' ' + lt : ''); el.classList.toggle('lim', lt === 'r'); }
      const g = P.m.gears.length > 1 ? String(Math.max(1, P.gear)) : 'E';
      if (g !== H.g) { H.g = g; el.querySelector('.zd-g').textContent = g; }
      const w = Math.round(clamp(u, 0, 1) * 100);
      if (w !== H.w) { H.w = w; el.querySelector('.zd-rev i').style.width = w + '%'; }
      const pos = (c) => Math.round(clamp(along(S.G, c) / K.len, 0, 1) * 1000) / 10;
      const pm = pos(P), po = pos(S.o);
      if (pm !== H.pm) { H.pm = pm; el.querySelector('.zd-me').style.left = pm + '%'; }
      if (po !== H.po) { H.po = po; el.querySelector('.zd-op').style.left = po + '%'; }
      const rp = S.runs.get(P), ph = Z.G ? Z.G.phase() : 'racing', t = rp.fin != null ? rp.fin : ph === 'racing' || ph === 'finish' ? Math.max(0, race.time) : 0;   // (the run's clock: from the lights, held at the line)
      const tt = Z.dec(t.toFixed(2)) + ' s';
      if (tt !== H.t) { H.t = tt; el.querySelector('.zd-t').textContent = tt; }
      const word = H.word && race.time - H.wordT < 1.4 ? H.word : '';
      if (word !== H.shown) {
        H.shown = word; const we = el.querySelector('.zd-w');
        we.textContent = word ? tr(({ perfect: 'POPOLNO', good: 'DOBRO', early: 'PREZGODAJ', late: 'PREPOZNO' })[word]) : '';
        we.className = 'zd-w' + (word ? ' ' + word : '');
      }
    },

    /* ---- the results of its own ---- */
    finish(race) {
      const S = this.st, G = Z.G; if (!S || race.zbMode !== 'drag' || !G || typeof document === 'undefined') return false;
      const $ = (id) => document.getElementById(id), P = S.P, o = S.o, rp = S.runs.get(P), ro = S.runs.get(o), E = S.end || { win: false, out: true };
      // the rival not over the line yet (far behind): when it would be, at its speed now
      if (ro.fin == null) { const left = K.len - along(S.G, o); ro.fin = race.time + Math.max(0, left) / Math.max(5, o.speed); ro.est = true; }
      const win = !!E.win, gap = Number.isFinite(rp.fin) && Number.isFinite(ro.fin) ? Math.abs(rp.fin - ro.fin) : NaN;
      const et = (r) => (r.fin != null && Number.isFinite(r.re) ? r.fin - r.re : NaN);
      // the record: the player's own 402 m, from its start to the line, with each vehicle (R0.dragBy: model id -> s; bestRace: the best of
      // them, the menu's Best run); not with a red light, a run out of time or a head start of the player's own
      const R0 = G.rec(race.track.def.id), etP = et(rp), by = R0.dragBy && typeof R0.dragBy === 'object' && !Array.isArray(R0.dragBy) ? R0.dragBy : (R0.dragBy = {});
      const own = Number.isFinite(by[P.m.id]) && by[P.m.id] > 0 ? by[P.m.id] : 0;
      let newRec = false;
      if (!S.red && !E.out && S.aP === 0 && Number.isFinite(etP) && etP > 0 && (!own || etP < own)) { by[P.m.id] = etP; if (!R0.bestRace || etP < R0.bestRace) R0.bestRace = etP; newRec = true; G.saveRecords(); }
      $('res-pos').textContent = win ? '✓' : '✕';
      $('res-title').textContent = S.red ? tr('Rdeča luč') : E.out ? tr('Čas je potekel') : tr(win ? 'Zmaga!' : 'Poraz');
      const gs = Number.isFinite(gap) ? Z.dec(gap.toFixed(3)) : '–';
      $('res-sub').textContent = (S.red ? tr('Plin si pritisnil, preden so ugasnile luči.') : win ? tr('Na cilju si bil {0} s pred tekmecem ({1}).', gs, o.m.name) : E.out ? '' : tr('Tekmec ({0}) je bil na cilju {1} s pred tabo.', o.m.name, gs)) + (newRec ? tr(' Nov rekord.') : '');
      $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); const laps = $('res-laps'); if (laps) laps.classList.add('off');
      $('res-table').querySelector('thead').innerHTML = '<tr><th>' + Z.esc(tr('Drag dirka')) + '</th><th>' + Z.esc(tr('Ti')) + '</th><th>' + Z.esc(tr('Tekmec')) + '</th></tr>';
      const kmh = (r) => (r.fin != null && !r.est ? Math.round(r.v) + ' km/h' : '–');
      const mark = (r, m) => (r.marks[m] != null && Number.isFinite(r.re) ? dec3(r.marks[m] - r.re) : '–');
      const rows = [[tr('Reakcija'), S.red ? tr('rdeča luč') : dec3(rp.re), dec3(ro.re)], ['18 m', mark(rp, K.ft60), mark(ro, K.ft60)], ['201 m', mark(rp, K.eighth), mark(ro, K.eighth)],
        [tr('Do cilja'), dec3(etP), ro.est ? '–' : dec3(et(ro))], [tr('Čas od luči'), dec3(rp.fin), (ro.est ? '~' : '') + dec3(ro.fin)], [tr('Hitrost na cilju'), kmh(rp), kmh(ro)]];
      if (S.hs) rows.push([tr('Prednost'), S.aP ? Z.dec(S.aP.toFixed(1)) + ' m' : '–', S.aO ? Z.dec(S.aO.toFixed(1)) + ' m' : '–']);
      rows.push([tr('Vozilo'), P.m.name, o.m.name], [tr('Rekord'), by[P.m.id] ? dec3(by[P.m.id]) : '–', '']);   // (with this vehicle)
      $('res-table').querySelector('tbody').innerHTML = rows.map(([a, b, c], i) => '<tr' + (i === 3 ? ' class="me"' : '') + '><td>' + Z.esc(a) + '</td><td>' + Z.esc(b) + '</td><td>' + Z.esc(c) + '</td></tr>').join('');
      $('res-restart').dataset.act = 'restart'; $('res-restart').textContent = tr('Ponovi dvoboj');
      Z.resEnd('drag');
      G.showScreen('results');
      return true;
    },
    // under the head: the shifts' words, the rival the other way next time (a tap: the setting and the run again)
    resEnd(race, kind) {
      const S = this.st; if (kind !== 'drag' || !S || race.zbMode !== 'drag') return '';
      const n = (w) => S.words.filter(x => x === w).length, G = Z.G, truck = !!(G && G.S && +G.S.zbDrag === 1);
      const shifts = S.words.length ? tr('Menjave: {0} · popolno {1}, dobro {2}, prezgodaj {3}, prepozno {4}', S.words.length, n('perfect'), n('good'), n('early'), n('late')) : S.P.man ? tr('Menjave: nobene (prestave prestavljaš sam).') : tr('Električni avto: brez menjav.');
      setTimeout(() => {
        const b = Z.el('zb-drag-swap'); if (!b) return;
        b.addEventListener('click', (e) => { e.preventDefault(); const G2 = Z.G; if (!G2 || !G2.S) return; G2.S.zbDrag = truck ? 0 : 1; G2.save(); const r = Z.el('res-restart'); if (r) r.click(); });
      }, 0);
      return '<div class="zb-drag-res"><span>' + Z.esc(shifts) + '</span><button type="button" id="zb-drag-swap" class="zb-ci">' + Z.esc(tr(truck ? 'Proti avtu' : 'Proti tovornjaku')) + '</button></div>';
    },
    stop() {
      const S = this.st;
      if (S) { for (const c of [S.P, S.o]) { if (c) { c.ctl = null; c.man = null; } } }
      this.st = null; this.ui(null);
    },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) {
    Comm.addLines('zbDragIntro', ['A quarter mile, side by side. Watch the lights, then shift on the green!', 'Drag race against the {rival}: four hundred metres, every shift counts.', 'Two lanes, one finish line. Clean launch, clean shifts!']);
    Comm.addLines('zbDragWin', ['Won it! First over the line!', 'A perfect run, the {rival} is beaten!', 'That is the win, superb launch!']);
    Comm.addLines('zbDragLose', ['Beaten to the line by the {rival}.', 'Not this time, the {rival} was quicker.', 'So close! The rival takes it.']);
    Comm.addLines('zbDragRed', ['Red light! Too early off the line.', 'Jumped the start, red light! The run does not count.']);
  }
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
