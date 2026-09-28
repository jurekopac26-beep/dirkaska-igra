/* =========================================================================
   INPUT — touch buttons, on-screen steering wheel, tilt, keyboard
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
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      keys[e.code] = true;
      if ((e.code === 'Escape' || e.code === 'KeyP') && onPause) onPause();
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
    // keyboard
    const kL = keys.ArrowLeft || keys.KeyA, kR = keys.ArrowRight || keys.KeyD;
    const kU = keys.ArrowUp || keys.KeyW, kD = keys.ArrowDown || keys.KeyS, kH = keys.Space;
    let steer = 0, digital = true;
    if (kL || kR) { steer = (kR ? 1 : 0) - (kL ? 1 : 0); }
    else if (mode === 'buttons') steer = (right ? 1 : 0) - (left ? 1 : 0);
    else if (mode === 'wheel') {
      if (wheel.pid === null) { const d = Math.min(Math.abs(wheel.ang), dt * 7.5); wheel.ang -= Math.sign(wheel.ang) * d; }
      steer = clamp(wheel.ang / (wheel.max * 0.86), -1, 1); digital = false;
    } else if (mode === 'tilt') { tilt.value = tiltSteer(); steer = tilt.value; digital = false; }
    gas = gas || kU; brake = brake || kD; drift = drift || kH;
    S.steer = steer; S.digital = digital;
    S.brk = brake ? 1 : 0;
    S.thr = gas ? 1 : (autoGas && !brake ? 1 : 0);
    S.hand = drift ? 1 : 0;
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

  return { init, layout, setMode, setOptions, update, requestTilt, tiltAlive, calibrate, reset, vibrate, state: S, tilt, get mode() { return mode; } };
})();

