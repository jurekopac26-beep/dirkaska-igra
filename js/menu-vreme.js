/* The weather over the whole track screen (docs/meni-izbira-proge.md, sklop 12; the user's choice of 8. 11. 2026 ~23.20, stran Odločitve
   meni-vreme-cel-meni: the rain and the snow over the whole menu; the mockup maketa-menija/izbira-proge/wxfx.js, its blizzard). Each
   weather changes the picture (its light and colours, clouds, a rainbow, lightning, drops on the lens; in the snow a snowy
   copy of it), the air over the whole screen (slanted rain, a blizzard in the wind), the yard's floor (wet, with ripples and the car's
   reflection, or snow), the road sign (drops and drips; snow stuck on it, frost, snow on its top), the car (darker in the rain; frosted
   windows, snow on its top, standing in snow) and the buttons (drops and splashes; snow on their tops). A tap on a weather: a ring on its
   icon, the light and the air change in ~1 s, the water and the snow gather in ~2.5 s. The wind blows from the right to the left.
   js/menu.js calls on() after each drawing of the track screen (a new track's: the car stays, its reflection with it), turn() as the
   carousel turns (the buttons' drops and snow fade), rest() and wake() under the Earth, off() when the screen goes. The Earth
   keeps its day (its own moon button). A device that asks for less motion: the weather as one still picture, at once; a slow one: fewer
   frames (as the car's, js/menu-car.js). Nothing of it takes a tap (pointer-events: none). */
