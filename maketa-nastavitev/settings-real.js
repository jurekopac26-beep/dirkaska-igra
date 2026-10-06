/* The pictures over the settings made of real frames from the game (REAL_FRAMES: Riviera, France, the same second of a race drawn
   with every option), in three ways:
     video:   each setting a clip from the game with the chosen option (here its frame, a bar running as a clip would);
     compare: every option at once, side by side, the same second of the race; the chosen one wider and lit;
     live:    one window at the top with your own paused race, as the game draws it now; a setting you change shows there.
   A setting that cannot be seen in a picture (the sound, the tilt's sensitivity ...) shows the race with a small sign of what it does. */
window.SetReal = (function () {
  'use strict';
  const RF = window.REAL_FRAMES, DATA = window.REAL_DATA || null;   // (the single-file build: the frames inside the page)
  const url = (o, n) => DATA ? DATA[o][n] : 'posnetki/' + o + '/' + n + '.jpg';
  // the frame of an option, where the game draws it differently; the rest show the race as it is, with the player's controls (the
  // frames were taken with Nagib: Samodejni plin also with the other two)
  const FR = { control: 1, camera: 1, zoom: 1, carLow: 1, quality: 1, shadows: 1, line: 1, tower: 1, autoGas: 1 };
  let ctl = () => 'tilt';
  const has = (o, n) => RF[o].frames.includes(n);
  const baseOf = (o) => has(o, 'control-' + ctl()) ? 'control-' + ctl() : 'base';
  const frameOf = (o, key, v) => {
    if (!FR[key]) return baseOf(o);
    const n = key === 'autoGas' && ctl() !== 'tilt' ? key + '-' + v + '-' + ctl() : key + '-' + v;
    return has(o, n) ? n : has(o, key + '-' + v) ? key + '-' + v : baseOf(o);
  };
  // the part of the screen a setting is about: cx, cy (0..1 of the screen), wf (the share of the screen's width shown); car: around
  // our car (dy: a little above it, the road ahead)
  const REG = {
    port: { control: { cx: .5, cy: .87, wf: 1 }, autoGas: { cx: .5, cy: .87, wf: 1 }, carLow: { cx: .5, cy: .71, wf: 1 }, tower: { cx: .28, cy: .17, wf: .62 },
      quality: { car: 1, dy: -.03, wf: .5 }, shadows: { car: 1, dy: -.03, wf: .5 }, line: { cx: .5, cy: .5, wf: 1 }, live: { car: 1, dy: .1, wf: 1 }, def: { car: 1, dy: -.07, wf: 1 } },
    land: { control: { cx: .5, cy: .76, wf: 1 }, autoGas: { cx: .5, cy: .76, wf: 1 }, carLow: { cx: .5, cy: .62, wf: 1 }, tower: { cx: .14, cy: .45, wf: .32 },
      quality: { car: 1, wf: .42 }, shadows: { car: 1, wf: .42 }, line: { car: 1, dy: -.1, wf: 1 }, live: { car: 1, wf: .78 }, def: { car: 1, wf: 1 } }
  };
  // (compare: every tile the same scale, as the card's full width would show it; the controls: their left half, where Tipke, Volan and
  // Nagib differ most)
  const REGC = { port: { control: { cx: .26, cy: .87, wf: 1 } }, land: { control: { cx: .2, cy: .76, wf: 1 } } };
  const regOf = (o, key, cmp) => (cmp && REGC[o][key]) || REG[o][key] || REG[o].def;
  // the sign over the race for what a picture cannot show
  const SIGN = { tiltSens: 'tilt', tiltInvert: 'tilt', assist: 'drift', kontrole: 'pad', notes: 'note', pkNotes: 'note', ghost: 'ghost', difficulty: 'gauge', damage: 'crash',
    faults: 'wrench', radio: 'headset', intro: 'film', pkFly: 'film', hlv: 'film', detail: 'tree', saver: 'battery', sound: 'speaker', music: 'music', comm: 'mic',
    codrv: 'mic', vibrate: 'buzz', lang: 'globe', name: 'person', profile: 'folder', pitCmp: 'tyre' };
  const G = {
    tilt: '<path d="M8.5 3.5 L15.5 5 L13 20.5 L6 19 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" transform="rotate(14 11 12)"/><path d="M17.5 7 A7 7 0 0 1 19.5 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    drift: '<path d="M4 17 C8 17 9 9 14 8 C17 7.4 19 8 20 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M5 12 H8 M4 14.5 H7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    pad: '<path d="M7 7.5 H17 C19.5 7.5 21 10 21.3 13.5 C21.6 17 20.4 18.6 18.8 18.6 C17.4 18.6 16.6 17.2 15.8 15.8 H8.2 C7.4 17.2 6.6 18.6 5.2 18.6 C3.6 18.6 2.4 17 2.7 13.5 C3 10 4.5 7.5 7 7.5 Z" fill="none" stroke="currentColor" stroke-width="2"/>',
    note: '<path d="M5 17 C5 10 9 6 16 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M13 3 L17 6 L13.5 9.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    ghost: '<path d="M6 20 V10 A6 6 0 0 1 18 10 V20 L15.5 18 L13 20 L10.5 18 L8 20 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="10" cy="11" r="1.3" fill="currentColor"/><circle cx="14" cy="11" r="1.3" fill="currentColor"/>',
    gauge: '<path d="M4.5 16.5 A8 8 0 1 1 19.5 16.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 13 L16 8.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    crash: '<path d="M12 3 L14 9 L20 7 L16 12 L21 15 L14.5 15.5 L15 21 L11 16.5 L6 20 L7.5 14 L3 11 L9 10 Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
    wrench: '<path d="M14.5 4 A4.5 4.5 0 0 0 10.6 10.4 L4 17 L7 20 L13.6 13.4 A4.5 4.5 0 0 0 20 9.5 L17 12 L14.5 11 L13.5 8.5 Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
    headset: '<path d="M4.5 15 V12 A7.5 7.5 0 0 1 19.5 12 V15" fill="none" stroke="currentColor" stroke-width="2.1"/><rect x="3.5" y="13.5" width="4" height="6" rx="1.5" fill="currentColor"/><rect x="16.5" y="13.5" width="4" height="6" rx="1.5" fill="currentColor"/>',
    film: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9 L15 12 L10 15 Z" fill="currentColor"/>',
    tree: '<path d="M12 3 L18 13 H14.5 L19 19 H5 L9.5 13 H6 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 19 V22" stroke="currentColor" stroke-width="2.2"/>',
    battery: '<rect x="3" y="7" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 10.5 V13.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><rect x="5.5" y="9.5" width="6" height="5" fill="currentColor"/>',
    speaker: '<path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" fill="currentColor"/><path d="M15.5 9 A4 4 0 0 1 15.5 15 M18 6.5 A7.5 7.5 0 0 1 18 17.5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>',
    music: '<path d="M9 17.5 V5.5 L19 3.5 V15.5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="2.6" fill="currentColor"/><circle cx="16.5" cy="15.5" r="2.6" fill="currentColor"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11 A6.5 6.5 0 0 0 18.5 11 M12 17.5 V21" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>',
    buzz: '<rect x="8" y="3.5" width="8" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 8 L3 10 L4.5 12 L3 14 M19.5 8 L21 10 L19.5 12 L21 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    globe: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12 H20.5 M12 3.5 C8.5 7 8.5 17 12 20.5 C15.5 17 15.5 7 12 3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    person: '<circle cx="12" cy="8" r="3.8" fill="currentColor"/><path d="M4.5 20.5 C5.5 15.5 8.5 13.5 12 13.5 C15.5 13.5 18.5 15.5 19.5 20.5 Z" fill="currentColor"/>',
    folder: '<path d="M3 6.5 H9.5 L11.5 8.5 H21 V18.5 H3 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    tyre: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'
  };
  const svg = (g) => '<svg viewBox="0 0 24 24">' + G[g] + '</svg>';
  const optLabel = (it, v) => { if (it.opts) { const o = it.opts.find(x => String(x.v) === String(v)); return o ? o.l : ''; } if (it.range) return v + it.range.unit; return ''; };
  const h = (cls, html) => { const e = document.createElement('div'); e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // a frame shown in its box: the part of the screen the setting is about, as big as the box allows
  function frameEl(o, key, name, v) {
    const f = h('rf'); f.dataset.o = o; f.dataset.key = key; f.dataset.frame = name; if (v != null) f.dataset.v = v;
    f.style.backgroundImage = 'url("' + url(o, name) + '")';
    return f;
  }
  function placeOne(f) {
    const bw = f.offsetWidth, bh = f.offsetHeight; if (!bw || !bh) return;
    const tile = f.closest('.rc'), ref = tile ? tile.offsetWidth : bw;   // (a tile: the scale of the whole card)
    const o = f.dataset.o, R = RF[o], g = regOf(o, f.dataset.reg || f.dataset.key, !!tile || !!f.closest('.sx-live')), p = R.pos[f.dataset.frame] || R.pos.base;
    const cx = g.car ? p[0] / R.w : g.cx, cy = g.car ? p[1] / R.h + (g.dy || 0) : g.cy;
    let dw = ref / g.wf, dh = dw * R.h / R.w; if (dh < bh) { dh = bh; dw = dh * R.w / R.h; }
    const L = Math.max(0, Math.min(dw - bw, cx * dw - bw / 2)), T = Math.max(0, Math.min(dh - bh, cy * dh - bh / 2));
    f.style.backgroundSize = dw.toFixed(1) + 'px ' + dh.toFixed(1) + 'px'; f.style.backgroundPosition = (-L).toFixed(1) + 'px ' + (-T).toFixed(1) + 'px';
  }
  function place(root) { for (const f of (root || document).querySelectorAll('.rf')) placeOne(f); }
  const sign = (it, v) => SIGN[it.key] ? '<span class="rsign">' + svg(SIGN[it.key]) + '<b>' + (optLabel(it, v) || it.name) + '</b></span>' : '';

  /* ---- 1. video: the clip of the chosen option ---- */
  function video(o, it, v) {
    const pic = h('sx-pic real rv');
    pic.appendChild(frameEl(o, it.key, frameOf(o, it.key, v), v));
    pic.insertAdjacentHTML('beforeend', (SIGN[it.key] ? '' : '<i class="rtag">' + (optLabel(it, v) || it.name) + '</i>') + sign(it, v) +
      '<div class="rbar"><i class="rplay"><svg viewBox="0 0 24 24"><path d="M7 4.5 L20 12 L7 19.5 Z" fill="currentColor"/></svg></i><span class="rprog"><b></b></span><em>0:02</em></div>');
    return pic;
  }
  function videoTo(pic, o, it, v, dir) {   // (the new clip comes in from the side of the button tapped)
    const old = pic.querySelector('.rf'), nf = frameEl(o, it.key, frameOf(o, it.key, v), v);
    nf.classList.add('in', dir < 0 ? 'l' : 'r'); pic.insertBefore(nf, old.nextSibling); placeOne(nf);
    requestAnimationFrame(() => { nf.classList.remove('in'); old.classList.add('out', dir < 0 ? 'r' : 'l'); setTimeout(() => old.remove(), 420); });
    const tg = pic.querySelector('.rtag'); if (tg) tg.textContent = optLabel(it, v) || it.name;
    const s = pic.querySelector('.rsign'); if (s) s.outerHTML = sign(it, v);
    const b = pic.querySelector('.rprog b'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  }

  /* ---- 2. compare: every option at once, the same second ---- */
  function compare(o, it, v, pick) {
    // (a setting the game does not draw differently: one frame with its sign; side by side they would all be the same picture)
    if (!FR[it.key]) { const pic = h('sx-pic real rv rc1'); pic.appendChild(frameEl(o, it.key, 'base')); pic.insertAdjacentHTML('beforeend', sign(it, v) || '<i class="rtag">' + it.name + '</i>'); return pic; }
    const pic = h('sx-pic real rc'); const opts = it.opts || [{ v, l: optLabel(it, v) || it.name }];
    pic.classList.add('n' + opts.length);
    for (const op of opts) {
      const t = h('rt' + (String(op.v) === String(v) ? ' sel' : '')); t.dataset.v = op.v;
      t.appendChild(frameEl(o, it.key, frameOf(o, it.key, op.v), op.v));
      t.insertAdjacentHTML('beforeend', (SIGN[it.key] ? '<span class="rsign">' + svg(SIGN[it.key]) + '</span>' : '') + '<span class="rl">' + op.l + '</span>');
      if (it.opts) t.addEventListener('click', () => pick(op.v));
      pic.appendChild(t);
    }
    return pic;
  }
  function compareTo(pic, v, it) {
    if (pic.classList.contains('rc1')) { const s = pic.querySelector('.rsign'); if (s && it) s.outerHTML = sign(it, v); return; }
    for (const t of pic.querySelectorAll('.rt')) t.classList.toggle('sel', String(t.dataset.v) === String(v)); setTimeout(() => place(pic), 30); setTimeout(() => place(pic), 380); }

  /* ---- 3. live: one window with the race as it is now ---- */
  function live(o) {
    const w = h('sx-live', '<div class="rlw"></div><i class="rlive"><b></b>V živo · tvoja dirka</i><span class="rcap"></span>');
    w.dataset.o = o; return w;
  }
  function liveShow(w, it, v, instant) {
    const o = w.dataset.o, box = w.querySelector('.rlw'), nf = frameEl(o, it ? it.key : 'live', it ? frameOf(o, it.key, v) : baseOf(o), v);
    nf.dataset.reg = !it ? 'live' : REG[o][it.key] ? it.key : 'def';   // (Kamera, Oddaljenost ...: around our car, the road ahead)
    const old = box.querySelector('.rf'); box.appendChild(nf); placeOne(nf);
    if (old) { if (instant) old.remove(); else { nf.classList.add('fade'); requestAnimationFrame(() => nf.classList.remove('fade')); setTimeout(() => old.remove(), 360); } }
    w.querySelector('.rcap').innerHTML = it ? '<b>' + it.name + '</b>' + (optLabel(it, v) ? ' · ' + optLabel(it, v) : '') : '';
    const s = w.querySelector('.rsign'); if (s) s.remove();
    if (it && SIGN[it.key]) w.insertAdjacentHTML('beforeend', sign(it, v));
  }
  // the controls changed: the pictures that show the race as it is show the new ones
  function rebase(root) {
    for (const f of (root || document).querySelectorAll('.rf')) {
      const key = f.dataset.key; if (key === 'control' || key === 'live' || (FR[key] && key !== 'autoGas')) continue;
      const n = key === 'autoGas' ? frameOf(f.dataset.o, key, f.dataset.v) : baseOf(f.dataset.o);
      if (n !== f.dataset.frame) { f.dataset.frame = n; f.style.backgroundImage = 'url("' + url(f.dataset.o, n) + '")'; placeOne(f); }
    }
  }
  return { video, videoTo, compare, compareTo, live, liveShow, place, frameOf, rebase, set control(f) { ctl = f; } };
})();
