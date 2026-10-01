/* =========================================================================
   INPUT — touch buttons, on-screen steering wheel, tilt, keyboard, gamepad
   ========================================================================= */
const Input = (function () {
  'use strict';
  const { clamp, sstep, wrapPi } = Core;
  const DEG = Math.PI / 180;
  const S = { steer: 0, thr: 0, brk: 0, hand: 0, digital: true };
  let mode = 'buttons';
  let layer = null;
  const ptrs = new Map();
  const keys = Object.create(null);
  let R = {};
  const wheel = { pid: null, ang: 0, last: 0, max: 130 * DEG, el: null };
  const tilt = { listening: false, raw: 0, neutral: 0, got: false, lastT: 0, sens: 22, invert: false, value: 0 };
  let autoGas = false;
  let onPause = null;
  let vib = true;
  const els = {};
  const pressed = { left: false, right: false, gas: false, brake: false, drift: false };

  function $(id) { return document.getElementById(id); }

  function init(layerEl, pauseCb) {
    layer = layerEl; onPause = pauseCb;
    ['c-left', 'c-right', 'c-wheel', 'c-gas', 'c-brake', 'c-drift', 'tilt-ind'].forEach(id => { els[id] = $(id); });
    wheel.el = $('wheel-rot');
    const opt = { passive: false };
    layer.addEventListener('pointerdown', onDown, opt);
    layer.addEventListener('pointermove', onMove, opt);
    layer.addEventListener('pointerup', onUp, opt);
    layer.addEventListener('pointercancel', onUp, opt);
    layer.addEventListener('lostpointercapture', onUp, opt);
    // block iOS gestures (double-tap zoom, callouts)
    layer.addEventListener('touchstart', e => e.preventDefault(), opt);
    layer.addEventListener('touchmove', e => e.preventDefault(), opt);
    layer.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => {
      if (capture) { e.preventDefault(); if (e.repeat) return; const cb = capture; capture = null; cb(e.code === 'Escape' ? null : e.code === 'Backspace' || e.code === 'Delete' ? '' : e.code, e.key); return; }   // (Kontrole: the key for an action; Esc: no change, Backspace: none)
      const typing = !!(e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName));   // (a name being typed: its keys are letters)
      if (!typing && driveKeys.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      keys[e.code] = true;
      if (typing) return;
      if (keyIs('pause', e.code) && onPause) onPause();
      if (keyIs('cam', e.code) && onCam) onCam();   // (the camera)
      if (keyIs('tyre', e.code) && onTyre) onTyre();   // (the tyres for the next stop)
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; ptrs.clear(); wheel.pid = null; });
    window.addEventListener('resize', () => setTimeout(layout, 60));
    layout();
  }

  function layout() {
    const r = (id) => { const e = els[id]; if (!e || e.offsetParent === null) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 }; };
    R = { left: r('c-left'), right: r('c-right'), wheel: r('c-wheel'), gas: r('c-gas'), brake: r('c-brake'), drift: r('c-drift') };
  }

  function setMode(m) {
    mode = m;
    const t = $('touch');
    if (t) { t.classList.remove('m-buttons', 'm-wheel', 'm-tilt'); t.classList.add('m-' + m); }
    wheel.pid = null; wheel.ang = 0;
    requestAnimationFrame(layout);
    if (m === 'tilt') startTiltListening(); 
  }
  function setOptions(o) {
    if (o.autoGas != null) autoGas = !!o.autoGas;
    if (o.tiltSens != null) tilt.sens = o.tiltSens;
    if (o.tiltInvert != null) tilt.invert = !!o.tiltInvert;
    if (o.vibrate != null) vib = !!o.vibrate;
  }

  function inRect(r, x, y, pad) { return r && x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad; }
  function wheelAngle(x, y) { return Math.atan2(y - R.wheel.cy, x - R.wheel.cx); }

  function onDown(e) {
    e.preventDefault();
    if (pad.on) { pad.on = false; padShow(); }   // (a touch: the on-screen controls again)
    try { layer.setPointerCapture(e.pointerId); } catch (_) { }
    const p = { x: e.clientX, y: e.clientY };
    ptrs.set(e.pointerId, p);
    if (mode === 'wheel' && wheel.pid === null && R.wheel) {
      const dx = p.x - R.wheel.cx, dy = p.y - R.wheel.cy;
      const rad = R.wheel.w * 0.5;
      if (dx * dx + dy * dy < (rad * 1.35) * (rad * 1.35) || (p.x < window.innerWidth * 0.42 && p.y > window.innerHeight * 0.3)) {
        wheel.pid = e.pointerId; wheel.last = wheelAngle(p.x, p.y);
      }
    }
    if (window.Sfx) Sfx.resume();
  }
  function onMove(e) {
    const p = ptrs.get(e.pointerId); if (!p) return;
    e.preventDefault();
    p.x = e.clientX; p.y = e.clientY;
    if (e.pointerId === wheel.pid && R.wheel) {
      const dx = p.x - R.wheel.cx, dy = p.y - R.wheel.cy;
      if (dx * dx + dy * dy > (R.wheel.w * 0.1) * (R.wheel.w * 0.1)) {
        const a = wheelAngle(p.x, p.y);
        wheel.ang = clamp(wheel.ang + wrapPi(a - wheel.last), -wheel.max, wheel.max);
        wheel.last = a;
      }
    }
  }
  function onUp(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (e.pointerId === wheel.pid) wheel.pid = null;
  }

  /* ---------------- tilt ---------------- */
  function screenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
    if (typeof window.orientation === 'number') return window.orientation;
    return window.innerWidth > window.innerHeight ? 90 : 0;
  }
  function onOrient(e) {
    if (e.beta == null || e.gamma == null) return;
    const b = e.beta * DEG, g = e.gamma * DEG;
    const ux = -Math.cos(b) * Math.sin(g), uy = Math.sin(b);
    const th = screenAngle() * DEG;
    const ur = ux * Math.cos(th) - uy * Math.sin(th);
    const uu = ux * Math.sin(th) + uy * Math.cos(th);
    const wheelA = Math.atan2(-ur, uu);
    const roll = Math.asin(clamp(-ur, -1, 1));
    const k = sstep(0.2, 0.45, uu);
    tilt.raw = k * wheelA + (1 - k) * roll;
    tilt.got = true; tilt.lastT = performance.now();
  }
  function startTiltListening() {
    if (tilt.listening) return;
    if (typeof DeviceOrientationEvent === 'undefined') return;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') return; // needs gesture: requestTilt()
    window.addEventListener('deviceorientation', onOrient); tilt.listening = true;
  }
  // must be called from a user gesture on iOS
  function requestTilt() {
    return new Promise((resolve) => {
      if (typeof DeviceOrientationEvent === 'undefined') { resolve('unsupported'); return; }
      const attach = () => { if (!tilt.listening) { window.addEventListener('deviceorientation', onOrient); tilt.listening = true; } };
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') { attach(); resolve('granted'); } else resolve('denied'); }).catch(() => resolve('denied'));
      } else { attach(); resolve('granted'); }
    });
  }
  function tiltAlive() { return tilt.got && performance.now() - tilt.lastT < 1500; }
  function calibrate() { tilt.neutral = Math.abs(tilt.raw) < 35 * DEG ? tilt.raw : 0; }
  function tiltSteer() {
    let v = wrapPi(tilt.raw - tilt.neutral);
    if (tilt.invert) v = -v;
    const dz = 1.2 * DEG, mx = tilt.sens * DEG;
    const a = Math.abs(v);
    let s = a < dz ? 0 : Math.min(1, (a - dz) / (mx - dz));
    s = Math.pow(s, 1.15);
    return v < 0 ? -s : s;
  }

  /* ---------------- the controls (Nastavitve · Kontrole): the keys for each action, and for each pad or wheel its own buttons and axes
     (stored by game.js, given here with setKeys / setPads). A pad in the standard layout by default: the left stick steers, RT / R2 or
     A / Cross the throttle, LT / L2 or X / Square the brake, B / Circle or RB / R1 drift, Start the pause, View / Select the camera, Y /
     Triangle the rescue. A wheel (another layout): the wheel's axis steers in proportion (no curve, a small dead zone), its pedals are
     axes found and measured in Kontrole (where each rests and where it is pressed down). */
  const KEY_DEF = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], gas: ['ArrowUp', 'KeyW'], brake: ['ArrowDown', 'KeyS'], drift: ['Space', ''], pause: ['Escape', 'KeyP'], cam: ['KeyC', ''], tyre: ['KeyT', ''] };
  const WHEEL_RE = /wheel|volant|lenkrad|racing|driving force|g2[79]|g9[02]\d|g923|g29|t\d{3}|t-gt|tmx|thrustmaster|fanatec|moza|simagic/i;
  let keyMap = {}, driveKeys = new Set(), capture = null;
  const keyDown = (act) => { const m = keyMap[act]; return !!(m && ((m[0] && keys[m[0]]) || (m[1] && keys[m[1]]))); };
  const keyIs = (act, code) => { const m = keyMap[act]; return !!(m && code && (m[0] === code || m[1] === code)); };
  function setKeys(m) {   // { act: [code, code] } (missing actions: the default keys)
    keyMap = {}; for (const a in KEY_DEF) keyMap[a] = (m && Array.isArray(m[a]) ? m[a] : KEY_DEF[a]).slice(0, 2).map(c => (typeof c === 'string' ? c : ''));
    driveKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']); for (const a of ['left', 'right', 'gas', 'brake', 'drift']) for (const c of keyMap[a]) if (c) driveKeys.add(c);   // (no scrolling of the page with them)
  }
  setKeys(null);
  function captureKey(cb) { capture = cb; for (const k in keys) keys[k] = false; }   // (the next key pressed goes to cb: its code, '' for none, null when Esc)
  const isWheel = (gp) => !!gp && gp.mapping !== 'standard' && WHEEL_RE.test(gp.id || '');
  function padDefault(gp) {   // a device's binding before the player sets it
    const B = (i) => ({ t: 'b', i });
    if (isWheel(gp)) return { steer: { i: 0, inv: 0, dz: 0.02, rng: 1, cur: 1 }, gas: [], brake: [], drift: [], pause: [B(9)], cam: [B(8)], rescue: [B(3)] };
    return { steer: { i: 0, inv: 0, dz: 0.15, rng: 1, cur: 1.5 }, gas: [B(7), B(0)], brake: [B(6), B(2)], drift: [B(1), B(5)], pause: [B(9)], cam: [B(8)], rescue: [B(3)] };
  }
  let padBinds = {}, padPick = '';
  function setPads(m, pick) { padBinds = m && typeof m === 'object' ? m : {}; padPick = pick || ''; }
  const padBind = (gp) => padBinds[gp.id] || padDefault(gp);

  /* ---------------- gamepad (the browser's Gamepad API: pads and wheels) ----------------
     padRead() once a frame (game.js): the values for update() through the device's binding (above), and the presses since the last frame
     for the menus (start, a, b, y, lb, rb and the directions of the stick or the d-pad, repeated while held: a pad's standard layout) and
     for the race (pause, cam, rescue: the bound buttons). From its first press the pad is the controller (the on-screen controls hide)
     until the screen is touched again. The device: the one picked in Kontrole while connected, else the first. */
  const PAD_DZ = 0.15, PAD_B = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, back: 8, start: 9 };
  const pad = { on: false, name: '', wheel: false, steer: 0, dsteer: 0, thr: 0, brk: 0, hand: 0, rx: 0, ry: 0, rt: 0, lt: 0, prev: {}, hold: {}, pressed: [], moved: {} };
  let onPad = null, onCam = null, onTyre = null;
  function padAxis(v) { const a = Math.abs(v || 0); if (!(a > PAD_DZ)) return 0; return Math.sign(v) * Math.pow(Math.min(1, (a - PAD_DZ) / (1 - PAD_DZ)), 1.5); }   // (a dead zone, finer near the middle)
  function steerOf(v, s) {   // the steering axis through its calibration: turned the other way, full lock at rng of the axis, the dead zone in the middle, the curve
    const x = (v || 0) * (s.inv ? -1 : 1), a = Math.abs(x) / Math.max(0.05, s.rng || 1), dz = s.dz || 0;
    if (!(a > dz)) return 0;
    return Math.sign(x) * Math.pow(Math.min(1, (a - dz) / Math.max(0.01, 1 - dz)), s.cur || 1);
  }
  function pedalOf(gp, q) {   // a pedal on an axis: 0 where it rests (lo), 1 pressed down (hi); a small dead zone at rest. (An axis the browser reads as 0
    const v = gp.axes ? gp.axes[q.i] : undefined;                           // until it first moves - some wheels' pedals - counts as resting.)
    if (typeof v !== 'number' || !isFinite(v)) return 0;
    const key = gp.id + ':' + q.i; if (v !== 0) pad.moved[key] = true; else if (!pad.moved[key] && q.lo !== 0) return 0;
    const t = (v - q.lo) / ((q.hi - q.lo) || 1);
    return clamp((t - 0.04) / 0.96, 0, 1);
  }
  function padShow() { const t = $('touch'); if (t) t.classList.toggle('pad', pad.on); }
  function padList() { const out = []; try { const l = navigator.getGamepads ? navigator.getGamepads() : null; if (l) for (const g of l) if (g && g.connected !== false && g.buttons && g.buttons.length) out.push(g); } catch (_) { } return out; }
  function padDev() { const l = padList(); return l.find(g => g.id === padPick) || l[0] || null; }
  function padRaw() {   // Kontrole: the device as it is now (its axes and buttons, to find the one the player moves or presses)
    const gp = padDev(); if (!gp) return null;
    const bv = (b) => (typeof b === 'number' ? b : b ? (b.value > 0 ? b.value : b.pressed ? 1 : 0) : 0);
    return { id: gp.id, wheel: isWheel(gp), std: gp.mapping === 'standard', axes: Array.from(gp.axes || [], (v) => (typeof v === 'number' && isFinite(v) ? v : 0)), buttons: Array.from(gp.buttons || [], bv), bind: JSON.parse(JSON.stringify(padBind(gp))), def: padDefault(gp) };
  }
  function padRead(dt) {
    pad.pressed.length = 0;
    const gp = padDev();
    if (!gp) { pad.steer = pad.dsteer = pad.thr = pad.brk = pad.hand = pad.rx = pad.ry = pad.rt = pad.lt = 0; pad.name = ''; pad.wheel = false; return pad; }
    if (gp.id !== pad.name) { pad.name = gp.id; pad.prev = {}; pad.hold = {}; pad.wheel = isWheel(gp); if (pad.on) { pad.on = false; padShow(); } }   // (another device: announced at its first press)
    const bv = (i) => { const b = gp.buttons[i]; if (!b) return 0; if (typeof b === 'number') return b; return b.value > 0 ? b.value : b.pressed ? 1 : 0; };
    const Bd = padBind(gp), std = gp.mapping === 'standard', val = (q) => (q.t === 'a' ? pedalOf(gp, q) : bv(q.i)), most = (L) => { let m = 0; for (const q of L || []) m = Math.max(m, val(q)); return m; };
    const lx = std ? padAxis(gp.axes && gp.axes[0]) : 0, ly = std ? padAxis(gp.axes && gp.axes[1]) : 0;
    pad.steer = steerOf(gp.axes && gp.axes[Bd.steer.i], Bd.steer); pad.dsteer = std ? (bv(15) > 0.5 ? 1 : 0) - (bv(14) > 0.5 ? 1 : 0) : 0;   // (the d-pad: a pad's)
    pad.rx = std ? padAxis(gp.axes && gp.axes[2]) : 0; pad.ry = std ? padAxis(gp.axes && gp.axes[3]) : 0; pad.rt = std ? bv(7) : 0; pad.lt = std ? bv(6) : 0;   // (the right stick and the triggers alone: the photo mode's camera)
    pad.thr = most(Bd.gas); pad.brk = most(Bd.brake); pad.hand = most(Bd.drift) > 0.5 ? 1 : 0;
    const sx = std ? lx : pad.steer;   // (the menus: a pad's stick, a wheel turned)
    const down = { up: std && (bv(12) > 0.5 || ly < -0.55), down: std && (bv(13) > 0.5 || ly > 0.55), left: (std && bv(14) > 0.5) || sx < -0.55, right: (std && bv(15) > 0.5) || sx > 0.55 };
    for (const k in PAD_B) down[k] = bv(PAD_B[k]) > 0.5;
    for (const k of ['pause', 'cam', 'rescue']) down['@' + k] = most(Bd[k]) > 0.5;   // (the race's buttons as bound: pressed as '@pause' ...)
    let any = false;
    for (const k in down) {
      if (!down[k]) { pad.prev[k] = false; pad.hold[k] = 0; continue; }
      any = true;
      if (!pad.prev[k]) { pad.pressed.push(k); pad.hold[k] = 0; }
      else if (!(k in PAD_B) && k[0] !== '@') { const h0 = pad.hold[k]; pad.hold[k] = h0 + dt; if (pad.hold[k] > 0.42 && Math.floor((pad.hold[k] - 0.42) / 0.13) !== Math.floor((h0 - 0.42) / 0.13)) pad.pressed.push(k); }   // (a direction held: again after 0.42 s, then every 0.13 s; a button once per press)
      pad.prev[k] = true;
    }
    if ((any || Math.abs(pad.steer) > 0.3 || pad.thr > 0.2 || pad.brk > 0.2) && !pad.on) { pad.on = true; padShow(); if (onPad) onPad(gp.id, pad.wheel); }
    return pad;
  }

  /* ---------------- per-frame ---------------- */
  function update(dt) {
    const W = window.innerWidth, H = window.innerHeight;
    let left = false, right = false, gas = false, brake = false, drift = false;
    for (const [id, p] of ptrs) {
      if (id === wheel.pid) continue;
      if (inRect(R.drift, p.x, p.y, 12)) { drift = true; continue; }
      if (mode === 'tilt') { if (p.x < W * 0.5) brake = true; else gas = true; continue; }
      if (mode === 'buttons' && p.x < W * 0.5) {
        if (p.y > H * 0.28) {
          const split = R.left && R.right ? (R.left.cx + R.right.cx) / 2 : W * 0.16;
          if (p.x < split) left = true; else right = true;
        }
        continue;
      }
      if (p.x >= W * 0.5 && p.y > H * 0.25) {
        const split = R.gas && R.brake ? (R.gas.cx + R.brake.cx) / 2 : W * 0.85;
        if (p.x >= split) gas = true; else brake = true;
      }
    }
    // keyboard (the keys bound to each action: Nastavitve · Kontrole)
    const kL = keyDown('left'), kR = keyDown('right'), kU = keyDown('gas'), kD = keyDown('brake'), kH = keyDown('drift');
    let steer = 0, digital = true;
    if (kL || kR) { steer = (kR ? 1 : 0) - (kL ? 1 : 0); }
    else if (mode === 'buttons') steer = (right ? 1 : 0) - (left ? 1 : 0);
    else if (mode === 'wheel') {
      if (wheel.pid === null) { const d = Math.min(Math.abs(wheel.ang), dt * 7.5); wheel.ang -= Math.sign(wheel.ang) * d; }
      steer = clamp(wheel.ang / (wheel.max * 0.86), -1, 1); digital = false;
    } else if (mode === 'tilt') { tilt.value = tiltSteer(); steer = tilt.value; digital = false; }
    gas = gas || kU; brake = brake || kD; drift = drift || kH;
    if (pad.on) {   // the gamepad (padRead: this frame's values): the stick over the other steering, the triggers in proportion
      if (pad.steer) { steer = pad.steer; digital = false; } else if (pad.dsteer && !steer) steer = pad.dsteer;
      if (pad.brk > 0.05) brake = true;
    }
    S.steer = steer; S.digital = digital;
    S.brk = Math.max(brake ? 1 : 0, pad.on ? pad.brk : 0);
    S.thr = Math.max(gas ? 1 : (autoGas && !brake ? 1 : 0), pad.on ? pad.thr : 0);
    S.hand = drift || (pad.on && pad.hand) ? 1 : 0;
    // visuals
    setPressed('left', left || kL); setPressed('right', right || kR); setPressed('gas', gas || (autoGas && !brake)); setPressed('brake', brake); setPressed('drift', drift);
    if (wheel.el && mode === 'wheel') wheel.el.style.transform = 'rotate(' + (wheel.ang / DEG).toFixed(1) + 'deg)';
    if (els['tilt-ind'] && mode === 'tilt') els['tilt-ind'].style.setProperty('--t', (tilt.value * 38).toFixed(1) + 'deg');
    return S;
  }
  const map = { left: 'c-left', right: 'c-right', gas: 'c-gas', brake: 'c-brake', drift: 'c-drift' };
  function setPressed(k, v) { if (pressed[k] === v) return; pressed[k] = v; const e = els[map[k]]; if (e) e.classList.toggle('on', !!v); }
  function reset() { ptrs.clear(); wheel.pid = null; wheel.ang = 0; for (const k in keys) keys[k] = false; }
  function vibrate(ms) { if (vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (_) { } } }

  return { init, layout, setMode, setOptions, update, requestTilt, tiltAlive, calibrate, reset, vibrate, padRead, padRaw, padList, setKeys, setPads, captureKey, get keyMap() { return keyMap; }, set onPad(fn) { onPad = fn; }, set onCam(fn) { onCam = fn; }, set onTyre(fn) { onTyre = fn; }, pad, state: S, tilt, get mode() { return mode; } };
})();

