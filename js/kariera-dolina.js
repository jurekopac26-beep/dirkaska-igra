/* Career 1.0, the valley (Atlas Career, the user's decision of 24. 11. 2026, #797 part C): a map of the menu, not a race camera. A 3D valley
   seen from above, its places: CIRCUIT, MOUNTAIN, POLICE, TRAFFIC, RIVAL, GUEST CARS, WORLD, TROPHIES (each a model on its pad, a label over
   it: its stars). Over it the stars' strip to the next stage and the coins; under it NEXT, CONTINUE, LIST and the dock (GARAGE, DEALER,
   WORKSHOP, SCHOOL). A place: its window (its events by stage); an event: its card (tracks, stars, coins; Race!); back from an event: its
   result. The logic is js/kariera.js's (44 events, stars, stages, coins); this only draws it. window.MenuDolina = { open(o), close(now),
   back(), isOpen(), root(), _R() } (js/menu.js dolina()); nothing at load. About 6 draw calls and under 60 thousand vertices (the limits:
   ~300, ~900 thousand); drawn only when something changes */
(function () {
  'use strict';
  const calmQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null, calm = () => !!(calmQ && calmQ.matches);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const D2R = Math.PI / 180;
  const ZADNJI = 'dirk.dolina.zadnji';   // (localStorage: the event raced last, for CONTINUE)

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

  const svg = (p) => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' + p + '</svg>';
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
  const ikona = (k) => svg(I_KIND[k] || I_KIND.pokal);
  const zvezde = (n, cls) => '<span class="dol-z' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + [0, 1, 2].map(i => '<u' + (i < n ? ' class="on"' : '') + '></u>').join('') + '</span>';
  const I_PL = {
    circuit: '<path d="M7 5h10a7 7 0 0 1 0 14H7A7 7 0 0 1 7 5zm0 3.4a3.6 3.6 0 0 0 0 7.2h10a3.6 3.6 0 0 0 0-7.2z"/>',
    mountain: '<path d="M1 20 9 5l4 7 2.5-4L23 20z"/><path d="M9 5l2.3 4.3L9.6 11 8 9.7 6.6 10.6z" fill="#fff" opacity=".85"/>',
    police: '<path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z"/><path d="M12 7l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="#fff" opacity=".9"/>',
    traffic: '<path d="M5 9l1.6-4.2A2 2 0 0 1 8.5 3.5h7a2 2 0 0 1 1.9 1.3L19 9h1a1 1 0 0 1 1 1v6h-2v2.5h-3V16H8v2.5H5V16H3v-6a1 1 0 0 1 1-1zm2.3 0h9.4l-1.1-3H8.4zM6.5 11.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm11 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"/>',
    rival: I_KIND.dvoboj,
    guest: I_KIND.razred,
    world: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    trophies: I_KIND.pokal,
  };
  const I_DOCK = {
    garage: '<path d="M2 10 12 3l10 7v11h-3v-9H5v9H2z"/><path d="M6.5 14h11v2h-11zm0 3.5h11v2h-11z"/>',
    dealer: '<path d="M3 3h8.6l9.7 9.7-8.6 8.6L3 11.6zm4.6 3a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z"/>',
    workshop: '<path d="M21.2 6.4l-3.4 3.4-3-.6-.6-3 3.4-3.4a6 6 0 0 0-7.8 7.5L2.6 17.5a2 2 0 0 0 0 2.8l1.1 1.1a2 2 0 0 0 2.8 0l7.2-7.2a6 6 0 0 0 7.5-7.8z"/>',
    school: '<path d="M12 3 1 8.5 12 14l9-4.5V16h2V8.5zM5 12.3V17c0 1.7 3.1 3.5 7 3.5s7-1.8 7-3.5v-4.7L12 16z"/>',
  };
  const I_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M5 4l9 8-9 8zm10 0h3v16h-3z"/></svg>';
  const I_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>';
  const I_LIST = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M3 5h3v3H3zm5 .5h13v2H8zM3 10.5h3v3H3zm5 .5h13v2H8zM3 16h3v3H3zm5 .5h13v2H8z"/></svg>';

  /* ---- the places: where each stands in the valley (x across, z into it), its model, its events ---- */
  // a place's events (kind and vrsta): the class cups the GUEST CARS, the duels the RIVAL, the time trials and the final the WORLD, the circuit
  // cups the CIRCUIT, the road and the long ones the MOUNTAIN. TROPHIES, POLICE and TRAFFIC hold no career event (the progress; the game's modes)
  function placeOf(x) {
    if (x.kind === 'razred') return 'guest';
    if (x.kind === 'dvoboj') return 'rival';
    if (x.kind === 'kronometer' || x.vrsta === 'tt' || x.kind === 'finale') return 'world';
    if (x.vrsta === 'krog' || x.vrsta === 'dolge') return 'circuit';
    return 'mountain';
  }
  const PLACES = [
    { k: 'circuit', name: 'CIRCUIT', x: -15, z: 12, about: 'Cups on circuits: laps, a grid, a podium.' },
    { k: 'rival', name: 'RIVAL', x: 15, z: 12, about: 'One rival, one road. Win the duel.' },
    { k: 'traffic', name: 'TRAFFIC', x: -24, z: -9, about: 'Through the traffic on open roads.', modes: 1 },
    { k: 'trophies', name: 'TROPHIES', x: 0, z: -6, about: 'Your stars, the stages, the class goals.' },
    { k: 'police', name: 'POLICE', x: 24, z: -9, about: 'Chases with the patrol on your tail, or in it.', modes: 1 },
    { k: 'guest', name: 'GUEST CARS', x: -16, z: -30, about: 'Class cups: one for every class of car you own.' },
    { k: 'world', name: 'WORLD', x: 16, z: -30, about: 'Time trials around the world, and the final.' },
    { k: 'mountain', name: 'MOUNTAIN', x: 0, z: -54, about: 'Road races up and down the passes.' },
  ];
  const MODES = {
    police: [{ act: 'mode:chase', name: 'Police chase', about: 'Get away from the patrol.' }, { act: 'mode:pursuit', name: 'Pursuit', about: 'Drive the patrol car, catch the fugitive.' }],
    traffic: [{ act: 'mode:duel', name: 'Traffic duel', about: 'Race a rival through the traffic.' }, { act: 'mode:endless', name: 'Endless traffic', about: 'As far as you can, the traffic ever thicker.' }],
  };
  const DOCK = [{ k: 'garage', name: 'GARAGE', act: 'game:menu-garage' }, { k: 'dealer', name: 'DEALER', act: 'game:to-career' }, { k: 'workshop', name: 'WORKSHOP', act: 'game:to-upg' }, { k: 'school', name: 'SCHOOL', act: 'game:to-school' }];

  /* ---- the valley (made up: no real place): a broad floor, its walls, the peaks behind; a pad flat under each place, a path between them ---- */
  const LAKE = { x: 36, z: -46, r: 7 };
  const PEAKS = [[-60, -110, 40, 20], [-10, -130, 52, 24], [44, -118, 44, 20], [-92, -60, 30, 22], [92, -62, 32, 22], [18, -150, 34, 18]];
  const NX = 110, NZ = 110, X0 = -130, X1 = 130, Z0 = -170, Z1 = 70;
  const PATH = [[-15, 12], [0, 18], [15, 12], [24, -9], [16, -30], [0, -44], [-16, -30], [-24, -9], [-15, 12]];   // (a loop through them; the spokes to TROPHIES, MOUNTAIN)
  const SPOKES = [[[0, 18], [0, -6]], [[0, -6], [0, -44]]];
  function hash(i, j) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { let s = 0, a = .5, f = 1; for (let k = 0; k < 4; k++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s / .9375; }
  function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function segD(x, z, a, b) { const ex = b[0] - a[0], ez = b[1] - a[1], t = clamp(((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez || 1), 0, 1); return Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t); }
  function pathD(x, z) { let d = 1e9; for (let i = 0; i + 1 < PATH.length; i++) d = Math.min(d, segD(x, z, PATH[i], PATH[i + 1])); for (const s of SPOKES) d = Math.min(d, segD(x, z, s[0], s[1])); return d; }
  function padD(x, z) { let d = 1e9; for (const p of PLACES) d = Math.min(d, Math.hypot(x - p.x, z - p.z) - (p.k === 'mountain' ? 11 : 7.5)); return d; }
  function height(x, z) {
    const wx = step(36, 70, Math.abs(x) + (fbm(x * .03, z * .03) - .5) * 16), wz = step(-62, -100, z), wf = step(32, 60, z);
    let y = (fbm(x * .05 + 3, z * .05 - 1) - .5) * 1.6 + 26 * wx * (1 + (fbm(x * .04 - 7, z * .04) - .5) * .8) + 30 * wz + 10 * wf;
    for (const p of PEAKS) { const dx = x - p[0], dz = z - p[1]; y += p[2] * Math.exp(-(dx * dx + dz * dz) / (2 * p[3] * p[3])); }
    y = lerp(.05, y, step(0, 7, padD(x, z)));   // (the pads flat)
    const lr = Math.hypot(x - LAKE.x, z - LAKE.z); if (lr < LAKE.r + 5) y = lerp(-1.6, y, step(LAKE.r - 2, LAKE.r + 5, lr));
    return y;
  }
  function makeGround(T3) {
    const cols = NX + 1, nv = cols * (NZ + 1), pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), dx = (X1 - X0) / NX, dz = (Z1 - Z0) / NZ;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i < cols; i++) { const k = j * cols + i, x = X0 + dx * i, z = Z0 + dz * j; pos[k * 3] = x; pos[k * 3 + 1] = height(x, z); pos[k * 3 + 2] = z; }
    const idx = [];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const nrm = g.attributes.normal.array;
    for (let k = 0; k < nv; k++) {
      const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2], s = 1 - nrm[k * 3 + 1], n = fbm(x * .11 + 3.1, z * .11 - 1.7);
      let r = lerp(.45, .57, n), gg = lerp(.7, .8, n), b = lerp(.3, .37, n);
      const mix = (c, a) => { r = lerp(r, c[0], a); gg = lerp(gg, c[1], a); b = lerp(b, c[2], a); };
      mix([.27, .5, .25], step(.52, .7, fbm(x * .05 - 4, z * .05 + 9)) * (1 - step(20, 32, y)) * step(1.5, 6, y));   // (forest on the slopes)
      mix([.62, .65, .4], step(18, 30, y + (n - .5) * 8));                                                              // (alpine grass)
      mix([.5 + .1 * n, .48 + .08 * n, .45 + .07 * n], Math.max(step(.34, .54, s), step(38, 50, y) * .7));            // (rock)
      mix([.95, .97, .99], step(44, 56, y + (n - .5) * 10) * (1 - step(.5, .72, s)));                                   // (snow)
      mix([.83, .8, .72], 1 - step(1.1, 2.1, pathD(x, z)));                                                             // (the paths)
      mix([.74, .8, .62], .55 * (1 - step(-1.5, 0, padD(x, z))));                                                       // (the pads, mown)
      if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 2.2) mix([.86, .8, .62], .8);                                  // (the shore)
      col[k * 3] = r; col[k * 3 + 1] = gg; col[k * 3 + 2] = b;
    }
    g.setAttribute('color', new T3.BufferAttribute(col, 3));
    return g;
  }

  // the places' models, merged into one mesh (vertex colours): a part's geometry, its colour (or a colour by its point), where it stands
  function Kit(T3) {
    const P = [], N = [], C = [], m4 = new T3.Matrix4(), q = new T3.Quaternion(), e3 = new T3.Euler(), v = new T3.Vector3(), sc = new T3.Vector3(), cl = new T3.Color();
    let grey = 0;
    function add(geo, color, x, y, z, ry, sx, sy, sz, rx) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      m4.compose(v.set(x || 0, y || 0, z || 0), q.setFromEuler(e3.set(rx || 0, ry || 0, 0)), sc.set(sx || 1, sy || sx || 1, sz || sx || 1));
      g.applyMatrix4(m4); g.computeVertexNormals();
      const p = g.attributes.position.array, n = g.attributes.normal.array;
      for (let i = 0; i < p.length; i += 3) {
        if (typeof color === 'function') color(p[i], p[i + 1], p[i + 2], cl); else cl.set(color);
        if (grey) { const l = cl.r * .3 + cl.g * .59 + cl.b * .11; cl.setRGB(lerp(cl.r, l, .75) * .92 + .05, lerp(cl.g, l, .75) * .92 + .05, lerp(cl.b, l, .75) * .92 + .06); }
        P.push(p[i], p[i + 1], p[i + 2]); N.push(n[i], n[i + 1], n[i + 2]); C.push(cl.r, cl.g, cl.b);
      }
      g.dispose(); if (g !== geo) geo.dispose();
    }
    const box = (c, x, y, z, w, h, d, ry) => add(new T3.BoxGeometry(w, h, d), c, x, y + h / 2, z, ry);
    function car(c, x, z, ry, s) {   // (a boxy car: no make; never black)
      s = s || 1; const cs = Math.cos(ry || 0), sn = Math.sin(ry || 0), at = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
      let p = at(0, 0); add(new T3.BoxGeometry(2.3 * s, .7 * s, 1.15 * s), c, p[0], .5 * s, p[1], ry);
      p = at(-.2 * s, 0); add(new T3.BoxGeometry(1.25 * s, .55 * s, 1 * s), 0xcfe8fa, p[0], 1.1 * s, p[1], ry);
    }
    function build() {
      const g = new T3.BufferGeometry();
      g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3));
      return g;
    }
    return { add, box, car, build, grey: (on) => { grey = on ? 1 : 0; } };
  }
  function models(T3, K, p, off) {
    const x = p.x, z = p.z;
    K.grey(off);
    if (p.k === 'circuit') {
      K.add(new T3.TorusGeometry(4.6, .7, 3, 40), 0x5a606a, x, .12, z, 0, 1.45, 1, .2, Math.PI / 2);
      K.box(0xffffff, x, .12, z + 4.6, .5, .1, 1.5);
      K.box(0xe8eef5, x - 9.4, 0, z - 1, 1.6, 1.6, 6.5); K.box(0xd23c3c, x - 9.4, 1.6, z - 1, 1.9, .4, 6.8);   // (the stand)
      K.car(0xe8473c, x - 2, z + 4.6, 0, .55); K.car(0x2f8fe8, x + 1.2, z + 4.6, 0, .55);
    } else if (p.k === 'mountain') {
      K.add(new T3.ConeGeometry(10, 15, 9), (px, py, pz, c) => c.setRGB(.5 + py * .01, .5 + py * .009, .47 + py * .008), x, 7.5, z);
      K.add(new T3.ConeGeometry(4.3, 6.2, 9), 0xf3f7fb, x, 12.2, z);
      const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 5.2, r = lerp(10.2, 2.6, t); pts.push(new T3.Vector3(x + Math.cos(a) * r, .3 + t * 13.4, z + Math.sin(a) * r)); }
      K.add(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 90, .38, 4, false), 0xffc629);
    } else if (p.k === 'police') {
      K.box(0xd9e1ec, x, 0, z - 1.5, 7, 3.4, 4.6); K.box(0x3b6fc4, x, 3.4, z - 1.5, 7.4, .5, 5);
      K.box(0x3b6fc4, x - 1.2, 0, z + .82, 2.2, 2.2, .1); K.box(0xffffff, x, 3.9, z - 1.5, 2.4, .9, 1.2);
      K.car(0xf4f6f9, x + 2.2, z + 3.4, .3, .8); K.box(0xe8473c, x + 1.96, 1.38, z + 3.32, .4, .2, .9, .3); K.box(0x2f7ff0, x + 2.5, 1.38, z + 3.46, .4, .2, .9, .3);
    } else if (p.k === 'traffic') {
      K.box(0x6a707a, x, 0, z, 15, .16, 5, .25);
      for (let i = -3; i <= 3; i++) K.box(0xf5f5f0, x + i * 1.94, .16, z - i * .49, 1.1, .03, .22, .25);
      K.car(0xf2b630, x - 4.6, z - .1, .25, .7); K.car(0x2f8fe8, x + .6, z + 1.2, .25, .7); K.car(0xe8473c, x + 4.4, z - 2.3, .25, .7); K.car(0xf4f6f9, x - 1.2, z - 2.2, .25, .7);
    } else if (p.k === 'rival') {
      K.box(0x5f656f, x, 0, z, 4.6, .16, 12); K.box(0xf5f5f0, x, .16, z + 2.5, 4.6, .03, .5); K.box(0xf5f5f0, x, .16, z, .18, .03, 11);
      K.car(0xff7a1a, x - 1.15, z + 3.6, Math.PI / 2, .7); K.car(0x22b8d8, x + 1.15, z + 3.6, Math.PI / 2, .7);
      K.box(0xe8eef5, x - 2.9, 0, z + 1, .4, 3.8, .4); K.box(0xe8eef5, x + 2.9, 0, z + 1, .4, 3.8, .4); K.box(0xffc629, x, 3.4, z + 1, 6.2, .8, .5);
    } else if (p.k === 'guest') {
      K.add(new T3.CylinderGeometry(6, 6.3, .4, 24), 0xe9edf2, x, .2, z);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; K.box(0xffffff, x + Math.cos(a) * 5, .4, z + Math.sin(a) * 5, .35, 3.6, .35); }
      K.add(new T3.ConeGeometry(7, 1.8, 24), 0xff8f3a, x, 4.9, z);
      K.car(0x9b5de5, x - 2.6, z + 1.2, .5, .75); K.car(0xf2b630, x + 2.4, z + .6, -.5, .75); K.car(0x22b8d8, x, z - 2.4, 0, .75);
    } else if (p.k === 'world') {
      K.add(new T3.CylinderGeometry(1.4, 2.2, 2.2, 16), 0xe9edf2, x, 1.1, z);
      K.add(new T3.SphereGeometry(3.6, 22, 16), (px, py, pz, c) => { const lx = px - x, ly = py - 5.8, lz = pz - z, l = Math.hypot(lx, ly, lz) || 1, n = fbm(lx / l * 2.2 + 5, ly / l * 2.2 + lz / l * 1.7 + 2); if (n > .55) c.setRGB(.36, .68, .34); else c.setRGB(.25, .55, .9); }, x, 5.8, z);
      K.add(new T3.TorusGeometry(4.3, .14, 4, 40), 0xffc629, x, 5.8, z, .4, 1, 1, 1, Math.PI / 2.4);
    } else if (p.k === 'trophies') {
      K.box(0xe9edf2, x, 0, z, 3, 2.4, 3); K.box(0xd5dce6, x - 3.1, 0, z + .2, 3, 1.5, 3); K.box(0xd5dce6, x + 3.1, 0, z + .2, 3, 1, 3);
      const pr = [[0, 0], [1.2, 0], [1.2, .3], [.4, .5], [.35, 1.6], [1.4, 2.4], [1.9, 4.2], [1.7, 4.3], [0, 3.2]].map(a => new T3.Vector2(a[0], a[1]));
      K.add(new T3.LatheGeometry(pr, 18), 0xffc629, x, 2.4, z);
      K.add(new T3.TorusGeometry(.9, .2, 6, 14), 0xffc629, x - 1.85, 5.6, z, 0, 1, 1, 1, 0); K.add(new T3.TorusGeometry(.9, .2, 6, 14), 0xffc629, x + 1.85, 5.6, z, 0, 1, 1, 1, 0);
    }
    K.grey(0);
  }
  const TOPY = { circuit: 3.5, mountain: 17, police: 6, traffic: 3.5, rival: 5, guest: 6.5, world: 10.5, trophies: 7.6 };   // (the label's point over the model)

  /* ---- the state ---- */
  let el = null, R = null, o = null, W = 1, H = 1, SIDE = false, FOV = 46;

  function measure() {
    W = Math.max(1, el.clientWidth); H = Math.max(1, el.clientHeight); SIDE = W > H * 1.05; FOV = SIDE ? 40 : 46;
    el.classList.toggle('side', SIDE);
  }
  function aim(e, oo) {   // (the circle it opens from and closes into: the career's strip)
    const f = oo && (typeof oo.from === 'function' ? oo.from() : oo.from), h = oo && oo.root, hb = h && (h.getBoundingClientRect ? h : h.host);
    const rr = (hb || e).getBoundingClientRect(), g = f && f.isConnected ? f.getBoundingClientRect() : null;
    if (g && g.width) { e.style.setProperty('--zx', (g.left + g.width / 2 - rr.left).toFixed(1) + 'px'); e.style.setProperty('--zy', (g.top + g.height / 2 - rr.top).toFixed(1) + 'px'); e.style.setProperty('--zr', (Math.min(g.width, g.height) / 2).toFixed(1) + 'px'); }
    e.style.setProperty('--zR', Math.ceil(Math.hypot(rr.width, rr.height) + 40) + 'px');
  }
  function lsGet() { try { return localStorage.getItem(ZADNJI); } catch (_) { return null; } }
  function lsSet(id) { try { localStorage.setItem(ZADNJI, id); } catch (_) { /* (no storage: CONTINUE from the result only) */ } }

  function build(T3) {
    const v = o.view, a = v.atlas, st = a.stopnje || [], extra = o.extra !== false;
    const evs = [], byId = {};
    for (const s of st) for (const x of (s.dogodki || s.pokali || [])) if (!byId[x.id]) { byId[x.id] = x; evs.push(x); }
    const pl = PLACES.map(p => {
      const L = evs.filter(x => placeOf(x) === p.k);
      return Object.assign({}, p, { evs: L, done: L.reduce((s, x) => s + (x.zvezdice | 0), 0), max: L.length * 3,
        off: p.modes ? !extra : p.k === 'trophies' ? false : !L.some(x => x.stanje !== 'zaklenjen') });
    });
    const e = el = document.createElement('div');
    e.className = 'dol'; e.setAttribute('role', 'dialog'); e.setAttribute('aria-modal', 'true'); e.setAttribute('aria-label', 'Career: the valley');
    const z = a.zvezdice | 0, cur = st[(v.stopnja | 0) - 1] || st[0], nxt = st.find(s => !s.odprta), p0 = cur ? cur.prag | 0 : 0;
    const frac = nxt ? clamp((z - p0) / Math.max(1, nxt.prag - p0), 0, 1) : 1;
    e.innerHTML = '<canvas aria-hidden="true"></canvas><div class="dol-pins"></div><div class="dol-ui">' +
      '<div class="dol-top"><button type="button" class="zem-sq zem-back dol-back" data-close aria-label="Back">' + I_BACK + '</button>' +
      '<div class="dol-title"><b>CAREER</b><small>' + (cur ? 'STAGE ' + cur.n + ' · ' + esc(enName(cur).toUpperCase()) : '') + '</small></div>' +
      '<div class="dol-coins" aria-label="' + fmt(v.money) + ' coins">' + I_COIN + '<b>' + fmt(v.money) + '</b></div></div>' +
      '<button type="button" class="dol-strip" data-nap aria-label="Stars: ' + z + (nxt ? ', ' + Math.max(0, nxt.prag - z) + ' more to stage ' + nxt.n : '') + '">' +
      '<i>★</i><b>' + z + '</b><span class="bar"><b style="width:' + Math.round(frac * 100) + '%"></b></span>' +
      '<em>' + (nxt ? '★ ' + nxt.prag + ' · STAGE ' + nxt.n : 'ALL OPEN') + '</em></button>' +
      '<div class="dol-acts"></div>' +
      '<nav class="dol-dock" aria-label="Garage and shops">' + DOCK.map(d => '<button type="button" data-act="' + d.act + '">' + svg(I_DOCK[d.k]) + '<span>' + d.name + '</span></button>').join('') + '</nav>' +
      '<div class="dol-card" role="region" aria-label="Window"></div></div>';
    o.root.appendChild(e);
    const cv = e.querySelector('canvas');
    R = { cv, pl, evs, byId, extra, sheet: null, over: null, raf: 0, frames: 0, verts: 0, v3: new T3.Vector3(), anim: null, camP: new T3.Vector3(), camT: new T3.Vector3() };
    acts();
    const r = R.r = new T3.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setClearColor(0x000000, 0);
    const scene = R.scene = new T3.Scene(); scene.fog = new T3.Fog(0xd4e9f7, 120, 330);
    scene.add(new T3.HemisphereLight(0xeef4ff, 0x5d6b4a, .66));
    const sun = new T3.DirectionalLight(0xfff4e0, .58); sun.position.set(-50, 90, 60); scene.add(sun);
    measure(); r.setSize(W, H, false);
    R.cam = new T3.PerspectiveCamera(FOV, W / H, .5, 800);
    const add = (mesh, count) => { scene.add(mesh); R.verts += mesh.geometry.attributes.position.count * (count == null ? 1 : count); return mesh; };

    add(new T3.Mesh(makeGround(T3), new T3.MeshLambertMaterial({ vertexColors: true })));
    const water = new T3.CircleGeometry(LAKE.r + 1.5, 36); water.rotateX(-Math.PI / 2);
    add(new T3.Mesh(water, new T3.MeshLambertMaterial({ color: 0x5aa7d8 }))).position.set(LAKE.x, -.25, LAKE.z);
    const inst = (geo, n) => { const mm = new T3.InstancedMesh(geo, new T3.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, n)); mm.frustumCulled = false; return mm; };   // (r128 culls an instanced mesh by its first shape: off)
    const m4 = new T3.Matrix4(), q = new T3.Quaternion(), up = new T3.Vector3(0, 1, 0), p3 = new T3.Vector3(), sc = new T3.Vector3(), cl = new T3.Color();
    const rnd = rng(11), tg = new T3.ConeGeometry(1, 1, 7); tg.translate(0, .5, 0);
    const NT = 340, trees = inst(tg, NT);
    let n = 0;
    for (let t = 0; n < NT && t < 9000; t++) {
      const x = lerp(-95, 95, rnd()), zz = lerp(-120, 58, rnd()), y = height(x, zz);
      if (padD(x, zz) < 3 || pathD(x, zz) < 3 || Math.hypot(x - LAKE.x, zz - LAKE.z) < LAKE.r + 2.5 || y > 34) continue;
      if (rnd() > .1 + .9 * step(.4, .7, fbm(x * .05 - 4, zz * .05 + 9))) continue;
      const h = lerp(2.6, 5.2, rnd()), w = h * lerp(.3, .38, rnd());
      trees.setMatrixAt(n, m4.compose(p3.set(x, y - .3, zz), q.identity(), sc.set(w, h, w)));
      trees.setColorAt(n, cl.setRGB(lerp(.15, .25, rnd()), lerp(.38, .52, rnd()), lerp(.17, .24, rnd()))); n++;
    }
    trees.count = n; add(trees, n);
    const NR = 60, rocks = inst(new T3.DodecahedronGeometry(1, 0), NR);
    n = 0;
    for (let t = 0; n < NR && t < 5000; t++) {
      const x = lerp(-100, 100, rnd()), zz = lerp(-130, 50, rnd()), y = height(x, zz);
      if (y < 6 || padD(x, zz) < 3 || pathD(x, zz) < 3) continue;
      const g = lerp(.5, .64, rnd());
      rocks.setMatrixAt(n, m4.compose(p3.set(x, y - .2, zz), q.setFromAxisAngle(up, rnd() * 6.28), sc.set(lerp(1, 2.8, rnd()), lerp(.7, 1.7, rnd()), lerp(1, 2.6, rnd()))));
      rocks.setColorAt(n, cl.setRGB(g, g * .97, g * .92)); n++;
    }
    rocks.count = n; add(rocks, n);
    const K = Kit(T3);
    for (const p of pl) models(T3, K, p, p.off);
    add(new T3.Mesh(K.build(), new T3.MeshLambertMaterial({ vertexColors: true })));
    const ring = new T3.TorusGeometry(1, .06, 6, 48); ring.rotateX(Math.PI / 2);
    R.ring = add(new T3.Mesh(ring, new T3.MeshBasicMaterial({ color: 0xffd84a }))); R.ring.visible = false;

    // the labels over the places
    const pins = e.querySelector('.dol-pins');
    R.marks = pl.map(p => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'dol-pl' + (p.off ? ' off' : '') + (p.k === 'trophies' ? ' gold' : ''); b.dataset.pl = p.k;
      const sub = p.off ? (p.modes ? 'LATER' : 'LOCKED') : p.max ? '★ ' + p.done + '/' + p.max : p.k === 'trophies' ? '★ ' + z + '/' + (a.max | 0) : 'PLAY';
      b.setAttribute('aria-label', p.name + ': ' + (p.off ? (p.modes ? 'later' : 'locked') : p.max ? p.done + ' of ' + p.max + ' stars' : 'open'));
      b.innerHTML = '<i>' + (p.off ? I_LOCK : svg(I_PL[p.k])) + '</i><span><b>' + p.name + '</b><small>' + sub + '</small></span>';
      pins.appendChild(b);
      return { el: b, p, w: { x: p.x, y: TOPY[p.k], z: p.z } };
    });

    // the input
    R.onSize = () => { if (!R) return; clearTimeout(R.sizeT); R.sizeT = setTimeout(resize, 120); };
    e.addEventListener('click', onClick);
    addEventListener('resize', R.onSize);

    // the first picture now (no empty frame), then the circle opens; the result of the event just raced over it
    fit(true); place(); r.render(scene, R.cam); R.frames++;
    aim(e, o);
    if (calm()) e.classList.add('on'); else requestAnimationFrame(() => requestAnimationFrame(() => { if (el === e) e.classList.add('on'); }));
    const iz = o.izid && byId[o.izid.id] ? o.izid : null;
    if (iz) { lsSet(iz.id); R.izid = iz; acts(); over('izid', izidHtml(iz, byId[iz.id])); } else focusFirst();
  }

  // NEXT: the first open event without its three stars (the stages' order); CONTINUE: the one raced last
  function nextEv() { return R.evs.find(x => x.stanje !== 'zaklenjen' && (x.zvezdice | 0) < 3) || null; }
  function lastEv() { const id = lsGet(); return (id && R.byId[id]) || null; }
  function acts() {
    const n = nextEv(), c = lastEv(), d = el.querySelector('.dol-acts');
    d.innerHTML = '<button type="button" class="dol-a" data-list>' + I_LIST + '<span>LIST</span></button>' +
      (c ? '<button type="button" class="dol-a go gold" data-ev="' + esc(c.id) + '" data-cont-ev>' + I_PLAY + '<span>CONTINUE<small>' + esc(enName(c)) + '</small></span></button>' : '') +
      (n ? '<button type="button" class="dol-a' + (c ? '' : ' go gold') + '" data-ev="' + esc(n.id) + '" data-next>' + I_NEXT + '<span>NEXT<small>' + esc(enName(n)) + '</small></span></button>' : '');
  }
  function focusFirst() {
    if (!el) return;
    const b = (R && R.over && R.over.querySelector('[data-cont]')) || el.querySelector('.dol-card.on button:not([data-x])') || el.querySelector('.dol-acts .gold') || el.querySelector('.dol-pl:not(.off)') || el.querySelector('.dol-back');
    if (b) try { b.focus({ preventScroll: true }); } catch (_) { /* (an old browser: no focus) */ }
  }

  /* ---- the picture: a camera over the whole valley, every place between the head and the buttons (the window's room kept free) ---- */
  function room() {   // (the free box on the screen, in pixels: under the strip, over the buttons, beside the window)
    const rr = el.getBoundingClientRect(), q = (s) => el.querySelector(s), b = (s) => { const x = q(s); return x ? x.getBoundingClientRect() : null; };
    const t = b('.dol-strip'), ac = b('.dol-acts'), dk = b('.dol-dock'), k = q('.dol-card');
    let top = t ? t.bottom - rr.top + 8 : 110, bot = H - 14, left = 16, right = W - 16;
    for (const g of [ac, dk]) if (g && g.height) bot = Math.min(bot, g.top - rr.top - 8);
    if (k && k.classList.contains('on')) { if (SIDE) right = Math.min(right, k.offsetLeft - 12); else bot = Math.min(bot, k.offsetTop - 8); }   // (its place when in: offsets, not the slide's rectangle)
    if (bot - top < 80) top = Math.max(40, bot - 80);
    return { top, bot, left, right };
  }
  // the camera's place and aim: tilted down over the valley, moved back and across until the places' points fill the free box
  function solve(box) {
    const c = R.cam, pitch = (SIDE ? 40 : 52) * D2R, tgt = R.v3.clone().set(0, 0, -20), v = R.v3;
    // (on its side the camera looks from the east: the valley's length, the circuit to the mountain, across the wide screen)
    const yaw = SIDE ? Math.PI / 2 : 0, sy0 = Math.sin(yaw), cy0 = Math.cos(yaw);
    let D = 90;
    // (a small room over a window: only the window's place, near; else the whole valley)
    const sel = R.sheet && R.sheet.pl, few = sel && (box.bot - box.top < 300 || box.right - box.left < 360), pts = [];
    for (const m of R.marks) if (!few || m.p.k === sel) { pts.push([m.p.x, 0, m.p.z]); pts.push([m.w.x, m.w.y, m.w.z]); }
    c.fov = FOV; c.aspect = W / H; c.clearViewOffset(); c.updateProjectionMatrix();
    for (let it = 0; it < 40; it++) {
      c.position.set(tgt.x + sy0 * Math.cos(pitch) * D, tgt.y + Math.sin(pitch) * D, tgt.z + cy0 * Math.cos(pitch) * D); c.lookAt(tgt); c.updateMatrixWorld();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of pts) { v.set(p[0], p[1], p[2]).project(c); const sx = (v.x + 1) * .5 * W, sy = (1 - v.y) * .5 * H; x0 = Math.min(x0, sx - 50); x1 = Math.max(x1, sx + 50); y0 = Math.min(y0, sy - 40); y1 = Math.max(y1, sy + 6); }
      const s = Math.max((x1 - x0) / Math.max(40, box.right - box.left), (y1 - y0) / Math.max(40, box.bot - box.top));
      const wpp = 2 * D * Math.tan(FOV / 2 * D2R) / H, dx = (box.left + box.right) / 2 - (x0 + x1) / 2, dy = (box.top + box.bot) / 2 - (y0 + y1) / 2;
      const u = dx * wpp, w = dy * wpp / Math.sin(pitch);
      tgt.x -= cy0 * u + sy0 * w; tgt.z -= -sy0 * u + cy0 * w;
      D = clamp(D * Math.pow(s, .8), few ? 45 : 30, 400);
    }
    return { p: c.position.clone(), t: tgt.clone() };
  }
  function fit(now) {
    const s = solve(room());
    if (now || calm() || !R.camT.lengthSq()) { R.camP.copy(s.p); R.camT.copy(s.t); R.anim = null; }
    else { R.anim = { p0: R.camP.clone(), t0: R.camT.clone(), p1: s.p, t1: s.t, s: performance.now(), dur: 420 }; }
    kick();
  }
  function kick() { if (R && !R.raf) R.raf = requestAnimationFrame(frame); }
  function frame(now) {
    if (!R) return;
    R.raf = 0;
    let moving = false;
    if (R.anim) {
      const A = R.anim, k = clamp((now - A.s) / A.dur, 0, 1), f = ease(k);
      R.camP.lerpVectors(A.p0, A.p1, f); R.camT.lerpVectors(A.t0, A.t1, f);
      if (k >= 1) R.anim = null; else moving = true;
    }
    place();
    R.r.render(R.scene, R.cam); R.frames++;
    if (moving) kick();
  }
  function place() {
    const c = R.cam;
    c.fov = FOV; c.aspect = W / H; c.clearViewOffset(); c.updateProjectionMatrix();
    c.position.copy(R.camP); c.lookAt(R.camT); c.updateMatrixWorld();
    const v = R.v3, sel = R.sheet && R.sheet.pl;
    for (const m of R.marks) {
      v.set(m.w.x, m.w.y, m.w.z).project(c);
      const sx = (v.x + 1) * .5 * W, sy = (1 - v.y) * .5 * H;
      m.sx = sx; m.sy = sy;
      v.set(m.p.x, 0, m.p.z).project(c); m.bx = (v.x + 1) * .5 * W; m.by = (1 - v.y) * .5 * H;
      m.el.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) translate(-50%,-100%)';
      m.el.classList.toggle('sel', m.p.k === sel);
    }
    const sm = sel && R.marks.find(m => m.p.k === sel);
    R.ring.visible = !!sm;
    if (sm) { const rr = sm.p.k === 'mountain' ? 12.5 : 8.6; R.ring.position.set(sm.p.x, .25, sm.p.z); R.ring.scale.set(rr, 1, rr); }
  }
  function resize() {
    if (!el || !R) return;
    aim(el, o); measure(); R.r.setSize(W, H, false); fit(true);
  }

  /* ---- the windows: a place's events, an event's card, the list, the trophies, the game's modes ---- */
  function rowHtml(x) {
    const lock = x.stanje === 'zaklenjen', tr = (x.tracks || []).map(trackName), sub = [tr.length > 1 ? tr.length + ' races' : tr[0] || '', x.km ? (Math.round(x.km * 10) / 10) + ' km' : ''].filter(Boolean).join(' · ');
    return '<li><button type="button" class="dol-row ' + x.stanje + '" data-ev="' + esc(x.id) + '" aria-label="' + esc(enName(x)) + (lock ? ', locked' : ', ' + (x.zvezdice | 0) + ' of 3 stars') + '">' +
      '<i>' + (lock ? I_LOCK : ikona(x.kind)) + '</i><span><b>' + esc(enName(x)) + '</b><small>' + esc((KIND[x.kind] || 'Event') + (sub ? ' · ' + sub : '')) + '</small></span>' + zvezde(x.zvezdice | 0) + '</button></li>';
  }
  function byStage(L) {
    const st = o.view.atlas.stopnje || [];
    return st.map(s => { const m = L.filter(x => x.stopnja === s.n); return m.length ? '<li class="dol-sh' + (s.odprta ? '' : ' off') + '">' + (s.odprta ? '' : I_LOCK) + 'STAGE ' + s.n + ' · ' + esc(enName(s).toUpperCase()) + (s.odprta ? '' : '<em>★ ' + s.prag + '</em>') + '</li>' + m.map(rowHtml).join('') : ''; }).join('');
  }
  const head = (icon, title, sub, right) => '<div class="dol-ph"><i>' + icon + '</i><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' + (right ? '<em>' + right + '</em>' : '') + '</div>';
  function placeHtml(p) {
    if (p.modes) {
      const L = MODES[p.k] || [];
      return head(svg(I_PL[p.k]), p.name, p.about) + '<ul class="dol-modes">' + L.map(m => '<li><button type="button" class="dol-mode' + (R.extra ? '' : ' off') + '"' + (R.extra ? ' data-act="' + m.act + '"' : ' disabled') + '>' +
        '<span><b>' + esc(m.name) + '</b><small>' + esc(R.extra ? m.about : 'Coming later') + '</small></span><i>' + (R.extra ? I_PLAY : I_LOCK) + '</i></button></li>').join('') + '</ul>' +
        '<p class="dol-rule">Free play: no stars, no career coins.</p>';
    }
    if (p.k === 'trophies') return trophiesHtml();
    return head(svg(I_PL[p.k]), p.name, p.about, '★ ' + p.done + '<small>/' + p.max + '</small>') + '<ol class="dol-list">' + byStage(p.evs) + '</ol>';
  }
  function trophiesHtml() {
    const v = o.view, a = v.atlas, st = a.stopnje || [], z = a.zvezdice | 0, cur = v.stopnja | 0, nxt = st.find(s => !s.odprta);
    const lad = st.map(s => '<li class="' + (s.odprta ? (s.n === cur ? 'cur' : 'on') : 'off') + '"><b>' + (s.odprta ? s.n : I_LOCK) + '</b><div><span>STAGE ' + s.n + ' · ' + esc(enName(s).toUpperCase()) + '</span>' +
      '<div class="bar"><b style="width:' + (s.max ? Math.round(100 * s.zvezdice / s.max) : 0) + '%"></b></div></div><em>' + (s.odprta ? s.zvezdice + '/' + s.max + ' ★' : 'from ★ ' + s.prag) + '</em></li>').join('');
    const cl = (v.razredi || []).filter(r => r.cilji && r.cilji.length).map(r => '<li class="' + r.stanje + '"><span>' + esc(CAT[r.cat] || r.cat) + '</span>' +
      r.cilji.map(g => '<u class="' + (g.done ? 'on' : '') + '" title="' + esc(g.en || g.name) + (g.done ? '' : ' ' + (g.progress | 0) + '/' + g.need) + '"></u>').join('') + '</li>').join('');
    return head(svg(I_PL.trophies), 'TROPHIES', nxt ? Math.max(0, nxt.prag - z) + ' more ★ to Stage ' + nxt.n + ' · ' + enName(nxt) : 'Every stage is open', '★ ' + z + '<small>/' + (a.max | 0) + '</small>') +
      '<ol class="dol-lad">' + lad + '</ol>' +
      (cl ? '<h3 class="dol-h3">CLASS GOALS <small>A win · a time trial medal · km</small></h3><ul class="dol-goals">' + cl + '</ul>' : '') +
      '<p class="dol-rule">First wins on a track: <b>' + (v.prve | 0) + '</b></p>';
  }
  function cardHtml(x) {
    const a = o.view.atlas, s = (a.stopnje || [])[x.stopnja - 1], lock = x.stanje === 'zaklenjen', tr = (x.tracks || []).map(trackName), facts = [];
    if (tr.length > 1) facts.push(tr.length + ' races');
    if (x.km) facts.push((Math.round(x.km * 10) / 10) + ' km');
    if (x.laps) facts.push(x.laps + (x.laps === 1 ? ' lap' : ' laps'));
    if (x.kind === 'dvoboj') facts.push('1 rival'); else if (x.kind === 'kronometer') facts.push('Against the clock'); else if (x.n) facts.push(x.n + ' rivals');
    if (x.cat) facts.push(CAT[x.cat] || x.cat);
    if (DIFF[x.diff]) facts.push(DIFF[x.diff]);
    const t = ZV()[x.kind] || ZV().pokal, k = x.kovanci || [], rows = [1, 2, 3].filter(zz => t.includes(zz));
    const note = !lock ? '' : s && !s.odprta ? 'Opens at ★ ' + s.prag + ' (you have ' + (a.zvezdice | 0) + ')' : x.cat ? 'Needs a car of the class ' + (CAT[x.cat] || x.cat) : 'Locked';
    const pk = PLACES.find(p => p.k === placeOf(x));
    return '<div class="dol-chips"><span class="chip gold">' + esc((KIND[x.kind] || 'Event').toUpperCase()) + '</span><span class="chip">' + esc(pk ? pk.name : '') + ' · STAGE ' + x.stopnja + '</span></div>' +
      '<h2>' + esc(enName(x)) + '</h2><p class="dol-tr">' + esc(tr.join(' · ')) + '</p>' +
      '<div class="dol-facts">' + facts.map(f => '<span>' + esc(f) + '</span>').join('') + '</div>' +
      '<div class="dol-mine">' + zvezde(x.zvezdice | 0, 'big') + '<span>' + (x.best >= 1 ? 'Best: ' + najbolje(x) : lock ? 'Locked' : 'Not raced yet') + '</span></div>' +
      '<ul class="dol-pay">' + rows.map(zz => '<li class="' + (zz <= (x.zvezdice | 0) ? 'got' : '') + '"><span>' + '★'.repeat(zz) + '</span><b>' + I_COIN + fmt(k[zz - 1]) + '</b></li>').join('') + '</ul>' +
      '<p class="dol-rule">' + esc(pravilo(x)) + '. A better result later pays the difference.</p>' +
      (note ? '<p class="dol-lock">' + I_LOCK + esc(note) + '</p>' : '');
  }
  // a window: { m: 'pl' | 'ev' | 'list', pl (the place), id (the event), up (the window it came from: back goes there) }
  function sheet(sh) {
    const k = el.querySelector('.dol-card');
    if (!sh) { R.sheet = null; k.classList.remove('on'); k.innerHTML = ''; el.classList.remove('carded'); fit(); return; }
    R.sheet = sh;
    let body = '', foot = '', kind = sh.m;
    if (sh.m === 'pl') { const p = R.pl.find(q => q.k === sh.pl); body = placeHtml(p); kind = p.modes ? 'modes' : p.k === 'trophies' ? 'trophies' : 'pl'; }
    else if (sh.m === 'list') body = head(I_LIST, 'ALL EVENTS', R.evs.length + ' events in ' + (o.view.atlas.stopnje || []).length + ' stages', '★ ' + (o.view.atlas.zvezdice | 0) + '<small>/' + (o.view.atlas.max | 0) + '</small>') + '<ol class="dol-list">' + byStage(R.evs) + '</ol>';
    else if (sh.m === 'ev') {
      const x = R.byId[sh.id], lock = x.stanje === 'zaklenjen';
      body = cardHtml(x);
      foot = '<div class="dol-cf"><button type="button" class="go ' + (lock ? 'off' : 'gold') + '" data-go="' + esc(x.id) + '">' + (lock ? I_LOCK + 'LOCKED' : (x.zvezdice | 0) >= 3 ? 'RACE AGAIN' : 'RACE!') + '</button></div>';
    }
    k.dataset.m = kind;
    k.innerHTML = (sh.up ? '<button type="button" class="dol-x dol-bk" data-up aria-label="Back">' + I_BACK + '</button>' : '') + '<button type="button" class="dol-x" data-x aria-label="Close">' + I_X + '</button>' +
      '<div class="dol-cb">' + body + '</div>' + foot;
    k.classList.add('on'); el.classList.add('carded'); k.scrollTop = 0; const cb = k.querySelector('.dol-cb'); if (cb) cb.scrollTop = 0;
    fit();
  }
  function openEv(id, up) { if (R.byId[id]) { const pl = placeOf(R.byId[id]); sheet({ m: 'ev', id, pl, up: up || null }); focusFirst(); } }

  /* ---- the result, the progress ---- */
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
      if (up) { over('nap', napHtml(up)); R.over.gor = up; return; }
      R.izid = null;
      if (iz && R.byId[iz.id]) return openEv(iz.id, { m: 'pl', pl: placeOf(R.byId[iz.id]) });
      return focusFirst();
    }
    if (gor && R.izid) { const id = R.izid.id; R.izid = null; if (R.byId[id]) return openEv(id, { m: 'pl', pl: placeOf(R.byId[id]) }); }
    focusFirst();
  }
  function go(id) {   // (the game starts it, or refuses a locked one with its toast: the valley stays)
    const oo = o; if (!oo || typeof oo.start !== 'function') return;
    if (oo.start(id)) { lsSet(id); if (el && o === oo) close(true); }
  }
  function doAct(a) { const oo = o; if (oo && typeof oo.act === 'function') oo.act(a); }
  function onClick(ev) {
    if (!R) return;
    const t = ev.target, q = (s) => (t && t.closest ? t.closest(s) : null);
    let b;
    if (q('[data-close]')) return close(false);
    if (q('[data-cont]')) return cont();
    if (R.over) { if (t === R.over) back(); return; }   // (a tap beside the window: back)
    if ((b = q('[data-go]'))) return go(b.dataset.go);
    if ((b = q('[data-act]'))) return doAct(b.dataset.act);
    if (q('[data-up]')) return up();
    if (q('[data-x]')) { sheet(null); return focusFirst(); }
    if ((b = q('[data-ev]'))) { const from = R.sheet && R.sheet.m !== 'ev' ? { m: R.sheet.m, pl: R.sheet.pl } : null; return openEv(b.dataset.ev, from); }
    if ((b = q('[data-pl]'))) { sheet({ m: 'pl', pl: b.dataset.pl }); return focusFirst(); }
    if (q('[data-list]')) { sheet({ m: 'list' }); return focusFirst(); }
    if (q('[data-nap]')) return over('nap', napHtml(null));
    if (t && t.tagName === 'CANVAS') {   // (a tap on a place's model: its window; beside them: the window shut)
      const rr = el.getBoundingClientRect(), x = ev.clientX - rr.left, y = ev.clientY - rr.top;
      let best = null, bd = 56;
      for (const m of R.marks) { const d = Math.min(Math.hypot(x - m.bx, y - m.by), Math.hypot(x - m.sx, y - m.sy + 20)); if (d < bd) { bd = d; best = m; } }
      if (best) sheet({ m: 'pl', pl: best.p.k }); else if (R.sheet) sheet(null);
    }
  }
  function up() { const u = R && R.sheet && R.sheet.up; if (!u) return; sheet(u); focusFirst(); }

  /* ---- opened, closed ---- */
  function teardown(e, r) {
    if (r) { cancelAnimationFrame(r.raf); clearTimeout(r.sizeT); removeEventListener('resize', r.onSize); }
    return () => {
      if (r && r.scene) r.scene.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
      if (r && r.r) { r.r.dispose(); r.r.forceContextLoss(); r.cv.width = r.cv.height = 1; }
      if (e) e.remove();
    };
  }
  // o: { root, view (MenuBridge.kariera(): its atlas), izid (the event just raced, or null), from (the strip it opens from), start(id) (true:
  // started), act(a) (the menu's act: 'mode:chase', 'game:menu-garage', …), extra (false: POLICE and TRAFFIC shut, 'later'), close() (once,
  // however it closes) }. False: not opened (no 3D, no atlas, or the build failed; nothing left behind)
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
    if (R && R.sheet) { if (R.sheet.up) return up(); sheet(null); return focusFirst(); }
    close(false);
  }

  window.MenuDolina = {
    open, close, back,
    isOpen: () => !!el,
    root: () => el,
    _R() {   // (the tests: the draws and vertices of the last picture, the window open, the places)
      if (!R) return null;
      const i = R.r.info.render;
      return { calls: i.calls, tris: i.triangles, verts: R.verts, sel: R.sheet ? R.sheet.id || R.sheet.pl || R.sheet.m : null, sheet: R.sheet ? R.sheet.m : null,
        over: R.over ? R.over.dataset.k : null, moving: !!(R.raf || R.anim), SIDE, W, H, frames: R.frames,
        places: R.marks.map(m => ({ k: m.p.k, n: m.p.evs.length, off: m.p.off, x: Math.round(m.sx), y: Math.round(m.sy) })) };
    },
  };
})();
