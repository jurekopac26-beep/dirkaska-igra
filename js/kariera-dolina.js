/* Career 1.0, the valley (Atlas, docs/kariera-1-0.md; the user's decision of 22. 11. 2026): a map of the menu, not a race camera. A 3D
   valley, the road climbing it in bends from the lake to the summit; the events as pins along the road (5 stages, a gate before each), the
   final at the summit. A tap: the event's card (its tracks, stars, coins; Race!); back from an event: its result; the stars: the stages'
   progress. window.MenuDolina = { open(o), close(now), back(), isOpen(), root(), _R() } (js/menu.js dolina()); nothing at load. About 10
   draw calls and under 60 thousand vertices (the limits: ~300, ~900 thousand); drawn only while something moves */
(function () {
  'use strict';
  const calmQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null, calm = () => !!(calmQ && calmQ.matches);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const D2R = Math.PI / 180;

  /* ---- the words (the menu: English only) ---- */
  const KIND = { pokal: 'Cup', finale: 'Final', razred: 'Class cup', dirka: 'Race', dvoboj: 'Duel', kronometer: 'Time trial' };
  const DIFF = ['Easy', 'Medium', 'Hard', 'Super hard'];
  const CAT = { mali: 'Small cars', sportni: 'Sports cars', super: 'Supercars', klasika: 'Classics', reli: 'Rally', teren: 'Off-road', dirkalni: 'Racing',
    tovornjaki: 'Trucks', elektricni: 'Electric', posebni: 'Specials' };
  const MEDAL = ['Gold', 'Silver', 'Bronze'];
  const ZV = () => (window.Kariera && Kariera.ZVEZDICE) || { pokal: [3, 2, 1] };
  const enName = (x) => (x && x.en && (x.en.name || (typeof x.en === 'string' ? x.en : ''))) || (x && x.name) || '';
  function trackName(id) {   // (a track's place, without its country)
    const d = ((typeof Core !== 'undefined' && Core.TRACKS) || []).find(t => t.id === id); if (!d) return String(id);   // (Core: a script's const, not on window)
    const n = (d.en && d.en.name) || d.name || String(id), k = n.lastIndexOf(', ');
    return k > 0 ? n.slice(0, k) : n;
  }
  // the stars by the place (Kariera.ZVEZDICE): 'P1 ★★★ · P2–3 ★★ · P4–6 ★'; a time trial's by the medal, a duel's the win
  function pravilo(x) {
    const t = ZV()[x.kind] || ZV().pokal, out = [];
    if (x.kind === 'kronometer') return t.map((z, i) => MEDAL[i] + ' ' + '★'.repeat(z)).join(' · ');
    if (x.kind === 'dvoboj') return 'Win the duel ' + '★'.repeat(t[0] || 3);
    for (let i = 0; i < t.length;) { let j = i; while (j + 1 < t.length && t[j + 1] === t[i]) j++; out.push('P' + (i + 1) + (j > i ? '–' + (j + 1) : '') + ' ' + '★'.repeat(t[i])); i = j + 1; }
    return out.join(' · ');
  }
  const najbolje = (x) => (!(x.best >= 1) ? '' : x.kind === 'kronometer' ? MEDAL[x.best - 1] || 'No medal' : 'P' + x.best);

  const I_BACK = '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M14 4 7 11l7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const I_X = '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M5 5l12 12M17 5 5 17" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
  const I_LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
  const I_COIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#ffc629"/><circle cx="12" cy="12" r="7" fill="none" stroke="#b07d00" stroke-width="1.6"/><path d="M12 7.6l1.3 2.7 2.9.4-2.1 2 .5 2.9L12 14.3l-2.6 1.3.5-2.9-2.1-2 2.9-.4z" fill="#b07d00"/></svg>';
  const I_KIND = {
    pokal: '<path d="M6 3h12v4a6 6 0 0 1-5 5.9V16h3v3H8v-3h3v-3.1A6 6 0 0 1 6 7z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    finale: '<path d="M5 2h2.2v20H5z"/><path d="M8.5 3H20l-3 4.5L20 12H8.5z"/>',
    razred: '<path d="M5 11l2-5h10l2 5h1a1 1 0 0 1 1 1v5h-2.2a2.5 2.5 0 0 1-4.6 0H9.8a2.5 2.5 0 0 1-4.6 0H3v-5a1 1 0 0 1 1-1zm2.3 0h9.4l-1.3-3.2H8.6z"/>',
    dirka: '<path d="M2 5h5l6 7-6 7H2l6-7zm9 0h5l6 7-6 7h-5l6-7z"/>',
    dvoboj: '<path d="M1.5 6h5l5 6-5 6h-5l5-6zm21 0h-5l-5 6 5 6h5l-5-6z"/>',
    kronometer: '<circle cx="12" cy="13.5" r="7.3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M10 2h4v2.6h-4zM11 9h2v5.2h-2z"/>',
  };
  const ikona = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' + (I_KIND[k] || I_KIND.pokal) + '</svg>';
  const zvezde = (n, cls) => '<span class="dol-z' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + [0, 1, 2].map(i => '<u' + (i < n ? ' class="on"' : '') + '></u>').join('') + '</span>';

  /* ---- the valley (made up: no real place). x across, z along (the summit at -z), y up ---- */
  const HW = 1.6;   // (the road's half width)
  const CP = [[4, 46], [8, 34], [6, 22], [-7, 10], [7, -2], [-8, -14], [8, -26], [-8, -38], [9, -50], [-9, -62], [9, -74], [-9, -86], [9, -98], [-9, -110],
    [9, -122], [-8, -134], [8, -146], [-4, -156], [2, -166]];
  const LAKE = { x: -14, z: 24, r: 5 };
  const PEAKS = [[-36, -178, 34, 15], [0, -200, 46, 20], [38, -184, 38, 16], [-66, -150, 28, 18], [66, -146, 30, 18], [20, -214, 30, 14], [-22, -222, 28, 14]];
  const NX = 120, NZ = 168, X0 = -150, X1 = 150, Z0 = -240, Z1 = 95, N = 240;   // (the ground's grid; the road's samples)
  const CAM_UP = 24, CAM_BACK = 38, LOOK = 8, CAM_D = Math.hypot(CAM_UP, CAM_BACK + LOOK), CAM_SIN = CAM_UP / CAM_D;
  const GOLD = [1, .78, .16], STEEL = [.48, .53, .6], ASPH = [.3, .32, .36], EDGE_OFF = [.78, .82, .88];
  const PIN = { zaklenjen: [.5, .55, .63], odprt: [.96, .97, 1], osvojen: GOLD };

  function hash(i, j) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { let s = 0, a = .5, f = 1; for (let k = 0; k < 4; k++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s / .9375; }
  function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // the valley without the road: the floor rising to the summit, the walls (rough), the peaks behind
  function base(x, z) {
    const t = clamp((50 - z) / 220, 0, 1), d = Math.abs(x - 6 * Math.sin(z * .02)), w = lerp(48, 26, t), m = step(.35 * w, 1.3 * w, d);
    let y = 44 * Math.pow(t, 1.5) + (30 + 25 * t) * m + (fbm(x * .045, z * .045) - .5) * (3 + 22 * m) + (fbm(x * .018 + 7.3, z * .018 - 2.1) - .5) * 26 * m;
    for (const p of PEAKS) { const dx = x - p[0], dz = z - p[1]; y += p[2] * Math.exp(-(dx * dx + dz * dz) / (2 * p[3] * p[3])); }
    return y;
  }
  let WY = null;   // (the lake's level: under the lowest of its shore)
  function lakeY() {
    if (WY !== null) return WY;
    let m = 1e9;
    for (let a = 0; a < 24; a++) for (let rr = LAKE.r + 1; rr <= LAKE.r + 7; rr++) m = Math.min(m, base(LAKE.x + Math.cos(a * Math.PI / 12) * rr, LAKE.z + Math.sin(a * Math.PI / 12) * rr));
    return (WY = m - .4);
  }
  function lake(x, z, y) {
    const r = Math.hypot(x - LAKE.x, z - LAKE.z); if (r >= LAKE.r + 7) return y;
    const w = lakeY();
    return r < LAKE.r ? w - .3 - 1.8 * (1 - step(0, LAKE.r, r)) : lerp(w - .3, y, step(LAKE.r, LAKE.r + 7, r));
  }
  // the road: its points (even along it), heights (the ground's, smoothed), the camera's line (the bends averaged)
  function makeRoad(T3) {
    const curve = new T3.CatmullRomCurve3(CP.map(([x, z]) => new T3.Vector3(x, 0, z)), false, 'centripetal');
    const p = curve.getSpacedPoints(N), y = new Float32Array(N + 1), S = new Float32Array((N + 1) * 3);
    for (let i = 0; i <= N; i++) y[i] = lake(p[i].x, p[i].z, base(p[i].x, p[i].z));
    for (let it = 0; it < 24; it++) { const c = y.slice(); for (let i = 1; i < N; i++) y[i] = (c[i - 1] + 2 * c[i] + c[i + 1]) / 4; }
    for (let i = 0; i <= N; i++) {
      let sx = 0, sy = 0, sz = 0, c = 0;
      for (let j = Math.max(0, i - 14); j <= Math.min(N, i + 14); j++) { sx += p[j].x; sy += y[j]; sz += p[j].z; c++; }
      S[i * 3] = sx / c; S[i * 3 + 1] = sy / c; S[i * 3 + 2] = sz / c;
    }
    return { p, y, S, zspan: Math.max(1, S[2] - S[N * 3 + 2]) };
  }
  function at(road, u) {
    const f = clamp(u, 0, 1) * N, i = Math.min(N - 1, f | 0), t = f - i, a = road.p[i], b = road.p[i + 1];
    return { x: lerp(a.x, b.x, t), y: lerp(road.y[i], road.y[i + 1], t), z: lerp(a.z, b.z, t), tx: b.x - a.x, tz: b.z - a.z };
  }
  function focus(u) {
    const S = R.road.S, f = clamp(u, 0, 1) * N, i = Math.min(N - 1, f | 0), t = f - i;
    return { x: lerp(S[i * 3], S[i * 3 + 3], t), y: lerp(S[i * 3 + 1], S[i * 3 + 4], t), z: lerp(S[i * 3 + 2], S[i * 3 + 5], t) };
  }
  // the ground: heights (the lake, the road's shelf), colours by height and slope (meadow, forest, alpine grass, rock, snow; the verge, the shore)
  function makeGround(T3, road) {
    const cols = NX + 1, nv = cols * (NZ + 1), pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), dist = new Float32Array(nv).fill(1e9), rh = new Float32Array(nv);
    const dx = (X1 - X0) / NX, dz = (Z1 - Z0) / NZ, M = HW + 11;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i, x = X0 + dx * i, z = Z0 + dz * j;
      pos[k * 3] = x; pos[k * 3 + 1] = lake(x, z, base(x, z)); pos[k * 3 + 2] = z;
    }
    for (let s = 0; s < N; s++) {   // (each vertex near the road: the height of the road's nearest point, a segment at a time over its box)
      const a = road.p[s], b = road.p[s + 1], ex = b.x - a.x, ez = b.z - a.z, ll = ex * ex + ez * ez || 1;
      const i0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - M - X0) / dx)), i1 = Math.min(NX, Math.ceil((Math.max(a.x, b.x) + M - X0) / dx));
      const j0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - M - Z0) / dz)), j1 = Math.min(NZ, Math.ceil((Math.max(a.z, b.z) + M - Z0) / dz));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const k = j * cols + i, px = pos[k * 3] - a.x, pz = pos[k * 3 + 2] - a.z, t = clamp((px * ex + pz * ez) / ll, 0, 1), qx = px - ex * t, qz = pz - ez * t, d = Math.sqrt(qx * qx + qz * qz);
        if (d < dist[k]) { dist[k] = d; rh[k] = lerp(road.y[s], road.y[s + 1], t); }
      }
    }
    for (let k = 0; k < nv; k++) if (dist[k] < M) pos[k * 3 + 1] = lerp(rh[k] - .15, pos[k * 3 + 1], step(HW + 3.4, M, dist[k]));   // (flat under the road and a cell beyond)
    const idx = [];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const nrm = g.attributes.normal.array, wy = lakeY();
    for (let k = 0; k < nv; k++) {
      const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2], s = 1 - nrm[k * 3 + 1], n = fbm(x * .11 + 3.1, z * .11 - 1.7);
      let r = lerp(.42, .55, n), gg = lerp(.66, .77, n), b = lerp(.29, .36, n);
      const mix = (c, a) => { r = lerp(r, c[0], a); gg = lerp(gg, c[1], a); b = lerp(b, c[2], a); };
      mix([.6, .63, .37], step(16, 34, y + (n - .5) * 8));                                                              // (alpine grass)
      mix([.24, .45, .22], step(.5, .7, fbm(x * .06 - 4, z * .06 + 9)) * (1 - step(28, 40, y)) * step(.06, .18, s));   // (forest on the slopes)
      mix([.47 + .12 * n, .45 + .1 * n, .42 + .08 * n], Math.max(step(.32, .52, s), step(46, 60, y) * .7));            // (rock)
      mix([.95, .97, .99], step(54, 66, y + (n - .5) * 10) * (1 - step(.5, .72, s)));                                   // (snow)
      mix([.56, .51, .41], .6 * (1 - step(HW + .6, HW + 2.4, dist[k])));                                               // (the verge)
      const lr = Math.hypot(x - LAKE.x, z - LAKE.z); if (lr < LAKE.r + 7 && y < wy + .7) mix([.85, .79, .6], .85);     // (the shore)
      col[k * 3] = r; col[k * 3 + 1] = gg; col[k * 3 + 2] = b;
    }
    g.setAttribute('color', new T3.BufferAttribute(col, 3));
    const near = (x, z) => Math.round(clamp((z - Z0) / dz, 0, NZ)) * cols + Math.round(clamp((x - X0) / dx, 0, NX));
    const hAt = (x, z) => {
      const fi = clamp((x - X0) / dx, 0, NX - 1e-6), fj = clamp((z - Z0) / dz, 0, NZ - 1e-6), i = fi | 0, j = fj | 0, u = fi - i, v = fj - j, k = j * cols + i;
      return lerp(lerp(pos[k * 3 + 1], pos[k * 3 + 4], u), lerp(pos[(k + cols) * 3 + 1], pos[(k + cols) * 3 + 4], u), v);
    };
    return { g, dist, nrm, near, hAt, nv };
  }
  // the road's ribbon: asphalt, its edges gold as far as the furthest open event, pale beyond
  function makeRibbon(T3, road, uOpen) {
    const OFF = [-1, -.82, -.8, .8, .82, 1], nc = OFF.length, nv = (N + 1) * nc, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), idx = [];
    for (let i = 0; i <= N; i++) {
      const a = road.p[Math.max(0, i - 1)], b = road.p[Math.min(N, i + 1)], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, open = i / N <= uOpen + 1e-6;
      for (let c = 0; c < nc; c++) {
        const k = i * nc + c, o = OFF[c] * HW, cc = c === 2 || c === 3 ? ASPH : open ? GOLD : EDGE_OFF;
        pos[k * 3] = road.p[i].x + nx * o; pos[k * 3 + 1] = road.y[i] + .12; pos[k * 3 + 2] = road.p[i].z + nz * o;
        col[k * 3] = cc[0]; col[k * 3 + 1] = cc[1]; col[k * 3 + 2] = cc[2]; nrm[k * 3 + 1] = 1;
      }
    }
    for (let i = 0; i < N; i++) for (let c = 0; c < nc - 1; c++) { const a = i * nc + c, b = a + 1, d = a + nc, e = d + 1; idx.push(a, b, d, b, e, d); }
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3)); g.setAttribute('normal', new T3.BufferAttribute(nrm, 3)); g.setIndex(idx);
    return g;
  }
  // the events' places: a gate before each stage, the events along the road in their order, the final at the summit
  function layout(v) {
    const st = (v.atlas && v.atlas.stopnje) || [], slots = [];
    let fin = null;
    for (const s of st) {
      slots.push({ gate: s });
      for (const x of (s.dogodki || s.pokali || [])) { if (x.kind === 'finale' && !fin) { fin = x; continue; } slots.push({ ev: x }); }
    }
    const n = slots.length, U0 = .012, U1 = fin ? .94 : .985;
    slots.forEach((sl, k) => { sl.u = n > 1 ? U0 + (U1 - U0) * k / (n - 1) : U0; });
    if (fin) slots.push({ ev: fin, u: .985, fin: true });
    return slots;
  }

  /* ---- the state ---- */
  let el = null, R = null, o = null, W = 1, H = 1, SIDE = false, FOV = 50;

  function measure() {
    W = Math.max(1, el.clientWidth); H = Math.max(1, el.clientHeight); SIDE = W > H; FOV = SIDE ? 42 : 50;
    el.classList.toggle('side', SIDE);
    if (R && R.road) { const vis = 2 * CAM_D * Math.tan(FOV / 2 * D2R); R.ku = vis / CAM_SIN / R.road.zspan; R.kl = vis * (W / H) / 10; }   // (a drag: the ground follows the finger)
    if (R) { const t = el.querySelector('.dol-stars'); R.topZ = t ? t.getBoundingClientRect().bottom - el.getBoundingClientRect().top + 34 : 100; }   // (the badges fade out under the head)
  }
  function aim(e, oo) {   // (the circle it opens from and closes into: the career's strip)
    const f = oo && (typeof oo.from === 'function' ? oo.from() : oo.from), h = oo && oo.root, hb = h && (h.getBoundingClientRect ? h : h.host);
    const rr = (hb || e).getBoundingClientRect(), g = f && f.isConnected ? f.getBoundingClientRect() : null;
    if (g && g.width) { e.style.setProperty('--zx', (g.left + g.width / 2 - rr.left).toFixed(1) + 'px'); e.style.setProperty('--zy', (g.top + g.height / 2 - rr.top).toFixed(1) + 'px'); e.style.setProperty('--zr', (Math.min(g.width, g.height) / 2).toFixed(1) + 'px'); }
    e.style.setProperty('--zR', Math.ceil(Math.hypot(rr.width, rr.height) + 40) + 'px');
  }

  function build(T3) {
    const v = o.view, a = v.atlas, st = a.stopnje || [];
    const e = el = document.createElement('div');
    e.className = 'dol'; e.setAttribute('role', 'dialog'); e.setAttribute('aria-modal', 'true'); e.setAttribute('aria-label', 'Career: the valley');
    e.innerHTML = '<canvas aria-hidden="true"></canvas><div class="dol-pins"></div><div class="dol-ui">' +
      '<button type="button" class="zem-sq zem-back dol-back" data-close aria-label="Back">' + I_BACK + '</button>' +
      '<div class="dol-title"><b>CAREER</b><small></small></div>' +
      '<button type="button" class="dol-stars" data-nap aria-label="The stars: ' + (a.zvezdice | 0) + ' of ' + (a.max | 0) + '"><i>★</i>' + (a.zvezdice | 0) + '<small>/ ' + (a.max | 0) + '</small></button>' +
      '<div class="dol-rail" role="group" aria-label="Stages">' + st.map(s => '<button type="button" data-st="' + s.n + '" class="' + (s.odprta ? '' : 'off') + '" aria-label="Stage ' + s.n + ': ' + esc(enName(s)) + (s.odprta ? '' : ', locked') + '">' + (s.odprta ? s.n : I_LOCK) + '</button>').join('') + '</div>' +
      '<div class="dol-hint">Drag to move · tap an event</div>' +
      '<div class="dol-card" role="region" aria-label="Event"></div></div>';
    o.root.appendChild(e);
    const cv = e.querySelector('canvas');
    R = { cv, u: 0, lat: 0, vu: 0, vl: 0, off: 0, offT: 0, sel: null, over: null, fly: null, drag: null, raf: 0, last: 0, frames: 0, cur: 0, verts: 0, v3: new T3.Vector3() };
    const r = R.r = new T3.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setClearColor(0x000000, 0);
    const scene = R.scene = new T3.Scene(); scene.fog = new T3.Fog(0xd4e9f7, 70, 290);
    scene.add(new T3.HemisphereLight(0xe8f1ff, 0x5d6b4a, .62));
    const sun = new T3.DirectionalLight(0xfff4e0, .55); sun.position.set(-60, 90, 40); scene.add(sun);
    const road = R.road = makeRoad(T3);
    measure(); r.setSize(W, H, false);
    R.cam = new T3.PerspectiveCamera(FOV, W / H, .5, 700);
    const add = (mesh, count) => { scene.add(mesh); R.verts += mesh.geometry.attributes.position.count * (count == null ? 1 : count); return mesh; };

    // the places; the furthest open event (the road's gold up to it)
    const slots = R.slots = layout(v), m4 = new T3.Matrix4(), q = new T3.Quaternion(), up = new T3.Vector3(0, 1, 0), p3 = new T3.Vector3(), sc = new T3.Vector3(), cl = new T3.Color();
    R.evs = []; R.gates = []; R.byId = {};
    let uOpen = 0;
    for (const sl of slots) {
      sl.p = at(road, sl.u);
      if (sl.ev) { R.evs.push(sl); R.byId[sl.ev.id] = sl; if (sl.ev.stanje !== 'zaklenjen') uOpen = Math.max(uOpen, sl.u); } else R.gates.push(sl);
    }
    const ground = makeGround(T3, road);
    add(new T3.Mesh(ground.g, new T3.MeshLambertMaterial({ vertexColors: true })));
    const water = new T3.CircleGeometry(LAKE.r + 6, 40); water.rotateX(-Math.PI / 2);
    add(new T3.Mesh(water, new T3.MeshLambertMaterial({ color: 0x5aa7d8 }))).position.set(LAKE.x, lakeY() + .02, LAKE.z);
    add(new T3.Mesh(makeRibbon(T3, road, uOpen), new T3.MeshLambertMaterial({ vertexColors: true })));
    const inst = (geo, n, mat) => { const mm = new T3.InstancedMesh(geo, mat || new T3.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, n)); mm.frustumCulled = false; return mm; };   // (r128 culls an instanced mesh by its first shape: off)

    // the trees (in patches, off the road, the lake, the rock and the snow) and the rocks (on the steep)
    const rnd = rng(7), tg = new T3.ConeGeometry(1, 1, 7); tg.translate(0, .5, 0);
    const trees = inst(tg, 380);
    let n = 0;
    for (let t = 0; n < 380 && t < 9000; t++) {
      const x = lerp(-78, 78, rnd()), z = lerp(-182, 90, rnd()), k = ground.near(x, z);
      if (ground.dist[k] < HW + 4.5 || Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 2.5) continue;
      const y = ground.hAt(x, z), s = 1 - ground.nrm[k * 3 + 1];
      if (y > 46 || s > .42 || rnd() > .18 + .95 * fbm(x * .06 - 4, z * .06 + 9)) continue;
      const h = lerp(2.4, 4.8, rnd()), w = h * lerp(.3, .38, rnd());
      trees.setMatrixAt(n, m4.compose(p3.set(x, y - .3, z), q.identity(), sc.set(w, h, w)));
      trees.setColorAt(n, cl.setRGB(lerp(.15, .25, rnd()), lerp(.36, .5, rnd()), lerp(.17, .24, rnd()))); n++;
    }
    trees.count = n; add(trees, n);
    const rocks = inst(new T3.DodecahedronGeometry(1, 0), 90);
    n = 0;
    for (let t = 0; n < 90 && t < 6000; t++) {
      const x = lerp(-80, 80, rnd()), z = lerp(-190, 86, rnd()), k = ground.near(x, z), s = 1 - ground.nrm[k * 3 + 1];
      if (ground.dist[k] < HW + 3 || s < .2 || Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 2) continue;
      const g = lerp(.46, .62, rnd());
      rocks.setMatrixAt(n, m4.compose(p3.set(x, ground.hAt(x, z) - .2, z), q.setFromAxisAngle(up, rnd() * 6.28), sc.set(lerp(.9, 2.6, rnd()), lerp(.6, 1.6, rnd()), lerp(.9, 2.4, rnd()))));
      rocks.setColorAt(n, cl.setRGB(g, g * .97, g * .92)); n++;
    }
    rocks.count = n; add(rocks, n);

    // the gates (two posts and a beam: gold an open stage's, steel a locked one's), the pins (a base and a pole by the event's state)
    const gates = inst(new T3.BoxGeometry(1, 1, 1), R.gates.length * 3), GH = 4.4, GW = HW + .9;
    R.gates.forEach((sl, i) => {
      const l = Math.hypot(sl.p.tx, sl.p.tz) || 1, nx = -sl.p.tz / l, nz = sl.p.tx / l, c = sl.gate.odprta ? GOLD : STEEL;
      q.setFromAxisAngle(up, Math.atan2(-nz, nx));
      for (const sd of [-1, 1]) { gates.setMatrixAt(i * 3 + (sd + 1) / 2, m4.compose(p3.set(sl.p.x + nx * GW * sd, sl.p.y + GH / 2, sl.p.z + nz * GW * sd), q, sc.set(.45, GH, .45))); }
      gates.setMatrixAt(i * 3 + 2, m4.compose(p3.set(sl.p.x, sl.p.y + GH, sl.p.z), q, sc.set(GW * 2 + .45, .5, .45)));
      for (let j = 0; j < 3; j++) gates.setColorAt(i * 3 + j, cl.setRGB(c[0], c[1], c[2]));
      sl.n = sl.gate.n; sl.top = { x: sl.p.x, y: sl.p.y + GH + .6, z: sl.p.z };
    });
    gates.count = R.gates.length * 3; add(gates, gates.count);
    const bg = new T3.CylinderGeometry(1.15, 1.25, .3, 18), pg = new T3.CylinderGeometry(.1, .1, 1, 6); pg.translate(0, .5, 0);
    const bases = inst(bg, R.evs.length), poles = inst(pg, R.evs.length);
    R.evs.forEach((sl, i) => {
      const c = PIN[sl.ev.stanje] || PIN.odprt, ph = sl.fin ? 5 : 3;
      bases.setMatrixAt(i, m4.compose(p3.set(sl.p.x, sl.p.y + .27, sl.p.z), q.identity(), sc.set(1, 1, 1)));
      poles.setMatrixAt(i, m4.compose(p3.set(sl.p.x, sl.p.y + .3, sl.p.z), q.identity(), sc.set(1, ph, 1)));
      bases.setColorAt(i, cl.setRGB(c[0], c[1], c[2])); poles.setColorAt(i, cl.setRGB(c[0], c[1], c[2]));
      sl.top = { x: sl.p.x, y: sl.p.y + .3 + ph + .2, z: sl.p.z };
    });
    bases.count = poles.count = R.evs.length; add(bases, R.evs.length); add(poles, R.evs.length);
    const ring = new T3.TorusGeometry(1.75, .17, 8, 36); ring.rotateX(Math.PI / 2);
    R.ring = add(new T3.Mesh(ring, new T3.MeshBasicMaterial({ color: 0xfff1b8 }))); R.ring.visible = false;
    const fin = R.evs.find(sl => sl.fin);
    if (fin) {
      const fg = new T3.PlaneGeometry(2.2, 1.3); fg.translate(1.1, -.65, 0);
      add(new T3.Mesh(fg, new T3.MeshLambertMaterial({ color: 0xffc629, side: T3.DoubleSide }))).position.set(fin.p.x + .1, fin.top.y - .2, fin.p.z);
    }

    // the badges over the pins, the stages' names over the gates
    const pins = e.querySelector('.dol-pins');
    R.marks = []; R.badges = [];
    for (const sl of R.gates) {
      const s = sl.gate, d = document.createElement('div');
      d.className = 'dol-gate' + (s.odprta ? '' : ' off');
      d.innerHTML = (s.odprta ? '' : I_LOCK) + '<b>STAGE ' + s.n + '</b><span>' + esc(enName(s).toUpperCase()) + '</span><em>★ ' + (s.odprta ? s.zvezdice + '/' + s.max : s.prag) + '</em>';
      pins.appendChild(d); R.marks.push({ el: d, w: sl.top, big: 1 });
    }
    for (const sl of R.evs) {
      const x = sl.ev, b = document.createElement('button');
      b.type = 'button'; b.className = 'dol-ev ' + x.stanje + (sl.fin ? ' fin' : ''); b.dataset.ev = x.id;
      b.setAttribute('aria-label', (KIND[x.kind] || 'Event') + ': ' + enName(x) + (x.stanje === 'zaklenjen' ? ', locked' : ', ' + (x.zvezdice | 0) + ' of 3 stars'));
      b.innerHTML = zvezde(x.zvezdice | 0) + '<i>' + (x.stanje === 'zaklenjen' ? I_LOCK : ikona(x.kind)) + '</i>';
      pins.appendChild(b); const mk = { el: b, w: sl.top, big: sl.fin ? 1.15 : 1, id: x.id }; R.marks.push(mk); R.badges.push(mk);
    }

    // where it starts: the event just raced; else the first open one without a star; else the furthest open one
    const iz = o.izid && R.byId[o.izid.id] ? o.izid : null;
    const first = (iz && R.byId[iz.id]) || R.evs.find(sl => sl.ev.stanje === 'odprt') || R.evs.filter(sl => sl.ev.stanje !== 'zaklenjen').pop() || null;
    if (first) { R.u = first.u; R.lat = latFor(first); }

    // the input
    R.onDown = (ev) => {
      if (!R || ev.button > 0 || R.over) return;
      const t = ev.target;
      if (t && t.closest && t.closest('.dol-card, .dol-ui button, .dol-over')) return;
      const now = performance.now();
      R.drag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, t0: now, tl: now, moved: 0 };
      R.fly = null; R.vu = R.vl = 0;
    };
    R.onMove = (ev) => {
      const g = R && R.drag; if (!g || ev.pointerId !== g.id) return;
      const now = performance.now(), dx = ev.clientX - g.x, dy = ev.clientY - g.y, dt = Math.max(1, now - g.tl);
      g.x = ev.clientX; g.y = ev.clientY; g.tl = now; g.moved = Math.max(g.moved, Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0));
      if (g.moved < 6) return;
      const du = dy * R.ku / H, dl = -dx * R.kl / W;
      R.u = clamp(R.u + du, 0, 1); R.lat = clamp(R.lat + dl, -1, 1);
      R.vu = lerp(R.vu, du / dt * 1000, .4); R.vl = lerp(R.vl, dl / dt * 1000, .4);
      hint(false); kick();
    };
    R.onUp = (ev) => {
      const g = R && R.drag; if (!g || ev.pointerId !== g.id) return;
      R.drag = null;
      if (g.moved >= 6) R.dragT = performance.now();   // (a drag, not a tap: its click eaten)
      if (performance.now() - g.tl > 90) R.vu = R.vl = 0;   // (held still before letting go: no glide)
      kick();
    };
    R.onWheel = (ev) => {
      if (!R || R.over || (ev.target && ev.target.closest && ev.target.closest('.dol-card'))) return;
      ev.preventDefault();
      const d = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaMode === 2 ? ev.deltaY * H : ev.deltaY;
      R.fly = null; R.vu = 0; R.u = clamp(R.u - d * R.ku / H * .6, 0, 1); hint(false); kick();
    };
    R.onKey = (ev) => {
      if (!R || R.over) return;
      const k = ev.key;
      if (k === 'ArrowUp' || k === 'ArrowDown') { ev.preventDefault(); ev.stopPropagation(); flyTo(clamp(R.u + (k === 'ArrowUp' ? .07 : -.07), 0, 1), R.lat); hint(false); }
      else if (k === 'ArrowLeft' || k === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); nextEv(k === 'ArrowRight' ? 1 : -1); }
    };
    R.onSize = () => { if (!R) return; clearTimeout(R.sizeT); R.sizeT = setTimeout(resize, 120); };
    e.addEventListener('pointerdown', R.onDown);
    e.addEventListener('wheel', R.onWheel, { passive: false });
    e.addEventListener('click', (ev) => { if (R && R.dragT && performance.now() - R.dragT < 350) { ev.stopPropagation(); ev.preventDefault(); } }, true);
    e.addEventListener('click', onClick);
    addEventListener('pointermove', R.onMove); addEventListener('pointerup', R.onUp); addEventListener('pointercancel', R.onUp); addEventListener('resize', R.onSize);
    document.addEventListener('keydown', R.onKey, true);

    // the first picture now (no empty frame), then the circle opens; the result of the event just raced over it
    place(); r.render(scene, R.cam); R.frames++;
    aim(e, o);
    if (calm()) e.classList.add('on'); else requestAnimationFrame(() => requestAnimationFrame(() => { if (el === e) e.classList.add('on'); }));
    if (iz) { R.izid = iz; over('izid', izidHtml(iz, R.byId[iz.id].ev)); } else focusFirst();
  }

  function latFor(sl) { return clamp((sl.p.x - focus(sl.u).x) / 10, -1, 1); }
  function hint(on) { const h = el && el.querySelector('.dol-hint'); if (h) h.classList.toggle('gone', !on); }
  function focusFirst() {
    if (!el) return;
    const b = el.querySelector('.dol-ev.sel') || el.querySelector('.dol-ev.odprt') || el.querySelector('.dol-ev:not(.zaklenjen)') || el.querySelector('.dol-back');
    if (b) try { b.focus({ preventScroll: true }); } catch (_) { /* (an old browser: no focus) */ }
  }

  /* ---- the picture: the camera over the road (the card's room kept free), the badges where their pins are ---- */
  function kick() { if (R && !R.raf) { R.last = performance.now(); R.raf = requestAnimationFrame(frame); } }
  function frame(now) {
    if (!R) return;
    R.raf = 0;
    const dt = Math.min(.05, Math.max(0, (now - R.last) / 1000));
    R.last = now;
    let moving = false;
    if (R.fly) {
      const k = clamp((now - R.fly.t0) / R.fly.dur, 0, 1), f = ease(k);
      R.u = lerp(R.fly.u0, R.fly.u1, f); R.lat = lerp(R.fly.l0, R.fly.l1, f);
      if (k >= 1) R.fly = null; moving = true;
    } else if (!R.drag && (Math.abs(R.vu) > 2e-4 || Math.abs(R.vl) > 2e-3)) {
      R.u = clamp(R.u + R.vu * dt, 0, 1); R.lat = clamp(R.lat + R.vl * dt, -1, 1);
      const f = Math.exp(-dt * 4.2); R.vu *= f; R.vl *= f;
      if (R.u <= 0 || R.u >= 1) R.vu = 0;
      moving = true;
    } else { R.vu = R.vl = 0; }
    if (Math.abs(R.offT - R.off) > .5) { R.off += (R.offT - R.off) * (1 - Math.exp(-dt * 14)); moving = true; } else R.off = R.offT;
    place();
    R.r.render(R.scene, R.cam); R.frames++;
    if (moving) kick();
  }
  function place() {
    const c = R.cam, f = focus(R.u), lx = R.lat * 10, off = Math.round(R.off);
    if (off > 0 && SIDE) { c.fov = FOV; c.aspect = (W + off) / H; c.setViewOffset(W + off, H, off, 0, W, H); }
    else if (off > 0) { c.fov = 2 * Math.atan(Math.tan(FOV / 2 * D2R) * (H + off) / H) / D2R; c.aspect = W / (H + off); c.setViewOffset(W, H + off, 0, off, W, H); }
    else { c.fov = FOV; c.aspect = W / H; c.clearViewOffset(); }
    c.updateProjectionMatrix();
    c.position.set(f.x + lx, f.y + CAM_UP, f.z + CAM_BACK); c.lookAt(f.x + lx, f.y, f.z - LOOK); c.updateMatrixWorld();
    const v = R.v3;
    for (const m of R.marks) {
      v.set(m.w.x, m.w.y, m.w.z); const d = v.distanceTo(c.position); v.project(c);
      const sx = (v.x + 1) * .5 * W, sy = (1 - v.y) * .5 * H;
      if (v.z > 1 || d > 220 || sx < -80 || sx > W + 80 || sy < -20 || sy > H + 90) { if (!m.off) { m.el.style.opacity = '0'; m.el.style.pointerEvents = 'none'; m.off = true; } continue; }
      const s = clamp(1.22 - d / 150, .5, 1) * m.big, a = clamp(2.3 - d / 100, 0, 1) * (m.el.classList.contains('sel') ? 1 : clamp((sy - (R.topZ || 100)) / 60, 0, 1));
      m.el.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) translate(-50%,-100%) scale(' + s.toFixed(3) + ')';
      m.el.style.opacity = a.toFixed(2); m.el.style.zIndex = String(1000 - Math.round(d)); m.el.style.pointerEvents = a < .4 ? 'none' : ''; m.off = false;
    }
    let cur = 1; for (const g of R.gates) if (g.u <= R.u + .015) cur = g.n;   // (the stage in sight: the rail's and the title's)
    if (cur !== R.cur) {
      R.cur = cur;
      const s = (o.view.atlas.stopnje || [])[cur - 1], t = el.querySelector('.dol-title small');
      if (t) t.textContent = s ? 'Stage ' + s.n + ' · ' + enName(s) : '';
      el.querySelectorAll('.dol-rail button').forEach(b => b.classList.toggle('cur', +b.dataset.st === cur));
    }
  }
  function flyTo(u, lat) {
    if (!R) return;
    if (calm()) { R.u = u; R.lat = lat; R.fly = null; kick(); return; }
    R.fly = { u0: R.u, u1: u, l0: R.lat, l1: lat, t0: performance.now(), dur: clamp(Math.abs(u - R.u) * 2600, 380, 1100) }; R.vu = R.vl = 0; kick();
  }
  function resize() {
    if (!el || !R) return;
    aim(el, o); measure(); R.r.setSize(W, H, false);
    const k = el.querySelector('.dol-card'); R.offT = R.off = k.classList.contains('on') ? (SIDE ? k.offsetWidth : k.offsetHeight) : 0;
    R.cur = 0; kick();
  }

  /* ---- the card, the result, the progress ---- */
  function cardHtml(x) {
    const a = o.view.atlas, s = (a.stopnje || [])[x.stopnja - 1], lock = x.stanje === 'zaklenjen', tr = (x.tracks || []).map(trackName), facts = [];
    if (tr.length > 1) facts.push(tr.length + ' races');
    if (x.km) facts.push((Math.round(x.km * 10) / 10) + ' km');
    if (x.laps) facts.push(x.laps + (x.laps === 1 ? ' lap' : ' laps'));
    if (x.kind === 'dvoboj') facts.push('1 rival'); else if (x.kind === 'kronometer') facts.push('Against the clock'); else if (x.n) facts.push(x.n + ' rivals');
    if (x.cat) facts.push(CAT[x.cat] || x.cat);
    if (DIFF[x.diff]) facts.push(DIFF[x.diff]);
    const t = ZV()[x.kind] || ZV().pokal, k = x.kovanci || [], rows = [1, 2, 3].filter(z => t.includes(z));
    const note = !lock ? '' : s && !s.odprta ? 'Opens at ★ ' + s.prag + ' (you have ' + (a.zvezdice | 0) + ')' : x.cat ? 'Needs a car of the class ' + (CAT[x.cat] || x.cat) : 'Locked';
    return '<button type="button" class="dol-x" data-x aria-label="Close">' + I_X + '</button><div class="dol-cb">' +
      '<div class="dol-chips"><span class="chip gold">' + esc((KIND[x.kind] || 'Event').toUpperCase()) + '</span><span class="chip">STAGE ' + x.stopnja + (s ? ' · ' + esc(enName(s).toUpperCase()) : '') + '</span></div>' +
      '<h2>' + esc(enName(x)) + '</h2><p class="dol-tr">' + esc(tr.join(' · ')) + '</p>' +
      '<div class="dol-facts">' + facts.map(f => '<span>' + esc(f) + '</span>').join('') + '</div>' +
      '<div class="dol-mine">' + zvezde(x.zvezdice | 0, 'big') + '<span>' + (x.best >= 1 ? 'Best: ' + najbolje(x) : lock ? 'Locked' : 'Not raced yet') + '</span></div>' +
      '<ul class="dol-pay">' + rows.map(z => '<li class="' + (z <= (x.zvezdice | 0) ? 'got' : '') + '"><span>' + '★'.repeat(z) + '</span><b>' + I_COIN + fmt(k[z - 1]) + '</b></li>').join('') + '</ul>' +
      '<p class="dol-rule">' + esc(pravilo(x)) + '. A better result later pays the difference.</p>' +
      (note ? '<p class="dol-lock">' + I_LOCK + esc(note) + '</p>' : '') + '</div>' +
      '<div class="dol-cf"><button type="button" class="go ' + (lock ? 'off' : 'gold') + '" data-go="' + esc(x.id) + '">' + (lock ? I_LOCK + 'LOCKED' : (x.zvezdice | 0) >= 3 ? 'RACE AGAIN' : 'RACE!') + '</button></div>';
  }
  function izidHtml(iz, x) {
    const prej = iz.prej | 0, zdaj = Math.max(prej, iz.zdaj | 0), nag = Array.isArray(iz.nagrade) ? iz.nagrade : [], sum = nag.reduce((s, n) => s + (+n.amount || 0), 0);
    const place = x && x.kind === 'kronometer' ? (MEDAL[iz.mesto - 1] || 'No medal').toUpperCase() : iz.mesto >= 1 ? 'P' + iz.mesto : '';
    return '<div class="dol-ob" role="dialog" aria-label="Result"><small class="dol-ok">RESULT</small><h2>' + esc(x ? enName(x) : '') + '</h2>' +
      (place ? '<div class="dol-place">' + place + '</div>' : '') +
      '<div class="dol-zz" aria-label="' + zdaj + ' of 3 stars">' + [0, 1, 2].map(i => '<u class="' + (i < prej ? 'on' : i < zdaj ? 'on new' : '') + '" style="--d:' + (i * .14) + 's"></u>').join('') + '</div>' +
      '<p class="dol-zt">' + (zdaj > prej ? '+' + (zdaj - prej) + ' ★' : zdaj >= 3 ? 'All three stars' : 'No new star this time') + '</p>' +
      (nag.length ? '<ul class="dol-nag">' + nag.map(n => '<li>' + I_COIN + '<b>+' + fmt(n.amount) + '</b><span>' + esc(n.en || n.name || '') + '</span></li>').join('') + '</ul>' : '') +
      (sum ? '<p class="dol-sum">+' + fmt(sum) + ' coins</p>' : '') + '<button type="button" class="go gold" data-cont>CONTINUE</button></div>';
  }
  function napHtml(gor) {
    const a = o.view.atlas, st = a.stopnje || [], z = a.zvezdice | 0, max = a.max || st.reduce((m, s) => m + (s.max || 0), 0), cur = o.view.stopnja | 0, nxt = st.find(s => !s.odprta);
    const rows = st.map(s => '<li class="' + (s.odprta ? (s.n === cur ? 'cur' : 'on') : 'off') + '"><b>' + (s.odprta ? s.n : I_LOCK) + '</b><div><span>STAGE ' + s.n + ' · ' + esc(enName(s).toUpperCase()) + '</span>' +
      '<div class="bar"><b style="width:' + (s.max ? Math.round(100 * s.zvezdice / s.max) : 0) + '%"></b></div></div><em>' + (s.odprta ? s.zvezdice + '/' + s.max + ' ★' : 'from ★ ' + s.prag) + '</em></li>').join('');
    return '<div class="dol-ob" role="dialog" aria-label="Progress">' + (gor ? '<div class="dol-up">STAGE ' + gor.n + ' · ' + esc(enName(gor).toUpperCase()) + ' IS OPEN</div>' : '<small class="dol-ok">PROGRESS</small>') +
      '<h2>★ ' + z + ' <small>/ ' + max + '</small></h2><ol class="dol-lad">' + rows + '</ol>' +
      '<p class="dol-next">' + (nxt ? Math.max(0, nxt.prag - z) + ' more ★ to Stage ' + nxt.n + ' · ' + esc(enName(nxt)) : 'Every stage is open') + '</p>' +
      '<button type="button" class="go gold" data-cont>OK</button></div>';
  }
  function over(kind, html) {
    shut();
    const d = document.createElement('div'); d.className = 'dol-over'; d.dataset.k = kind; d.innerHTML = html; el.appendChild(d); R.over = d;
    if (calm()) d.classList.add('on'); else requestAnimationFrame(() => d.classList.add('on'));
    const b = d.querySelector('[data-cont]'); if (b) try { b.focus({ preventScroll: true }); } catch (_) { /* (no focus) */ }
  }
  function shut() { if (R && R.over) { R.over.remove(); R.over = null; } }
  function cont() {
    if (!R || !R.over) return;
    const k = R.over.dataset.k, gor = R.over.gor; shut();
    if (k === 'izid') {
      const iz = R.izid, s = iz && iz.stopnja, up = s && typeof s === 'object' && s.zdaj > s.prej ? (o.view.atlas.stopnje || [])[s.zdaj - 1] : null;
      R.izid = null;
      if (up) { over('nap', napHtml(up)); R.over.gor = up; return; }
      if (iz && R.byId[iz.id]) { select(iz.id, true); focusFirst(); }
      return;
    }
    if (gor) { const g = R.gates.find(sl => sl.n === gor.n); if (g) flyTo(g.u, latFor(g)); }   // (a stage just opened: there)
    focusFirst();
  }
  function select(id, fly) {
    const sl = R && R.byId[id]; if (!sl) return;
    R.sel = id;
    for (const b of R.badges) b.el.classList.toggle('sel', b.id === id);
    R.ring.visible = true; R.ring.position.set(sl.p.x, sl.p.y + .2, sl.p.z);
    const k = el.querySelector('.dol-card'); k.innerHTML = cardHtml(sl.ev); k.classList.add('on'); el.classList.add('carded');
    R.offT = SIDE ? k.offsetWidth : k.offsetHeight;
    hint(false);
    if (fly) flyTo(sl.u, latFor(sl)); else kick();
  }
  function unselect(refocus) {
    if (!R || !R.sel) return;
    const id = R.sel; R.sel = null; R.ring.visible = false;
    for (const b of R.badges) b.el.classList.remove('sel');
    el.querySelector('.dol-card').classList.remove('on'); el.classList.remove('carded'); R.offT = 0; kick();
    if (refocus) { const b = R.badges.find(m => m.id === id); if (b) try { b.el.focus({ preventScroll: true }); } catch (_) { /* (no focus) */ } }
  }
  function nextEv(dir) {
    const L = R.evs; if (!L.length) return;
    let i = R.sel ? L.findIndex(sl => sl.ev.id === R.sel) : -1;
    if (i < 0) { let best = 9; L.forEach((sl, k) => { const d = Math.abs(sl.u - R.u); if (d < best) { best = d; i = k; } }); } else i = clamp(i + dir, 0, L.length - 1);
    select(L[i].ev.id, true);
    const b = R.badges.find(m => m.id === L[i].ev.id); if (b) try { b.el.focus({ preventScroll: true }); } catch (_) { /* (no focus) */ }
  }
  function go(id) {   // (the game starts it, or refuses a locked one with its toast: the valley stays)
    const oo = o; if (!oo || typeof oo.start !== 'function') return;
    if (oo.start(id) && el && o === oo) close(true);
  }
  function onClick(ev) {
    if (!R) return;
    const t = ev.target, q = (s) => (t && t.closest ? t.closest(s) : null);
    let b;
    if (q('[data-close]')) return close(false);
    if (q('[data-cont]')) return cont();
    if (R.over) { if (t === R.over) back(); return; }   // (a tap beside the window: back)
    if ((b = q('[data-go]'))) return go(b.dataset.go);
    if (q('[data-x]')) return unselect(true);
    if ((b = q('[data-ev]'))) return select(b.dataset.ev, true);
    if ((b = q('[data-st]'))) { const g = R.gates.find(sl => sl.n === +b.dataset.st); unselect(); if (g) flyTo(g.u, latFor(g)); hint(false); return; }
    if (q('[data-nap]')) return over('nap', napHtml(null));
    if (t && t.tagName === 'CANVAS') unselect();
  }

  /* ---- opened, closed ---- */
  function teardown(e, r) {
    if (r) {
      cancelAnimationFrame(r.raf); clearTimeout(r.sizeT);
      removeEventListener('pointermove', r.onMove); removeEventListener('pointerup', r.onUp); removeEventListener('pointercancel', r.onUp); removeEventListener('resize', r.onSize);
      document.removeEventListener('keydown', r.onKey, true);
    }
    return () => {
      if (r && r.scene) r.scene.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
      if (r && r.r) { r.r.dispose(); r.r.forceContextLoss(); r.cv.width = r.cv.height = 1; }
      if (e) e.remove();
    };
  }
  // o: { root, view (MenuBridge.kariera(): its atlas), izid (the event just raced, or null), from (the strip it opens from), start(id) (true:
  // started), close() (once, however it closes) }. False: not opened (no 3D, no atlas, or the build failed; nothing left behind)
  function open(opts) {
    if (el) close(true);
    const T3 = window.THREE, v = opts && opts.view;
    if (!T3 || !v || !v.atlas || !opts.root) return false;
    o = opts;
    try { build(T3); } catch (err) {
      if (window.console) console.warn('[dolina]', err);
      const end = teardown(el, R); el = null; R = null; o = null;
      try { end(); } catch (_) { /* (the context already lost) */ }
      return false;
    }
    return true;
  }
  function close(now) {
    if (!el) return;
    const e = el, r = R, oo = o; el = null; R = null; o = null;
    const end = teardown(e, r);
    if (now || calm()) end(); else { aim(e, oo); e.classList.remove('on'); e.style.pointerEvents = 'none'; setTimeout(end, 520); }
    if (oo && typeof oo.close === 'function') oo.close();
  }
  function back() {
    if (!el) return;
    if (R && R.over) { if (R.over.dataset.k === 'izid' || R.over.gor) return cont(); shut(); return focusFirst(); }
    if (R && R.sel) return unselect(true);
    close(false);
  }

  window.MenuDolina = {
    open, close, back,
    isOpen: () => !!el,
    root: () => el,
    _R() {   // (the tests: the draws and vertices of the last picture, where the camera is, what is chosen)
      if (!R) return null;
      const i = R.r.info.render;
      return { calls: i.calls, tris: i.triangles, verts: R.verts, u: R.u, lat: R.lat, sel: R.sel, over: R.over ? R.over.dataset.k : null, moving: !!(R.raf || R.fly || R.drag), SIDE, W, H, off: R.off, frames: R.frames };
    },
  };
})();