window.MenuVreme = (() => {
  const KEYS = ['dry', 'rain', 'change', 'storm', 'snow'];
  const FAST = 0.9, SLOW = 2.4, TAP = 0.55, DIR = -1;   // (s: the light and the air change fast, the water and the snow gather slowly; a tap's ring; the wind from the right)
  // per weather (the mockup's): the picture's brightness, saturation, contrast and grey, clouds, a blue tint, the warm sun, the rain and
  // its slant, the snow, the wetness, the rainbow, the car's brightness and saturation
  const P = {
    dry:    { b: 1.06, s: 1.18, c: 1.05, g: 0,   cl: 0,   ti: 0,   wa: 1,   rain: 0,   ang: 0,  snow: 0, wet: 0,  bow: 0, cb: 1.02, cs: 1.06 },
    rain:   { b: .74,  s: .72,  c: 1.06, g: .12, cl: .6,  ti: .35, wa: 0,   rain: 1,   ang: 9,  snow: 0, wet: 1,  bow: 0, cb: .84,  cs: .85 },
    change: { b: .93,  s: .96,  c: 1.03, g: .04, cl: .38, ti: .14, wa: .55, rain: .32, ang: 6,  snow: 0, wet: .6, bow: 1, cb: .95,  cs: .95 },
    storm:  { b: .5,   s: .6,   c: 1.12, g: .2,  cl: 1,   ti: .55, wa: 0,   rain: 1.8, ang: 24, snow: 0, wet: 1,  bow: 0, cb: .7,   cs: .8 },
    snow:   { b: 1,    s: .9,   c: 1.02, g: 0,   cl: .16, ti: .06, wa: 0,   rain: 0,   ang: 0,  snow: 1, wet: 0,  bow: 0, cb: 1.05, cs: .78 },
  };
  // the snow: the mockup's blizzard (the user's choice): the snow on things, its lumps, the flakes and their speed, the wind, the haze, the
  // frost, the snow stuck on the sign, the whiteout, the snowy picture's brightness
  const SN = { capK: 1.15, lumpK: 1.3, flakes: 2.3, speed: 1.6, wind: 230, haze: .75, frost: 1.1, signK: 1.7, white: .36, picB: .92 };
  const CAPX = 14, CAPY = 22;   // (the sign's top canvas reaches so far beyond it: the snow on its top, the splashes)
  const SVGNS = 'http://www.w3.org/2000/svg';
  const smooth = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const hash = (i) => { let h = (i * 374761393) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const n2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi), h = (a, b) => hash(a * 7919 + b * 104729);
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v; };
  const noise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };
  const calm = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const saver = () => { try { return !!(window.__game && window.__game.saver); } catch (_) { return false; } };
  const now = () => performance.now() / 1000;
  const dpr = () => window.devicePixelRatio || 1;
  const mix = (w, k) => KEYS.reduce((a, q) => a + w[q] * P[q][k], 0);
  const pure = (k) => { const w = {}; for (const q of KEYS) w[q] = q === k ? 1 : 0; return w; };
  const a3 = (v) => (+v).toFixed(3);

  let app = null, L = null, UI = null, AIR = null, ro = null, raf = 0, lastMs = 0, lastT = 0, busy = 0, frames = 0, resting = false, dirty = true, land = false, heavy = false;
  let look = 'dry', tl = [{ t: -99, k: 'dry' }], taps = [], storm = null, enter = null, uiNow = 1, uiGoal = 1, CK = null, last = null;

  /* ---------------- the canvases ---------------- */
  function layer(parent, cls, before) {
    const c = document.createElement('canvas'); c.className = cls; c.setAttribute('aria-hidden', 'true');
    parent.insertBefore(c, before || null);
    return { c, g: c.getContext('2d'), w: 0, h: 0, pr: 1, sig: undefined, mv: false };
  }
  function size(l, w, h, pr) {
    if (!l) return;
    const W = Math.max(1, Math.round(w * pr)), H = Math.max(1, Math.round(h * pr));
    if (l.c.width !== W || l.c.height !== H) { l.c.width = W; l.c.height = H; l.sig = undefined; }
    if (l.w !== w || l.h !== h || l.pr !== pr) { l.w = w; l.h = h; l.pr = pr; l.sig = undefined; }
  }
  // a layer is drawn again only when what it shows changed (sig) or something in it moves (mv), and once more when it stops moving
  function paint(l, sig, mv, draw) {
    if (!l || !l.w || !l.h) return;
    if (sig === l.sig && !mv && !l.mv) return;
    const g = l.g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, l.c.width, l.c.height);
    g.setTransform(l.pr, 0, 0, l.pr, 0, 0);
    draw(g, l.w, l.h);
    l.sig = sig; l.mv = mv;
  }
  // a style set only when it changed (no new style work each frame for the same value)
  function css(e, prop, v) { if (!e || e['_wx' + prop] === v) return; e['_wx' + prop] = v; if (prop.charCodeAt(0) === 45) e.style.setProperty(prop, v); else e.style[prop] = v; }
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  function soften(c, px) {
    try { const o = cv(c.width, c.height); o.getContext('2d').drawImage(c, 0, 0); const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.filter = 'blur(' + px + 'px)'; g.drawImage(o, 0, 0); g.filter = 'none'; } catch (_) { /* (no filter: sharp) */ }
    return c;
  }
  // the pictures drawn once (the sun, the rainbow, frost, the sprites …), the last few of them
  const PICS = new Map();
  function pic(key, make) { let p = PICS.get(key); if (!p) { p = make(); PICS.set(key, p); if (PICS.size > 24) PICS.delete(PICS.keys().next().value); } return p; }

  /* ---------------- the time: a tap fades the last mix into the new weather (fast: the light and the air; slow: the water and the snow) ---------------- */
  function weights(t, d) {
    const w = pure(tl[0].k);
    for (let i = 1; i < tl.length; i++) {
      if (t < tl[i].t) break;
      const e = smooth((t - tl[i].t) / d);
      for (const k of KEYS) w[k] = w[k] * (1 - e) + (k === tl[i].k ? e : 0);
    }
    return w;
  }
  // the lightning: it flashes 0.7 s after the storm comes and then every 3.2 s, each time with a short flicker
  function flash(t) {
    if (!storm || t < storm.t0) return 0;
    const end = Math.min(t + .01, storm.end), n = Math.floor((Math.min(t, storm.end) - storm.t0 - .7) / 3.2);
    let f = 0;
    for (let i = Math.max(0, n - 1); i <= n; i++) {
      const s = storm.t0 + .7 + i * 3.2; if (s >= end) break;
      for (const [o, a] of [[0, 1], [.13, .7]]) { const dt = t - (s + o); if (dt >= 0) f = Math.max(f, a * Math.exp(-dt / .09)); }
    }
    return Math.min(1, f);
  }

  /* ---------------- the pictures drawn once ---------------- */
  // the rainbow (changing weather: the sun comes out in the rain), low at the left
  function bowPic(W, H) {
    return pic('bow|' + W + '|' + H, () => {
      const c = cv(W, H), g = c.getContext('2d'), cx = W * .18, cy = H * 1.02, r0 = H * .72, cols = ['255,60,60', '255,150,40', '255,235,60', '80,220,90', '60,160,255', '90,90,230', '170,80,220'];
      g.globalCompositeOperation = 'screen';
      for (let i = 0; i < cols.length; i++) {
        const gr = g.createLinearGradient(cx - r0, 0, cx + r0, 0);
        gr.addColorStop(0, 'rgba(' + cols[i] + ',0)'); gr.addColorStop(.35, 'rgba(' + cols[i] + ',.3)'); gr.addColorStop(.75, 'rgba(' + cols[i] + ',.24)'); gr.addColorStop(1, 'rgba(' + cols[i] + ',0)');
        g.strokeStyle = gr; g.lineWidth = 4.2; g.beginPath(); g.arc(cx, cy, Math.max(4, r0 - i * 4), Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      }
      return c;
    });
  }
  // frost crystals growing from a corner (a0: the first branch's direction): a branch, side branches along it, and so on
  function dendrite(g, x, y, ang, len, depth, r, a) {
    if (depth <= 0 || len < 1.5) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    g.globalAlpha = a; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    const n = 2 + Math.floor(r() * 3);
    for (let i = 1; i <= n; i++) { const f = i / (n + 1), bx = x + (x2 - x) * f, by = y + (y2 - y) * f; for (const sd of [-1, 1]) if (r() < .75) dendrite(g, bx, by, ang + sd * (.95 + r() * .25), len * (.3 + r() * .22), depth - 1, r, a * .82); }
    dendrite(g, x2, y2, ang + (r() - .5) * .6, len * .62, depth - 1, r, a * .9);
  }
  function frostPatch(seed, sz, a0, pr) {
    return pic('fr|' + seed + '|' + sz + '|' + a0.toFixed(2) + '|' + pr, () => {
      const R = Math.ceil(sz * 2.3), c = cv(2 * R * pr, 2 * R * pr), g = c.getContext('2d'), r = rng(seed);
      g.scale(pr, pr); g.translate(R, R);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, sz * 1.4); gr.addColorStop(0, 'rgba(235,244,255,.55)'); gr.addColorStop(1, 'rgba(235,244,255,0)');
      g.fillStyle = gr; g.fillRect(-sz * 1.5, -sz * 1.5, sz * 3, sz * 3);
      g.strokeStyle = '#eef6ff'; g.lineWidth = .7; g.lineCap = 'round';
      for (let j = 0; j < 7; j++) dendrite(g, 0, 0, a0 + (j / 6) * Math.PI / 2 + (r() - .5) * .2, sz * (.45 + r() * .55), 4, r, .75);
      return { c, R };
    });
  }
  function frost(g, corners, seed, sz, pr, a) {
    if (a < .005) return;
    g.globalAlpha = Math.min(1, a);
    corners.forEach(([x, y, a0], i) => { const p = frostPatch(seed + i * 17, sz, a0, pr); g.drawImage(p.c, x - p.R, y - p.R, 2 * p.R, 2 * p.R); });
    g.globalAlpha = 1;
  }
  // a drop on the lens (a round lens of water: light at its top left, a dark rim), a soft snowflake
  const dropSprite = () => pic('drop', () => {
    const c = cv(64, 64), g = c.getContext('2d'), r = 30, gr = g.createRadialGradient(32 - r * .3, 32 - r * .35, r * .1, 32, 32, r);
    gr.addColorStop(0, 'rgba(255,255,255,.34)'); gr.addColorStop(.45, 'rgba(210,225,245,.06)'); gr.addColorStop(.85, 'rgba(20,30,45,.22)'); gr.addColorStop(1, 'rgba(255,255,255,.1)');
    g.fillStyle = gr; g.beginPath(); g.arc(32, 32, r, 0, 7); g.fill(); return c;
  });
  const flakeSprite = () => pic('flake', () => {
    const c = cv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  });
  function boltOf(W, H) {
    return pic('bolt|' + W + '|' + H, () => {
      const r = rng(7), pts = [[W * .6, -4]];
      while (pts[pts.length - 1][1] < H * .62) { const [x, y] = pts[pts.length - 1]; pts.push([x + (r() - .62) * 26, y + 10 + r() * 16]); }
      const br = [];
      for (const i of [3, 7, 11]) if (pts[i]) { const b = [pts[i]]; let [x, y] = pts[i]; for (let j = 0; j < 5; j++) { x += 6 + r() * 14; y += 8 + r() * 10; b.push([x, y]); } br.push(b); }
      return { pts, br };
    });
  }
  function lensDrops(W, H) {
    return pic('lens|' + W + '|' + H, () => {
      const r = rng(11), top = Math.min(90, H * .25), span = Math.max(20, H - top - 10), out = [];
      for (let i = 0; i < 30; i++) out.push({ thr: r(), x: 14 + r() * Math.max(0, W - 28), y0: top + r() * Math.max(10, H - top - 20), rad: 2.5 + r() * 7.5, run: r() < .3, v: 8 + r() * 22, top, span });
      return out;
    });
  }
  // the rain over the screen: its drops in a few groups of the same strength and width (one path each)
  function rainDrops(W, H) {
    return pic('rain|' + W + '|' + H, () => {
      const r = rng(3), B = {};
      for (let i = 0; i < 430; i++) {
        const x0 = r() * (W + 200) - 100, y0 = r() * H, v = 950 + r() * 600, len = 13 + r() * 17, a = .16 + r() * .26, d = r(), lw = .8 + d * .9;
        const ka = a < .2467 ? 0 : a < .3333 ? 1 : 2, kw = lw < 1.25 ? 0 : 1, k = ka * 2 + kw;
        (B[k] = B[k] || { a: [.203, .29, .377][ka], lw: [1.02, 1.47][kw], d: [] }).d.push({ i, x0, y0, v, len });
      }
      return Object.values(B);
    });
  }
  // the blizzard's flakes (the mockup's three sizes, 2.3 times as many, 1.6 times as fast, in the wind): the small and the middle ones
  // streaks in groups, the big soft ones near the lens
  function flakes(W, H) {
    return pic('snow|' + W + '|' + H, () => {
      const B = {}, big = [];
      [[5, 200, .45, .99, 16, 32, .6, 0], [6, 110, 1.08, 2.34, 34, 62, .85, 1], [7, 14, 4.5, 9.9, 75, 120, .2, 2]].forEach(([seed, n0, s0, s1, v0, v1, a0, soft], li) => {
        const r = rng(seed), n = Math.round(n0 * SN.flakes);
        for (let i = 0; i < n; i++) {
          const x0 = r() * (W + 60), y0 = r() * H, s = s0 + r() * (s1 - s0), v = (v0 + r() * (v1 - v0)) * SN.speed, amp = 4 + r() * 14, fq = .4 + r() * .9, ph = r() * 7, al = a0 * (.7 + .3 * r());
          const vx = DIR * SN.wind * (.7 + .6 * (s - s0) / (s1 - s0 + .01)), f = { i, n, x0, y0, s, v, amp, fq, ph, al, vx };
          if (soft === 2) { big.push(f); continue; }
          const ka = al * .9 < a0 * .765 ? 0 : 1, kw = Math.min(li ? 2 : 1, Math.floor((s - s0) / (s1 - s0) * (li ? 3 : 2))), k = li * 10 + ka * 3 + kw;
          (B[k] = B[k] || { a: a0 * (ka ? .83 : .7), lw: (s0 + (s1 - s0) * (kw + .5) / (li ? 3 : 2)) * 1.1, f: [] }).f.push(f);
        }
      });
      return { groups: Object.values(B), big };
    });
  }
  // the snow driven over the floor (streaks in groups)
  function streaks(W, H, hz) {
    return pic('drift|' + W + '|' + H + '|' + Math.round(hz), () => {
      const r = rng(37), B = {};
      for (let i = 0; i < 70; i++) {
        const y = hz + r() * (H - hz), x0 = r() * (W + 80), l = 14 + r() * 30, a = .18 + .3 * r(), lw = .8 + r(), ka = a < .28 ? 0 : a < .38 ? 1 : 2, kw = lw < 1.3 ? 0 : 1, k = ka * 2 + kw;
        (B[k] = B[k] || { a: [.23, .33, .43][ka], lw: [1.05, 1.55][kw], s: [] }).s.push({ y, x0, l });
      }
      return Object.values(B);
    });
  }
  function signDrops(W, H) {
    return pic('sd|' + W + '|' + H, () => {
      const r = rng(53), drops = [], drips = [];
      for (let i = 0; i < 70; i++) drops.push({ x: r() * W, y: r() * H, rad: .9 + r() * 2.2, thr: r() });
      for (let i = 0; i < 7; i++) drips.push({ x: 20 + r() * Math.max(0, W - 40), v: 6 + r() * 10, len: 10 + r() * 18, y0: r() * H, thr: r() });
      return { drops, drips };
    });
  }
  // snow blown onto the sign's face: patches, more at its top and on its left
  function signSnow(W, H, pr) {
    return pic('ssn|' + W + '|' + H + '|' + pr, () => {
      const c = cv(W * pr, H * pr), g = c.getContext('2d'), id = g.createImageData(c.width, c.height), d = id.data;
      for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
        const x = px / pr, y = py / pr, p = .12 + .6 * Math.pow(1 - y / H, 2.2) + .35 * Math.pow(1 - x / W, 3), n = n2(x / 10, y / 6) * .8 + n2(x / 3, y / 3) * .2, th = 1 - p * .62;
        if (n < th) continue;
        const a = smooth((n - th) * 4), i = (py * c.width + px) * 4;
        d[i] = 238 + 12 * a; d[i + 1] = 244 + 8 * a; d[i + 2] = 255; d[i + 3] = (.35 + .6 * a) * 255;
      }
      g.putImageData(id, 0, 0); return soften(c, pr * .6);
    });
  }

  /* ---------------- the picture in the snow ----------------
     A copy of the picture (the model, the map: each of its layers) made once per picture, a few rows at a time so the screen keeps moving
     (the mockup's): grass and slopes white with blue shadows, trees dark with snow on their branches, the road packed snow keeping its
     marks, coloured things kept but cooler, the distance in a pale haze; its edges (the model's island) kept. The flyover and the corner
     (videos): their light only, whiter and greyer */
  const SNOWPIC = new Map();   // (its source → { st: 'busy' | 'ready' | 'failed', url }, the last 8)
  function snowPic(src, disp) {
    let e = SNOWPIC.get(src);
    if (e) { SNOWPIC.delete(src); SNOWPIC.set(src, e); return e; }
    e = { st: 'busy', url: '' }; SNOWPIC.set(src, e);
    while (SNOWPIC.size > 8) {
      const [k0, e0] = SNOWPIC.entries().next().value; SNOWPIC.delete(k0);
      if (e0.url) setTimeout(() => { try { URL.revokeObjectURL(e0.url); } catch (_) { } }, 4000);
    }
    const im = new Image(); im.decoding = 'async';
    im.onload = () => convert(im, e, disp); im.onerror = () => { e.st = 'failed'; };
    im.src = src;
    return e;
  }
  function convert(im, e, disp) {
    const nw = im.naturalWidth, nh = im.naturalHeight; if (!nw || !nh) { e.st = 'failed'; return; }
    const s = Math.min(1, 900 / Math.max(nw, nh)), cw = Math.max(1, Math.round(nw * s)), ch = Math.max(1, Math.round(nh * s)), c = cv(cw, ch), g = c.getContext('2d', { willReadFrequently: true });
    let id; try { g.drawImage(im, 0, 0, cw, ch); id = g.getImageData(0, 0, cw, ch); } catch (_) { e.st = 'failed'; return; }
    const d = id.data, k = disp > 1 ? disp / cw : .5, B = SN.picB;   // (k: the shown px of one of its px, for the noise's size)
    const rows = (ya, yb) => {
      for (let y = ya; y < yb; y++) {
        const fog = Math.pow(1 - y / ch, 2.2) * .34;
        for (let x = 0; x < cw; x++) {
          const i = (y * cw + x) * 4; if (d[i + 3] < 8) continue;
          const r = d[i], gg = d[i + 1], b = d[i + 2], Lm = .3 * r + .59 * gg + .11 * b, sat = Math.max(r, gg, b) - Math.min(r, gg, b), gn = gg - Math.max(r, b), fine = hash((x * 92821) ^ (y * 68917)) - .5;
          let R2, G2, B2;
          if (sat > 75 && gn <= 4) { R2 = r * .84 + 20; G2 = gg * .87 + 24; B2 = b * .9 + 32; }
          else if (gn > 4 && Lm < 72) {
            const lit = smooth((Lm - 36) / 26) * (.8 + .4 * n2(x * k / 3, y * k / 2)), sw = 222 + Lm * .25;
            R2 = Lm * .42 + 14; G2 = Lm * .6 + 24; B2 = Lm * .52 + 30;
            R2 += (sw - 10 - R2) * lit; G2 += (sw - 2 - G2) * lit; B2 += (sw + 10 - B2) * lit;
          } else if (gn > 4) { const sw = 216 + (Lm - 110) * .3 + fine * 5; R2 = sw - 12; G2 = sw - 3; B2 = sw + 10; }
          else { const v = Lm * .55 + 112 + fine * 5; R2 = v - 7; G2 = v; B2 = v + 10; }
          d[i] = Math.min(255, (R2 * (1 - fog) + 226 * fog) * B); d[i + 1] = Math.min(255, (G2 * (1 - fog) + 233 * fog) * B); d[i + 2] = Math.min(255, (B2 * (1 - fog) + 243 * fog) * B);
        }
      }
    };
    let y = 0;
    const step = () => {
      const t0 = performance.now();
      while (y < ch && performance.now() - t0 < 8) { const yb = Math.min(ch, y + 8); rows(y, yb); y = yb; }
      if (y < ch) { setTimeout(step, 0); return; }
      g.putImageData(id, 0, 0); soften(c, .6);
      encode(c, (url) => { if (!url) { e.st = 'failed'; return; } e.url = url; e.st = 'ready'; kick(); });
    };
    setTimeout(step, 0);
  }
  // a snowy copy made a picture (webp) in a worker of its own (OffscreenCanvas), not on the screen's thread: the canvas's own toBlob waits
  // for the screen to rest and, as the weather keeps it moving, then does it at once (on a phone ~0.1 s a picture, the screen stopped);
  // else (no worker, no OffscreenCanvas, the worker failed) toBlob after all
  let encW = null, encN = 0;
  const encCb = new Map();
  const ENC = 'onmessage = async (e) => { const { n, bm } = e.data; let b = null; try { const o = new OffscreenCanvas(bm.width, bm.height); ' +
    'o.getContext("2d").drawImage(bm, 0, 0); if (bm.close) bm.close(); b = await o.convertToBlob({ type: "image/webp", quality: .9 }); } catch (_) { b = null; } postMessage({ n, b }); };';
  function encDrop() { encW = false; const cbs = [...encCb.values()]; encCb.clear(); for (const f of cbs) f(null); }
  function encode(c, done) {
    const own = () => { try { if (c.toBlob) c.toBlob((b) => done(b ? URL.createObjectURL(b) : ''), 'image/webp', .9); else done(c.toDataURL('image/webp', .9)); } catch (_) { done(''); } };
    if (encW === null) {
      encW = false;
      try {
        if (window.Worker && window.OffscreenCanvas && window.createImageBitmap && window.Blob) {
          const u = URL.createObjectURL(new Blob([ENC], { type: 'text/javascript' }));
          encW = new Worker(u); URL.revokeObjectURL(u);
          encW.onmessage = (ev) => { const d = ev.data || {}, f = encCb.get(d.n); encCb.delete(d.n); if (f) f(d.b || null); };
          encW.onerror = () => { try { encW.terminate(); } catch (_) { /* gone */ } encDrop(); };
        }
      } catch (_) { encW = false; }
    }
    if (!encW) { own(); return; }
    createImageBitmap(c).then((bm) => {
      if (!encW) { own(); return; }
      const n = ++encN; encCb.set(n, (b) => { if (b) done(URL.createObjectURL(b)); else own(); });
      try { encW.postMessage({ n, bm }, [bm]); } catch (_) { encCb.delete(n); own(); }
    }, own);
  }
  // the snowy copies' places: over each picture (the model's in its island, the map's over its wet layer), filled when made
  function makeSlots() {
    const dio = L.dio; L.snw = [];
    if (!dio || dio.querySelector('video')) return;
    const slot = (el, src, disp) => { const e = snowPic(src, disp); L.snw.push({ el, e, set: false, at: -99, cold: e.st !== 'ready' }); };
    const isl = dio.querySelector(':scope > .isl'), im = isl && isl.querySelector('img:not(.wet):not(.snw)');
    if (im && im.getAttribute('src')) { const e = document.createElement('img'); e.className = 'snw'; e.alt = ''; e.setAttribute('aria-hidden', 'true'); e.decoding = 'async'; isl.appendChild(e); slot(e, im.getAttribute('src'), im.clientWidth); }
    const svg = dio.querySelector('svg.mapsvg');
    if (svg) for (const m of svg.querySelectorAll('image:not(.wet):not(.snw)')) {
      const src = m.getAttribute('href'); if (!src) continue;
      const e = document.createElementNS(SVGNS, 'image'); e.setAttribute('class', 'snw' + (m.classList.contains('land') ? ' land' : m.classList.contains('isle') ? ' isle' : ''));
      for (const a of ['x', 'y', 'width', 'height', 'preserveAspectRatio']) { const v = m.getAttribute(a); if (v != null) e.setAttribute(a, v); }
      const nx = m.nextElementSibling, at = nx && nx.classList.contains('wet') ? nx : m; at.after(e);
      slot(e, src, m.getBoundingClientRect().width);
    }
  }
  function snowSlots(S, t) {
    if (!L.dio) return;
    if (!L.snw && (look === 'snow' || S.ws.snow > .002)) makeSlots();
    if (!L.snw) return;
    let fading = false;
    for (const s of L.snw) {
      if (!s.set && s.e.st === 'ready') { s.set = true; s.at = s.cold && !calm() ? t : -99; if (s.el.tagName.toLowerCase() === 'img') s.el.src = s.e.url; else s.el.setAttribute('href', s.e.url); }
      const k = s.set ? smooth((t - s.at) / .5) : 0; if (s.set && k < 1) fading = true;
      css(s.el, 'opacity', a3(Math.min(S.ws.snow, k)));
    }
    L.fading = fading;
  }

  /* ---------------- the car: its outline from its picture ----------------
     The 3D car drawn without its shadow and the wind (MenuCar.alpha), else its picture in its button, in the yard's px: its box, its top
     line (how flat at each column: the snow lies there), the line its tyres stand on (the longest edge of the hull under it: from tyre to
     tyre), its reflection (each column flipped about that line, fading), frost on its windows and snow packed on its lower body, thickest
     round the wheels (the mockup's). Made once per car, colour and place */
  function carData() {
    const y = L.yard; if (!y) return null;
    const btn = y.querySelector(':scope > .car'), im = btn && btn.querySelector('img'), M = window.MenuCar;
    let src, key, pr;
    if (!im) {
      if (!btn || btn.querySelector('.mono') || !y.classList.contains('c3d-on') || !M || !M.alpha) return btn && btn.querySelector('.mono') ? (CK = { key: 'none', none: true }) : null;   // (the 3D car not drawn yet: later)
      const a = M.alpha(); if (!a) return null;
      key = '3d|' + a.key + '|' + (land ? 1 : 0);
      if (CK && CK.key === key) return CK;
      src = a.cv; pr = a.pr;
    } else {
      if (!im.complete || !im.naturalWidth || !im.clientWidth) return null;
      const iw = im.clientWidth, ih = im.clientHeight, s = Math.min(iw / im.naturalWidth, ih / im.naturalHeight), dw = im.naturalWidth * s, dh = im.naturalHeight * s;
      const dx = btn.offsetLeft + im.offsetLeft, dy = btn.offsetTop + im.offsetTop + ih - dh;   // (contain, at its left bottom)
      key = 'img|' + im.currentSrc + '|' + [dx, dy, dw, dh, y.clientWidth, y.clientHeight].map(Math.round).join(',') + '|' + (land ? 1 : 0);
      if (CK && CK.key === key) return CK;
      pr = Math.min(2, dpr()); src = cv(y.clientWidth * pr, y.clientHeight * pr); src.getContext('2d').drawImage(im, dx * pr, dy * pr, dw * pr, dh * pr);
    }
    heavy = true;   // (once per car: not counted as the frames' work)
    try { CK = outline(src, pr, key); } catch (e) { CK = { key, none: true }; }
    return CK;
  }
  function outline(src, pr, key) {
    const W = src.width, H = src.height, d = src.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => d[(y * W + x) * 4 + 3];
    let x0 = W, x1 = -1, y0 = H, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] >= 140) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 - x0 < 10 * pr || y1 - y0 < 6 * pr) return { key, none: true };
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, top = new Array(bw).fill(null), bot = new Array(bw).fill(null), k = 1 / pr;
    for (let i = 0; i < bw; i++) {
      const x = x0 + i;
      for (let y = y0; y <= y1; y++) if (A(x, y) >= 140) { top[i] = y; break; }
      for (let y = y1; y >= y0; y--) if (A(x, y) >= 140) { bot[i] = y; break; }
    }
    // how flat the top line is at each column (its slope over a few pixels either side, then smoothed): the snow lies on the flat parts
    const S = Math.max(1, Math.round(3 * pr));
    const raw = top.map((v, i) => { if (v == null) return null; const yl = top[Math.max(0, i - S)], yr = top[Math.min(bw - 1, i + S)]; const sl = yl == null || yr == null ? 3 : Math.abs(yr - yl) / (2 * S); return Math.pow(Math.max(0, 1 - sl * 1.1), 1.6); });
    const flat = raw.map((v, i) => { if (v == null) return null; let s = 0, n = 0; for (let j = i - S; j <= i + S; j++) if (raw[j] != null) { s += raw[j]; n++; } return n ? s / n : 0; });
    // the ground: the lower hull of the bottom line, its longest edge low down (from tyre to tyre)
    const hull = [];
    for (let i = 0; i < bw; i++) {
      if (bot[i] == null) continue;
      const p = [i, -bot[i]];
      while (hull.length >= 2) { const a = hull[hull.length - 2], b = hull[hull.length - 1]; if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) <= 0) hull.pop(); else break; }
      hull.push(p);
    }
    const hv = hull.map((p) => [p[0], -p[1]]), low = y1 - .35 * bh;
    let ga = null, gb = null;
    for (let i = 1; i < hv.length; i++) { const a = hv[i - 1], b = hv[i]; if (a[1] >= low && b[1] >= low && (!ga || b[0] - a[0] > gb[0] - ga[0])) { ga = a; gb = b; } }
    if (!ga || gb[0] - ga[0] < 4 * pr) { ga = [0, y1]; gb = [bw - 1, y1]; }
    const gl = (i) => ga[1] + (gb[1] - ga[1]) * (i - ga[0]) / (gb[0] - ga[0]);   // (the ground under column i, the source's px)
    // the reflection: each column flipped about the ground, fading out (lying: sooner, on the wet ground only; upright the showroom's
    // glossy floor, dry or wet: stronger, longer, fading softly and blurred, docs/odlocitve.md »Meni: razstavni prostor«)
    const RH = Math.round((land ? .6 : .8) * bh), fa = land ? .38 : .6, fl = land ? .7 : 1, fe = land ? 1 : 1.6;
    const ry0 = Math.floor(Math.min(gl(0), gl(bw - 1))), rh = Math.ceil(Math.max(gl(0), gl(bw - 1))) + RH + 2 - ry0;
    const rc = cv(bw, rh), rg = rc.getContext('2d'), ro2 = rg.createImageData(bw, rh), q = ro2.data;
    for (let i = 0; i < bw; i++) {
      const g0 = gl(i), x = x0 + i;
      for (let dy = 0; dy <= RH; dy++) {
        const sy = Math.round(g0 - dy), ty = Math.round(g0 + dy) - ry0; if (sy < 0 || sy >= H || ty < 0 || ty >= rh) continue;
        const si = (sy * W + x) * 4, a = d[si + 3]; if (!a) continue;
        const f = fa * Math.pow(Math.max(0, 1 - dy / (RH * fl)), fe); if (f <= 0) continue;
        const ti = (ty * bw + i) * 4; q[ti] = d[si]; q[ti + 1] = d[si + 1]; q[ti + 2] = d[si + 2]; q[ti + 3] = a * f;
      }
    }
    rg.putImageData(ro2, 0, 0); if (!land) soften(rc, 1.1 * pr);
    // frost on the windows (grey-blue glass in its upper part), snow packed on the lower body, thickest round the wheels
    const fr = cv(bw, bh), fg = fr.getContext('2d'), fo = fg.createImageData(bw, bh), o = fo.data, wc = [ga[0] / bw, gb[0] / bw];
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      const si = ((y0 + j) * W + x0 + i) * 4; if (d[si + 3] < 200) continue;
      const r = d[si], gg = d[si + 1], b = d[si + 2], Lm = .3 * r + .59 * gg + .11 * b, sat = Math.max(r, gg, b) - Math.min(r, gg, b), fy = j / bh, fx = i / bw, x = i * k, y = j * k;
      let a = 0, v = 245;
      if (fy < .62 && sat < 48 && Lm > 42 && Lm < 170 && b >= r - 4) { const n = n2(x / 6, y / 5) * .75 + n2(x / 2, y / 2) * .25; a = .42 + .45 * n; v = 238; }
      else if (fy > .5 && Lm > 70) {
        const wh = Math.max(0, 1 - Math.min(Math.abs(fx - wc[0]), Math.abs(fx - wc[1])) / .14), p = (fy - .5) * 1.3 + wh * .4, n = n2(x / 5, y / 3.6) * .8 + n2(x / 1.6, y / 1.6) * .2, th = 1 - p * .7;
        if (n > th) a = Math.min(.95, smooth((n - th) * 5));
      }
      if (a > 0) { const ti = (j * bw + i) * 4; o[ti] = v - 8; o[ti + 1] = v - 2; o[ti + 2] = 255; o[ti + 3] = a * 255; }
    }
    fg.putImageData(fo, 0, 0); soften(fr, 1.1 * pr / 2);
    // the top line's flat runs (in the yard's px)
    const runs = []; let run = [];
    const flush = () => { if (run.length > 2) runs.push(run); run = []; };
    for (let i = 0; i < bw; i++) {
      if (top[i] == null) { flush(); continue; }
      const p = { x: (x0 + i) * k, y: top[i] * k, flat: flat[i], xr: i / bw, sx: i, sy: top[i] }, q2 = run[run.length - 1], cont = q2 && Math.abs(p.sy - q2.sy) < 2.5 * pr && p.sx - q2.sx < 3;
      if (p.flat > .3 && (!q2 || cont)) run.push(p); else { flush(); if (p.flat > .3) run.push(p); }
    }
    flush();
    const gA = [(x0 + ga[0]) * k, ga[1] * k], gB = [(x0 + gb[0]) * k, gb[1] * k];
    return { key, none: false, pr, box: [x0 * k, y0 * k, bw * k, bh * k], bx0: x0 * k, bx1: (x1 + 1) * k, gA, gB, gy: Math.max(gA[1], gB[1]), kc: clamp(bh * k / 100, .5, 1.2),
      refl: rc, rx: x0 * k, ry: ry0 * k, rw: bw * k, rh: rh * k, frost: fr, runs };
  }
  const gline = (x) => CK.gA[1] + (CK.gB[1] - CK.gA[1]) * (x - CK.gA[0]) / ((CK.gB[0] - CK.gA[0]) || 1);

  /* ---------------- the screen's layers ---------------- */
  function build(s) {
    const st = s.querySelector('#track-stage'), dio = st && st.querySelector(':scope > .dio'), y = s.querySelector('.yard');
    L = { s, stage: st, yard: y, dio: null, ov: null, st: null, wets: [], sky: {}, video: false, fl: null, rm: null, car: null, sign: null, face: null, cap: null, dim: null, snowbg: null,
      snw: null, geo: null, box: null, boxKey: '', vis: 0, tries: 0, fading: false };
    if (dio && !dio.classList.contains('friends')) {   // (the friends' times: a table, no weather on it)
      st.classList.add('wxd'); L.dio = dio; L.video = !!dio.querySelector('video');
      const at = dio.nextSibling; L.ov = {};
      for (const n of ['tint', 'white', 'clouds', 'warm']) { const e = document.createElement('i'); e.className = 'wxo ' + n; e.setAttribute('aria-hidden', 'true'); st.insertBefore(e, at); L.ov[n] = e; }
      L.st = layer(st, 'wxst', at);
      L.wets = [...dio.querySelectorAll('.wet')];
      L.sky = { sun: st.querySelector(':scope > .sky .sun'), cloud: st.querySelector(':scope > .sky .cloud') };
    }
    if (y) {
      L.fl = layer(y, 'wxfl', y.firstChild);   // (the floor: under the sign, its posts and the car)
      const btn = y.querySelector(':scope > .car'); L.car = layer(y, 'wxcar', btn ? btn.nextSibling : null);   // (the snow on the car: over it, under its name)
      L.sign = y.querySelector(':scope > .sign');
      if (L.sign) { L.face = layer(L.sign, 'wxface', null); L.cap = layer(y, 'wxsc', L.sign.nextSibling); }
      const room = y.parentNode; if (room && room.classList && room.classList.contains('room')) L.rm = layer(room, 'wxrm', room.firstChild);   // (the floor on under the neighbours and Race!)
    }
    const bg = s.querySelector('.rbg');
    if (bg) { const i = bg.querySelector(':scope > i'), mkd = (n) => { const e = document.createElement('div'); e.className = 'wxo ' + n; bg.insertBefore(e, i ? i.nextSibling : bg.firstChild); return e; }; L.snowbg = mkd('wxsnow'); L.dim = mkd('wxdim'); }
    if (!UI || UI.c.parentNode !== app) { if (UI) UI.c.remove(); if (AIR) AIR.c.remove(); UI = layer(app, 'wxl wxui', null); AIR = layer(app, 'wxl wxair', null); }
    if (ro) { ro.disconnect(); ro = null; }
    if (window.ResizeObserver) { ro = new ResizeObserver(() => { dirty = true; kick(); }); for (const e of [app, y, L.sign]) if (e) ro.observe(e); }
  }
  // where everything is (relative to the menu; the yard's things in the yard's px, the floor in the room's)
  function measure() {
    dirty = false;
    if (!app || !L || !L.s.isConnected) return false;
    land = !!(window.matchMedia && matchMedia('(orientation: landscape)').matches);
    const A = app.getBoundingClientRect(); if (A.width < 2 || A.height < 2) return false;
    const s = L.s, q = (sel) => s.querySelector(sel), dp = Math.min(2, dpr());
    const rel = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 ? { x: r.left - A.left, y: r.top - A.top, w: r.width, h: r.height, r: r.right - A.left, b: r.bottom - A.top } : null; };
    const B = L.box = { back: rel(q('.thead .hback')), globe: rel(q('.thead .globe')), views: rel(q('#track-stage .cams')), mg: rel(q('#track-stage .hgraph')), row: rel(q('.trow')), go: rel(q('.foot .go')),
      nb: land ? [] : [...s.querySelectorAll('.nbrs .nb')].map(rel).filter(Boolean), map: land ? rel(L.stage) : null,
      cards: land ? [...s.querySelectorAll('.rcard')].filter((e) => Math.abs(+e.dataset.k) === 1).map(rel).filter(Boolean) : [], arw: land ? [...s.querySelectorAll('.rarw')].map(rel).filter(Boolean) : [] };
    L.boxKey = JSON.stringify(B, (k, v) => typeof v === 'number' ? Math.round(v) : v);
    const prOf = (m, cap) => Math.min(m, dpr(), Math.sqrt(cap / Math.max(1, A.width * A.height)));
    size(UI, A.width, A.height, prOf(2, 1.6e6)); size(AIR, A.width, A.height, prOf(1.5, 1e6));
    if (L.st) {
      const st = L.stage, sw = st.clientWidth, sh = st.clientHeight; size(L.st, sw, sh, dp);
      let vis = sh; const room = !land && q('.room');   // (upright the room comes over the picture's foot: the picture seen above it)
      if (room) { const a = st.getBoundingClientRect(), b = room.getBoundingClientRect(); if (b.top > a.top + 40) vis = Math.min(sh, b.top - a.top); }
      L.vis = vis;
    }
    const y = L.yard; L.geo = null;
    if (y && y.clientWidth > 4 && y.clientHeight > 4) {
      const yw = y.clientWidth, yh = y.clientHeight, G = L.geo = { yw, yh, ox: 0, oy: 0, rw: yw, rh: yh, hz: .58 * yh, rmTop: 0, posts: [], sign: null, carBox: null, key: '' };
      size(L.fl, yw, yh, dp); size(L.car, yw, yh, dp);
      const btn = y.querySelector(':scope > .car'); if (btn) G.carBox = { x: btn.offsetLeft, y: btn.offsetTop, r: btn.offsetLeft + btn.offsetWidth, b: btn.offsetTop + btn.offsetHeight };
      const room = !land && L.rm ? y.parentNode : null;
      if (room) {
        G.ox = y.offsetLeft; G.oy = y.offsetTop; G.rw = room.clientWidth; G.rh = room.clientHeight; G.hz = G.oy + .58 * yh; G.rmTop = G.oy + yh;
        const rh = Math.max(0, G.rh - G.rmTop), c = L.rm.c.style; c.display = rh > 1 ? '' : 'none'; c.top = G.rmTop + 'px'; c.height = rh + 'px';
        if (rh > 1) size(L.rm, G.rw, rh, Math.min(1.5, dpr())); else L.rm.w = 0;
      } else if (L.rm) { L.rm.c.style.display = 'none'; L.rm.w = 0; }
      for (const p of y.querySelectorAll(':scope > .post')) if (p.offsetWidth) G.posts.push({ x: p.offsetLeft + p.offsetWidth / 2, b: p.offsetTop + p.offsetHeight });
      const sg = L.sign;
      if (sg && !land && sg.offsetWidth > 8) {
        G.sign = { x: sg.offsetLeft, y: sg.offsetTop, w: sg.offsetWidth, h: sg.offsetHeight };
        size(L.face, sg.clientWidth, sg.clientHeight, dp);
        if (L.cap) { const c = L.cap.c.style, w = G.sign.w + 2 * CAPX, h = G.sign.h + CAPY + 6; c.display = ''; c.left = (G.sign.x - CAPX) + 'px'; c.top = (G.sign.y - CAPY) + 'px'; c.width = w + 'px'; c.height = h + 'px'; size(L.cap, w, h, dp); }
      } else { if (L.face) L.face.w = 0; if (L.cap) { L.cap.c.style.display = 'none'; L.cap.w = 0; } }
      G.key = [yw, yh, G.ox, G.oy, G.rw, G.rh].map(Math.round).join(',');
    }
    return true;
  }

  /* ---------------- each layer ---------------- */
  // the picture: its light and colours (the stage's --wxf, the videos' --wxv: css/menu.css), its wet and snowy copies, the clouds, a blue
  // tint, the warm sun, the snow's light; on it the rainbow, the haze and frost of the snow, the lightning, drops on the lens
  function stageL(S) {
    const st = L.stage; if (!st || !L.ov) return;
    const { w, ws, F } = S, f = (k) => mix(w, k), sn = ws.snow, vid = L.video, g0 = mix(ws, 'g');
    css(st, '--wxf', 'brightness(' + a3(f('b') + .5 * F) + ') saturate(' + a3(f('s')) + ') contrast(' + a3(f('c')) + ') grayscale(' + a3(g0) + ')');
    if (vid) css(st, '--wxv', 'brightness(' + a3(f('b') + .5 * F + .08 * sn) + ') saturate(' + a3(f('s')) + ') contrast(' + a3(f('c')) + ') grayscale(' + a3(Math.min(1, g0 + .45 * sn)) + ')');
    css(L.s, '--wxk', 'brightness(' + a3(1 - (1 - f('b')) * .6 + .3 * F + .1 * sn) + ') saturate(' + a3((1 - (1 - f('s')) * .6) * (1 - .55 * sn)) + ')');   // (lying: the cards beside it, milder)
    css(L.ov.tint, 'opacity', a3(f('ti')));
    css(L.ov.white, 'opacity', a3(sn * (SN.white + (vid ? .22 : 0))));
    css(L.ov.clouds, 'opacity', a3(Math.max(0, f('cl') - .6 * F)));
    css(L.ov.warm, 'opacity', a3(f('wa')));
    const wet = a3(mix(ws, 'wet')); for (const e of L.wets) css(e, 'opacity', wet);
    if (L.sky.sun) css(L.sky.sun, 'opacity', a3(clamp(f('wa'), 0, 1)));
    if (L.sky.cloud) css(L.sky.cloud, 'opacity', a3(clamp(f('cl'), 0, 1)));
    const l = L.st; if (!l || !l.w) return;
    const sun = f('wa'), bow = mix(ws, 'bow'), lens = Math.min(1.2, ws.rain + ws.storm + .5 * ws.change);
    const sig = [sun, bow, sn, F, lens].map((v) => Math.round(v * 200)).join(','), mv = lens > .01 || F > .002;
    paint(l, sig, mv, (g, W, H) => {
      const V = Math.min(H, L.vis || H);
      // (no sun's rays over the picture: the user, 12. 11. 2026; its warm light stays)
      if (bow > .01) { g.globalAlpha = Math.min(1, bow); g.drawImage(bowPic(Math.round(W), Math.round(V)), 0, 0, W, V); g.globalAlpha = 1; }
      if (sn > .01) {
        const hz = g.createLinearGradient(0, V * .45, 0, V); hz.addColorStop(0, 'rgba(226,235,248,0)'); hz.addColorStop(1, 'rgba(226,235,248,' + a3(SN.haze * sn) + ')');
        g.fillStyle = hz; g.fillRect(0, 0, W, H);
        frost(g, [[0, V, -Math.PI / 2], [W, V, Math.PI]], 77, 46, l.pr, sn * SN.frost);
      }
      if (F > .02) {
        const Bt = boltOf(Math.round(W), Math.round(V)), path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
        g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = 'rgba(170,200,255,' + a3(F) + ')'; g.shadowBlur = 22;
        g.strokeStyle = 'rgba(200,220,255,' + a3(.55 * F) + ')'; g.lineWidth = 6; path(Bt.pts);
        g.strokeStyle = 'rgba(255,255,255,' + a3(F) + ')'; g.lineWidth = 2.2; path(Bt.pts); g.lineWidth = 1.2; Bt.br.forEach(path);
        g.restore();
        const gr = g.createRadialGradient(W * .55, 30, 10, W * .55, 30, V * .9); gr.addColorStop(0, 'rgba(190,210,255,' + a3(.45 * F) + ')'); gr.addColorStop(1, 'rgba(190,210,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      }
      if (lens > .01) {
        const sp = dropSprite(), t = S.tt;
        for (const d of lensDrops(Math.round(W), Math.round(V))) {
          if (lens < d.thr * 1.1) continue;
          const a = Math.min(1, (lens - d.thr * 1.1) * 4), y = d.run ? d.top + ((d.y0 - d.top + d.v * t) % d.span) : d.y0, s = d.rad * 32 / 30;
          if (d.run) { g.globalAlpha = 1; g.strokeStyle = 'rgba(220,235,255,' + a3(.12 * a) + ')'; g.lineWidth = d.rad * .7; g.beginPath(); g.moveTo(d.x, y - 30); g.lineTo(d.x, y); g.stroke(); }
          g.globalAlpha = a; g.drawImage(sp, d.x - s, y - s, 2 * s, 2 * s);
        }
        g.globalAlpha = 1;
      }
    });
  }
  // the floor: upright the room's (dark over the horizon in the rain; wet with the car's reflection and ripples; snow with drifts, the
  // snow driven over it), in the yard and on under the neighbours and Race!; lying only the ground the car stands on
  function floorL(S) {
    const G = L.geo; if (!G || !L.fl || !L.fl.w) return;
    const { w, ws } = S, wet = S.wet, sn = ws.snow, dark = .35 * w.storm + .18 * w.rain + .08 * w.change, rainy = ws.rain + ws.storm * 1.5 + ws.change * .4, ok = CK && !CK.none;
    const refl = !ok ? 0 : land ? (wet > .01 ? wet : 0) : 1;   // (upright the showroom's floor: the reflection dry too)
    const sig = [dark, wet, sn, refl].map((v) => Math.round(v * 200)).join(',') + '|' + (ok ? CK.key : '') + '|' + G.key, mv = (wet > .01 && rainy > .01) || sn > .01;
    if (land || !L.rm) { paint(L.fl, sig, mv, (g) => ground(g, S, refl, rainy)); return; }
    paint(L.fl, sig, mv, (g) => { g.translate(-G.ox, -G.oy); room(g, S, dark, refl, rainy); });
    if (L.rm.w) paint(L.rm, sig, mv, (g) => { g.translate(0, -G.rmTop); room(g, S, dark, refl, rainy); });
  }
  function room(g, S, dark, refl, rainy) {
    const G = L.geo, W = G.rw, H = G.rh, hz = G.hz, ok = CK && !CK.none, fy = G.oy + (ok ? CK.gy : G.carBox ? G.carBox.b : G.yh * .96), ws = S.ws, wet = S.wet, sn = ws.snow, t = S.tt, k = W / 412;
    if (dark > .01) { g.fillStyle = 'rgba(4,8,16,' + a3(dark) + ')'; g.fillRect(0, G.oy, W, hz - G.oy); }
    if (wet > .01) {
      const gl = g.createLinearGradient(0, hz, 0, H); gl.addColorStop(0, 'rgba(110,150,210,' + a3(.16 * wet) + ')'); gl.addColorStop(.3, 'rgba(60,90,140,' + a3(.08 * wet) + ')'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.fillRect(0, hz, W, H - hz);
    }
    if (refl > .005) { g.globalAlpha = Math.min(1, refl); g.drawImage(CK.refl, G.ox + CK.rx, G.oy + CK.ry, CK.rw, CK.rh); g.globalAlpha = 1; }
    if (wet > .01) {
      if (rainy > .01) ripples(g, 26, (r) => [r() * W, hz + 8 + r() * Math.max(10, H - hz - 20)], rainy, t, 14);
    }
    if (sn > .01) {
      const hzg = g.createLinearGradient(0, hz - 70, 0, hz); hzg.addColorStop(0, 'rgba(190,206,230,0)'); hzg.addColorStop(1, 'rgba(190,206,230,' + a3(.3 * sn) + ')'); g.fillStyle = hzg; g.fillRect(0, hz - 70, W, 70);
      // snow on the ground: white towards the wall, blue in the shadows, soft drifts (by the car and at the posts), a little sparkle
      const a = a3(.95 * sn), gs = g.createLinearGradient(0, hz - 6, 0, H);
      gs.addColorStop(0, 'rgba(236,243,252,' + a + ')'); gs.addColorStop(.45, 'rgba(214,226,242,' + a + ')'); gs.addColorStop(1, 'rgba(168,186,214,' + a + ')');
      g.fillStyle = gs; g.beginPath(); g.moveTo(0, hz + 4);
      for (let x = 0; x <= W + 5; x += 6) g.lineTo(x, hz - 4 * sn - 5 * noise(x / 40) * sn);
      g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
      for (const [x, y, rw, rh] of [[W * .1, fy + 4, 90 * k, 14], [W * .56, fy + 2, 110 * k, 12], ...G.posts.map((p) => [G.ox + p.x, G.oy + p.b + 1, 30 * k, 7])]) {
        const gd = g.createRadialGradient(x, y - rh * .4, 2, x, y, rw); gd.addColorStop(0, 'rgba(255,255,255,' + a3(.9 * sn) + ')'); gd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gd; g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, 7); g.fill();
      }
      const span = W + 80, sx = DIR * 260 * t; g.strokeStyle = '#fff';
      for (const b of streaks(Math.round(W), Math.round(H), hz)) {
        g.globalAlpha = Math.min(1, b.a * sn); g.lineWidth = b.lw; g.beginPath();
        for (const s of b.s) { const x = (((s.x0 + sx) % span) + span) % span - 40; g.moveTo(x, s.y); g.lineTo(x - DIR * s.l, s.y + 1); }
        g.stroke();
      }
      g.globalAlpha = 1;
      glints(g, 13, (r) => [r() * W, hz + r() * (H - hz)], sn, t);
    }
  }
  function ripples(g, n, at, rainy, t, grow) {
    const r = rng(23); g.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const [x, y] = at(r), per = .7 + r() * .9, off = r() * per, thr = r();
      if (rainy < thr) continue;
      const p = ((t + off) % per) / per; if (p > .6) continue;
      const q = p / .6, rr = 2 + q * grow; g.strokeStyle = 'rgba(190,215,255,' + a3(.4 * (1 - q) * Math.min(1, rainy)) + ')';
      g.beginPath(); g.ellipse(x, y, rr, rr * .28, 0, 0, 7); g.stroke();
    }
  }
  function glints(g, n, at, sn, t) {
    const r = rng(31);
    for (let i = 0; i < n; i++) { const [x, y] = at(r), tw = .5 + .5 * Math.sin(t * 3 + i), a = .7 * sn * tw * r(); g.fillStyle = 'rgba(255,255,255,' + a3(a) + ')'; g.fillRect(x, y, 1.2, 1.2); }
  }
  // lying: the ground under the car (a wet sheen, its reflection, ripples round it; a soft bank of snow)
  function ground(g, S, refl, rainy) {
    const G = L.geo, ok = CK && !CK.none, b = G.carBox || { x: 0, r: G.yw * .6, b: G.yh * .9 };
    const x0 = ok ? CK.bx0 : b.x, x1 = ok ? CK.bx1 : b.r, fy = ok ? CK.gy : b.b, cx = (x0 + x1) / 2, rx = (x1 - x0) * .62 + 16, ws = S.ws, wet = S.wet, sn = ws.snow, t = S.tt;
    const oval = (x, y, r, sy, stops) => { g.save(); g.translate(x, y); g.scale(1, sy); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.restore(); };
    if (wet > .01) {
      oval(cx, fy + 2, rx, .16, [[0, 'rgba(110,150,210,' + a3(.24 * wet) + ')'], [.6, 'rgba(70,100,150,' + a3(.1 * wet) + ')'], [1, 'rgba(70,100,150,0)']]);
      if (refl > .005) { g.globalAlpha = Math.min(1, refl); g.drawImage(CK.refl, CK.rx, CK.ry, CK.rw, CK.rh); g.globalAlpha = 1; }
      if (rainy > .01) ripples(g, 16, (r) => [cx + (r() * 2 - 1) * rx, fy + 3 + (r() * 2 - 1) * 9], rainy, t, 11);
    }
    if (sn > .01) {
      oval(cx, fy + 2, rx * 1.15, .2, [[0, 'rgba(240,246,253,' + a3(.9 * sn) + ')'], [.55, 'rgba(214,226,242,' + a3(.6 * sn) + ')'], [1, 'rgba(190,206,230,0)']]);
      glints(g, 6, (r) => [cx + (r() * 2 - 1) * rx, fy + 2 + (r() * 2 - 1) * 7], sn, t);
    }
  }
  // the car: darker in the rain (the yard's --wxcar: its 3D canvas and its picture), in the snow frosted windows, snow on its flat tops
  // (more on the side the wind goes to) and a bank round its tyres
  function carL(S) {
    const l = L.car; if (!l || !l.w || !L.yard) return;
    css(L.yard, '--wxcar', 'brightness(' + a3(mix(S.w, 'cb') + .35 * S.F) + ') saturate(' + a3(mix(S.w, 'cs')) + ')');
    const sn = S.ws.snow, ok = CK && !CK.none && sn > .01;
    paint(l, ok ? CK.key + '|' + Math.round(sn * 200) : '0', false, (g) => { if (ok) carSnow(g, sn); });
  }
  function carSnow(g, sn) {
    const C = CK, kc = C.kc;
    g.globalAlpha = Math.min(1, sn * 1.3); g.drawImage(C.frost, C.box[0], C.box[1], C.box[2], C.box[3]); g.globalAlpha = 1;
    const th = (p) => (1.5 + 9 * (.7 + .3 * noise(p.x / 16) + .18 * SN.lumpK * noise(p.x / 4 + 7))) * sn * p.flat * SN.capK * (.55 + .9 * (DIR > 0 ? p.xr : 1 - p.xr)) * kc;
    for (const run of C.runs) {
      const top = run.map((p) => [p.x, p.y - th(p)]), bot = run.map((p) => [p.x, p.y + 1.2 + 1.6 * sn * noise(p.x / 6 + 2)]);
      const gr = g.createLinearGradient(0, Math.min(...top.map((q) => q[1])), 0, Math.max(...bot.map((q) => q[1]))); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.55, '#eef3fa'); gr.addColorStop(1, '#b9c9df');
      g.fillStyle = gr; g.shadowColor = 'rgba(20,40,80,.4)'; g.shadowBlur = 3; g.shadowOffsetY = 1.2;
      g.beginPath(); top.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]); g.closePath(); g.fill();
      g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = .8; g.beginPath(); top.forEach(([x, y], i) => i ? g.lineTo(x, y + .6) : g.moveTo(x, y + .6)); g.stroke();
      g.strokeStyle = 'rgba(110,140,190,.45)'; g.lineWidth = .9; g.beginPath(); bot.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    }
    // it stands in the snow: a bank over the bottoms of the tyres and under the body, along the line they stand on
    const xa = C.bx0 - 6, xb = C.bx1 + 6, y0 = Math.min(gline(xa), gline(xb)), y1 = Math.max(gline(xa), gline(xb));
    const gb = g.createLinearGradient(0, y0 - 18 * kc, 0, y1 + 2); gb.addColorStop(0, '#ffffff'); gb.addColorStop(.6, '#e2eaf5'); gb.addColorStop(1, '#bccbe0');
    g.fillStyle = gb; g.shadowBlur = 4; g.shadowOffsetY = -1; g.shadowColor = 'rgba(30,50,90,.3)';
    g.beginPath(); g.moveTo(xa, gline(xa) + 2);
    for (let x = xa; x <= xb; x += 2) { const e = Math.min(1, (x - xa) / 40, (xb - x) / 40); g.lineTo(x, gline(x) + 1 - (9 + 5 * noise(x / 14 + 3) + 2 * noise(x / 3.5)) * sn * e * kc); }
    g.lineTo(xb, gline(xb) + 2); g.closePath(); g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  }
  // the sign: a wet sheen, drops and drips on its face, snow stuck on it, frost at its right edge; snow on its top and the rain's splashes
  // there (in the yard, round it: they go with it as a new track's sign comes in)
  function signL(S) {
    const ws = S.ws, wet = Math.min(1, ws.rain + ws.storm + .6 * ws.change), sn = ws.snow, t = S.tt, G = L.geo;
    const l = L.face;
    if (l && l.w) paint(l, Math.round(wet * 200) + ',' + Math.round(sn * 200), wet > .01, (g, W, H) => {
      if (wet > .01) {
        const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(255,255,255,' + a3(.2 * wet) + ')'); sh.addColorStop(.45, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, H);
        const D = signDrops(Math.round(W), Math.round(H)), on = D.drops.filter((d) => wet >= d.thr);
        for (const [dx, dy, kr, col] of [[.4, .8, 1, 'rgba(0,10,40,.28)'], [0, 0, 1, 'rgba(200,225,255,.35)'], [-.35, -.35, .32, 'rgba(255,255,255,.85)']]) {
          g.fillStyle = col; g.beginPath();
          for (const d of on) { const x = d.x + dx * (kr < 1 ? d.rad : 1), y = d.y + dy * (kr < 1 ? d.rad : 1), r = d.rad * kr; g.moveTo(x + r, y); g.arc(x, y, r, 0, 7); }
          g.fill();
        }
        for (const d of D.drips) {
          if (wet < d.thr) continue;
          const y = ((d.y0 + d.v * t) % (H + d.len)) - 4, gr = g.createLinearGradient(0, y - d.len, 0, y); gr.addColorStop(0, 'rgba(210,230,255,0)'); gr.addColorStop(1, 'rgba(225,240,255,.5)');
          g.strokeStyle = gr; g.lineWidth = 1.6; g.beginPath(); g.moveTo(d.x, y - d.len); g.lineTo(d.x, y); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(d.x, y, 1.8, 0, 7); g.fill();
        }
      }
      if (sn > .01) {
        const sp = signSnow(Math.round(W), Math.round(H), l.pr);
        g.globalAlpha = Math.min(1, sn * SN.signK); g.drawImage(sp, 0, 0, W, H); g.globalAlpha = Math.min(1, sn * (SN.signK - 1)); g.drawImage(sp, 6 * DIR, 2, W, H); g.globalAlpha = 1;
        frost(g, [[W, 0, Math.PI / 2], [W, H, Math.PI]], 79, 22, l.pr, sn * SN.frost);
        const fr = g.createLinearGradient(0, 0, 0, H); fr.addColorStop(0, 'rgba(230,240,255,' + a3(.22 * sn) + ')'); fr.addColorStop(.35, 'rgba(230,240,255,0)'); g.fillStyle = fr; g.fillRect(0, 0, W, H);
      }
    });
    const c = L.cap;
    if (c && c.w && G && G.sign) {
      const rainy = Math.min(1.5, ws.rain + ws.storm * 1.6 + ws.change * .4), spl = wet > .01 && rainy > .01;
      paint(c, Math.round(sn * 200) + '|' + G.sign.w, spl, (g) => {
        if (sn > .01) cap(g, CAPX + 2, CAPX + G.sign.w - 2, CAPY + 1, 10, 1, sn);
        if (spl) splashes(g, [[{ x: CAPX, y: CAPY, w: G.sign.w }, 0]], rainy, t, 1);
      });
    }
  }
  // snow on a top (the mockup's): a soft lumpy layer, more on the side the wind goes to and hanging over it, its lip a little lower
  function cap(g, x0, x1, y, h0, seed, sn) {
    const ov1 = DIR < 0 ? 7 : 2.5, ov2 = DIR > 0 ? 7 : 2.5, top = [], lip = [];
    for (let x = x0 - ov1; x <= x1 + ov2 + .1; x += 1.5) {
      const e = Math.min(1, (x - x0 + ov1) / (DIR < 0 ? 4 : 10), (x1 + ov2 - x) / (DIR > 0 ? 4 : 10)), u = clamp((x - x0) / ((x1 - x0) || 1), 0, 1), sk = .45 + .95 * (DIR > 0 ? u : 1 - u);
      top.push([x, y - h0 * SN.capK * sn * sk * (.6 + .32 * noise(x / 13 + seed) + .22 * SN.lumpK * noise(x / 4.2 + seed * 3)) * Math.sqrt(Math.max(0, e))]);
    }
    for (let x = x1 + ov2; x >= x0 - ov1 - .1; x -= 3) lip.push([x, y + 1.5 + 2.4 * sn * noise(x / 6 + seed + 9) * Math.min(1, (x - x0 + ov1) / 6, (x1 + ov2 - x) / 6) + (x > x1 ? (x - x1) * .5 : 0) + (x < x0 ? (x0 - x) * .5 : 0)]);
    const gr = g.createLinearGradient(0, y - h0 * 1.2, 0, y + 4); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.6, '#eaf0f8'); gr.addColorStop(1, '#bfcde2');
    g.fillStyle = gr; g.shadowColor = 'rgba(25,45,85,.45)'; g.shadowBlur = 3; g.shadowOffsetY = 1.5;
    g.beginPath(); top.forEach(([x, yy], i) => i ? g.lineTo(x, yy) : g.moveTo(x, yy)); lip.forEach(([x, yy]) => g.lineTo(x, yy)); g.closePath(); g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = .8; g.beginPath(); top.forEach(([x, yy], i) => i ? g.lineTo(x, yy + .7) : g.moveTo(x, yy + .7)); g.stroke();
    g.strokeStyle = 'rgba(100,130,180,.4)'; g.lineWidth = .8; g.beginPath(); lip.forEach(([x, yy], i) => i ? g.lineTo(x, yy) : g.moveTo(x, yy)); g.stroke();
  }
  // the rain's splashes on tops (boxes: [box, its number: the mockup's seeds])
  function splashes(g, boxes, rainy, t, a) {
    for (const [b, bi] of boxes) {
      if (!b) continue;
      const r = rng(200 + bi);
      for (let i = 0; i < 9; i++) {
        const x = b.x + 8 + r() * Math.max(0, b.w - 16), per = .45 + r() * .6, off = r() * per, thr = r() * 1.4; if (rainy < thr) continue;
        const p = ((t + off) % per) / per; if (p > .3) continue;
        const q = p / .3, al = a3(.7 * (1 - q) * a);
        g.strokeStyle = 'rgba(210,230,255,' + al + ')'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, b.y, 1 + q * 7, 1 + q * 2.2, 0, Math.PI, 0); g.stroke();
        g.fillStyle = 'rgba(220,235,255,' + al + ')'; g.beginPath(); for (const d of [-1, 1]) { const px = x + d * (2 + q * 6), py = b.y - 2 - q * 6 + q * q * 6; g.moveTo(px + .9, py); g.arc(px, py, .9, 0, 7); } g.fill();
      }
    }
  }
  // the buttons and panels: drops on them, snow on their tops (faded as the carousel turns; after the screen's slide-in)
  function uiL(S) {
    const l = UI; if (!l || !l.w || !L.box) return;
    const ws = S.ws, wet = Math.min(1, ws.rain + ws.storm + .6 * ws.change), sn = ws.snow, a = S.uiA, B = L.box;
    paint(l, [wet, sn].map((v) => Math.round(v * 200)).join(',') + ',' + Math.round(a * 60) + '|' + L.boxKey, false, (g) => {
      if (a < .005 || (wet < .01 && sn < .01)) return;
      if (wet > .01) {
        [B.row, ...B.nb, B.back, B.go, B.views, B.mg, ...B.cards, ...B.arw].forEach((b, bi) => {
          if (!b) return;
          const r = rng(100 + bi), n = Math.round(b.w * b.h / (b === B.row ? 900 : 420));
          for (let i = 0; i < n; i++) {
            const x = b.x + 4 + r() * (b.w - 8), y = b.y + 4 + r() * (b.h - 8), rad = .8 + r() * 2.3, thr = r(); if (wet < thr) continue;
            const k = Math.min(1, (wet - thr) * 5);
            g.fillStyle = 'rgba(0,8,30,' + a3(.3 * k) + ')'; g.beginPath(); g.arc(x + .4, y + .9, rad, 0, 7); g.fill();
            g.fillStyle = 'rgba(200,225,255,' + a3(.22 * k) + ')'; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
            g.fillStyle = 'rgba(255,255,255,' + a3(.85 * k) + ')'; g.beginPath(); g.arc(x - rad * .35, y - rad * .38, rad * .3, 0, 7); g.fill();
          }
        });
      }
      if (sn > .01) {
        const caps = [[B.row, 8], ...B.nb.map((b) => [b, 7.5]), [B.back, 6.5], [B.go, 7.5], [B.views, 5.5], [B.mg, 5.5], ...(land ? [[B.map, 9], ...B.cards.map((b) => [b, 8]), ...B.arw.map((b) => [b, 5])] : [])];
        caps.forEach(([b, h], i) => { if (b) cap(g, b.x + 2, b.r - 2, b.y + 1, h, (i + 1) * 7.3 + 1, sn); });
        if (B.globe) { const b = B.globe, cx = b.x + b.w / 2, gr = g.createLinearGradient(0, b.y - 4, 0, b.y + 6); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#cbd8ea'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, b.y + 5, b.w * .32, 6.5 * sn, 0, Math.PI, 0); g.closePath(); g.fill(); }
      }
      if (a < .999) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.fillStyle = 'rgba(0,0,0,' + a3(a) + ')'; g.fillRect(0, 0, l.c.width, l.c.height); g.globalCompositeOperation = 'source-over'; }   // (faded in the canvas itself: a fading canvas element stalls some browsers)
    });
  }
  // the air over everything: the splashes on the tops, the rain, the blizzard and its whiteout, the lightning's flash, a tap's ring
  function airL(S) {
    const l = AIR; if (!l || !l.w) return;
    const { w, ws, F } = S, rain = mix(w, 'rain'), sn = mix(w, 'snow'), wetU = Math.min(1, ws.rain + ws.storm + .6 * ws.change), rainy = Math.min(1.5, ws.rain + ws.storm * 1.6 + ws.change * .4);
    const spl = wetU > .01 && rainy > .01 && S.uiA > .01 && L.box, mv = rain > .01 || sn > .01 || F > .002 || taps.length > 0 || !!spl;
    paint(l, mv ? null : 'calm', mv, (g, W, H) => {
      const A = S.airA, t = S.tt;
      if (spl) { const B = L.box; g.globalAlpha = A; splashes(g, [[B.row, 1], [B.nb[0], 2], [B.nb[1], 3], [B.back, 4], [B.go, 5], ...(land ? [[B.map, 6], [B.cards[0], 7], [B.cards[1], 8]] : [])], rainy, t, S.uiA); }
      if (rain > .01) {
        const n = Math.round(240 * rain), rw = w.rain + w.change + w.storm, ang = rw > 0 ? (w.rain * 9 + w.change * 6 + w.storm * 24) / rw : 0, sa = Math.sin(ang * Math.PI / 180), ca = Math.cos(ang * Math.PI / 180), kl = 1 + .5 * w.storm;
        g.lineCap = 'round'; g.strokeStyle = 'rgb(195,218,255)';
        for (const b of rainDrops(Math.round(W), Math.round(H))) {
          g.globalAlpha = A * b.a; g.lineWidth = b.lw; g.beginPath(); let any = false;
          for (const d of b.d) { if (d.i >= n) continue; const y = ((d.y0 + d.v * t) % (H + 60)) - 30, x = d.x0 + DIR * (y - d.y0) * sa / ca, len = d.len * kl; g.moveTo(x, y); g.lineTo(x - DIR * len * sa, y - len * ca); any = true; }
          if (any) g.stroke();
        }
      }
      if (sn > .01) {
        const Fl = flakes(Math.round(W), Math.round(H)), wrap = (x) => ((x + 30) % (W + 60) + W + 60) % (W + 60) - 30;
        g.lineCap = 'round'; g.strokeStyle = '#fff';
        for (const b of Fl.groups) {
          g.globalAlpha = A * b.a; g.lineWidth = b.lw; g.beginPath(); let any = false;
          for (const f of b.f) { if (f.i >= f.n * sn) continue; const y = ((f.y0 + f.v * t) % (H + 2 * f.s + 20)) - f.s - 10, x = wrap(f.x0 + Math.sin(t * f.fq + f.ph) * f.amp + f.vx * t); g.moveTo(x, y); g.lineTo(x - f.vx * .035, y - f.v * .035); any = true; }
          if (any) g.stroke();
        }
        const sp = flakeSprite();
        for (const f of Fl.big) { if (f.i >= f.n * sn) continue; const y = ((f.y0 + f.v * t) % (H + 2 * f.s + 20)) - f.s - 10, x = wrap(f.x0 + Math.sin(t * f.fq + f.ph) * f.amp + f.vx * t); g.globalAlpha = A * f.al; g.drawImage(sp, x - f.s, y - f.s, 2 * f.s, 2 * f.s); }
        g.globalAlpha = A * .08 * sn; g.fillStyle = 'rgb(226,236,250)'; g.fillRect(0, 0, W, H);
      }
      if (F > .01) { g.globalAlpha = A; g.fillStyle = 'rgba(205,220,255,' + a3(.2 * F) + ')'; g.fillRect(0, 0, W, H); }
      g.globalAlpha = 1;
      for (const e of taps) {
        const p = (S.t - e.t) / TAP; if (p < 0 || p > 1) continue;
        g.strokeStyle = 'rgba(255,214,90,' + a3(.85 * (1 - p)) + ')'; g.lineWidth = 3 * (1 - p) + 1; g.beginPath(); g.arc(e.x, e.y, 12 + p * 34, 0, 7); g.stroke();
        g.fillStyle = 'rgba(255,255,255,' + a3(.35 * (1 - p)) + ')'; g.beginPath(); g.arc(e.x, e.y, 14 * (1 - p * .5), 0, 7); g.fill();
      }
    });
  }
  // lying: the blurred picture behind the carousel, darker in the rain, paler in the snow
  function rbgL(S) { if (!L.dim) return; css(L.dim, 'opacity', a3(Math.min(.6, .42 * S.w.storm + .24 * S.w.rain + .1 * S.w.change))); css(L.snowbg, 'opacity', a3(.16 * S.ws.snow)); }

  /* ---------------- a moment: the weathers' mix, then every layer ---------------- */
  function frame(t) {
    if (!app || !L || !L.s.isConnected) return false;
    if (dirty) measure();
    frames++;
    const c = calm(), dt = lastT ? clamp(t - lastT, 0, .1) : 0; lastT = t;
    if (tl.length > 1 && t - tl[tl.length - 1].t > SLOW + .05) tl = [{ t: -99, k: tl[tl.length - 1].k }];
    if (taps.length) taps = taps.filter((e) => t - e.t < TAP);
    const w = c ? pure(look) : weights(t, FAST), ws = c ? pure(look) : weights(t, SLOW), F = c ? 0 : flash(t) * w.storm;
    if (c) { uiNow = uiGoal; enter = null; } else if (!(enter && !enter.ready) && uiNow < uiGoal) uiNow = Math.min(uiGoal, uiNow + dt * 4);
    const airA = enter ? smooth((t - enter.t) / .3) : 1;
    if (enter && enter.ready && airA >= 1) enter = null;
    const S = last = { t, tt: c ? 0 : t, w, ws, F, wet: mix(ws, 'wet'), uiA: uiNow, airA };
    let waitCar = false;
    if ((S.wet > .005 || ws.snow > .005 || !land) && L.yard && !carData()) waitCar = true;   // (its reflection (upright always), its snow: once it is drawn)
    snowSlots(S, t);
    stageL(S); floorL(S); carL(S); signL(S); uiL(S); airL(S); rbgL(S);
    if (c) { if (waitCar && L.tries++ < 20) setTimeout(kick, 250); return false; }
    return tl.length > 1 || taps.length > 0 || look !== 'dry' || !!enter || uiNow < uiGoal || waitCar || L.fading || dirty;
  }
  function kick() { if (!raf && !resting && app && L) raf = requestAnimationFrame(loop); }
  function loop(ms) {
    raf = 0; if (!app || !L || resting || !L.s.isConnected) return;
    const fps = Math.min(saver() ? 15 : 30, busy > 12 ? 10 : busy > 6 ? 18 : 30);   // (a device slow to draw it: fewer frames)
    if (lastMs && ms - lastMs < 1000 / fps - 4 && !dirty) { raf = requestAnimationFrame(loop); return; }
    lastMs = ms;
    const b = performance.now(); let more = false;
    try { more = frame(ms / 1000); } catch (e) { try { console.error('menu weather:', e && e.message ? e.message : e); } catch (_) { } }
    if (!heavy) busy = busy * .9 + (performance.now() - b) * .1;
    heavy = false;
    if (more && !raf) raf = requestAnimationFrame(loop);
  }

  /* ---------------- the menu's side ---------------- */
  // after a drawing of the track screen (s: its section; lk: its weather, 'dry' | 'rain' | 'change' | 'storm' | 'snow'; o.entering: the
  // screen comes now (its slide-in: the buttons' drops and snow after it), o.tap: the tapped weather icon's place (its ring), o.app: the
  // menu): a new weather fades over the old one, entering the screen it is there at once
  function on(s, lk, o) {
    o = o || {};
    if (!s || !s.isConnected) { off(); return; }
    const t = now(), k = KEYS.includes(lk) ? lk : 'dry', c = calm(), A = o.app || s.parentNode;
    if (A !== app) { off(); app = A; }
    if (o.entering || !L || c) {
      tl = [{ t: -99, k }]; taps = []; storm = k === 'storm' ? { t0: t, end: 1e12 } : null;
      enter = o.entering && !c ? { t, ready: 0 } : null; uiNow = enter ? 0 : 1; uiGoal = 1;
    } else {
      if (k !== look) { tl.push({ t, k }); if (k === 'storm') storm = { t0: t, end: 1e12 }; else if (storm && storm.end > t) storm.end = t; }
      uiGoal = 1;
    }
    if (o.tap && !c && o.tap.width) { const r = app.getBoundingClientRect(); taps.push({ t, x: o.tap.left + o.tap.width / 2 - r.left, y: o.tap.top + o.tap.height / 2 - r.top }); }
    look = k; resting = false; lastT = 0;
    build(s); dirty = true;
    if (enter && !enter.ready) {   // (the buttons where they stay once the screen has slid in)
      const en = enter, done = () => { if (enter !== en || en.ready) return; en.ready = now(); dirty = true; kick(); };
      s.addEventListener('animationend', (e) => { if (e.target === s) done(); });
      setTimeout(done, 450);
    }
    try { frame(t); } catch (e) { try { console.error('menu weather:', e && e.message ? e.message : e); } catch (_) { } }   // (drawn at once: the new screen's first picture is in its weather)
    kick();
  }
  // the carousel turning (p: how far, in places): the buttons' drops and snow fade (at a third of a place gone), come back as it stops
  function turn(p) { const a = Math.max(0, 1 - 3 * Math.abs(p || 0)); uiGoal = a; if (uiNow > a) uiNow = a; kick(); }
  function rest() { resting = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function wake() { if (!resting) return; resting = false; lastT = 0; dirty = true; kick(); }
  function off() {
    if (raf) cancelAnimationFrame(raf); raf = 0; resting = false;
    if (ro) { ro.disconnect(); ro = null; }
    if (UI) UI.c.remove(); if (AIR) AIR.c.remove(); UI = AIR = null;
    L = null; app = null; enter = null; taps = []; storm = null;
  }
  // (tests) the weather as it is now, and at once in its own weather (no fade, no tap, no flash, the buttons shown)
  function info() {
    const r2 = (v) => +(+v).toFixed(2), wr = (w) => w ? Object.fromEntries(KEYS.map((k) => [k, r2(w[k])])) : null;
    return { on: !!(app && L), look, settled: tl.length < 2, moving: !!raf, resting, frames, busy: r2(busy), land,
      w: last ? wr(last.w) : null, ws: last ? wr(last.ws) : null, flash: last ? r2(last.F) : 0, uiA: r2(uiNow), taps: taps.length,
      layers: L ? { stage: !!(L.st && L.st.w), floor: !!(L.fl && L.fl.w), room: !!(L.rm && L.rm.w), car: !!(L.car && L.car.w), face: !!(L.face && L.face.w), cap: !!(L.cap && L.cap.w), ui: !!(UI && UI.w), air: !!(AIR && AIR.w), rbg: !!L.dim } : null,
      snow: L && L.snw ? L.snw.map((s) => s.e.st + (s.set ? '+' : '')) : [], enc: encW ? 'worker' : encW === false ? 'own' : '',
      car: CK ? (CK.none ? { none: true } : { box: CK.box.map((v) => Math.round(v)), runs: CK.runs.length, src: CK.key.slice(0, 3) }) : null };
  }
  function settle() {
    if (!L) return info();
    tl = [{ t: -99, k: look }]; taps = []; enter = null; storm = null; uiNow = uiGoal = 1;
    if (L.snw) for (const s of L.snw) s.at = -99;
    dirty = true; frame(now());
    return info();
  }
  return { on, off, rest, wake, turn, resize: () => { dirty = true; kick(); }, info, settle };
})();
