// The weather over the whole track screen (mockup): each weather changes the picture (light, clouds, sun, rainbow, lightning, drops on
// the lens), the air (rain, snow), the room (wet floor with the car's reflection, snow on the ground), the sign, the car and the buttons
// (drops, snow on their tops). WXFX.frame(t) draws the moment t of a timeline of taps, so a video can be made frame by frame.
window.WXFX = (() => {
  const KEYS = ['dry', 'rain', 'change', 'storm', 'snow'];
  const FAST = 0.9, SLOW = 2.4;   // (s: the light and the air change fast, water and snow gather slowly)
  const P = {   // per weather: the picture's filter, clouds, blue tint, warm sun, white snow light, rain, snow, wetness, rainbow, the car's filter
    dry:    { b: 1.06, s: 1.18, c: 1.05, g: 0,   cl: 0,   ti: 0,   wa: 1,   sw: 0,   rain: 0,   ang: 0,  snow: 0, wet: 0,  bow: 0, cb: 1.02, cs: 1.06 },
    rain:   { b: .74,  s: .72,  c: 1.06, g: .12, cl: .6,  ti: .35, wa: 0,   sw: 0,   rain: 1,   ang: 9,  snow: 0, wet: 1,  bow: 0, cb: .84,  cs: .85 },
    change: { b: .93,  s: .96,  c: 1.03, g: .04, cl: .38, ti: .14, wa: .55, sw: 0,   rain: .32, ang: 6,  snow: 0, wet: .6, bow: 1, cb: .95,  cs: .95 },
    storm:  { b: .5,   s: .6,   c: 1.12, g: .2,  cl: 1,   ti: .55, wa: 0,   sw: 0,   rain: 1.8, ang: 24, snow: 0, wet: 1,  bow: 0, cb: .7,   cs: .8 },
    snow:   { b: 1,    s: .9,   c: 1.02, g: 0,   cl: .16, ti: .06, wa: 0,   sw: 0,  rain: 0,   ang: 0,  snow: 1, wet: 0,  bow: 0, cb: 1.05, cs: .78 },
  };
  // three kinds of snow (opt.snowStyle): fresh powder falling calmly, a blizzard (wind, a whiteout, snow driven onto one side), and the
  // sunny day after (no snowfall, glitter in the air, sparkles, long icicles dripping in the sun)
  const SS = {
    powder:   { capK: 1.35, lumpK: 0.6, flakes: 1,   speed: 0.75, wind: 5,   streak: 0, crystals: 14, haze: 0.3,  frost: 0.55, signK: 0.85, ice: 0.35, drip: 0, sun: 0,    glint: 0.7, white: 0,    picB: 1,    diamond: 0, drift: 0 },
    blizzard: { capK: 1.15, lumpK: 1.3, flakes: 2.3, speed: 1.6,  wind: 230, streak: 1, crystals: 0,  haze: 0.75, frost: 1.1,  signK: 1.7,  ice: 0,    drip: 0, sun: 0,    glint: 0.15, white: 0.36, picB: 0.92,  diamond: 0, drift: 1 },
    sunny:    { capK: 0.9,  lumpK: 0.45, flakes: 0,  speed: 1,    wind: 6,   streak: 0, crystals: 0,  haze: 0.08, frost: 0.45, signK: 0.7,  ice: 1.4,  drip: 1, sun: 1,    glint: 1.8, white: 0,    picB: 1.12, sky: 1, diamond: 1, drift: 0 },
  };
  const SN = () => SS[opt.snowStyle] || SS.powder;
  const DIR = -1;   // the wind's direction across the screen (the rain's slant, the snow's drift, where snow piles up): -1 mirrors it
  let dpr = 2, E = {}, R = {}, tl = [{ t: -99, k: 'dry' }], sel = -1, opt = {}, carCont = null, bolt = null;
  const smooth = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const hash = (i) => { let h = (i * 374761393) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const n2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi), h = (a, b) => hash(a * 7919 + b * 104729);
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v; };
  const noise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
  const canvas = (parent, css, w, h, before) => {
    const c = document.createElement('canvas'); c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.cssText = 'position:absolute;pointer-events:none;width:' + w + 'px;height:' + h + 'px;' + css;
    if (before) parent.insertBefore(c, before); else parent.appendChild(c);
    const g = c.getContext('2d'); g.scale(dpr, dpr); return g;
  };
  const div = (parent, css) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;pointer-events:none;' + css; parent.appendChild(d); return d; };

  // the weights of the weathers at time t (each tap fades the last mix into the new weather over d seconds)
  function weights(t, d) {
    let w = Object.fromEntries(KEYS.map(k => [k, k === tl[0].k ? 1 : 0]));
    for (let i = 1; i < tl.length; i++) {
      if (t < tl[i].t) break;
      const e = smooth((t - tl[i].t) / d);
      for (const k of KEYS) w[k] = w[k] * (1 - e) + (k === tl[i].k ? e : 0);
    }
    return w;
  }
  const mix = (w, key) => KEYS.reduce((a, k) => a + w[k] * P[k][key], 0);
  const current = (t) => { let k = tl[0].k, t0 = tl[0].t; for (const e of tl) if (t >= e.t) { k = e.k; t0 = e.t; } return { k, t0 }; };

  // the lightning: flashes a little after the storm starts and then every 3.2 s, each with a short flicker
  function flash(t) {
    if (opt.flash != null) return opt.flash;
    let f = 0;
    for (const e of tl) {
      if (e.k !== 'storm' || t < e.t) continue;
      const nx = tl.find(x => x.t > e.t), end = nx ? nx.t : 1e9;
      for (let s = e.t + 0.7; s < Math.min(t + 0.01, end); s += 3.2)
        for (const [o, a] of [[0, 1], [0.13, 0.7]]) { const dt = t - (s + o); if (dt >= 0) f = Math.max(f, a * Math.exp(-dt / 0.09)); }
    }
    return Math.min(1, f);
  }

  function makeBolt(w, h) {
    const r = rng(7), pts = [[w * 0.6, -4]];
    while (pts[pts.length - 1][1] < h * 0.62) { const [x, y] = pts[pts.length - 1]; pts.push([x + (r() - 0.62) * 26, y + 10 + r() * 16]); }
    const br = [];
    for (const i of [3, 7, 11]) if (pts[i]) { const b = [pts[i]]; let [x, y] = pts[i]; for (let j = 0; j < 5; j++) { x += 6 + r() * 14; y += 8 + r() * 10; b.push([x, y]); } br.push(b); }
    return { pts, br };
  }

  // the car's top line (for the snow on it): the first opaque pixel in each column of its picture, and how flat it is there
  function carContour(img, w, h) {
    const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h);
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
    const a = g.getImageData(0, 0, c.width, c.height).data, top = [];
    for (let x = 0; x < c.width; x++) { let y = 0; while (y < c.height && a[(y * c.width + x) * 4 + 3] < 140) y++; top.push(y < c.height ? y : null); }
    // the slope over a few pixels either side (the picture's top line steps a pixel at a time), then smoothed, so the snow's
    // thickness changes gently along the car
    const S = Math.round(3 * dpr), raw = top.map((y, x) => {
      if (y == null) return null;
      const yl = top[Math.max(0, x - S)], yr = top[Math.min(top.length - 1, x + S)];
      const sl = yl == null || yr == null ? 3 : Math.abs(yr - yl) / (2 * S);
      return Math.pow(Math.max(0, 1 - sl * 1.1), 1.6);
    });
    return top.map((y, x) => {
      if (y == null) return null;
      let s = 0, n = 0; for (let i = x - S; i <= x + S; i++) if (raw[i] != null) { s += raw[i]; n++; }
      return { x, y, flat: n ? s / n : 0 };
    });
  }


  // --- built once: the picture in the snow, the frost on the car, frost crystals, snow stuck on the sign ---
  // the picture as shown (cover, any transform), then each pixel: grass and slopes white with blue shadows, trees dark with snow on
  // their branches, the road packed snow keeping its marks, coloured things (cars) kept but cooler, the distance in a pale haze
  function buildSnowStage(slow) {
    const Wm = R.map.w, Hm = R.map.h, cw = Math.round(Wm * dpr), ch = Math.round(Hm * dpr), c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d'), img = E.img, cs = getComputedStyle(img), bw = img.offsetWidth, bh = img.offsetHeight, nw = img.naturalWidth, nh = img.naturalHeight;
    const sc = Math.max(bw / nw, bh / nh), m = cs.transform && cs.transform !== 'none' ? new DOMMatrix(cs.transform) : new DOMMatrix(), [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
    g.scale(dpr, dpr); g.translate(img.offsetLeft + ox, img.offsetTop + oy); g.transform(m.a, m.b, m.c, m.d, m.e, m.f); g.translate(-ox, -oy);
    g.drawImage(img, (bw - nw * sc) / 2, (bh - nh * sc) / 2, nw * sc, nh * sc); g.setTransform(1, 0, 0, 1, 0, 0);
    const id = g.getImageData(0, 0, cw, ch), d = id.data, k = 1 / dpr;
    const rows = (ya, yb) => { for (let y = ya; y < yb; y++) {
      const fog = Math.pow(1 - y / ch, 2.2) * 0.34;
      for (let x = 0; x < cw; x++) {
        const i = (y * cw + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2], L = 0.3 * r + 0.59 * gg + 0.11 * b, sat = Math.max(r, gg, b) - Math.min(r, gg, b), gn = gg - Math.max(r, b);
        const fine = hash((x * 92821) ^ (y * 68917)) - 0.5;
        let R2, G2, B2;
        if (sat > 75 && gn <= 4) { R2 = r * 0.84 + 20; G2 = gg * 0.87 + 24; B2 = b * 0.9 + 32; }
        else if (gn > 4 && L < 72) {
          const lit = smooth((L - 36) / 26) * (0.8 + 0.4 * n2(x * k / 3, y * k / 2)), sw = 222 + L * 0.25;
          R2 = L * 0.42 + 14; G2 = L * 0.6 + 24; B2 = L * 0.52 + 30;
          R2 += (sw - 10 - R2) * lit; G2 += (sw - 2 - G2) * lit; B2 += (sw + 10 - B2) * lit;
        } else if (gn > 4) { const sw = 216 + (L - 110) * 0.3 + fine * 5; R2 = sw - 12; G2 = sw - 3; B2 = sw + 10; }
        else { const v = L * 0.55 + 112 + fine * 5; R2 = v - 7; G2 = v; B2 = v + 10; }
        d[i] = Math.min(255, R2 * (1 - fog) + 226 * fog); d[i + 1] = Math.min(255, G2 * (1 - fog) + 233 * fog); d[i + 2] = Math.min(255, B2 * (1 - fog) + 243 * fog);
      }
    } };
    const finish = () => { g.putImageData(id, 0, 0); soften(c, 0.6); c.ready = true; };
    c.style.cssText = 'position:absolute;left:0;top:0;width:' + Wm + 'px;height:' + Hm + 'px;z-index:1;opacity:0;pointer-events:none';
    E.map.insertBefore(c, E.img.nextSibling);
    if (!slow) { rows(0, ch); finish(); return c; }
    // on the live page a few rows at a time, so the screen keeps moving meanwhile
    let y = 0; const step = () => { const t0 = performance.now(); while (y < ch && performance.now() - t0 < 8) { rows(y, Math.min(ch, y + 6)); y += 6; } if (y < ch) setTimeout(step, 0); else finish(); };
    setTimeout(step, 0); return c;
  }
  function soften(c, px) { const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const og = o.getContext('2d'); og.drawImage(c, 0, 0); const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.filter = 'blur(' + px + 'px)'; g.drawImage(o, 0, 0); g.filter = 'none'; return c; }
  // frost on the car's windows (grey-blue glass in its upper part) and snow packed on its lower body, thickest round the wheels
  function buildCarFrost() {
    const c = R.car, cw = Math.round(c.w * dpr), ch = Math.round(c.h * dpr), o = document.createElement('canvas'); o.width = cw; o.height = ch;
    const g = o.getContext('2d'); g.drawImage(E.car, 0, 0, cw, ch);
    const d = g.getImageData(0, 0, cw, ch).data, out = g.createImageData(cw, ch), q = out.data, k = 1 / dpr;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4; if (d[i + 3] < 200) continue;
      const r = d[i], gg = d[i + 1], b = d[i + 2], L = 0.3 * r + 0.59 * gg + 0.11 * b, sat = Math.max(r, gg, b) - Math.min(r, gg, b), fy = y / ch, fx = x / cw;
      let a = 0, v = 245;
      if (fy < 0.62 && sat < 48 && L > 42 && L < 170 && b >= r - 4) { const n = n2(x * k / 6, y * k / 5) * 0.75 + n2(x * k / 2, y * k / 2) * 0.25; a = 0.42 + 0.45 * n; v = 238; }
      else if (fy > 0.5 && L > 70) {
        const wheel = Math.max(0, 1 - Math.min(Math.abs(fx - 0.19), Math.abs(fx - 0.66)) / 0.14), p = (fy - 0.5) * 1.3 + wheel * 0.4, n = n2(x * k / 5, y * k / 3.6) * 0.8 + n2(x * k / 1.6, y * k / 1.6) * 0.2, th = 1 - p * 0.7;
        if (n > th) a = Math.min(0.95, smooth((n - th) * 5));
      }
      if (a > 0) { q[i] = v - 8; q[i + 1] = v - 2; q[i + 2] = 255; q[i + 3] = a * 255; }
    }
    g.putImageData(out, 0, 0); soften(o, 1.1); return o;
  }
  // frost crystals growing from a corner: a branch, side branches along it, and so on
  function dendrite(g, x, y, ang, len, depth, r, a) {
    if (depth <= 0 || len < 1.5) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    g.globalAlpha = a; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    const n = 2 + Math.floor(r() * 3);
    for (let i = 1; i <= n; i++) { const f = i / (n + 1), bx = x + (x2 - x) * f, by = y + (y2 - y) * f; for (const sd of [-1, 1]) if (r() < 0.75) dendrite(g, bx, by, ang + sd * (0.95 + r() * 0.25), len * (0.3 + r() * 0.22), depth - 1, r, a * 0.82); }
    dendrite(g, x2, y2, ang + (r() - 0.5) * 0.6, len * 0.62, depth - 1, r, a * 0.9);
  }
  function frostCorners(w, h, corners, seed, size) {
    const o = document.createElement('canvas'); o.width = Math.round(w * dpr); o.height = Math.round(h * dpr);
    const g = o.getContext('2d'), r = rng(seed); g.scale(dpr, dpr); g.strokeStyle = '#eef6ff'; g.lineWidth = 0.7; g.lineCap = 'round';
    for (const [cx, cy, a0] of corners) {
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, size * 1.4); gr.addColorStop(0, 'rgba(235,244,255,.55)'); gr.addColorStop(1, 'rgba(235,244,255,0)');
      g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(cx - size * 1.5, cy - size * 1.5, size * 3, size * 3);
      for (let j = 0; j < 7; j++) dendrite(g, cx, cy, a0 + (j / 6) * Math.PI / 2 + (r() - 0.5) * 0.2, size * (0.45 + r() * 0.55), 4, r, 0.75);
    }
    return o;
  }
  // snow blown onto the sign's face: patches, more at its top and on the side the wind comes from
  function buildSignSnow() {
    const s = R.sign, o = document.createElement('canvas'); o.width = Math.round(s.w * dpr); o.height = Math.round(s.h * dpr);
    const g = o.getContext('2d'); g.scale(dpr, dpr);
    for (let y = 0; y < s.h; y += 1.2) for (let x = 0; x < s.w; x += 1.2) {
      const p = 0.12 + 0.6 * Math.pow(1 - y / s.h, 2.2) + 0.35 * Math.pow(1 - x / s.w, 3), n = n2(x / 10, y / 6) * 0.8 + n2(x / 3, y / 3) * 0.2;
      if (n < 1 - p * 0.62) continue;
      const a = smooth((n - (1 - p * 0.62)) * 4);
      g.fillStyle = 'rgba(' + (238 + 12 * a | 0) + ',' + (244 + 8 * a | 0) + ',255,' + (0.35 + 0.6 * a) + ')'; g.fillRect(x, y, 1.4, 1.4);
    }
    soften(o, 1); return o;
  }
  function icicles(g, x0, x1, y, n, maxL, seed, a, t) {
    const r = rng(seed), S = SN();
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), L = (0.25 + 0.75 * r() * r()) * maxL * a * S.ice, w = (1.1 + r() * 2.2) * Math.min(1.2, 0.6 + S.ice * 0.4), ph = r(); if (L < 1.5 || i >= n * Math.min(1.5, S.ice + 0.2)) continue;
      if (S.drip && ph < 0.5) { const q = ((t || 0) * 0.9 + ph * 7) % 1.6, dy = q < 0.35 ? 0 : (q - 0.35) * (q - 0.35) * 220; g.fillStyle = 'rgba(215,236,255,' + (q < 0.35 ? q * 2.2 : 0.8) + ')'; g.beginPath(); g.ellipse(x, y + L + 1.6 + dy, 1.1, 1.6, 0, 0, 7); g.fill(); }
      const gr = g.createLinearGradient(0, y, 0, y + L); gr.addColorStop(0, 'rgba(240,248,255,.95)'); gr.addColorStop(0.55, 'rgba(205,228,252,.72)'); gr.addColorStop(1, 'rgba(190,220,255,.12)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 0.25, y + L * 0.55, x, y + L); g.quadraticCurveTo(x + w * 0.25, y + L * 0.55, x + w, y); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 0.55; g.beginPath(); g.moveTo(x - w * 0.45, y + 0.8); g.lineTo(x - w * 0.08, y + L * 0.72); g.stroke();
    }
  }


  // --- the car's shadow on the floor: where its tyres stand (dark, tight), under its body (softer), round it (wide and faint) ---
  // the tyres are found in its picture: the columns whose lowest opaque pixel is (nearly) the lowest of all
  function carFeet() {
    const c = R.car, cw = Math.round(c.w * dpr), ch = Math.round(c.h * dpr), o = document.createElement('canvas'); o.width = cw; o.height = ch;
    const g = o.getContext('2d'); g.drawImage(E.car, 0, 0, cw, ch); const a = g.getImageData(0, 0, cw, ch).data, bot = [];
    for (let x = 0; x < cw; x++) { let y = ch - 1; while (y >= 0 && a[(y * cw + x) * 4 + 3] < 140) y--; bot.push(y); }
    const maxB = Math.max(...bot), tol = ch * 0.025, cols = bot.map((y, x) => y >= maxB - tol ? x : -1).filter(x => x >= 0), wheels = [];
    for (const x of cols) { const w = wheels[wheels.length - 1]; if (w && x - w.x1 <= 3 * dpr) w.x1 = x; else wheels.push({ x0: x, x1: x }); }
    const body = bot.map((y, x) => y >= 0 ? x : -1).filter(x => x >= 0);
    return { y: (maxB + 1) / dpr, wheels: wheels.filter(w => w.x1 - w.x0 > 6 * dpr).map(w => ({ x0: w.x0 / dpr, x1: w.x1 / dpr })), x0: body[0] / dpr, x1: body[body.length - 1] / dpr };
  }
  function blob(g, cx, cy, rx, ry, rgb, a) {
    g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gr.addColorStop(0.55, 'rgba(' + rgb + ',' + a * 0.55 + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore();
  }
  function drawShadow(g, w, ws, top) {
    const F = E.feet; if (!F) return;
    const c = R.car, fy = c.y + F.y - top, sn = ws.snow, rgb = sn > 0.5 ? '35,55,100' : '0,0,0', sun = w.dry + 0.5 * w.change;
    const bx0 = c.x + F.x0, bx1 = c.x + F.x1, cx = (bx0 + bx1) / 2, half = (bx1 - bx0) / 2;
    blob(g, cx - 14 * sun, fy + 1, half * 1.12 + 10 * sun, 13, rgb, 0.42);                 // the wide soft shadow round the car (the sun's to the left)
    if (F.wheels.length >= 2) {
      const a = c.x + F.wheels[0].x0, b = c.x + F.wheels[F.wheels.length - 1].x1;
      blob(g, (a + b) / 2, fy, (b - a) / 2 + 6, 6.5, rgb, 0.62);                           // under the body, between the wheels: darker
    }
    for (const wh of F.wheels) { const x0 = c.x + wh.x0, x1 = c.x + wh.x1; blob(g, (x0 + x1) / 2, fy, (x1 - x0) * 0.62, 3.4, rgb, 0.9); }   // where each tyre stands
  }

  // --- the sign's look: each country its own real road sign (colours, frame, lettering from its sign rules: research of 30. 10. 2026,
  // docs/meni-izbira-proge.md), a little worn as such signs are there (dirt, salt, dust, fading, rust, streaks); optionally its flag ---
  // frame: 'line' = a line inset from the edge (yellow or blue field showing outside it), 'band' = a coloured band at the edge,
  // 'edge' = a light border at the edge; two = a second, smaller line (the name in the country's own script, or the Latin one)
  const SIGNS = {
    Slovenia:       { bg: '#f0ca00', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.6, 3], r: 6, font: [700, 0.5], wear: { fade: 0.08, grime: 0.32, bolts: 2 } },
    Germany:        { bg: '#f0ca00', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.6, 3], r: 6, font: [700, 0.2], cond: 1, wear: { grime: 0.25, bolts: 2, sparkle: 0.4 } },
    Austria:        { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['band', '#0e518d', 5], r: 5, font: [700, 0.6], wear: { grime: 0.18, bolts: 2, sheen: 0.32 } },
    Belgium:        { bg: '#0e518d', fg: '#f6f6f6', frame: ['line', '#f6f6f6', 2, 3], r: 6, font: [700, 0.6], wear: { streaks: 1, fade: 0.06, bolts: 2 } },
    Finland:        { bg: '#0a5ca8', fg: '#ffffff', frame: ['line', '#ffffff', 2, 3], r: 6, font: [700, 0.8], wear: { salt: 1, fade: 0.12, bolts: 2 } },
    England:        { bg: '#33533b', fg: '#ffffff', frame: ['edge', '#ffffff', 3.6], r: 8, font: [700, 0.3], wear: { grime: 0.22, bolts: 2 } },
    France:         { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['band', '#c1121c', 5, 1.5], r: 7, font: [800, 1.2], wear: { grime: 0.12, bolts: 2 } },
    Italy:          { bg: '#0e518d', fg: '#ffffff', frame: ['edge', '#ffffff', 2.4], r: 3, arrow: 1, font: [700, 0.8], wear: { fade: 0.18, grime: 0.2, scratch: 1 } },
    Monaco:         { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['band', '#c1121c', 5, 1.5], r: 7, font: [800, 1.2], two: [null, 'MÙNEGU'], wear: { bolts: 2, sheen: 0.3 } },
    Russia:         { bg: '#1c5aa6', fg: '#ffffff', frame: ['edge', '#ffffff', 2.2], r: 3, font: [700, 0.6], two: ['РОССИЯ', null], wear: { fade: 0.14, mud: 1, bolts: 2 } },
    USA:            { bg: '#006747', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 8, font: [600, 1], wear: { fade: 0.1, sparkle: 1, rust: 1, bolts: 4 } },
    Canada:         { bg: '#006747', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 7, font: [600, 1], wear: { salt: 1, grime: 0.22, bolts: 4 } },
    Brazil:         { bg: '#003166', fg: '#ffffff', frame: ['line', '#ffffff', 2.2, 2.6], r: 5, font: [700, 0.6], wear: { fade: 0.16, dust: '160,80,40', bolts: 2 } },
    Chile:          { bg: '#006747', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 6, font: [700, 0.8], wear: { fade: 0.14, dust: '170,150,120', bolts: 2 } },
    Australia:      { bg: '#005a3c', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 6, font: [600, 0.8], wear: { fade: 0.16, dust: '175,85,45', bolts: 2 } },
    'South Africa': { bg: '#00683f', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 4, font: [600, 0.4], cond: 1, wear: { fade: 0.18, dust: '165,90,55', bolts: 2 } },
    Morocco:        { bg: '#ffffff', fg: '#000000', frame: ['band', '#cc0605', 5, 1.5], r: 7, font: [800, 1], two: ['المغرب', null], wear: { fade: 0.12, dust: '190,160,120', bolts: 2 } },
    Japan:          { bg: '#005898', fg: '#ffffff', frame: ['line', '#ffffff', 2.2, 2.2], r: 5, font: [600, 0.4], two: ['日本', 'Japan'], wear: { bolts: 4, sheen: 0.24 } },
    China:          { bg: '#1450a0', fg: '#ffffff', frame: ['line', '#ffffff', 2, 2.4], r: 4, font: [600, 0.4], two: ['中国', 'China'], wear: { bolts: 4, sheen: 0.2 } },
    Thailand:       { bg: '#006a3a', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 4, font: [600, 0.3], two: ['ประเทศไทย', 'Thailand'], wear: { fade: 0.12, streaks: 1, bolts: 2 } },
  };
  const FLAGFILE = (k) => 'assets/flags/' + k.toLowerCase().replace(/ /g, '-') + '.svg';
  // the sign's look on any element (the screen's sign, or the signs sheet); its wear (and flag) drawn into a canvas, returned
  async function signLook(el, key, o = {}) {
    const S = SIGNS[key]; if (!S) return null;
    const w = el.offsetWidth, h = el.offsetHeight, name = o.name || el.textContent.trim(), fk = o.flag === true ? 'end' : o.flag || null;
    // the flag on the sign (fk): 'end' at its right end, 'both' at both ends, 'stripe' a band of its colours along the bottom, 'plate'
    // a small plate of its own over the sign (drawn by the page), 'eu' the EU's border sign (blue, the ring of twelve stars), 'emblem'
    // the flag in a round badge at the left, 'bg' the whole face in the flag's colours
    let img = null, vb = 1.5;
    if (fk) { img = new Image(); img.src = FLAGFILE(key); try { await img.decode(); vb = img.naturalWidth / img.naturalHeight || 1.5; } catch (e) { img = null; } }
    const S2 = fk === 'eu' ? Object.assign({}, S, { bg: '#003399', fg: '#ffffff', frame: ['edge', '#ffffff', 2.4] }) : fk === 'bg' ? Object.assign({}, S, { frame: ['edge', '#ffffff', 2.4] }) : S, f = S2.frame;
    Object.assign(el.style, { background: S2.bg, color: S2.fg, textShadow: 'none', filter: 'none', borderRadius: S.r + 'px', fontStyle: 'normal', border: 'none',
      fontWeight: S.font[0], letterSpacing: S.font[1] + 'px', fontStretch: S.cond ? '87%' : '100%' });
    const sh = ['0 0 0 1px rgba(0,0,0,.45)', '3px 5px 0 rgba(0,0,0,.35)', '0 10px 18px rgba(0,0,0,.35)'];
    if (f[0] === 'band') sh.unshift('inset 0 0 0 ' + f[2] + 'px ' + f[1]), f[3] && sh.splice(1, 0, '0 0 0 ' + f[3] + 'px #fff');
    if (f[0] === 'edge' && !S.arrow) sh.unshift('inset 0 0 0 ' + f[2] + 'px ' + f[1]);
    if (f[0] === 'line') sh.unshift('inset 0 0 0 ' + f[3] + 'px ' + S2.bg, 'inset 0 0 0 ' + (f[3] + f[2]) + 'px ' + f[1]);
    el.style.boxShadow = sh.join(', ');
    if (S.arrow) { el.style.clipPath = 'polygon(0 0, calc(100% - ' + h * 0.42 + 'px) 0, 100% 50%, calc(100% - ' + h * 0.42 + 'px) 100%, 0 100%)'; el.style.boxShadow = 'none'; }
    // the name: one line, or the country's script and a second line; always in the middle of the sign, smaller if the flag needs room
    // (o.flagCx: the flag's middle on the sign, where the car leaves it free; the edge colours carried out to both ends)
    if (fk === 'bg' && img) { const fc = document.createElement('canvas'); fc.width = Math.round(w * 2); fc.height = Math.round(h * 2); const fg = fc.getContext('2d'), dw = fc.height * vb, dx = Math.max(0, Math.min(fc.width - dw, (o.flagCx != null ? o.flagCx * 2 : fc.width / 2) - dw / 2)); fg.drawImage(img, dx, 0, dw, fc.height); if (dx > 0) { fg.drawImage(fc, dx + 1, 0, 1, fc.height, 0, 0, dx + 1, fc.height); fg.drawImage(fc, dx + dw - 2, 0, 1, fc.height, dx + dw - 1, 0, fc.width - dx - dw + 1, fc.height); } el.style.background = 'url(' + fc.toDataURL() + ') center / 100% 100%'; el.style.color = '#fff'; el.style.textShadow = '0 0 3px #000, 0 0 3px #000, 0 2px 2px rgba(0,0,0,.6)'; }
    const fh = h * 0.62, fw = fh * vb, side = fk === 'end' || fk === 'both' ? fw + 10 : fk === 'eu' || fk === 'emblem' ? h * 0.9 : 0, avail = w - 2 * (side + 12);

    let box0 = null; const two = S.two && (S.two[0] || S.two[1]), l1 = two ? (S.two[0] || name) : name, l2 = two ? (S.two[1] || name) : null;
    for (const n of [...el.childNodes]) if (n.nodeType === 3 || n.classList?.contains('nm')) n.remove();
    if (o.noText) { box0 = null; } else {
    const box = box0 = document.createElement('span'); box.className = 'nm'; box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1;white-space:nowrap';
    const a = document.createElement('span'); a.textContent = l1; box.appendChild(a);
    if (l2) { const b = document.createElement('span'); b.textContent = l2; b.style.fontSize = '0.52em'; b.style.fontWeight = 600; box.appendChild(b); a.style.fontSize = '0.74em'; }
    el.insertBefore(box, el.firstChild); if (fk === 'stripe') box.style.transform = 'translateY(' + (-h * 0.1) + 'px)';
    let fs = parseFloat(getComputedStyle(el).fontSize); while ((box.offsetWidth > avail || box.offsetHeight > h * (fk === 'stripe' ? 0.66 : 0.9)) && fs > 12) { fs -= 1; el.style.fontSize = fs + 'px'; }
    }
    // the wear, the flag, the arrow's border: drawn once
    const dp = Math.min(2, window.devicePixelRatio || 2), c = document.createElement('canvas'); c.width = Math.round(w * dp); c.height = Math.round(h * dp);
    const g = c.getContext('2d'), W = S.wear || {}, r = rng(key.length * 97 + key.charCodeAt(0) * 31 + key.charCodeAt(1)); g.scale(dp, dp);
    const pad = (f[0] === 'band' ? f[2] : f[0] === 'line' ? f[2] + f[3] : f[2]) + 6, fy = (h - fh) / 2;
    const printed = (fx) => { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(fx + 0.8, fy + 1, fw, fh); g.drawImage(img, fx, fy, fw, fh); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; g.strokeRect(fx - 0.5, fy - 0.5, fw + 1, fh + 1); };
    if (img && (fk === 'end' || fk === 'both')) { printed(w - fw - pad - (S.arrow ? h * 0.42 : 0)); if (fk === 'both') printed(pad); }
    if (img && fk === 'stripe') {
      let cols = []; try { const t = await (await fetch(FLAGFILE(key))).text(); for (const m of t.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/g)) { const c = m[1].toLowerCase(); if (!cols.includes(c)) cols.push(c); } } catch (e) {}
      cols = cols.slice(0, 3); if (cols.length === 2) cols = [cols[0], cols[1], cols[0]];
      const sh2 = h * 0.14, sy = h - sh2 - pad + 1, sw = w - 2 * pad - (S.arrow ? h * 0.42 : 0);
      g.fillStyle = '#fff'; g.fillRect(pad - 1.5, sy - 1.5, sw + 3, sh2 + 3);
      if (cols.length) cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(pad + i * sw / cols.length, sy, sw / cols.length + 0.5, sh2); }); else g.drawImage(img, pad, sy, sw, sh2);
    }
    if (img && fk === 'emblem') {   // a round badge at the left: the flag in a white ring
      const R0 = h * 0.33, cx = pad + R0 + 2, cy = h / 2; g.save(); g.beginPath(); g.arc(cx, cy, R0, 0, 7); g.clip(); g.drawImage(img, cx - R0 * vb, cy - R0, 2 * R0 * vb, 2 * R0); g.restore();
      g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.beginPath(); g.arc(cx, cy, R0 + 1, 0, 7); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.8; g.beginPath(); g.arc(cx, cy, R0 + 2.4, 0, 7); g.stroke();
    }
    if (fk === 'eu') {   // the ring of twelve gold stars at the left of the blue border sign
      const R0 = h * 0.3, cx = pad + R0 + 4, cy = h / 2, st = (x, y, r) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.4 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
      g.fillStyle = '#ffcc00'; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; st(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0, h * 0.06); }
    }
    if (S.arrow && fk !== 'bg') {   // the pointed blade: its white edge along the cut
      const p = h * 0.42; g.strokeStyle = f[1]; g.lineWidth = f[2] * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(w - p, 0); g.lineTo(w, h / 2); g.lineTo(w - p, h); g.lineTo(0, h); g.closePath(); g.stroke();
    }
    for (let i = 0; i < w * h / 3; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * w, r() * h, 1, 1); }   // the sheeting's grain
    if (W.fade) { const fd = g.createLinearGradient(0, 0, w, h); fd.addColorStop(0, 'rgba(255,255,255,' + W.fade + ')'); fd.addColorStop(1, 'rgba(255,255,255,' + W.fade * 0.3 + ')'); g.fillStyle = fd; g.fillRect(0, 0, w, h); }
    const shn = W.sheen || 0.2, sg = g.createLinearGradient(0, 0, w, h); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.36, 'rgba(255,255,255,' + shn + ')'); sg.addColorStop(0.45, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, h);
    const bottom = (rgb, a) => { const gd = g.createLinearGradient(0, h * 0.5, 0, h); gd.addColorStop(0, 'rgba(' + rgb + ',0)'); gd.addColorStop(1, 'rgba(' + rgb + ',' + a + ')'); g.fillStyle = gd; g.fillRect(0, 0, w, h); };
    if (W.grime) { bottom('70,55,35', W.grime); for (let i = 0; i < 9; i++) { const x = r() * w, l = 5 + r() * 12; g.strokeStyle = 'rgba(70,55,35,' + W.grime * 0.45 + ')'; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, h - l); g.lineTo(x + r() * 2 - 1, h); g.stroke(); } }
    if (W.dust) { bottom(W.dust, 0.42); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(' + W.dust + ',' + (0.2 + r() * 0.35) + ')'; g.fillRect(r() * w, h - Math.pow(r(), 2) * h * 0.45, 1.2, 1.2); } }
    if (W.mud) { bottom('60,45,30', 0.35); for (let i = 0; i < 14; i++) { const x = r() * w, y0 = h * (0.45 + r() * 0.3); g.strokeStyle = 'rgba(60,45,30,' + (0.15 + r() * 0.2) + ')'; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + r() * 3 - 1.5, h); g.stroke(); } }
    if (W.salt) { for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(235,238,240,' + (0.25 + r() * 0.5) + ')'; g.fillRect(r() * w, h - Math.pow(r(), 1.6) * h * 0.4, 0.9 + r(), 0.9 + r()); } }
    if (W.streaks) for (let i = 0; i < 12; i++) { const x = r() * w, l = h * (0.25 + r() * 0.6), gr = g.createLinearGradient(0, 0, 0, l); gr.addColorStop(0, 'rgba(40,35,30,.32)'); gr.addColorStop(1, 'rgba(40,35,30,0)'); g.strokeStyle = gr; g.lineWidth = 1 + r() * 2.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + r() - 0.5, l); g.stroke(); }
    if (W.scratch) for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, l = 6 + r() * 18, an = -0.4 + r() * 0.3; g.strokeStyle = 'rgba(255,255,255,' + (0.12 + r() * 0.18) + ')'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); }
    if (W.sparkle) for (let i = 0; i < 70 * W.sparkle; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.25 + r() * 0.55) + ')'; g.fillRect(r() * w, r() * h, 0.9, 0.9); }
    const bolts = W.bolts === 4 ? [[0.04, 0.24], [0.96, 0.24], [0.04, 0.76], [0.96, 0.76]] : W.bolts === 2 ? [[0.035, 0.5], [0.965, 0.5]] : [];
    for (const [bx, by] of bolts) {
      if ((bx < 0.5 && (fk === 'eu' || fk === 'emblem' || fk === 'both')) || (bx > 0.5 && (fk === 'end' || fk === 'both'))) continue;   // (not on the flag)
      const x = bx * w - (S.arrow && bx > 0.5 ? h * 0.42 : 0), y = by * h;
      if (W.rust) { const rg = g.createLinearGradient(0, y, 0, y + 22); rg.addColorStop(0, 'rgba(150,70,25,.55)'); rg.addColorStop(1, 'rgba(150,70,25,0)'); g.fillStyle = rg; g.beginPath(); g.moveTo(x - 2, y); g.quadraticCurveTo(x - 1, y + 14, x + 0.5, y + 22); g.quadraticCurveTo(x + 1.5, y + 12, x + 2.2, y); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 0.6, y + 0.9, 2.4, 0, 7); g.fill();
      const bg = g.createRadialGradient(x - 0.8, y - 0.9, 0.2, x, y, 2.4); bg.addColorStop(0, '#f4f6f8'); bg.addColorStop(0.6, '#9aa3ad'); bg.addColorStop(1, '#5e6670'); g.fillStyle = bg; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill();
    }
    if (o.append) { c.style.cssText = 'position:absolute;left:0;top:0;width:' + w + 'px;height:' + h + 'px;pointer-events:none;border-radius:inherit'; el.appendChild(c); }
    return c;
  }
  async function styleSign(key, flag, mode) {
    if (mode === 'flagname') { const free = Math.max(0, (R.carRightAtSign || R.sign.x) - R.sign.x); E.signWear = await signLook(E.sign, key, { flag: 'bg', noText: true, flagCx: (free + R.sign.w) / 2 }); if (E.plate) await signLook(E.plate, key, { append: true }); return; }
    E.signWear = await signLook(E.sign, key, { flag });
  }

  async function init(T) {
    dpr = Math.min(2, window.devicePixelRatio || 2); opt = {};
    const $ = (s) => document.querySelector(s);
    E = { map: $('#map'), img: $('#mapimg'), room: $('#room'), car: $('#car'), sign: $('#boards .bd.b'), row: $('.row'), nb: [...document.querySelectorAll('.nb')],
      back: $('.back'), go: $('.go'), home: $('#homeBtn'), globe: $('#hflag'), views: $('.views'), mg: $('.mgbox'), flow: $('#flow') };
    E.map.style.overflow = 'hidden';
    if (T.signMode === 'flagname') {
      const sg = E.sign, top0 = sg.offsetTop, h0 = sg.offsetHeight, nh = 50, ny = top0 + 40, posts = [...document.querySelectorAll('#boards .post')];
      for (const p of posts) { const fl = p.offsetTop + p.offsetHeight; p.style.top = (ny + nh - 4) + 'px'; p.style.height = (fl - ny - nh + 4) + 'px'; }
      Object.assign(sg.style, { top: ny + 'px', height: nh + 'px' });
      const pw = 150, ph = 42, py = ny - ph - 6, px = sg.offsetLeft + sg.offsetWidth - pw - 10, bd = document.getElementById('boards');
      bd.insertAdjacentHTML('beforeend', '<i class="post" style="left:' + (px + pw * 0.22) + 'px;top:' + (py + ph - 2) + 'px;height:10px"></i><i class="post" style="left:' + (px + pw * 0.78 - 6) + 'px;top:' + (py + ph - 2) + 'px;height:10px"></i><div class="bd" id="namePlate" style="left:' + px + 'px;top:' + py + 'px;width:' + pw + 'px;height:' + ph + 'px;font-size:28px;overflow:hidden">' + (T.country || '') + '</div>');
      E.plate = document.getElementById('namePlate');
    }
    for (const k of ['map', 'room', 'car', 'sign', 'row', 'back', 'go', 'home', 'globe', 'views', 'mg', 'plate']) if (E[k] && E[k].offsetWidth) R[k] = rect(E[k]);
    R.nb = E.nb.map(rect);
    const W = document.body.clientWidth || 412, H = document.body.clientHeight || 892; R.W = W; R.H = H;
    // the picture's layers (under the camera buttons, the graph and the weather icons)
    E.tint = div(E.map, 'z-index:1;background:#283c60;mix-blend-mode:multiply;opacity:0');
    E.white = div(E.map, 'z-index:1;background:#e6efff;mix-blend-mode:screen;opacity:0');
    E.clouds = div(E.map, 'z-index:1;opacity:0;background:linear-gradient(180deg,rgba(12,18,30,.92) 0%,rgba(14,20,34,.55) 38%,rgba(14,20,34,0) 78%)');
    E.warm = div(E.map, 'z-index:1;opacity:0;mix-blend-mode:screen;background:radial-gradient(circle at 90% 16%,rgba(255,206,120,.62),rgba(255,170,80,.2) 28%,rgba(255,150,60,0) 62%)');
    E.gStage = canvas(E.map, 'left:0;top:0;z-index:1', R.map.w, R.map.h);
    // the room: the floor (wet or snowy) just over the room's own picture, under the posts, the car and the wind
    E.gRoom = canvas(document.body, 'left:0;top:' + R.room.y + 'px', W, H - R.room.y, E.room.nextSibling);
    // the car: snow on its top
    E.gCar = canvas(document.body, 'left:' + R.car.x + 'px;top:' + (R.car.y - 14) + 'px;z-index:3', R.car.w, R.car.h + 14, E.car.nextSibling);
    carCont = carContour(E.car, R.car.w * dpr, R.car.h * dpr);
    // the sign: drops and drips on its face, frost in the snow (inside it, so the car still covers its lower left)
    E.sign.style.overflow = 'hidden';
    E.gSign = canvas(E.sign, 'left:' + (-E.sign.clientLeft) + 'px;top:' + (-E.sign.clientTop) + 'px', R.sign.w, R.sign.h);
    // the buttons: drops, splashes and snow on their tops; then the air over everything
    E.gUi = canvas(document.body, 'left:0;top:0;z-index:19', W, H);
    E.gAir = canvas(document.body, 'left:0;top:0;z-index:20', W, H);
    bolt = makeBolt(R.map.w, R.map.h);
    R.wxi = [...document.querySelectorAll('.wxc i')].map(rect); R.wxs = [...document.querySelectorAll('.wxc i svg')].map(rect);
    // where the car's top reaches over the sign's bottom edge (the icicles hang only right of it)
    R.carRightAtSign = R.car.x + Math.max(0, ...carCont.filter(p => p && R.car.y + p.y / dpr < R.sign.b).map(p => p.x / dpr));
    E.snowStage = null; setTimeout(snowReady, 700);   // (the snow's pictures take a moment: made after the screen shows, or at the first snow)
    E.stageFrost = frostCorners(R.map.w, R.map.h, [[0, R.map.h, -Math.PI / 2], [R.map.w, R.map.h, Math.PI]], 77, 46);
    E.feet = carFeet(); if (T.signStyle !== false) await styleSign(SIGNS[T.signStyle] ? T.signStyle : T.countryKey, T.signFlag || false, T.signMode); E.gSign.canvas.style.left = '0px'; E.gSign.canvas.style.top = '0px'; E.gSign.canvas.style.borderRadius = 'inherit';
    // a long place name fits between the back button and the globe
    { const h = document.querySelector('.htitle'), b = document.querySelector('#homeBtn').getBoundingClientRect(), gl = document.querySelector('#hflag').getBoundingClientRect();
      if (h) { const avail = (document.body.clientWidth || 412) - 14 - gl.width - b.right - 22; h.style.minWidth = '0'; const rg = document.createRange(), tw = () => { rg.selectNodeContents(h); return rg.getBoundingClientRect().width; }; let fs = parseFloat(getComputedStyle(h).fontSize); while (tw() > avail && fs > 20) { fs -= 1; h.style.fontSize = fs + 'px'; } } }
    E.signFrost = frostCorners(R.sign.w, R.sign.h, [[R.sign.w, 0, Math.PI / 2], [R.sign.w, R.sign.h, Math.PI]], 79, 22);
    return true;
  }

  function snowReady() { if (!E.snowStage) { E.snowStage = buildSnowStage(!!opt.live); E.carFrost = buildCarFrost(); E.signSnow = buildSignSnow(); } }

  function setSel(k) {
    const C = window.WXC; if (!C || k === sel) return; sel = k;
    C.box.innerHTML = C.ic.map((h, i) => '<i class="' + (i === k ? 'on' : '') + '">' + h + (i === k ? '<em>' + C.names[i] + '</em>' : '') + '</i>').join('');
  }

  // --- the picture ---
  function drawStage(t, w, ws, fl) {
    const g = E.gStage, Wm = R.map.w, Hm = R.map.h; g.clearRect(0, 0, Wm, Hm);
    // the sun's rays and a flare (dry; half of it in changing weather)
    const sun = Math.max(mix(w, 'wa'), w.snow * SN().sun);
    if (sun > 0.01) {
      const sx = Wm * 0.9, sy = 60; g.save(); g.globalCompositeOperation = 'screen';
      for (let i = 0; i < 14; i++) {
        const a = Math.PI * (0.52 + i * 0.045) + Math.sin(t * 0.3 + i) * 0.01, len = 520, sp = 0.012 + 0.01 * hash(i);
        const gr = g.createRadialGradient(sx, sy, 10, sx, sy, len); gr.addColorStop(0, 'rgba(255,220,150,' + (0.16 * sun) + ')'); gr.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a - sp) * len, sy + Math.sin(a - sp) * len); g.lineTo(sx + Math.cos(a + sp) * len, sy + Math.sin(a + sp) * len); g.closePath(); g.fill();
      }
      for (const [f, r, col, a] of [[0.35, 16, '255,190,110', 0.22], [0.55, 7, '160,230,255', 0.28], [0.8, 30, '255,150,90', 0.1], [1.05, 12, '200,255,200', 0.16]]) {
        const x = sx + (Wm * 0.25 - sx) * f, y = sy + (Hm * 0.8 - sy) * f, gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(' + col + ',' + (a * sun) + ')'); gr.addColorStop(0.7, 'rgba(' + col + ',' + (a * sun * 0.5) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
      g.restore();
    }
    // a rainbow (changing weather: the sun comes out in the rain)
    const bow = mix(ws, 'bow');
    if (bow > 0.01) {
      g.save(); g.globalCompositeOperation = 'screen';
      const cx = Wm * 0.18, cy = Hm * 1.02, r0 = Hm * 0.72, cols = ['255,60,60', '255,150,40', '255,235,60', '80,220,90', '60,160,255', '90,90,230', '170,80,220'];
      for (let i = 0; i < cols.length; i++) {
        const gr = g.createLinearGradient(cx - r0, 0, cx + r0, 0);
        gr.addColorStop(0, 'rgba(' + cols[i] + ',0)'); gr.addColorStop(0.35, 'rgba(' + cols[i] + ',' + (0.3 * bow) + ')'); gr.addColorStop(0.75, 'rgba(' + cols[i] + ',' + (0.24 * bow) + ')'); gr.addColorStop(1, 'rgba(' + cols[i] + ',0)');
        g.strokeStyle = gr; g.lineWidth = 4.2; g.beginPath(); g.arc(cx, cy, r0 - i * 4, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      }
      g.restore();
    }
    if (ws.snow > 0.01 && SN().sky) {   // the sunny day after: a clear blue sky over the hills
      const sk = g.createLinearGradient(0, 0, 0, Hm * 0.5); sk.addColorStop(0, 'rgba(90,150,230,' + 0.4 * ws.snow + ')'); sk.addColorStop(1, 'rgba(90,150,230,0)');
      g.fillStyle = sk; g.fillRect(0, 0, Wm, Hm * 0.5);
    }
    if (ws.snow > 0.01) {
      const hz = g.createLinearGradient(0, Hm * 0.45, 0, Hm); hz.addColorStop(0, 'rgba(226,235,248,0)'); hz.addColorStop(1, 'rgba(226,235,248,' + SN().haze * ws.snow + ')');
      g.fillStyle = hz; g.fillRect(0, 0, Wm, Hm); g.globalAlpha = Math.min(1, ws.snow * SN().frost); g.drawImage(E.stageFrost, 0, 0, Wm, Hm); g.globalAlpha = 1;
    }
    // the lightning
    const st = w.storm;
    if (st > 0.01 && fl > 0.02) {
      g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
      const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
      g.shadowColor = 'rgba(170,200,255,' + fl * st + ')'; g.shadowBlur = 22;
      g.strokeStyle = 'rgba(200,220,255,' + (0.55 * fl * st) + ')'; g.lineWidth = 6; path(bolt.pts);
      g.strokeStyle = 'rgba(255,255,255,' + (fl * st) + ')'; g.lineWidth = 2.2; path(bolt.pts); g.lineWidth = 1.2; bolt.br.forEach(path);
      g.restore();
      const gr = g.createRadialGradient(Wm * 0.55, 30, 10, Wm * 0.55, 30, Hm * 0.9); gr.addColorStop(0, 'rgba(190,210,255,' + 0.45 * fl * st + ')'); gr.addColorStop(1, 'rgba(190,210,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, Wm, Hm);
    }
    // drops on the lens (rain): round drops, some running down
    const lens = Math.min(1.2, ws.rain + ws.storm + 0.5 * ws.change);
    if (lens > 0.01) {
      const r = rng(11);
      for (let i = 0; i < 30; i++) {
        const thr = r(), x = 14 + r() * (Wm - 28), y0 = 90 + r() * (Hm - 110), rad = 2.5 + r() * 7.5, run = r() < 0.3, v = 8 + r() * 22;
        if (lens < thr * 1.1) continue;
        const a = Math.min(1, (lens - thr * 1.1) * 4), y = run ? 90 + ((y0 - 90 + v * t) % (Hm - 100)) : y0;
        if (run) { g.strokeStyle = 'rgba(220,235,255,' + 0.12 * a + ')'; g.lineWidth = rad * 0.7; g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x, y); g.stroke(); }
        const gr = g.createRadialGradient(x - rad * 0.3, y - rad * 0.35, rad * 0.1, x, y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,' + 0.34 * a + ')'); gr.addColorStop(0.45, 'rgba(210,225,245,' + 0.06 * a + ')'); gr.addColorStop(0.85, 'rgba(20,30,45,' + 0.22 * a + ')'); gr.addColorStop(1, 'rgba(255,255,255,' + 0.1 * a + ')');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
      }
    }
  }

  // --- the room: a wet floor with the car's reflection and ripples, or snow on the ground ---
  function drawRoom(t, w, ws) {
    const g = E.gRoom, W = R.W, top = R.room.y, H = R.H - top; g.clearRect(0, 0, W, H);
    const hz = (opt.hz || 668) - top, floor = (opt.carFloor || 734) - top;
    g.save(); g.beginPath(); g.roundRect(0, 0, W, H + 20, [13, 13, 0, 0]); g.clip();   // (the room's top corners are round)
    const dark = 0.35 * w.storm + 0.18 * w.rain + 0.08 * w.change;
    if (dark > 0.01) { g.fillStyle = 'rgba(4,8,16,' + dark + ')'; g.fillRect(0, 0, W, hz); }
    const wet = mix(ws, 'wet');
    if (wet > 0.01) {
      // the floor's sheen, the car's reflection (upside down, fading out), ripples in the puddles
      const gl = g.createLinearGradient(0, hz, 0, H); gl.addColorStop(0, 'rgba(110,150,210,' + 0.16 * wet + ')'); gl.addColorStop(0.3, 'rgba(60,90,140,' + 0.08 * wet + ')'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.fillRect(0, hz, W, H - hz);
      const c = R.car, o = document.createElement('canvas'); o.width = Math.round(c.w * dpr); o.height = Math.round(c.h * 0.6 * dpr);
      const og = o.getContext('2d'); og.scale(1, -1); og.drawImage(E.car, 0, -c.h * dpr, o.width, c.h * dpr); og.setTransform(1, 0, 0, 1, 0, 0);
      og.globalCompositeOperation = 'destination-in'; const fd = og.createLinearGradient(0, 0, 0, o.height); fd.addColorStop(0, 'rgba(0,0,0,.42)'); fd.addColorStop(1, 'rgba(0,0,0,0)'); og.fillStyle = fd; og.fillRect(0, 0, o.width, o.height);
      g.globalAlpha = wet; g.drawImage(o, c.x, floor - 6, c.w, c.h * 0.6); g.globalAlpha = 1;
      const rainy = ws.rain + ws.storm * 1.5 + ws.change * 0.4, r = rng(23);
      for (let i = 0; i < 26; i++) {
        const x = r() * W, y = hz + 8 + r() * (H - hz - 20), per = 0.7 + r() * 0.9, off = r() * per, thr = r();
        if (rainy < thr) continue;
        const p = ((t + off) % per) / per; if (p > 0.6) continue;
        const q = p / 0.6; g.strokeStyle = 'rgba(190,215,255,' + (0.4 * (1 - q) * Math.min(1, rainy)) + ')'; g.lineWidth = 1;
        g.beginPath(); g.ellipse(x, y, 2 + q * 14, (2 + q * 14) * 0.28, 0, 0, 7); g.stroke();
      }
    }
    const sn = ws.snow;
    if (sn > 0.01) {
      const hzg = g.createLinearGradient(0, hz - 70, 0, hz); hzg.addColorStop(0, 'rgba(190,206,230,0)'); hzg.addColorStop(1, 'rgba(190,206,230,' + 0.3 * sn + ')'); g.fillStyle = hzg; g.fillRect(0, hz - 70, W, 70);
      // snow on the ground: white towards the wall, blue in the shadows, soft drifts, a little sparkle
      const gs = g.createLinearGradient(0, hz - 6, 0, H); gs.addColorStop(0, 'rgba(236,243,252,' + 0.95 * sn + ')'); gs.addColorStop(0.45, 'rgba(214,226,242,' + 0.95 * sn + ')'); gs.addColorStop(1, 'rgba(168,186,214,' + 0.95 * sn + ')');
      g.fillStyle = gs; g.beginPath(); g.moveTo(0, hz + 4);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, hz - 4 * sn - 5 * noise(x / 40) * sn);
      g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
      for (const [x, y, rw, rh] of [[40, floor + 4, 90, 14], [230, floor + 2, 110, 12], [R.sign.x + 50, hz + 2, 40, 9], [R.sign.r - 56, hz + 2, 40, 9]]) {
        const gd = g.createRadialGradient(x, y - rh * 0.4, 2, x, y, rw); gd.addColorStop(0, 'rgba(255,255,255,' + 0.9 * sn + ')'); gd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gd; g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, 7); g.fill();
      }
      // (the car's shadow: drawShadow)
      if (SN().drift) { const r2 = rng(37); for (let i = 0; i < 70; i++) { const y = hz + r2() * (H - hz), x0 = r2() * (W + 80) + DIR * 260 * t, x = ((x0 % (W + 80)) + W + 80) % (W + 80) - 40, l = 14 + r2() * 30; g.strokeStyle = 'rgba(255,255,255,' + (0.18 + 0.3 * r2()) * sn + ')'; g.lineWidth = 0.8 + r2(); g.beginPath(); g.moveTo(x, y); g.lineTo(x - DIR * l, y + 1); g.stroke(); } }
      const r = rng(31); for (let i = 0; i < 90 * SN().glint; i++) { const x = r() * W, y = hz + r() * (H - hz), tw = 0.5 + 0.5 * Math.sin(t * 3 + i); g.fillStyle = 'rgba(255,255,255,' + 0.7 * sn * tw * r() + ')'; g.fillRect(x, y, 1.2, 1.2); }
    }
    drawShadow(g, w, ws, top);
    g.restore();
  }

  // --- the car: snow on its roof, bonnet and wing (a soft lumpy layer), frosted windows, snow packed round the wheels, standing in snow ---
  function drawCar(t, ws) {
    const g = E.gCar, c = R.car; g.clearRect(0, 0, c.w, c.h + 14);
    E.car.style.filter = 'brightness(' + E._cb + ') saturate(' + E._cs + ')';
    const sn = ws.snow; if (sn < 0.01) return;
    g.globalAlpha = Math.min(1, sn * 1.3); g.drawImage(E.carFrost, 0, 14, c.w, c.h); g.globalAlpha = 1;
    const k = 1 / dpr, pts = carCont.filter(Boolean), S = SN(), th = (p) => (1.5 + 9 * (0.7 + 0.3 * noise(p.x / (16 * dpr)) + 0.18 * S.lumpK * noise(p.x / (4 * dpr) + 7))) * sn * p.flat * S.capK * (S.wind > 50 ? 0.55 + 0.9 * (DIR > 0 ? p.x / (R.car.w * dpr) : 1 - p.x / (R.car.w * dpr)) : 1);
    g.save(); g.translate(0, 14);
    let run = [];
    const flush = () => {
      if (run.length > 2) {
        const top = run.map(p => [p.x * k, p.y * k - th(p)]), bot = run.map(p => [p.x * k, p.y * k + 1.2 + 1.6 * sn * noise(p.x / (6 * dpr) + 2)]);
        const gr = g.createLinearGradient(0, Math.min(...top.map(q => q[1])), 0, Math.max(...bot.map(q => q[1])));
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#eef3fa'); gr.addColorStop(1, '#b9c9df');
        g.fillStyle = gr; g.shadowColor = 'rgba(20,40,80,.4)'; g.shadowBlur = 3; g.shadowOffsetY = 1.2;
        g.beginPath(); top.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]); g.closePath(); g.fill();
        g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 0.8; g.beginPath(); top.forEach(([x, y], i) => i ? g.lineTo(x, y + 0.6) : g.moveTo(x, y + 0.6)); g.stroke();
        g.strokeStyle = 'rgba(110,140,190,.45)'; g.lineWidth = 0.9; g.beginPath(); bot.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      }
      run = [];
    };
    for (const p of pts) {
      const q = run[run.length - 1], cont = q && Math.abs(p.y - q.y) < 2.5 * dpr && p.x - q.x < 3;
      if (p.flat > 0.3 && (!q || cont)) run.push(p); else { flush(); if (p.flat > 0.3) run.push(p); }
    }
    flush();
    // the car stands in the snow: a bank over the bottoms of the tyres and under the body
    const gb = g.createLinearGradient(0, c.h - 18, 0, c.h + 2); gb.addColorStop(0, '#ffffff'); gb.addColorStop(0.6, '#e2eaf5'); gb.addColorStop(1, '#bccbe0');
    g.fillStyle = gb; g.shadowBlur = 4; g.shadowOffsetY = -1; g.shadowColor = 'rgba(30,50,90,.3)';
    g.beginPath(); g.moveTo(-6, c.h + 2);
    for (let x = -6; x <= c.w + 6; x += 2) { const e = Math.min(1, (x + 6) / 40, (c.w + 6 - x) / 40); g.lineTo(x, c.h + 1 - (9 + 5 * noise(x / 14 + 3) + 2 * noise(x / 3.5)) * sn * e); }
    g.lineTo(c.w + 6, c.h + 2); g.closePath(); g.fill();
    g.restore();
    glints(g, pts.filter((p, i) => i % 23 === 0 && p.flat > 0.5).map(p => [p.x * k, p.y * k + 14 - th(p) + 1]), t, sn * S.glint, 5);
  }
  // little sparkles that come and go
  function glints(g, pts, t, a, seed) {
    const r = rng(seed); g.save(); g.strokeStyle = '#fff'; g.lineCap = 'round';
    for (const [x, y] of pts) {
      const ph = r() * 7, f = Math.max(0, Math.sin(t * 2.2 + ph)); if (f < 0.55) continue;
      const s = (f - 0.55) * 8 * a; g.globalAlpha = Math.min(1, f * a); g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke();
    }
    g.restore();
  }

  // --- the sign: drops, drips and a wet sheen; frost on its edges in the snow ---
  function drawSign(t, ws) {
    const g = E.gSign, s = R.sign; g.clearRect(0, 0, s.w, s.h);
    if (E.signWear) g.drawImage(E.signWear, 0, 0, s.w, s.h);
    const wet = Math.min(1, ws.rain + ws.storm + 0.6 * ws.change);
    if (wet > 0.01) {
      const sh = g.createLinearGradient(0, 0, 0, s.h); sh.addColorStop(0, 'rgba(255,255,255,' + 0.2 * wet + ')'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, s.w, s.h);
      const r = rng(53);
      for (let i = 0; i < 70; i++) {
        const x = r() * s.w, y = r() * s.h, rad = 0.9 + r() * 2.2, thr = r(); if (wet < thr) continue;
        g.fillStyle = 'rgba(0,10,40,.28)'; g.beginPath(); g.arc(x + 0.4, y + 0.8, rad, 0, 7); g.fill();
        g.fillStyle = 'rgba(200,225,255,.35)'; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.32, 0, 7); g.fill();
      }
      for (let i = 0; i < 7; i++) {
        const x = 20 + r() * (s.w - 40), v = 6 + r() * 10, len = 10 + r() * 18, y = ((r() * s.h + v * t) % (s.h + len)) - 4, thr = r(); if (wet < thr) continue;
        const gr = g.createLinearGradient(0, y - len, 0, y); gr.addColorStop(0, 'rgba(210,230,255,0)'); gr.addColorStop(1, 'rgba(225,240,255,.5)');
        g.strokeStyle = gr; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y - len); g.lineTo(x, y); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill();
      }
    }
    const sn = ws.snow;
    if (sn > 0.01) {
      const S = SN(); g.globalAlpha = Math.min(1, sn * S.signK); g.drawImage(E.signSnow, 0, 0, s.w, s.h); if (S.signK > 1) { g.globalAlpha = sn * (S.signK - 1); g.drawImage(E.signSnow, 6 * DIR, 2, s.w, s.h); }
      g.globalAlpha = Math.min(1, sn * S.frost); g.drawImage(E.signFrost, 0, 0, s.w, s.h); g.globalAlpha = 1;
      const fr = g.createLinearGradient(0, 0, 0, s.h); fr.addColorStop(0, 'rgba(230,240,255,' + 0.22 * sn + ')'); fr.addColorStop(0.35, 'rgba(230,240,255,0)'); g.fillStyle = fr; g.fillRect(0, 0, s.w, s.h);
    }
  }

  // --- the buttons and panels: drops, splashes on their tops, snow on their tops ---
  function cap(g, x0, x1, y, h0, seed, sn, t) {
    const S = SN(), wind = S.wind > 50, ov1 = wind && DIR < 0 ? 7 : 2.5, ov2 = wind && DIR > 0 ? 7 : 2.5, over = ov1, top = [], lip = [];
    for (let x = x0 - over; x <= x1 + ov2 + 0.1; x += 1.5) {
      const e = Math.min(1, (x - x0 + over) / (wind && DIR < 0 ? 4 : 10), (x1 + ov2 - x) / (wind && DIR > 0 ? 4 : 10)), u = Math.min(1, Math.max(0, (x - x0) / (x1 - x0))), sk = wind ? 0.45 + 0.95 * (DIR > 0 ? u : 1 - u) : 1;
      const hh = h0 * S.capK * sn * sk * (0.6 + 0.32 * noise(x / 13 + seed) + 0.22 * S.lumpK * noise(x / 4.2 + seed * 3)) * Math.sqrt(Math.max(0, e));
      top.push([x, y - hh]);
    }
    for (let x = x1 + ov2; x >= x0 - over - 0.1; x -= 3) lip.push([x, y + 1.5 + 2.4 * sn * noise(x / 6 + seed + 9) * Math.min(1, (x - x0 + over) / 6, (x1 + ov2 - x) / 6) + (wind && x > x1 ? (x - x1) * 0.5 : 0) + (wind && x < x0 ? (x0 - x) * 0.5 : 0)]);
    const gr = g.createLinearGradient(0, y - h0 * 1.2, 0, y + 4); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#eaf0f8'); gr.addColorStop(1, '#bfcde2');
    g.fillStyle = gr; g.shadowColor = 'rgba(25,45,85,.45)'; g.shadowBlur = 3; g.shadowOffsetY = 1.5;
    g.beginPath(); top.forEach(([x, yy], i) => i ? g.lineTo(x, yy) : g.moveTo(x, yy)); lip.forEach(([x, yy]) => g.lineTo(x, yy)); g.closePath(); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 0.8; g.beginPath(); top.forEach(([x, yy], i) => i ? g.lineTo(x, yy + 0.7) : g.moveTo(x, yy + 0.7)); g.stroke();
    g.strokeStyle = 'rgba(100,130,180,.4)'; g.lineWidth = 0.8; g.beginPath(); lip.forEach(([x, yy], i) => i ? g.lineTo(x, yy) : g.moveTo(x, yy)); g.stroke();
    glints(g, top.filter((q, i) => i % 11 === 3).map(([x, yy]) => [x, yy + 1.5]), t, sn * S.glint, seed * 13 | 0);
  }
  function drawUi(t, ws, w) {
    const g = E.gUi; g.clearRect(0, 0, R.W, R.H);
    const boxes = [R.row, ...R.nb, R.back, R.go, R.home, R.views, R.mg].filter(Boolean);
    const wet = Math.min(1, ws.rain + ws.storm + 0.6 * ws.change);
    if (wet > 0.01) {
      boxes.forEach((b, bi) => {
        const r = rng(100 + bi), n = Math.round(b.w * b.h / (b === R.row ? 900 : 420));
        for (let i = 0; i < n; i++) {
          const x = b.x + 4 + r() * (b.w - 8), y = b.y + 4 + r() * (b.h - 8), rad = 0.8 + r() * 2.3, thr = r(); if (wet < thr) continue;
          const a = Math.min(1, (wet - thr) * 5);
          g.fillStyle = 'rgba(0,8,30,' + 0.3 * a + ')'; g.beginPath(); g.arc(x + 0.4, y + 0.9, rad, 0, 7); g.fill();
          g.fillStyle = 'rgba(200,225,255,' + 0.22 * a + ')'; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
          g.fillStyle = 'rgba(255,255,255,' + 0.85 * a + ')'; g.beginPath(); g.arc(x - rad * 0.35, y - rad * 0.38, rad * 0.3, 0, 7); g.fill();
        }
      });
      // splashes on the tops of the sign, the panel and the buttons
      const rainy = Math.min(1.5, ws.rain + ws.storm * 1.6 + ws.change * 0.4), tops = [R.sign, R.row, ...R.nb, R.back, R.go].filter(Boolean);
      tops.forEach((b, bi) => {
        const r = rng(200 + bi);
        for (let i = 0; i < 9; i++) {
          const x = b.x + 8 + r() * (b.w - 16), per = 0.45 + r() * 0.6, off = r() * per, thr = r() * 1.4; if (rainy < thr) continue;
          const p = ((t + off) % per) / per; if (p > 0.3) continue;
          const q = p / 0.3, a = 0.7 * (1 - q);
          g.strokeStyle = 'rgba(210,230,255,' + a + ')'; g.lineWidth = 1;
          g.beginPath(); g.ellipse(x, b.y, 1 + q * 7, 1 + q * 2.2, 0, Math.PI, 0); g.stroke();
          g.fillStyle = 'rgba(220,235,255,' + a + ')'; for (const d of [-1, 1]) { g.beginPath(); g.arc(x + d * (2 + q * 6), b.y - 2 - q * 6 + q * q * 6, 0.9, 0, 7); g.fill(); }
        }
      });
    }
    const sn = ws.snow;
    if (sn > 0.01) {
      g.save();
      const caps = [[R.sign, 10], ...(R.plate ? [[R.plate, 7]] : []), [R.row, 8], ...R.nb.map(b => [b, 7.5]), [R.back, 6.5], [R.go, 7.5], [R.home, 6.5], [R.views, 5.5], [R.mg, 5.5]];
      caps.forEach(([b, h], i) => { if (b) cap(g, b.x + 2, b.r - 2, b.y + 1, h, i * 7.3 + 1, sn, t); });
      if (R.globe) { const b = R.globe, cx = b.x + b.w / 2, gr = g.createLinearGradient(0, b.y - 4, 0, b.y + 6); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#cbd8ea'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, b.y + 5, b.w * 0.32, 6.5 * sn, 0, Math.PI, 0); g.closePath(); g.fill(); }
      // icicles: under the sign (right of the car), the panel, the neighbour buttons and Race!
      const ic = Math.min(1, sn * 1.2);
      icicles(g, Math.max(R.sign.x + 6, R.carRightAtSign + 6), R.sign.r - 6, R.sign.b - 0.5, 16, 15, 301, ic, t);
      icicles(g, R.row.x + 14, R.row.r - 14, R.row.b - 0.5, 16, 9, 302, ic, t);
      R.nb.forEach((b, i) => icicles(g, b.x + 10, b.r - 10, b.b - 0.5, 7, 8, 303 + i, ic, t));
      icicles(g, R.go.x + 12, R.go.r - 12, R.go.b - 0.5, 9, 6, 306, ic, t);
      g.restore();
    }
  }

  // --- the air: rain, snow, the lightning's flash, the ripple of a tap on a weather icon ---
  function drawAir(t, w, fl) {
    const g = E.gAir, W = R.W, H = R.H; g.clearRect(0, 0, W, H);
    const rain = mix(w, 'rain'), rw = w.rain + w.change + w.storm, ang = rw > 0 ? (w.rain * 9 + w.change * 6 + w.storm * 24) / rw : 0, sa = Math.sin(ang * Math.PI / 180), ca = Math.cos(ang * Math.PI / 180);
    if (rain > 0.01) {
      const r = rng(3), n = Math.round(240 * rain);
      g.lineCap = 'round';
      for (let i = 0; i < 430; i++) {
        const x0 = r() * (W + 200) - 100, y0 = r() * H, v = 950 + r() * 600, len = (13 + r() * 17) * (1 + 0.5 * w.storm), a = 0.16 + r() * 0.26, d = r();
        if (i >= n) continue;
        const y = ((y0 + v * t) % (H + 60)) - 30, x = x0 + DIR * (y - y0) * sa / ca;
        g.strokeStyle = 'rgba(195,218,255,' + a + ')'; g.lineWidth = 0.8 + d * 0.9;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - DIR * len * sa, y - len * ca); g.stroke();
      }
    }
    const sn = mix(w, 'snow');
    if (sn > 0.01) {
      const wrap = (x) => ((x + 30) % (W + 60) + W + 60) % (W + 60) - 30;
      const S = SN();
      const fs = opt.snowStyle === 'blizzard' ? 0.9 : opt.snowStyle === 'sunny' ? 1 : 1.3;
      for (const [seed, n0, s0, s1, v0, v1, a0, soft] of [[5, 200, 0.5 * fs, 1.1 * fs, 16, 32, 0.6, 0], [6, 110, 1.2 * fs, 2.6 * fs, 34, 62, 0.85, 1], [7, 14, 5 * fs, 11 * fs, 75, 120, 0.2, 2]]) {
        const r = rng(seed), n = Math.round(n0 * S.flakes);
        for (let i = 0; i < n; i++) {
          const x0 = r() * (W + 60), y0 = r() * H, s = s0 + r() * (s1 - s0), v = (v0 + r() * (v1 - v0)) * S.speed, amp = 4 + r() * 14, fq = 0.4 + r() * 0.9, ph = r() * 7, al = a0 * (0.7 + 0.3 * r());
          if (i >= n * sn) continue;
          const vx = DIR * S.wind * (0.7 + 0.6 * (s - s0) / (s1 - s0 + 0.01)), y = ((y0 + v * t) % (H + 2 * s + 20)) - s - 10, x = wrap(x0 + Math.sin(t * fq + ph) * amp + vx * t);
          if (S.streak && soft < 2) { const k2 = 0.035; g.strokeStyle = 'rgba(255,255,255,' + al * 0.9 + ')'; g.lineWidth = s * 1.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - vx * k2, y - v * k2); g.stroke(); continue; }
          if (!soft) { g.fillStyle = 'rgba(255,255,255,' + al + ')'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); continue; }
          const gr = g.createRadialGradient(x, y, 0, x, y, s * (soft === 2 ? 1 : 1.25)); gr.addColorStop(0, 'rgba(255,255,255,' + al + ')'); gr.addColorStop(soft === 2 ? 0.25 : 0.5, 'rgba(255,255,255,' + al * 0.7 + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, s * 1.25, 0, 7); g.fill();
        }
      }
      if (S.diamond) {   // glitter: ice crystals hanging in the sunny air, flashing as they turn
        const r = rng(13);
        for (let i = 0; i < 130; i++) {
          const x = r() * W, y0 = r() * H, ph = r() * 7, y = (y0 + 6 * t) % H, f = Math.pow(Math.max(0, Math.sin(t * (2 + r() * 3) + ph)), 6), s = 0.6 + r() * 1.4;
          g.fillStyle = 'rgba(255,250,235,' + (0.25 + 0.75 * f) * sn + ')'; g.beginPath(); g.arc(x, y, s * (0.6 + f), 0, 7); g.fill();
          if (f > 0.6) { g.strokeStyle = 'rgba(255,255,255,' + f * sn + ')'; g.lineWidth = 0.6; const l = 2 + 5 * f; g.beginPath(); g.moveTo(x - l, y); g.lineTo(x + l, y); g.moveTo(x, y - l); g.lineTo(x, y + l); g.stroke(); }
        }
      }
      if (S.white) { g.fillStyle = 'rgba(226,236,250,' + 0.08 * sn + ')'; g.fillRect(0, 0, W, H); }
      const r = rng(9); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineCap = 'round';
      for (let i = 0; i < S.crystals; i++) {
        const x0 = r() * (W + 60), y0 = r() * H, s = 3.2 + r() * 3.4, v = 40 + r() * 30, ph = r() * 7, rot = ph + t * (0.6 + r());
        if (i >= S.crystals * sn) continue;
        const y = ((y0 + v * S.speed * t) % (H + 20)) - 10, x = wrap(x0 + Math.sin(t * 0.7 + ph) * 10 + DIR * S.wind * t);
        g.lineWidth = 0.8; g.beginPath();
        for (let a = 0; a < 6; a++) {
          const an = rot + a * Math.PI / 3, cx = Math.cos(an), sy = Math.sin(an);
          g.moveTo(x, y); g.lineTo(x + cx * s, y + sy * s);
          for (const f of [0.45, 0.72]) { const bx = x + cx * s * f, by = y + sy * s * f, bl = s * 0.28; for (const sd of [-1, 1]) { const ba = an + sd * 0.8; g.moveTo(bx, by); g.lineTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl); } }
        }
        g.stroke();
      }
    }
    if (fl > 0.01 && w.storm > 0.01) { g.fillStyle = 'rgba(205,220,255,' + 0.2 * fl * w.storm + ')'; g.fillRect(0, 0, W, H); }
    // the tap
    const C = window.WXC;
    for (const e of tl) {
      const p = (t - e.t) / 0.55; if (p < 0 || p > 1 || !C || e.t < 0) continue;
      const b = (R.wxs || [])[KEYS.indexOf(e.k)]; if (!b) continue;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      g.strokeStyle = 'rgba(255,214,90,' + (0.85 * (1 - p)) + ')'; g.lineWidth = 3 * (1 - p) + 1; g.beginPath(); g.arc(cx, cy, 12 + p * 34, 0, 7); g.stroke();
      g.fillStyle = 'rgba(255,255,255,' + (0.35 * (1 - p)) + ')'; g.beginPath(); g.arc(cx, cy, 14 * (1 - p * 0.5), 0, 7); g.fill();
    }
  }

  // one moment: the weathers' mix, then every layer
  function frame(t, o) {
    if (o) Object.assign(opt, o);
    const cur = current(t); setSel(KEYS.indexOf(cur.k));
    const w = weights(t, FAST), ws = weights(t, SLOW), fl = flash(t);
    if (ws.snow > 0 || w.snow > 0) snowReady();
    const f = (key) => mix(w, key);
    if (E.snowStage) E.snowStage.style.filter = 'brightness(' + (1 + (SN().picB - 1) * ws.snow).toFixed(3) + ')';
    E.img.style.filter = 'brightness(' + (f('b') + 0.5 * fl * w.storm).toFixed(3) + ') saturate(' + f('s').toFixed(3) + ') contrast(' + f('c').toFixed(3) + ') grayscale(' + mix(ws, 'g').toFixed(3) + ')';
    E.tint.style.opacity = f('ti'); if (E.snowStage) E.snowStage.style.opacity = E.snowStage.ready ? ws.snow.toFixed(3) : 0; E.clouds.style.opacity = Math.max(0, f('cl') - 0.6 * fl * w.storm); E.warm.style.opacity = Math.max(f('wa'), w.snow * SN().sun); E.white.style.opacity = mix(ws, 'sw') + ws.snow * SN().white;
    E._cb = (f('cb') + 0.35 * fl * w.storm).toFixed(3); E._cs = f('cs').toFixed(3);
    if (E.flow) E.flow.style.filter = 'brightness(' + (1 + 0.6 * w.storm - 0.15 * ws.snow).toFixed(2) + ')';
    drawStage(t, w, ws, fl); drawRoom(t, w, ws); drawCar(t, ws); drawSign(t, ws); drawUi(t, ws, w); drawAir(t, w, fl);
    return { k: cur.k, w, fl };
  }

  return { init, frame, setTimeline: (x) => { tl = x; sel = -1; }, tap: (k, t) => { tl.push({ t, k }); }, signLook, SIGNS, KEYS, _E: () => E };
})();
