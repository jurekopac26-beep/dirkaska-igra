/* =========================================================================
   GARAGE — the garage page (garaza.html): the cars, their parts, service and paint, the money. The pictures and the animations are
   Garage3D's; this file keeps the garage's own state (a demo profile for now: joined with the menu and the career later), the page's
   buttons over the picture and the menu of a tapped part (GarageShop's prices: four tabs, four tiles).
   ========================================================================= */
(function () {
  'use strict';
  const tr = (s, ...a) => Lang.tr(s, ...a);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const num = (n) => Lang.thou(n);
  const eur = (n) => num(n) + ' €';
  const L2 = (p) => p[Lang.cur === 'en' ? 1 : 0];   // (a [Slovenian, English] pair in the page's language)
  const MODELS = Core.MODELS, PRICE = Core.CAREER.car, EL = GarageShop.EL;
  // the game's colours (game.js PLAYER_COLORS), their names
  const COLORS = [[0xd81f2a, 'Rdeča'], [0xf5f5f0, 'Bela'], [0x1c5fd6, 'Modra'], [0xf2c230, 'Rumena'], [0x1a1a1f, 'Črna'], [0x2fa84f, 'Zelena'], [0xff7a1a, 'Oranžna'], [0x8e3bd6, 'Vijolična']];
  const CSS = (h) => '#' + h.toString(16).padStart(6, '0');
  // the cars in the game's display order (game.js's car screen: by category in Core.CATS' order, in each the cheapest first (the career
  // price), then by id); a retired model never listed (a stored one is its heir's, Core.heirOf)
  const CAT_IDS = Core.CATS.map(c => c.id), catIx = (M) => { const i = CAT_IDS.indexOf(M.cat); return i < 0 ? CAT_IDS.length : i; };
  const ORDER = MODELS.filter(M => !M.retired).sort((A, B) => catIx(A) - catIx(B) || (PRICE[A.id] || 0) - (PRICE[B.id] || 0) || (A.id < B.id ? -1 : A.id > B.id ? 1 : 0)).map(M => M.id);
  const model = (id) => MODELS.find(m => m.id === id);
  const heirId = (id) => { const M = model(id); return M ? Core.heirOf(M).id : id; };
  // each car's colour in a new profile (the 10 older ones as before; the others in turn round the colours by their place in the order)
  const COLOR0 = { pico: 2, kaze: 0, muscle: 6, strega: 3, vortex: 1, truck: 4, rally: 1, ev: 5, formula: 0, lm: 2 }, color0 = (id) => COLOR0[id] != null ? COLOR0[id] : ORDER.indexOf(id) % COLORS.length;
  const FREE = ['pico', 'kaze', 'muscle'];   // (the free game's cars; the rest come with the full game)
  // service: w = 1 - the row's state; f = (the car's worth / 68.000 €)^0.8 (the wash ^0.3); the wash (20 + 280 w) f, the body (150 +
  // 15.000 w^1.6) f, the engine and its oil (180 + 9.000 w^1.8) f; under 1.000 € to 10 €, over it to 50 €; a full service 15 % off;
  // under 2 % wear it is free (nacrti/cene/ekonomija.json)
  const SRV = [
    { id: 'clean', a: 20, b: 280, p: 1, e: 0.3 },
    { id: 'body', a: 150, b: 15000, p: 1.6, e: 0.8 },
    { id: 'engine', a: 180, b: 9000, p: 1.8, e: 0.8 },
  ];
  const round = (v) => v < 1000 ? Math.round(v / 10) * 10 : Math.round(v / 50) * 50;
  const fullPrice = (ps) => { const q = ps.filter(p => p > 0), s = q.reduce((a, b) => a + b, 0); return q.length > 1 ? round(s * 0.85) : s; };   // (more than one: 15 % off)
  // (the tyres standing on the regal: on offer, 20 % off)
  const PROMO = 0.8;
  // (the game's four upgrades from the parts fitted: the tyres' category; the power, the grip of the aero kit and the wing, the braking
  // they add (%) past each level's threshold)
  const LV = { motor: [8, 16, 25], aero: [3, 6, 9], zavore: [8, 16, 25] };   // (the aero kits STREET, SPORT, RACE: levels 1, 2, 3, as their maquettes)
  // (the regal's parts by their plates: the element, the option's English name; the maquettes' kits)
  const REGAL = { SNOW: ['gume', 'Snow'], 'TRACK SLICK': ['gume', 'Track Slick'], MOUNTAIN: ['gume', 'Mountain'],
    SPORT: ['auspuh', 'Sport'], CARBON: ['auspuh', 'Carbon'], RACE: ['auspuh', 'Racing'], TWIN: ['auspuh', 'Dual'], TITANIUM: ['auspuh', 'Titanium'], STRAIGHT: ['auspuh', 'Straight'],
    'CHROME 3-SPOKE': ['platisca', 'Chrome, 3 spokes'], 'GOLD 5-SPOKE': ['platisca', 'Gold, 5 spokes'], 'ORANGE 10-SPOKE': ['platisca', 'Orange, 10 spokes'], 'BLACK MESH': ['platisca', 'Black mesh'],
    'AIR FILTER': ['filter_zraka', 'Air filter'], 'ECU CHIP': ['cip', 'Chip'], TURBO: ['turbo', 'Turbo'], 'LIGHT BATTERY': ['akumulator', 'Light battery'], SPRINGS: ['vzmeti', 'Springs'],
    DAMPERS: ['amortizerji', 'Coilovers'], 'ANTI-ROLL BARS': ['stabilizatorji', 'Anti-roll bars'], 'SPORT PADS': ['zavore', 'Sport pads'], HORN: ['hupa', 'Two-tone'], 'TYRE SMOKE': ['dim_gum', 'Blue'],
    DUCKTAIL: ['krilo', 'Ducktail'], 'SHORT WING': ['krilo', 'Short wing'], 'LOW WING': ['krilo', 'Low wing'], 'GT WING': ['krilo', 'GT wing'], 'DOUBLE WING': ['krilo', 'Double wing'] };
  const KITS = ['Street', 'Sport', 'Race'];
  const findOpt = (el, en) => { const E = EL[el]; for (let t = 0; t < 4; t++) { const j = E.c[t][1].findIndex(o => o[0][1] === en); if (j >= 0) return [t, j]; } return null; };
  const opt = (el, t, j) => EL[el].c[t][1][j];
  const price = (el, t, j) => { const o = opt(el, t, j); return el === 'gume' && o[4] ? round(o[1] * PROMO) : o[1]; };

  /* ---------------- the state: money, the cars (bought or not), each car's parts, wear and colour ---------------- */
  const KEY = 'apex-garage';
  const carNew = (id, own) => ({ own: !!own, parts: {}, color: color0(id), stripe: true, cond: { clean: 1, body: 1, engine: 1 } });
  function profile(mode) {   // the mockup's three profiles: a new player (free), the full game, a veteran
    const S = { v: 2, mode, money: 11500, car: 'pico', cars: {}, lang: S0lang(), sound: true, guide: 0 };
    for (const id of ORDER) S.cars[id] = carNew(id, id === 'pico');
    S.cars.pico.cond = { clean: 0.35, body: 0.6, engine: 0.42 };
    if (mode === 'vet') {
      S.money = 248500; S.car = 'kaze';
      const set = (id, P, c) => { const k = S.cars[id]; k.own = true; for (const el in P) { const o = findOpt(el, P[el]); if (o) k.parts[el] = o; } if (c) k.cond = c; };
      set('pico', { turbo: 'Turbo', cip: 'Chip', gume: 'Track Semi-slick', zavore: 'Sport pads', krilo: 'Arch' }, { clean: 0.9, body: 0.85, engine: 0.8 });
      set('kaze', { turbo: 'Turbo kit', cip: 'Stage 3 map', auspuh: 'Titanium', gume: 'Track Slick', zavore: 'Racing discs', aero: 'Sport', krilo: 'GT wing' }, { clean: 0.55, body: 0.72, engine: 0.66 });
      set('muscle', { auspuh: 'Dual', gume: 'Premium Summer' }); set('strega', { aero: 'Street', gume: 'Street Semi-slick' }); set('vortex', {}); set('rally', { gume: 'Rally Gravel', zavore: 'Slotted discs' }, { clean: 0.2, body: 0.5, engine: 0.7 }); set('ev', { cip: 'Stage 1 map' });
    }
    return S;
  }
  function S0lang() { try { const s = JSON.parse(localStorage.getItem('tdgp-settings') || 'null'); if (s && s.lang === 'en') return 'en'; } catch (_) { } return 'sl'; }
  let S = null;
  // (a car's parts as the game's contract has them (docs/deli.md): { element: its option 1 .. 16 }; here [tab, place] each)
  const toDeli = (parts) => { const o = {}; for (const el in parts) o[el] = parts[el][0] * 4 + parts[el][1] + 1; return o; };
  const fromDeli = (deli) => { const o = {}; for (const el in deli || {}) { const n = deli[el]; if (EL[el] && Number.isInteger(n) && n >= 1 && n <= 16) o[el] = [Math.floor((n - 1) / 4), (n - 1) % 4]; } return o; };
  function load() {
    let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { s = null; }
    if (!s || s.v !== 2 || !s.cars || !s.mode) { const d = profile(s && s.mode || 'full'); if (s && s.lang === 'en') d.lang = 'en'; return d; }   // (an older profile (credits, levels): a new one)
    const d = profile(s.mode);
    for (const id of ORDER) { const c = s.cars[id], o = d.cars[id]; if (!c || typeof c !== 'object') continue; o.own = !!c.own;
      o.parts = fromDeli(c.deli);
      o.color = Number.isInteger(c.color) && c.color >= 0 && c.color < COLORS.length ? c.color : o.color; o.stripe = c.stripe !== false;
      for (const k of ['clean', 'body', 'engine']) o.cond[k] = c.cond && Number.isFinite(c.cond[k]) ? Math.min(1, Math.max(0, c.cond[k])) : o.cond[k]; }
    d.money = Number.isFinite(s.money) ? Math.max(0, Math.round(s.money)) : d.money; d.car = ORDER.includes(heirId(s.car)) ? heirId(s.car) : d.car; d.lang = s.lang === 'en' ? 'en' : 'sl'; d.sound = s.sound !== false; d.demo = s.demo !== false; d.guide = s.guide ? 1 : 0;
    if (!d.cars.pico.own) d.cars.pico.own = true;
    return d;
  }
  // (saved with each car's parts as the game's contract has them: deli)
  function save() { try { const cars = {}; for (const id in S.cars) { const c = Object.assign({}, S.cars[id], { deli: toDeli(S.cars[id].parts) }); delete c.parts; cars[id] = c; } localStorage.setItem(KEY, JSON.stringify(Object.assign({}, S, { cars }))); } catch (_) { } }
  const C = () => S.cars[S.car], M = () => model(S.car);
  const locked = (id) => S.mode === 'free' && !FREE.includes(id) && !S.cars[id].own;
  // the game's four upgrade levels from a car's parts (parts: those, or another set to try)
  function levels(parts) { const L = { motor: 0, gume: 0, zavore: 0, aero: 0 }, sum = { motor: 0, aero: 0, zavore: 0 };
    for (const el in parts) { const E = EL[el], [t, j] = parts[el]; if (!E || !E.k) continue; if (E.k === 'gume') L.gume = t; else sum[E.k] += opt(el, t, j)[3]; }
    for (const k in sum) L[k] = LV[k].filter(v => sum[k] >= v).length; return L; }
  const worth = (id) => Math.max(20000, PRICE[id] || 48000);
  const srvPrice = (s, c, id) => { const w = 1 - c.cond[s.id]; if (w < 0.02) return 0; const f = Math.pow(worth(id) / 68000, s.e); return round((s.a + s.b * Math.pow(w, s.p)) * f); };
  const spec = (id) => { const c = S.cars[id]; return { M: model(id), color: COLORS[c.color][0], stripe: c.stripe, upg: levels(c.parts), cond: Object.assign({}, c.cond), num: 0 }; };
  // (the aero kit the car has: 0 none or another, 1 STREET, 2 SPORT, 3 RACE; RACE is locked till SPORT or more is fitted)
  const kitOf = (c) => { const p = c.parts.aero; if (!p) return 0; const n = opt('aero', p[0], p[1])[0][1]; return KITS.indexOf(n) + 1; };
  const raceLocked = (c) => { const p = c.parts.aero; return !p || (p[0] < 1 || (p[0] === 1 && p[1] < 2)); };

  /* ---------------- the parts' pictures in the menu's tiles (small drawings in the colours of the option's category) ---------------- */
  const TONE = ['#7d8796', '#2f9e5b', '#e7a020', '#d8261d'];
  const ICON = {
    gume: (t) => '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" fill="#1d1f24"/><circle cx="22" cy="22" r="13.5" fill="none" stroke="' + TONE[t] + '" stroke-width="2.6"/><circle cx="22" cy="22" r="9" fill="#b9c0cb"/><circle cx="22" cy="22" r="3" fill="#6d7686"/></svg>',
    platisca: (t, j) => { const n = [5, 5, 10, 12][t] + (j % 2), sp = Array.from({ length: n }, (_, k) => { const a = k / n * 6.283; return '<path d="M22 22L' + (22 + Math.cos(a) * 15).toFixed(1) + ' ' + (22 + Math.sin(a) * 15).toFixed(1) + '" stroke="' + ['#c8ced8', '#e0e4ea', '#d9a520', '#2b2e35'][t] + '" stroke-width="2.6"/>'; }).join('');
      return '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" fill="#22252b"/><circle cx="22" cy="22" r="16" fill="#3a3f48"/>' + sp + '<circle cx="22" cy="22" r="4" fill="#9aa2ae"/></svg>'; },
    auspuh: (t) => '<svg viewBox="0 0 44 44"><rect x="4" y="16" width="26" height="12" rx="5" fill="' + ['#9aa2ae', '#7b8594', '#4a5160', '#6b5bd6'][t] + '"/><rect x="28" y="18" width="12" height="8" rx="3" fill="#c8ced8"/><ellipse cx="40" cy="22" rx="2.5" ry="4" fill="#1d1f24"/></svg>',
    krilo: (t) => '<svg viewBox="0 0 44 44"><path d="M4 16c12-5 24-5 36 0l-1 5c-11-3-23-3-34 0z" fill="' + TONE[t] + '"/><path d="M12 20v12M32 20v12" stroke="#4a5160" stroke-width="3"/><path d="M6 33h32" stroke="#4a5160" stroke-width="2.4"/></svg>',
    aero: (t) => '<svg viewBox="0 0 44 44"><path d="M3 29v-5l5-1 5-7h15l7 6 6 2v5z" fill="#3b78d8"/><path d="M3 30h38v3H3z" fill="' + TONE[t] + '"/><circle cx="12" cy="31" r="4" fill="#1d1f24"/><circle cx="32" cy="31" r="4" fill="#1d1f24"/></svg>',
    filter_zraka: (t) => '<svg viewBox="0 0 44 44"><path d="M10 12h24l-4 22H14z" fill="' + ['#9aa2ae', '#d8261d', '#4a5160', '#1d1f24'][t] + '"/><path d="M12 18h20M13 24h18M14 30h16" stroke="rgba(255,255,255,.45)" stroke-width="1.6"/><rect x="16" y="6" width="12" height="6" rx="2" fill="#c8ced8"/></svg>',
    cip: (t) => '<svg viewBox="0 0 44 44"><rect x="10" y="10" width="24" height="24" rx="3" fill="' + ['#2f6b46', '#1f5d3a', '#22324a', '#1d1f24'][t] + '"/><rect x="16" y="16" width="12" height="12" rx="1.5" fill="#d9a520"/>' + [13, 19, 25, 31].map(v => '<path d="M' + v + ' 6v4M' + v + ' 34v4M6 ' + v + 'h4M34 ' + v + 'h4" stroke="#9aa2ae" stroke-width="1.8"/>').join('') + '</svg>',
    turbo: (t) => '<svg viewBox="0 0 44 44"><circle cx="20" cy="24" r="13" fill="' + ['#9aa2ae', '#b0b6c0', '#7b8594', '#4a5160'][t] + '"/><circle cx="20" cy="24" r="6" fill="#3a3f48"/><path d="M20 24l5-3M20 24l-1 6M20 24l-5-3" stroke="#c8ced8" stroke-width="1.6"/><rect x="28" y="8" width="10" height="9" rx="2" fill="#d9a520"/></svg>',
    akumulator: (t) => '<svg viewBox="0 0 44 44"><rect x="7" y="13" width="30" height="22" rx="3" fill="' + ['#22324a', '#1d6fb8', '#1d1f24', '#3a3f48'][t] + '"/><rect x="11" y="9" width="6" height="5" fill="#9aa2ae"/><rect x="27" y="9" width="6" height="5" fill="#9aa2ae"/><path d="M14 24h6M30 24h-6M27 21v6" stroke="#fff" stroke-width="2"/></svg>',
    vzmeti: (t) => '<svg viewBox="0 0 44 44"><path d="M14 8h16M14 36h16M15 10l14 4-14 4 14 4-14 4 14 4-14 4" fill="none" stroke="' + TONE[t] + '" stroke-width="3.2" stroke-linejoin="round"/></svg>',
    amortizerji: (t) => '<svg viewBox="0 0 44 44"><rect x="18" y="4" width="8" height="18" rx="2" fill="#c8ced8"/><rect x="16" y="20" width="12" height="16" rx="2" fill="' + TONE[t] + '"/><circle cx="22" cy="6" r="3" fill="#4a5160"/><circle cx="22" cy="38" r="3" fill="#4a5160"/></svg>',
    stabilizatorji: (t) => '<svg viewBox="0 0 44 44"><path d="M6 12v10q0 8 8 8h16q8 0 8-8V12" fill="none" stroke="' + TONE[t] + '" stroke-width="4" stroke-linecap="round"/></svg>',
    zavore: (t) => '<svg viewBox="0 0 44 44"><circle cx="20" cy="24" r="15" fill="' + ['#9aa2ae', '#b0b6c0', '#7b8594', '#3a3f48'][t] + '"/><circle cx="20" cy="24" r="5" fill="#4a5160"/><path d="M28 6a18 18 0 0 1 10 12l-8 3a10 10 0 0 0-5-7z" fill="' + TONE[t] + '"/></svg>',
    hupa: (t) => '<svg viewBox="0 0 44 44"><path d="M6 18h6l14-9v26l-14-9H6z" fill="' + TONE[t] + '"/><path d="M31 15a10 10 0 0 1 0 14M35 11a16 16 0 0 1 0 22" fill="none" stroke="#4a5160" stroke-width="2.4"/></svg>',
    dim_gum: (t, j) => { const c = [['#e8ebf0', '#e8ebf0', '#e8ebf0', '#e8ebf0'], ['#47a3ff', '#ff4a3a', '#ffd23f', '#a35bff'], ['#1d6fb8', '#2fbf5a', '#ff8a1a', '#ff7ac0'], ['#47a3ff', '#ff4a3a', '#2fbf5a', '#e8ebf0']][t][j];
      return '<svg viewBox="0 0 44 44"><circle cx="15" cy="26" r="9" fill="' + c + '"/><circle cx="25" cy="20" r="11" fill="' + c + '"/><circle cx="31" cy="28" r="8" fill="' + c + '" opacity=".85"/><circle cx="10" cy="36" r="5" fill="#1d1f24"/></svg>'; },
    barva: (t, j, hex) => '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" fill="' + CSS(hex) + '" stroke="#d6dde8" stroke-width="2.5"/>' + (t === 1 ? '<path d="M12 30l20-16" stroke="rgba(255,255,255,.35)" stroke-width="5"/>' : '<ellipse cx="16" cy="15" rx="6" ry="3.5" fill="rgba(255,255,255,' + (0.25 + 0.12 * t) + ')"/>') + '</svg>',
    servis: (i) => ['<svg viewBox="0 0 44 44"><path d="M22 6c7 9 11 15 11 20a11 11 0 0 1-22 0c0-5 4-11 11-20z" fill="#47a3ff"/></svg>',
      '<svg viewBox="0 0 44 44"><path d="M5 30v-6l5-2 5-7h15l7 7 3 2v6z" fill="#7b8594"/><path d="M33 6l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#ffd23f"/></svg>',
      '<svg viewBox="0 0 44 44"><path d="M8 18h21l6-6h3v6l-7 7v8H8z" fill="#4a5160"/><path d="M13 18v-5h9v5" fill="none" stroke="#4a5160" stroke-width="3"/><path d="M22 33c3-4 5-6 5-8a5 5 0 0 0-10 0c0 2 2 4 5 8z" fill="#d9a520"/></svg>',
      '<svg viewBox="0 0 44 44"><path d="M29 6a9 9 0 0 0-8 12L7 32v5h5l14-14a9 9 0 0 0 12-8l-5 2-4-4 2-5z" fill="#2f9e5b"/></svg>'][i],
  };

  /* ---------------- the page's buttons: the money, the car's name, the cars before and after it, the go button ---------------- */
  let thumbs = {}, thumbQ = [];
  function head() {
    const Mm = M(), c = C(), own = c.own;
    $('g-money').textContent = num(S.money);
    $('g-name').textContent = Mm.name;
    $('g-sub').textContent = own ? '' : locked(S.car) ? tr('V POLNI IGRI') : eur(PRICE[S.car] || 0);
    // the go button: choose this car, buy it, or it comes with the full game
    const go = $('g-go'); go.className = 'g-btn g-btn-go';
    if (own) { go.textContent = tr('Izberi'); go.dataset.act = 'go'; }
    else if (locked(S.car)) { go.textContent = tr('V polni igri'); go.className += ' lock'; go.dataset.act = 'locked'; }
    else { go.textContent = tr('Kupi · {0}', eur(PRICE[S.car] || 0)); go.className += ' buy'; go.dataset.act = 'buy'; }
    // the cars before and after it: their pictures (as they stand in their colour, half a metre further back), their names to the ear
    const i = ORDER.indexOf(S.car), pv = ORDER[(i - 1 + ORDER.length) % ORDER.length], nx = ORDER[(i + 1) % ORDER.length];
    for (const [el, id] of [[$('g-prev'), pv], [$('g-next'), nx]]) { const k = S.cars[id], t = thumbs[id] && thumbs[id][k.color]; el.querySelector('.th').innerHTML = t ? '<img alt="" src="' + t + '">' : '';
      el.setAttribute('aria-label', (el.id === 'g-prev' ? tr('Prejšnji avto') : tr('Naslednji avto')) + ': ' + model(id).name); }
    queueThumbs([pv, nx]);
    $('g-track').disabled = false;
    // the cabinet: the lamps over the maquette of the kit the car has (YOUR CAR's for none), RACE locked till SPORT, the tags' prices
    G.front({ lit: Math.max(0, kitOf(c) - 1), lock: [false, false, raceLocked(c)], price: [eur(450), eur(opt('aero', 2, 0)[1])] });
  }
  function render() { head(); if (menu) drawMenu(); }

  /* ---------------- the car pictures for the buttons (drawn by Garage3D one at a time, between frames) ---------------- */
  function queueThumbs(ids) {
    for (const id of ids) { const k = S.cars[id]; if (!(thumbs[id] && thumbs[id][k.color]) && !thumbQ.some(q => q[0] === id && q[1] === k.color)) thumbQ.push([id, k.color]); }
  }
  function thumbStep() {
    if (!thumbQ.length || G.busy) return;
    const [id, col] = thumbQ.shift(), k = S.cars[id];
    try { (thumbs[id] = thumbs[id] || {})[col] = G.thumb({ M: model(id), color: COLORS[col][0], stripe: k.stripe, upg: levels(k.parts) }, 160, 72, { back: 0.5 }); } catch (e) { console.error(e); return; }
    head();
  }

  /* ---------------- the menu of a tapped part: four tabs (its categories: the name and the prices), four tiles (the options: the chosen
     one blue, the others orange), back and buy; ↺ SERIJSKO when the car has something else than its own; the service's and the paint's
     the same (the service: its four as the tiles, no tabs; the paint: the colour of the circle tapped, its four kinds of work) ---------------- */
  let menu = null;   // { el, tab, sel: [t, j], key: the tapped thing, color (the paint's) }
  const tabRange = (el, t) => { const o = EL[el].c[t][1].map((q, j) => price(el, t, j)); return num(Math.min(...o)) + '–' + num(Math.max(...o)) + ' €'; };
  // (the things on the screen of an element's menu: the regal's parts with its options, the maquettes for the aero kit, the circles)
  function keysOf(el) { return G.items.filter(it => (it.kind !== 'car') && ((it.name && REGAL[it.name] && REGAL[it.name][0] === el) || (el === 'aero' && it.kind === 'mq') || (el === 'barva' && it.kind === 'col') || (el === 'servis' && it.kind === 'service'))).map(it => it.key); }
  function keyOfOpt(el, t, j) { if (el === 'aero') { const k = KITS.indexOf(opt(el, t, j)[0][1]); return k >= 0 ? 'mq' + k : null; }
    for (const n in REGAL) if (REGAL[n][0] === el) { const o = findOpt(el, REGAL[n][1]); if (o && o[0] === t && o[1] === j) return 'rgl:' + n; } return null; }
  function openMenu(m) {
    const c = C(); if (!c.own) { toast(locked(S.car) ? tr('{0} je na voljo v polni igri.', M().name) : tr('Najprej kupi avto.'), true); return; }
    menu = m; if (!menu.sel) menu.sel = c.parts[m.el] && m.el !== 'barva' ? c.parts[m.el].slice() : m.el === 'servis' ? [0, 3] : [0, 0]; if (menu.tab == null) menu.tab = menu.sel[0];
    $('g-low').classList.add('hide'); drawMenu(); requestAnimationFrame(() => { if (menu) $('g-menu').classList.add('on'); });
  }
  function closeMenu() { if (!menu) return; menu = null; $('g-menu').classList.remove('on'); $('g-low').classList.remove('hide'); G.markOff(); G.ghostOff(); }
  function drawMenu() {
    const m = menu, c = C(), el = m.el, box = $('g-menu'), en = Lang.cur === 'en';
    let html = '', buy = '', can = true, ok = false, note = '';
    if (el === 'servis') {
      const ps = SRV.map(s => srvPrice(s, c, S.car)), all = fullPrice(ps);
      html += '<div class="g-mh"><h3>' + esc(tr('Servis')) + '</h3><span>' + esc(tr('Stanje {0} %', Math.round((c.cond.clean + c.cond.body + c.cond.engine) / 3 * 100))) + '</span></div><div class="g-mg">' +
        GarageShop.SERVICE.map((q, i) => { const p = i < 3 ? ps[i] : all, done = !p; return '<button class="g-tl' + (m.sel[1] === i ? ' sel' : '') + (done ? ' fit' : '') + '" data-tile="0,' + i + '"><span class="pi">' + ICON.servis(i) + '</span><div><b>' + esc(L2(q[0])) + '</b><small>' + esc(i < 3 ? tr('Stanje {0} %', Math.round(c.cond[SRV[i].id] * 100)) : L2(q[1])) + '</small><i>' + (done ? '✓' : eur(p)) + '</i></div></button>'; }).join('') + '</div>';
      const p = m.sel[1] < 3 ? ps[m.sel[1]] : all; ok = !p; buy = ok ? tr('KOT NOV ✓') : tr('SERVIS · {0}', eur(p)); can = !ok;
    } else {
      const E = EL[el], t = m.tab;
      html += '<div class="g-mt">' + E.c.map((q, i) => '<button class="' + (i === t ? 'sel' : '') + '" data-tab="' + i + '"><b>' + esc(L2(q[0])) + '</b><small>' + tabRange(el, i) + '</small></button>').join('') + '</div>';
      const col = el === 'barva' ? COLORS[m.color != null ? m.color : c.color] : null;
      html += '<div class="g-mh"><h3>' + esc(L2(E.n)) + '</h3>' + (col ? '<span>' + esc(tr(col[1])) + '</span>' : '') + '</div><div class="g-mg">' + E.c[t][1].map((o, j) => {
        const fit = el === 'barva' ? (c.parts.barva ? c.parts.barva[0] === t && c.parts.barva[1] === j : false) && m.color === c.color : c.parts[el] && c.parts[el][0] === t && c.parts[el][1] === j;
        const lock = el === 'aero' && t >= 2 && raceLocked(c), pr = price(el, t, j), promo = pr !== o[1];
        return '<button class="g-tl' + (m.sel[0] === t && m.sel[1] === j ? ' sel' : '') + (fit ? ' fit' : '') + (lock ? ' lock' : '') + '" data-tile="' + t + ',' + j + '"><span class="pi">' + ICON[el](t, j, col && col[0]) + '</span><div><b>' + esc(L2(o[0])) + '</b><small>' + esc(lock ? tr('🔒 najprej športni paket') : L2(o[2])) + '</small><i>' +
          (promo ? '<s>' + eur(o[1]) + '</s><em>' + eur(pr) + '</em>' : eur(pr)) + '</i></div></button>'; }).join('') + '</div>';
      const [st, sj] = m.sel, fitSel = el === 'barva' ? !!c.parts.barva && c.parts.barva[0] === st && c.parts.barva[1] === sj && m.color === c.color : !!c.parts[el] && c.parts[el][0] === st && c.parts[el][1] === sj;
      const lockSel = el === 'aero' && st >= 2 && raceLocked(c);
      ok = fitSel; can = !fitSel && !lockSel; buy = fitSel ? tr('NAMEŠČENO ✓') : lockSel ? tr('🔒 ZAKLENJENO') : tr('KUPI IN NAMESTI · {0}', eur(price(el, st, sj)));
      if (!fitSel && !lockSel && price(el, st, sj) > S.money) note = tr('premalo denarja · imaš {0}', eur(S.money));
      if (el !== 'barva' && c.parts[el]) html += '<div class="g-mx"><button data-mact="stock">↺ ' + esc(tr('SERIJSKO')) + '</button></div>';
    }
    html += '<div class="g-mb"><button class="back" data-mact="close">‹ ' + esc(tr('NAZAJ')) + '</button><button class="buy' + (ok ? ' ok' : '') + '" data-mact="buy"' + (can ? '' : ' disabled') + '>' + esc(buy) + (note ? '<small>' + esc(note) + '</small>' : '') + '</button></div>';
    box.innerHTML = html; void en;
    // the marks: the thing of the chosen tile blue (else the one tapped), the others of this menu orange; the new part seen on the car
    const kb = (el === 'barva' ? 'col' + (m.color != null ? m.color : c.color) : keyOfOpt(el, m.sel[0], m.sel[1])) || m.key;
    G.mark(kb, keysOf(el));
    const E = EL[el]; if (E && E.k) { const P = Object.assign({}, c.parts, { [el]: m.sel }), L0 = levels(c.parts), L1 = levels(P); if (L1[E.k] !== L0[E.k]) G.ghost(E.k, L1[E.k]); else G.ghostOff(); } else G.ghostOff();
    // the menu at the bottom when at the top it would cover what was tapped
    box.classList.remove('bot'); const b = kb && G.box(kb), top = box.offsetTop, h = box.offsetHeight || 330; box.classList.toggle('bot', !!b && b.y < top + h + 8 && b.y + b.h > top);   // (measured where it stands at the top)
  }
  function tile(t, j) { if (!menu) return; menu.sel = [t, j]; drawMenu(); }
  // buying the chosen option: paid, fitted, the menu closed; the car's upgrade played when one of its four levels changes, else a word
  // that it is done (the paint: the chamber; the service: the arms)
  function buyMenu() {
    const m = menu, c = C(); if (!m || !c.own) return; const el = m.el;
    if (el === 'servis') { const ids = m.sel[1] === 3 ? ['clean', 'body', 'engine'] : [SRV[m.sel[1]].id]; closeMenu(); doService(ids); return; }
    const [t, j] = m.sel; if (el === 'aero' && t >= 2 && raceLocked(c)) return;
    if (el === 'barva') { const col = m.color != null ? m.color : c.color; closeMenu(); doPaint(col, [t, j]); return; }
    const p = price(el, t, j); if (!pay(p)) { drawMenu(); return; }
    closeMenu(); fit(el, [t, j]);
  }
  function fit(el, v) {
    const c = C(), L0 = levels(c.parts); if (v) c.parts[el] = v; else delete c.parts[el]; const L1 = levels(c.parts), k = EL[el].k; save(); render();
    const name = L2(EL[el].n) + ' · ' + (v ? L2(opt(el, v[0], v[1])[0]) : tr('serijsko'));
    lastFit = name;
    if (k && L1[k] !== L0[k]) G.upgrade(k, L1[k]); else { G.sfx('ping'); chip(tr('KONČANO'), esc(name)); lastFit = null; }
  }
  let lastFit = null;
  function stock() { if (!menu) return; const el = menu.el; closeMenu(); fit(el, null); }

  /* ---------------- what the buttons and the taps do ---------------- */
  const G = Garage3D;
  let toastT = 0, chipT = 0;
  function toast(t, bad) { const el = $('g-toast'); el.textContent = t; el.className = 'g-toast on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => { el.className = 'g-toast'; }, 2600); }
  function chip(small, big) { const el = $('g-chip'); el.innerHTML = '<small>' + esc(small) + '</small><b>' + big + '</b>'; el.className = 'g-chip on'; clearTimeout(chipT); chipT = setTimeout(() => { el.className = 'g-chip'; }, 2400); }
  function pay(p) {
    if (S.money < p) { const el = $('g-cr'); el.classList.remove('poor'); void el.offsetWidth; el.classList.add('poor'); setTimeout(() => el.classList.remove('poor'), 500); toast(tr('Premalo denarja: potrebuješ {0}, imaš {1}.', eur(p), eur(S.money)), true); return false; }
    if (p > 0) { const from = S.money; S.money -= p; countMoney(from, S.money); const el = $('g-cr'); el.classList.remove('pay'); void el.offsetWidth; el.classList.add('pay'); G.sfx('coin'); }
    return true;
  }
  let moneyAnim = 0;
  function countMoney(a, b) { cancelAnimationFrame(moneyAnim); const t0 = performance.now(), el = $('g-money'); const st = (t) => { const k = Math.min(1, (t - t0) / 700); el.textContent = num(Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)))); if (k < 1) moneyAnim = requestAnimationFrame(st); }; moneyAnim = requestAnimationFrame(st); }
  function pickCar(id) {
    if (id === S.car) return;
    closeMenu(); S.car = id; save(); render();
    $('g-name').parentElement.classList.remove('new'); void $('g-name').offsetWidth; $('g-name').parentElement.classList.add('new');
    G.swap(spec(id));
  }
  // (another profile: its car on the table (the same car again: shown at once with its parts and colour, else it drives in))
  function carAgain() { if (G.cur && G.cur.M.id === S.car) G.show(spec(S.car)); else G.swap(spec(S.car)); }
  function step(d) { const i = ORDER.indexOf(S.car); pickCar(ORDER[(i + d + ORDER.length) % ORDER.length]); }
  function doService(ids) {
    const c = C(); if (!c.own) return;
    const list = SRV.filter(s => ids.includes(s.id) && srvPrice(s, c, S.car) > 0);
    if (!list.length) return;
    const p = list.length > 1 ? fullPrice(list.map(s => srvPrice(s, c, S.car))) : srvPrice(list[0], c, S.car);
    if (!pay(p)) return;
    for (const s of list) c.cond[s.id] = 1;
    save(); render();
    G.service(list.map(s => s.id), { clean: 1, body: 1, engine: 1 });
  }
  function doPaint(col, kind) {
    const c = C(); if (!c.own) return;
    if (col === c.color && kind && c.parts.barva && c.parts.barva[0] === kind[0] && c.parts.barva[1] === kind[1]) return;
    const p = kind ? price('barva', kind[0], kind[1]) : 0;
    if (!pay(p)) return;
    c.color = col; if (kind) c.parts.barva = kind; c.cond.clean = 1; c.cond.body = 1; save(); render(); queueThumbs([S.car]);
    G.paint(COLORS[col][0], c.stripe);
  }
  function buy() {
    const id = S.car, p = PRICE[id] || 0;
    if (!pay(p)) return;
    S.cars[id].own = true; save(); render(); G.sfx('ping');
    chip(tr('NOV AVTO V GARAŽI'), esc(M().name));
  }
  // a tap on the picture: a part of the regal (its element's menu, its option chosen), a maquette (the aero kit), the SERVICE button,
  // a colour circle (the paint in that colour), the lift's plate (the car up or down), the car (its wheels: the tyres; its body: the
  // paint in its colour); elsewhere: the menu closed
  function onTap(x, y) {
    const h = G.pick(x, y); G.sound(S.sound);
    if (!h) { closeMenu(); return; }
    if (h.kind === 'lift') { closeMenu(); G.lift(); return; }
    let m = null;
    if (h.kind === 'mq') m = { el: 'aero', key: h.key, sel: findOpt('aero', KITS[h.i]) };
    else if (h.kind === 'service') m = { el: 'servis', key: h.key };
    else if (h.kind === 'col') m = { el: 'barva', key: h.key, color: h.i, sel: C().parts.barva ? C().parts.barva.slice() : [0, 0] };
    else if (h.key === 'car:wheel') m = { el: 'gume', key: null };
    else if (h.key === 'car:body') m = { el: 'barva', key: null, color: C().color, sel: C().parts.barva ? C().parts.barva.slice() : [0, 0] };
    else if (h.name && REGAL[h.name]) { const [el, en] = REGAL[h.name]; m = { el, key: h.key, sel: findOpt(el, en) }; }
    if (!m) { closeMenu(); return; }
    if (m.sel) m.tab = m.sel[0];
    G.markOff(); G.ghostOff(); menu = null; openMenu(m);
  }
  function onAct(act) {
    G.sound(S.sound);
    switch (act) {
      case 'prev': step(-1); break;
      case 'next': step(1); break;
      case 'buy': buy(); break;
      case 'locked': toast(tr('{0} je na voljo v polni igri.', M().name)); break;
      case 'go': { const go = $('g-go'); go.classList.add('done'); go.textContent = tr('Izbran ✓'); toast(tr('{0} je izbran za naslednjo dirko.', M().name)); setTimeout(() => head(), 1600); break; }
      case 'back': location.href = 'index.html?zaslon=avto' + (GAME_CAR ? '&avto=' + encodeURIComponent(S.car) : ''); break;   // (the game's car screen, on the car shown)
      case 'track': location.href = 'index.html?zaslon=avto&avto=' + encodeURIComponent(S.car) + '&naprej=proga'; break;   // (the game's track screen with the car shown, when it is the player's)
      case 'coins': toast(tr('Imaš {0}.', eur(S.money))); break;
      case 'sound': S.sound = !S.sound; save(); G.sound(S.sound); $('g-snd').classList.toggle('mute', !S.sound); break;
      case 'lang': S.lang = S.lang === 'en' ? 'sl' : 'en'; save(); setLang(); break;
      case 'reset': { const g = S.guide; S = profile(S.mode); S.demo = true; S.guide = g; } save(); thumbs = {}; closeMenu(); render(); carAgain(); toast(tr('Profil je ponastavljen.')); break;
      case 'demo-off': $('g-demo').classList.add('off'); S.demo = false; save(); break;
    }
  }
  function setLang() { Lang.set(S.lang); Lang.apply(document.body); $('g-lang').textContent = S.lang === 'en' ? 'SL' : 'EN'; render(); }

  /* ---------------- the guide on the first visit: what can be tapped, one thing at a time ---------------- */
  const GUIDE_AT = ['rgl:TURBO', 'mq1', 'service', 'col0', '#g-prev,#g-next'];   // (what each step rings: a thing in the picture, or the page's elements, each its own ring)
  const GUIDE = [
    ['Deli na regalu', 'Tapni del na regalu: odpre se meni z možnostmi in cenami. Izbrani del vidiš prosojno na avtu.'],
    ['Aero paketi', 'Makete na omarici so aero paketi tvojega avta. Tapni maketo, da ga izbereš.'],
    ['Servis', 'Rdeči gumb SERVICE: pranje, karoserija, motor in olje.'],
    ['Barva', 'Tapni barvni krog: avto prebarvamo v stekleni komori.'],
    ['Drugi avti', 'Spodnja gumba pripeljeta prejšnji ali naslednji avto.'],
  ];
  let gStep = -1;
  function guide(i) {
    const el = $('g-guide'); gStep = i; if (i >= GUIDE.length) { el.className = 'g-guide'; el.innerHTML = ''; S.guide = 1; save(); return; }
    const k = GUIDE_AT[i], [t, p] = GUIDE[i], app = $('g-app').getBoundingClientRect(), pad = 10;
    const rs = k[0] === '#' ? [...document.querySelectorAll(k)].map(e => e.getBoundingClientRect()).filter(b => b.width).map(b => ({ x: b.left - app.left, y: b.top - app.top, w: b.width, h: b.height })) : [G.box(k)].filter(Boolean);
    const ring = rs.map(r => '<i class="ring" style="left:' + (r.x - pad) + 'px;top:' + (r.y - pad) + 'px;width:' + (Math.max(44, r.w) + 2 * pad) + 'px;height:' + (Math.max(44, r.h) + 2 * pad) + 'px"></i>').join('');
    const r = rs.length ? rs.reduce((a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; }) : null;
    const below = !r || r.y < app.height * 0.5, by = below ? (r ? r.y + Math.max(44, r.h) + pad + 14 : 140) : null;
    // (upright: under or over the ring, the screen's width; lying down: beside it, on the other half, by the ring's height (over it, the
    // ring low on the screen))
    const ty = app.width > app.height * 1.25 ? (r && r.x + r.w / 2 > app.width / 2 ? 'right:auto;' : 'left:auto;') + 'width:' + Math.round(Math.min(380, app.width * 0.42)) + 'px;'
        + (r && r.y + r.h / 2 > app.height * 0.6 ? 'bottom:' + Math.round(app.height - r.y + pad + 14) + 'px' : 'top:' + Math.round(Math.max(56, Math.min((r ? r.y + r.h / 2 : app.height / 2) - 70, app.height - 180))) + 'px')
      : below ? 'top:' + Math.min(by, app.height - 190) + 'px' : 'bottom:' + Math.max(16, app.height - r.y + pad + 14) + 'px';
    el.innerHTML = '<div class="veil"></div>' + ring + '<div class="bub" style="' + ty + '"><b>' + esc(tr(t)) + '</b><p>' + esc(tr(p)) + '</p><div><small>' + (i + 1) + ' / ' + GUIDE.length + '</small><button data-guide="1">' + esc(tr(i + 1 < GUIDE.length ? 'Naprej' : 'Razumem')) + '</button></div></div>';
    el.className = 'g-guide on';
  }

  /* ---------------- the page ---------------- */
  function bind() {
    document.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.guide) { guide(gStep + 1); return; }
      if (t.dataset.act) return onAct(t.dataset.act);
      if (t.dataset.tab) { G.sound(S.sound); if (menu) { menu.tab = +t.dataset.tab; drawMenu(); } return; }
      if (t.dataset.tile) { G.sound(S.sound); const [a, b] = t.dataset.tile.split(',').map(Number); tile(a, b); return; }
      if (t.dataset.mact) { G.sound(S.sound); if (t.dataset.mact === 'close') closeMenu(); else if (t.dataset.mact === 'buy') buyMenu(); else if (t.dataset.mact === 'stock') stock(); return; }
      if (t.dataset.mode) { const g = S.guide; S = profile(t.dataset.mode); S.demo = true; S.guide = g; save(); thumbs = {}; closeMenu(); markMode(); render(); carAgain(); return; }
    });
    document.addEventListener('pointerdown', () => G.sound(S.sound), { once: true });
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'Escape') closeMenu(); });
    G.onTap = onTap;
    G.onHud = (k, d) => {
      if (k === 'busy') { $('g-stage').classList.toggle('busy', !!d); return; }
      if (k === 'power') { const Mm = M(), c = C(), a = Mm.kw * [1, 1.08, 1.16, 1.25][d.from], b = Mm.kw * [1, 1.08, 1.16, 1.25][d.lv]; void c;
        chip(tr('MOČ'), Math.round(a) + ' → <em>' + Math.round(b) + ' kW</em>'); }
      else if (k === 'done') { if (d.kind === 'motor') { lastFit = null; return; }
        const n = { clean: 'Pranje', body: 'Karoserija', engine: 'Motor in olje', paint: 'Barva' }[d.kind];
        chip(tr('KONČANO'), esc(lastFit || (n ? tr(n) : '')) + (lastFit ? '' : ' ✓')); lastFit = null; }
    };
  }
  function markMode() { document.querySelectorAll('#g-modes button').forEach(b => b.classList.toggle('sel', b.dataset.mode === S.mode)); }
  // the picture over the whole page, raised a little (its foot under the buttons)
  // (lying down: raised more and its view taller by how little is free between the buttons at the top and the car's name, the car and
  // the cabinet between them)
  function resize() { const st = $('g-stage'), r = st.getBoundingClientRect(); G.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2));
    const wide = r.width > r.height * 1.25, a = $('g-track').getBoundingClientRect(), b = $('g-name').getBoundingClientRect(), free = b.top > a.bottom ? (b.top - a.bottom) / r.height : 0.55;
    G.shift(Math.round(wide ? r.height * 0.29 * free : Math.min(70, r.height * 0.08)), wide ? free : 1); }

  // opened from the game's car screen (a tap on its car: garaza.html?car=<id>&color=<rrggbb>): that car on the table in that colour (a
  // retired model's: its heir); the money and the cars stay the profile's (the mockup's for now). Without them: the profile's car
  let GAME_CAR = null;
  function fromGame() {
    let P = null; try { P = new URLSearchParams(location.search); } catch (_) { return; }
    const id = heirId((P.get('car') || '').trim().toLowerCase()); if (!ORDER.includes(id)) return;
    GAME_CAR = id; S.car = id;
    const hx = parseInt(P.get('color') || '', 16), ci = COLORS.findIndex(c => c[0] === hx); if (ci >= 0) S.cars[id].color = ci;
    save();
  }

  let last = 0, hold = false, skip = 0;   // (hold: the tests step the clock themselves, advance)
  function loop(t) {
    const dt = last ? (t - last) / 1000 : 0.016; last = t;
    // idle (nothing moving but the dust in the light): about 30 frames a second, for the battery
    if (G.idle && !thumbQ.length && (skip += dt) < 1 / 31) { requestAnimationFrame(loop); return; }
    const step = Math.max(dt, skip); skip = 0;
    if (!hold) G.frame(step);
    if (thumbQ.length) thumbStep();
    requestAnimationFrame(loop);
  }
  function start() {
    S = load(); fromGame(); Lang.set(S.lang);
    if (S.demo === false) $('g-demo').classList.add('off');
    bind(); markMode();
    $('g-snd').classList.toggle('mute', !S.sound);
    G.init($('g-gl')); resize();
    G.show(spec(S.car));
    setLang();
    requestAnimationFrame((t) => { last = t; loop(t); setTimeout(() => { $('g-load').classList.add('done'); if (!S.guide && !hold) guide(0); }, 400); });
    window.__garage = { get S() { return S; }, get gameCar() { return GAME_CAR; }, ORDER, G, onAct, onTap, pickCar, doService, doPaint, buy, fit, levels, price, findOpt, openMenu, closeMenu, tile, buyMenu, guide, get menu() { return menu; }, thumbs: () => thumbs, render, REGAL,
      set hold(v) { hold = !!v; }, advance(sec) { for (let t = 0; t < sec; t += 1 / 30) G.frame(1 / 30, true); G.frame(0.0001); } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
