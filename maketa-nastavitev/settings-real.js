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
    if (f.classList.contains('rfs') || f.classList.contains('rfb')) return;   // (a phone's whole screen; the race blurred behind it)
    const bw = f.offsetWidth, bh = f.offsetHeight; if (!bw || !bh) return;
    const tile = f.closest('.rc'), ref = tile ? tile.offsetWidth : bw;   // (a tile: the scale of the whole card)
    const o = f.dataset.o, R = RF[o], g = regOf(o, f.dataset.reg || f.dataset.key, !!tile || !!f.closest('.sx-live')), p = R.pos[f.dataset.frame] || R.pos.base;
    const cx = g.car ? p[0] / R.w : g.cx, cy = g.car ? p[1] / R.h + (g.dy || 0) : g.cy;
    let dw = ref / g.wf, dh = dw * R.h / R.w; if (dh < bh) { dh = bh; dw = dh * R.w / R.h; }
    const L = Math.max(0, Math.min(dw - bw, cx * dw - bw / 2)), T = Math.max(0, Math.min(dh - bh, cy * dh - bh / 2));
    f.style.backgroundSize = dw.toFixed(1) + 'px ' + dh.toFixed(1) + 'px'; f.style.backgroundPosition = (-L).toFixed(1) + 'px ' + (-T).toFixed(1) + 'px';
  }
  function place(root) { for (const f of (root || document).querySelectorAll('.rf')) placeOne(f); for (const p of (root || document).querySelectorAll('.rv[data-ph]')) placePhone(p); for (const p of (root || document).querySelectorAll('.rv3')) placeTrio(p); }
  const sign = (it, v) => SIGN[it.key] ? '<span class="rsign">' + svg(SIGN[it.key]) + '<b>' + (optLabel(it, v) || it.name) + '</b></span>' : '';

  /* ---- the pictures in a phone (1 · Posnetek): 1 the whole phone on the race blurred, 2 a big phone close up (the part of the screen
     that matters, its edge and corners at the side), 3 the phone in two hands: the thumbs on the real controls of the option shown,
     the phone tilted for the tilt ---- */
  let phoneMode = '0';
  const BZ = 0.05;   // (the phone's edge: 5 % of the screen's short side)
  // where the thumbs press on the screen (0..1 of it), for each control: Tipke the left arrow, Volan the wheel, Nagib the brake; gas right
  const TIPS = {
    port: { buttons: [[.12, .93], [.86, .885]], wheel: [[.2, .885], [.86, .885]], tilt: [[.13, .9], [.86, .885]], hold: [[.04, .985], [.96, .985]] },
    land: { buttons: [[.07, .86], [.95, .74]], wheel: [[.12, .78], [.95, .74]], tilt: [[.08, .8], [.95, .74]], hold: [[.02, .9], [.98, .9]] }
  };
  const TILT = { tiltSens: 1, tiltInvert: 1 };
  const thumbSvg = (side) => '<svg class="rthumb ' + side + '" viewBox="0 0 40 100" aria-hidden="true"><defs><linearGradient id="rtg-' + side + '" x1="0" x2="1"><stop offset="0" stop-color="#c9d1dc"/><stop offset=".5" stop-color="#eef2f6"/><stop offset="1" stop-color="#b7c0cc"/></linearGradient></defs>' +
    '<rect x="4" y="2" width="32" height="140" rx="16" fill="url(#rtg-' + side + ')" stroke="rgba(40,50,64,.35)"/><rect x="10" y="6" width="20" height="19" rx="9" fill="rgba(255,255,255,.75)"/></svg>';
  function phonePic(o, it, v) {
    const n = frameOf(o, it.key, v), pic = h('sx-pic real rv rphm m' + phoneMode);
    pic.dataset.ph = phoneMode; pic.dataset.o = o; pic.dataset.key = it.key; pic.dataset.v = v;
    if (phoneMode !== '2') { const b = frameEl(o, it.key, n, v); b.classList.add('rfb'); pic.appendChild(b); }
    const ph = h('rph'), scr = h('rpsc'), f = frameEl(o, it.key, n, v); f.classList.add('rfs'); scr.appendChild(f); ph.appendChild(scr); pic.appendChild(ph);
    if (phoneMode === '3') pic.insertAdjacentHTML('beforeend', thumbSvg('l') + thumbSvg('r'));
    return pic;
  }
  function placePhone(pic) {
    const bw = pic.offsetWidth, bh = pic.offsetHeight; if (!bw || !bh) return;
    const o = pic.dataset.o, R = RF[o], mode = pic.dataset.ph, key = pic.dataset.key, v = pic.dataset.v, lying = R.w > R.h;
    const b = BZ * Math.min(R.w, R.h), ph = pic.querySelector('.rph');
    let s, L, T, rot = 0;
    if (mode === '2') {   // (close up: the screen 84 % of the picture's width, its edge showing; the part of it the setting is about in the middle)
      const g = regOf(o, key, false), p = R.pos[pic.querySelector('.rfs').dataset.frame] || R.pos.base;
      const cy = g.car ? p[1] / R.h + (g.dy || 0) : g.cy;
      s = bw * 0.84 / R.w; L = (bw - (R.w + 2 * b) * s) / 2;
      T = bh / 2 - (b + cy * R.h) * s; T = Math.min(10, Math.max(bh - (R.h + 2 * b) * s - 10, T));
    } else {   // (the whole phone; with the hands a little smaller, to leave them room)
      const mx = mode === '3' ? (lying ? 120 : 30) : 24, my = mode === '3' ? (lying ? 18 : 44) : 18;
      s = Math.min((bw - mx) / (R.w + 2 * b), (bh - my) / (R.h + 2 * b));
      L = (bw - (R.w + 2 * b) * s) / 2; T = (bh - (R.h + 2 * b) * s) / 2 - (mode === '3' && !lying ? 12 : 0);
      if (mode === '3') rot = TILT[key] || (key === 'control' && v === 'tilt') || (key !== 'control' && ctl() === 'tilt' && TILT[key]) ? (lying ? -9 : -13) : (lying ? 0 : -3);
    }
    const OW = (R.w + 2 * b) * s, OH = (R.h + 2 * b) * s;
    ph.style.width = OW.toFixed(1) + 'px'; ph.style.height = OH.toFixed(1) + 'px'; ph.style.left = L.toFixed(1) + 'px'; ph.style.top = T.toFixed(1) + 'px';
    ph.style.padding = (b * s).toFixed(1) + 'px'; ph.style.borderRadius = (Math.min(OW, OH) * 0.13).toFixed(1) + 'px';
    pic.querySelector('.rpsc').style.borderRadius = (Math.min(OW, OH) * 0.09).toFixed(1) + 'px';
    ph.style.setProperty('--cam', (b * s * 0.55).toFixed(1) + 'px'); ph.classList.toggle('lying', lying);
    pic._g = { L, T, OW, OH, s, b, R, lying, bw, bh };
    if (pic.dataset.clip) { pic._th = null; syncPic(pic, 0); return; }   // (a clip: its moment poses the phone and the thumbs)
    // the thumbs: on the controls of the option shown (Upravljanje), else holding the phone at its lower corners
    const c = key === 'control' ? v : key === 'autoGas' ? ctl() : null;
    pose(pic, rot, mode === '3' ? TIPS[o][c] || TIPS[o].hold : null);
  }
  // the phone turned by rot (degrees) about its middle; the thumbs' tips at tips ([[x, y], [x, y]]: fractions of the screen), turned with it
  function pose(pic, rot, tips) {
    const g = pic._g; if (!g) return;
    const { L, T, OW, OH, s, b, R, lying, bw, bh } = g;
    pic.querySelector('.rph').style.transform = 'rotate(' + rot.toFixed(2) + 'deg)';
    if (!tips) return;
    const cx = L + OW / 2, cyc = T + OH / 2, a = rot * Math.PI / 180, tw = lying ? Math.max(26, Math.min(40, bh * 0.19)) : Math.max(22, Math.min(44, bw * 0.105));   // (lying: from the sides, shorter and wider)
    for (const [i, side] of [[0, 'l'], [1, 'r']]) {
      const el = pic.querySelector('.rthumb.' + side); if (!el) continue;
      const [fx, fy] = tips[i], x0 = L + (b + fx * R.w) * s - cx, y0 = T + (b + fy * R.h) * s - cyc;
      const x = cx + x0 * Math.cos(a) - y0 * Math.sin(a), y = cyc + x0 * Math.sin(a) + y0 * Math.cos(a);
      const ang = (side === 'l' ? 1 : -1) * (lying ? 74 : 26) + rot;
      el.style.width = tw.toFixed(1) + 'px'; el.style.height = (tw * 2.5).toFixed(1) + 'px';
      el.style.left = (x - tw / 2).toFixed(1) + 'px'; el.style.top = (y - tw * 0.12).toFixed(1) + 'px'; el.style.transform = 'rotate(' + ang.toFixed(1) + 'deg)';
    }
  }

  /* ---- Upravljanje as a real clip from the game (REAL_VIDEO: Riviera, 4 s of an S-bend, the autopilot driving, each control shown in
     use: the arrows pressed, the wheel turned, the tilt bar, the gas and the brake). 1 the clip in a phone (Nagib: the phone tilts with
     the steering); 2 the phone in two hands, the thumbs pressing the arrows, turning the wheel, on the gas and the brake (Nagib: the
     hands tilt the phone); 3 the three controls at once: three phones side by side on the same moment, the chosen one bigger ---- */
  const RV = window.REAL_VIDEO || null, VDATA = window.REAL_VDATA || null;
  let clipMode = '0', still = false;
  const CTRL = ['buttons', 'wheel', 'tilt'], CTRL_L = { buttons: 'Tipke', wheel: 'Volan', tilt: 'Nagib' };
  const vsrc = (o, c, ext) => (VDATA && VDATA[o + '/' + c + '.' + ext]) || 'posnetki/video/control-' + c + '-' + o + '.' + ext;
  const BAR = '<div class="rbar"><i class="rplay"><svg viewBox="0 0 24 24"><path d="M7 4.5 L20 12 L7 19.5 Z" fill="currentColor"/></svg></i><span class="rprog"><b></b></span><em>0:00</em></div>';
  // (the published mockup, REAL_VBLOB: each clip fetched whole and played from memory, as a page's files may come without byte ranges,
  // which Safari wants for a video; the MP4 where the browser plays it, else the WebM)
  const BLOB = !!window.REAL_VBLOB, blobs = {};
  let ext = null;
  function blobUrl(o, c) {
    ext = ext || (document.createElement('video').canPlayType('video/mp4; codecs="avc1.4D401F"') ? 'mp4' : 'webm');
    const k = o + '/' + c + '.' + ext;
    return blobs[k] || (blobs[k] = fetch(vsrc(o, c, ext)).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); }).then(b => URL.createObjectURL(b)));
  }
  function clipVideo(o, c) {
    const v = document.createElement('video'); v.className = 'rvid';
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.autoplay = !still;
    for (const a of ['muted', 'loop', 'playsinline'].concat(still ? [] : ['autoplay'])) v.setAttribute(a, '');
    v.poster = vsrc(o, c, 'jpg');
    const sources = () => { v.innerHTML = '<source src="' + vsrc(o, c, 'mp4') + '" type=\'video/mp4; codecs="avc1.4D401F"\'><source src="' + vsrc(o, c, 'webm') + '" type=\'video/webm; codecs="vp9"\'>'; v.load(); };
    if (BLOB) blobUrl(o, c).then(u => { v.src = u; if (!still && !(v.closest('.rvc') || {})._off) { const p = v.play(); if (p) p.catch(() => { }); } }).catch(sources);
    else sources();
    v.dataset.o = o; v.dataset.c = c;
    return v;
  }
  const hasClip = (o, it) => it.key === 'control' && clipMode !== '0' && RV && RV[o];
  function clipPic(o, it, v, pick) {
    const three = clipMode === '3', pic = h('sx-pic real rv rvc ' + (three ? 'rv3' : 'rphm m' + (clipMode === '2' ? '3' : '1')));
    pic.dataset.o = o; pic.dataset.key = it.key; pic.dataset.v = v; pic.dataset.clip = clipMode;
    const bg = frameEl(o, it.key, frameOf(o, it.key, v), v); bg.classList.add('rfb'); pic.appendChild(bg);
    if (three) for (const c of CTRL) {
      const w = h('r3' + (c === String(v) ? ' sel' : '')); w.dataset.c = c;
      const ph = h('rph'), scr = h('rpsc'); scr.appendChild(clipVideo(o, c)); ph.appendChild(scr); w.appendChild(ph);
      w.insertAdjacentHTML('beforeend', '<span class="rl">' + CTRL_L[c] + '</span>');
      if (pick) w.addEventListener('click', () => pick(c));
      pic.appendChild(w);
    } else {
      pic.dataset.ph = clipMode === '2' ? '3' : '1';
      const ph = h('rph'), scr = h('rpsc'); scr.appendChild(clipVideo(o, v)); ph.appendChild(scr); pic.appendChild(ph);
      if (clipMode === '2') pic.insertAdjacentHTML('beforeend', thumbSvg('l') + thumbSvg('r'));
      pic.insertAdjacentHTML('beforeend', '<i class="rtag">' + optLabel(it, v) + '</i>');
    }
    if (!three) pic.insertAdjacentHTML('beforeend', BAR);   // (three phones fill the picture: no bar over them)
    watch(pic);
    return pic;
  }
  // three phones: the chosen one as big as the picture allows, the other two at 74 %, in a row, each with its name under it
  function placeTrio(pic) {
    const bw = pic.offsetWidth, bh = pic.offsetHeight; if (!bw || !bh) return;
    const o = pic.dataset.o, R = RF[o], lying = R.w > R.h, b = BZ * Math.min(R.w, R.h), sel = String(pic.dataset.v), k = 0.74, gap = lying ? 12 : 9, lab = 22;
    const fw = R.w + 2 * b, fh = R.h + 2 * b, tilt = (bh - lab - 16) * 0.11;   // (room at the ends for the Nagib phone's tilt)
    const s = Math.min((bh - lab - 16) / fh, (bw - 2 * gap - 16 - 2 * tilt) / (fw * (1 + 2 * k)));
    let x = (bw - fw * s * (1 + 2 * k) - 2 * gap) / 2;
    for (const w of pic.querySelectorAll('.r3')) {
      const kk = w.dataset.c === sel ? 1 : k, OW = fw * s * kk, OH = fh * s * kk, ph = w.querySelector('.rph');
      w.style.left = x.toFixed(1) + 'px'; w.style.top = ((bh - lab - fh * s) / 2 + (fh * s - OH) / 2 + 2).toFixed(1) + 'px'; w.style.width = OW.toFixed(1) + 'px'; w.style.height = (OH + lab).toFixed(1) + 'px';
      ph.style.width = OW.toFixed(1) + 'px'; ph.style.height = OH.toFixed(1) + 'px'; ph.style.padding = (b * s * kk).toFixed(1) + 'px'; ph.style.borderRadius = (Math.min(OW, OH) * 0.13).toFixed(1) + 'px';
      w.querySelector('.rpsc').style.borderRadius = (Math.min(OW, OH) * 0.09).toFixed(1) + 'px';
      ph.style.setProperty('--cam', (b * s * kk * 0.55).toFixed(1) + 'px'); ph.classList.toggle('lying', lying);
      x += OW + gap;
    }
    syncPic(pic, 0);
  }
  // where the thumbs are at frame i (fractions of the screen): on the controls in use, else resting by them, a little off the glass
  function clipTips(o, c, i) {
    const V = RV[o], Rc = V.rects[c], st = V.steer[i], gas = V.gas[i] === '1', brk = V.brake[i] === '1', hov = o === 'land' ? 0.05 : 0.025;
    const ctr = (r, dy) => [r[0] + r[2] / 2, r[1] + r[3] / 2 + (dy || 0)];
    let l, r;
    if (c === 'buttons') { const a = ctr(Rc.left), z = ctr(Rc.right); l = V.left[i] === '1' ? a : V.right[i] === '1' ? z : [(a[0] + z[0]) / 2, a[1] + hov]; }
    else if (c === 'wheel') {   // (on the wheel's rim at ten o'clock, turning with it)
      const w = Rc.wheel, rad = w[2] * V.w * 0.44, th = (-58 + st * 112) * Math.PI / 180;
      l = [w[0] + w[2] / 2 + rad * Math.sin(th) / V.w, w[1] + w[3] / 2 - rad * Math.cos(th) / V.h];
    } else l = ctr(Rc.brake, brk ? 0 : hov);
    if (c === 'tilt') r = ctr(Rc.gas, gas ? 0 : hov);
    else r = brk ? ctr(Rc.brake) : ctr(Rc.gas, gas ? 0 : hov);
    return [l, r];
  }
  // a clip's moment: its bar, the three phones kept together, the tilt of the phone and the thumbs (dt: the time since the last
  // frame, for the thumbs to glide; 0: at once)
  function syncPic(pic, dt) {
    const o = pic.dataset.o, V = RV && RV[o], vids = [...pic.querySelectorAll('video.rvid')]; if (!V || !vids.length) return;
    const three = pic.dataset.clip === '3', main = three ? (pic.querySelector('.r3.sel video') || vids[0]) : vids[vids.length - 1];
    const t = main.currentTime || 0, dur = main.duration || V.n / V.fps, i = Math.min(V.n - 1, Math.max(0, Math.floor(t * V.fps))), st = V.steer[i], lying = o === 'land';
    const pb = pic.querySelector('.rprog b'); if (pb) { pb.style.animation = 'none'; pb.style.transform = 'scaleX(' + Math.min(1, t / dur).toFixed(3) + ')'; }
    const em = pic.querySelector('.rbar em'); if (em) em.textContent = '0:0' + Math.floor(t);
    if (three) {
      for (const v of vids) if (v !== main && !v.seeking && Math.abs(v.currentTime - t) > 0.12) v.currentTime = t;
      const w = pic.querySelector('.r3[data-c="tilt"] .rph'); if (w) w.style.transform = 'rotate(' + (st * (lying ? 5 : 7)).toFixed(2) + 'deg)';
      return;
    }
    if (!pic._g) return;
    const c = String(pic.dataset.v), hands = pic.dataset.clip === '2';
    const rot = c === 'tilt' ? st * (lying ? 8 : 13) : hands && !lying ? -3 : 0;
    if (!hands) { pose(pic, rot, null); return; }
    const tg = clipTips(o, c, i);
    if (!pic._th || !dt) pic._th = tg.map(p => p.slice());
    else { const k = 1 - Math.exp(-dt / 0.05); for (let j = 0; j < 2; j++) for (let q = 0; q < 2; q++) pic._th[j][q] += (tg[j][q] - pic._th[j][q]) * k; }
    pose(pic, rot, pic._th);
  }
  // the clips on the screen play, the others wait; one loop moves what goes with them
  const seen = new Set(); let io = null, looping = false, lastT = 0;
  function watch(pic) {
    if (!io && 'IntersectionObserver' in window) io = new IntersectionObserver((es) => {
      for (const e of es) { e.target._off = !e.isIntersecting; for (const v of e.target.querySelectorAll('video')) { if (e.isIntersecting && !still) { const p = v.play(); if (p) p.catch(() => { }); } else v.pause(); } }
    }, { rootMargin: '60px' });
    if (io) io.observe(pic);
    seen.add(pic);
    if (!looping && !still) { looping = true; lastT = 0; requestAnimationFrame(loop); }
  }
  function loop(now) {
    const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0; lastT = now;
    for (const pic of [...seen]) { if (!pic.isConnected) { seen.delete(pic); if (io) io.unobserve(pic); continue; } if (!pic._off) syncPic(pic, dt); }
    if (seen.size) requestAnimationFrame(loop); else looping = false;
  }
  // another control chosen: its clip comes in on the same moment of the race (the thumbs glide to it, the phone tilts or not)
  function clipTo(pic, o, it, v) {
    pic.dataset.v = v;
    const bg = pic.querySelector('.rfb'); if (bg) { const n = frameOf(o, it.key, v); bg.dataset.frame = n; bg.style.backgroundImage = 'url("' + url(o, n) + '")'; }
    if (pic.dataset.clip === '3') {
      const was = pic.querySelector('.r3.sel video'), t = was ? was.currentTime : 0;
      for (const w of pic.querySelectorAll('.r3')) w.classList.toggle('sel', w.dataset.c === String(v));
      const now = pic.querySelector('.r3.sel video'); if (now && Math.abs(now.currentTime - t) > 0.05) now.currentTime = t;
      placeTrio(pic); return;
    }
    const scr = pic.querySelector('.rpsc'), old = scr.querySelector('video.rvid:last-of-type'), nv = clipVideo(o, v), t = old ? old.currentTime : 0;
    nv.classList.add('fade'); scr.appendChild(nv);
    const show = () => { nv.classList.remove('fade'); setTimeout(() => { for (const x of scr.querySelectorAll('video.rvid')) if (x !== nv) x.remove(); }, 380); };
    nv.addEventListener('loadedmetadata', () => { try { nv.currentTime = Math.min(t + 0.04, (nv.duration || 4) - 0.05); } catch (_) { } }, { once: true });
    nv.addEventListener('seeked', show, { once: true }); setTimeout(show, 1500);
    const tg = pic.querySelector('.rtag'); if (tg) tg.textContent = optLabel(it, v);
  }

  /* ---- 1. video: the clip of the chosen option ---- */
  function video(o, it, v, pick) {
    if (hasClip(o, it)) return clipPic(o, it, v, pick);
    const pic = phoneMode !== '0' ? phonePic(o, it, v) : h('sx-pic real rv');
    if (phoneMode !== '0') {
      pic.insertAdjacentHTML('beforeend', (SIGN[it.key] ? '' : '<i class="rtag">' + (optLabel(it, v) || it.name) + '</i>') + sign(it, v) +
        '<div class="rbar"><i class="rplay"><svg viewBox="0 0 24 24"><path d="M7 4.5 L20 12 L7 19.5 Z" fill="currentColor"/></svg></i><span class="rprog"><b></b></span><em>0:02</em></div>');
      return pic;
    }
    pic.appendChild(frameEl(o, it.key, frameOf(o, it.key, v), v));
    pic.insertAdjacentHTML('beforeend', (SIGN[it.key] ? '' : '<i class="rtag">' + (optLabel(it, v) || it.name) + '</i>') + sign(it, v) +
      '<div class="rbar"><i class="rplay"><svg viewBox="0 0 24 24"><path d="M7 4.5 L20 12 L7 19.5 Z" fill="currentColor"/></svg></i><span class="rprog"><b></b></span><em>0:02</em></div>');
    return pic;
  }
  function videoTo(pic, o, it, v, dir) {   // (the new clip comes in from the side of the button tapped)
    if (pic.dataset.clip) { clipTo(pic, o, it, v); return; }
    if (pic.dataset.ph) {   // (in a phone: the new clip on its screen, the race behind it, the thumbs and the tilt move to it)
      const n = frameOf(o, it.key, v); pic.dataset.v = v;
      const scr = pic.querySelector('.rpsc'), old = scr.querySelector('.rfs'), nf = frameEl(o, it.key, n, v); nf.classList.add('rfs', 'fade'); scr.appendChild(nf);
      requestAnimationFrame(() => nf.classList.remove('fade')); setTimeout(() => old.remove(), 360);
      const bg = pic.querySelector('.rfb'); if (bg) { bg.dataset.frame = n; bg.style.backgroundImage = 'url("' + url(o, n) + '")'; }
      placePhone(pic);
      const tg = pic.querySelector('.rtag'); if (tg) tg.textContent = optLabel(it, v) || it.name;
      const sg = pic.querySelector('.rsign'); if (sg) sg.outerHTML = sign(it, v);
      return;
    }
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
    for (const p of (root || document).querySelectorAll('.rv[data-ph]')) placePhone(p);   // (the thumbs on the new controls)
  }
  // (the pictures for the mockup's images: every clip at the moment t, still; the phones and the thumbs posed for it)
  function stillAt(t) {
    still = true;
    const vids = [...document.querySelectorAll('video.rvid')];
    return Promise.all(vids.map(v => new Promise(res => {
      const go = () => { v.pause(); v.addEventListener('seeked', () => requestAnimationFrame(() => res()), { once: true }); v.currentTime = Math.min(t, (v.duration || 4) - 0.02); };
      setTimeout(res, 8000); if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
    }))).then(() => place());
  }
  return { video, videoTo, compare, compareTo, live, liveShow, place, frameOf, rebase, stillAt, set control(f) { ctl = f; }, set phone(m) { phoneMode = m || '0'; }, get phone() { return phoneMode; },
    set clip(m) { clipMode = RV ? m || '0' : '0'; }, get clip() { return clipMode; }, set still(v) { still = !!v; }, get hasVideo() { return !!RV; } };
})();
