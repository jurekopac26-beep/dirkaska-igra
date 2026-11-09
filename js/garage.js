/* =========================================================================
   GARAGE — the garage page (garaza.html): the cars, their parts, service and paint, the money. The pictures and the animations are
   Garage3D's; this file keeps the garage's state (the real profile: the career's coins, cars and upgrades, shared with the game; or a mockup's test
   profile with its own money), the page's
   buttons over the picture and the menu of a tapped part (GarageShop's prices: four tabs, four tiles).
   ========================================================================= */
(function () {
  'use strict';
  const tr = (s, ...a) => Lang.tr(s, ...a);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const num = (n) => Lang.thou(n);
  const eur = (n) => Lang.eur(n);   // (as the game's: the coins, 2.500 🪙 / 2,500 🪙, the coin not on its own line)
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
  // service: w = 1 - the row's state; f = (the car's worth / 68.000)^0.8 (the wash ^0.3); the wash (20 + 280 w) f, the body (150 +
  // 15.000 w^1.6) f, the engine and its oil (180 + 9.000 w^1.8) f; under 1.000 to 10, over it to 50 (coins); a full service 15 % off;
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
  const LV = { motor: [8, 16, 25], aero: [3, 6, 9], zavore: [8, 16, 25] };   // (the aero kits STREET, SPORT, RACE: levels 1, 2, 3)
  // (the regal's parts by their plates: the element, the option's English name; the maquettes' kits)
  const REGAL = { SNOW: ['gume', 'Snow'], 'TRACK SLICK': ['gume', 'Track Slick'], MOUNTAIN: ['gume', 'Mountain'],
    SPORT: ['auspuh', 'Sport'], CARBON: ['auspuh', 'Carbon'], RACE: ['auspuh', 'Racing'], TWIN: ['auspuh', 'Dual'], TITANIUM: ['auspuh', 'Titanium'], STRAIGHT: ['auspuh', 'Straight'],
    'CHROME 3-SPOKE': ['platisca', 'Chrome, 3 spokes'], 'GOLD 5-SPOKE': ['platisca', 'Gold, 5 spokes'], 'ORANGE 10-SPOKE': ['platisca', 'Orange, 10 spokes'], 'BLACK MESH': ['platisca', 'Black mesh'],
    'AIR FILTER': ['filter_zraka', 'Air filter'], 'ECU CHIP': ['cip', 'Chip'], TURBO: ['turbo', 'Turbo'], 'LIGHT BATTERY': ['akumulator', 'Light battery'], SPRINGS: ['vzmeti', 'Springs'],
    DAMPERS: ['amortizerji', 'Coilovers'], 'ANTI-ROLL BARS': ['stabilizatorji', 'Anti-roll bars'], 'SPORT PADS': ['zavore', 'Sport pads'], 'FUEL CAP': ['zamasek', 'Anodised red'], 'TYRE SMOKE': ['dim_gum', 'Blue'],
    DUCKTAIL: ['krilo', 'Ducktail'], 'SHORT WING': ['krilo', 'Short wing'], 'LOW WING': ['krilo', 'Low wing'], 'GT WING': ['krilo', 'GT wing'], 'DOUBLE WING': ['krilo', 'Double wing'] };
  // (the cabinet's drawers, sklop 6d: each element's four parts in it (the options' English names), as Garage3D's DRW lays them out: the
  // concept's mn/predali_pred_po with the user's four to a drawer (the chrome indicators, the bolt, the sport discs))
  const DRAWER = { zarometi: ['LED', 'Yellow', 'Smoked', 'Bi-LED'], luc_pod_avtom: ['Blue', 'Turquoise', 'Purple', 'Red'], zadnje_luci: ['Smoked', 'Clear', 'Round', 'LED strip'],
    zmigavci: ['Clear', 'Smoked', 'Sequential', 'Chrome'], maska: ['Honeycomb', 'Mesh', 'Chrome', 'Carbon'], celjusti: ['Red', 'Yellow', 'Gold', 'Body colour'],
    nalepke: ['Flames', 'Chequers', 'Star', 'Big bolt'], zavore: ['Sport pads', 'Sport discs', 'Racing discs', 'Ceramic'] };
  // (a regal's part the shop sells: every plate's element in the game's list of parts (in the horn's place the fuel cap: the game has no
  // horn, docs/deli.md, the user's choice 2. 11. 2026))
  const sold = (n) => !!(REGAL[n] && EL[REGAL[n][0]]);
  const findOpt = (el, en) => { const E = EL[el]; for (let t = 0; t < 4; t++) { const j = E.c[t][1].findIndex(o => o[0][1] === en); if (j >= 0) return [t, j]; } return null; };
  // (the stock part among the options (the tyres': Touring, docs/deli.md); what is on a car: its own part, else that one)
  const STOCK = { gume: findOpt('gume', 'Touring') }, has = (c, el) => c.parts[el] || STOCK[el] || null, isStock = (el, v) => !!v && !!STOCK[el] && STOCK[el][0] === v[0] && STOCK[el][1] === v[1];
  const opt = (el, t, j) => EL[el].c[t][1][j];
  const price = (el, t, j) => { const o = opt(el, t, j); return el === 'gume' && o[4] ? round(o[1] * PROMO) : o[1]; };

  /* ---------------- the state: money, the cars (bought or not), each car's parts, wear and colour ---------------- */
  // Two kinds of profile. The real one (mode 'game', the default: odlocitve denarnica-mockup 1) is the career's (tdgp-career, js/game.js):
  // its coins, the cars bought and their four upgrade levels are the game's, bought here or there (what is bought in the garage the career
  // has and the other way round); what only the garage knows of each car (its parts, colour, wear) is kept in the career too (career.garage).
  // The mockup's three (a new player, the full game, a veteran) keep their own test money and cars in apex-garage, apart from the game.
  const KEY = 'apex-garage', CKEY = 'tdgp-career', CAR0 = Core.CAREER.car0;
  const carNew = (id, own) => ({ own: !!own, parts: {}, have: {}, color: color0(id), stripe: true, cond: { clean: 1, body: 1, engine: 1 } });
  // (the parts a car has bought, each element's options 1 .. 16 (have): a part taken off stays that car's, fitted again free (the user's
  // choice 2. 11. 2026, NAMESTI); every part on the car is among them)
  const optN = (v) => v[0] * 4 + v[1] + 1;
  const haveAdd = (k, el, v) => { if (!v || !EL[el] || isStock(el, v)) return; const a = k.have[el] || (k.have[el] = []), n = optN(v); if (!a.includes(n)) a.push(n); };
  const haveIt = (k, el, v) => !!v && (isStock(el, v) || !!(k.have[el] && k.have[el].includes(optN(v))));
  const haveFitted = (k) => { for (const el in k.parts) haveAdd(k, el, k.parts[el]); };
  // (a car's parts, colour and wear as saved: { deli, color, stripe, cond })
  const carFrom = (o, c) => { o.parts = fromDeli(c.deli); o.color = Number.isInteger(c.color) && c.color >= 0 && c.color < COLORS.length ? c.color : o.color; o.stripe = c.stripe !== false;
    o.have = {}; if (c.have && typeof c.have === 'object') for (const el in c.have) if (EL[el] && Array.isArray(c.have[el])) o.have[el] = c.have[el].filter((n, i, a) => Number.isInteger(n) && n >= 1 && n <= 16 && a.indexOf(n) === i);
    for (const k of ['clean', 'body', 'engine']) o.cond[k] = c.cond && Number.isFinite(c.cond[k]) ? Math.min(1, Math.max(0, c.cond[k])) : o.cond[k]; };
  // (a save kept safe as the game's: a full storage makes room by dropping ghosts, js/shramba.js)
  const keepItem = (k, v) => { try { if (typeof Shramba !== 'undefined') Shramba.keep(k, v); else localStorage.setItem(k, v); } catch (_) { } };
  function profile(mode) {   // the mockup's three profiles: a new player (free), the full game, a veteran
    const S = { v: 2, mode, money: 11500, car: 'pico', cars: {}, rent: null, lang: S0lang(), sound: true, guide: 0, flag: '' };
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
  // (the game's colour (its car screen's, tdgp-settings; none: its first, red): an owned car the garage has not saved yet is drawn in it)
  function S0color() { try { const s = JSON.parse(localStorage.getItem('tdgp-settings') || 'null'), k = s && s.color; if (Number.isInteger(k) && k >= 0 && k < COLORS.length) return k; } catch (_) { } return 0; }
  function S0lang() { try { const s = JSON.parse(localStorage.getItem('tdgp-settings') || 'null'); if (s && s.lang === 'en') return 'en'; } catch (_) { } return 'sl'; }
  let S = null;
  // (a car's parts as the game's contract has them (docs/deli.md): { element: its option 1 .. 16 }; here [tab, place] each)
  const toDeli = (parts) => { const o = {}; for (const el in parts) o[el] = parts[el][0] * 4 + parts[el][1] + 1; return o; };
  const fromDeli = (deli) => { const o = {}; for (const el in deli || {}) { const n = deli[el]; if (EL[el] && Number.isInteger(n) && n >= 1 && n <= 16) o[el] = [Math.floor((n - 1) / 4), (n - 1) % 4]; } return o; };
  // the page's own (the language, the sound, the guide seen, the track's flag, the mockup's row shown) from what was saved
  const pageOwn = (d, s) => { d.lang = s.lang === 'en' ? 'en' : 'sl'; d.sound = s.sound !== false; d.demo = s.demo !== false; d.guide = s.guide ? 1 : 0; d.flag = typeof s.flag === 'string' ? s.flag : ''; return d; };
  function load() {
    let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { s = null; }
    // the real profile: a new player's, an older garage's (the mockup's only before: g unset), or chosen
    if (!s || s.v !== 2 || !s.g || s.mode === 'game') { const d = fromCareer(); if (s && s.v === 2) pageOwn(d, s); else if (s && s.lang === 'en') d.lang = 'en'; return d; }
    if (!s.cars || !s.mode) { const d = profile(s.mode || 'full'); if (s.lang === 'en') d.lang = 'en'; return d; }
    const d = profile(s.mode);
    for (const id of ORDER) { const c = s.cars[id], o = d.cars[id]; if (!c || typeof c !== 'object') continue; o.own = !!c.own; carFrom(o, c); }
    d.money = Number.isFinite(s.money) ? Math.max(0, Math.round(s.money)) : d.money; d.car = ORDER.includes(heirId(s.car)) ? heirId(s.car) : d.car; pageOwn(d, s);
    if (!d.cars.pico.own) d.cars.pico.own = true;
    d.rent = rentFrom(s.rent, d); for (const id of ORDER) haveFitted(d.cars[id]);
    return d;
  }
  // (saved with each car's parts as the game's contract has them: deli; the real profile's in the career, apex-garage only the page's own)
  function save() { try {
    if (S.mode === 'game') { toCareer(); keepItem(KEY, JSON.stringify({ v: 2, g: 1, mode: 'game', car: S.car, lang: S.lang, sound: S.sound, demo: S.demo, guide: S.guide, flag: S.flag })); return; }
    const cars = {}; for (const id in S.cars) { const c = Object.assign({}, S.cars[id], { deli: toDeli(S.cars[id].parts) }); delete c.parts; cars[id] = c; } keepItem(KEY, JSON.stringify(Object.assign({}, S, { g: 1, cars }))); } catch (_) { } }

  /* ---------------- the real profile: the career's (its coins, cars, upgrade levels) ---------------- */
  // (the career as saved; none yet: a new one, not started (on: false; the game starts it from here, js/game.js careerNew))
  // (a car rented for one race (RENT A CAR): one not owned, else none)
  const rentFrom = (r, d) => { const id = r && typeof r === 'object' ? heirId(r.id) : typeof r === 'string' ? heirId(r) : null; return id && ORDER.includes(id) && !d.cars[id].own ? id : null; };
  function careerRead() {
    let c = null; try { c = JSON.parse(localStorage.getItem(CKEY) || 'null'); } catch (_) { c = null; }
    return c && typeof c === 'object' && c.v === 1 ? c : { v: 1, on: false, money: Core.CAREER.start, cars: [CAR0], upg: {}, earned: 0, races: 0, wins: 0 };
  }
  // (a car's four levels in the career: its own (a retired model's: its heir's; both: the better of each), 0 .. 3)
  function careerUpg(c, id) { const L = { motor: 0, gume: 0, zavore: 0, aero: 0 }, U = c.upg && typeof c.upg === 'object' ? c.upg : {};
    for (const k in U) if (heirId(k) === id && U[k] && typeof U[k] === 'object') for (const u in L) { const v = U[k][u]; if (Number.isInteger(v) && v > L[u] && v <= 3) L[u] = v; }
    return L; }
  // the parts of a level the game set (bought in its upgrade screen): that upgrade's parts (the power: the filter, the chip, the turbo, the
  // exhaust; the grip: the kit and the wing; the braking: the brakes; the tyres) replaced by a set that gives the level, the rest kept
  const LEVEL_SET = { motor: [{}, { cip: 'Chip' }, { cip: 'Chip', turbo: 'Sport turbo' }, { cip: 'Chip', turbo: 'Turbo kit' }],   // (8, 16, 25 % of power)
    aero: [{}, { aero: 'Street' }, { aero: 'Sport' }, { aero: 'Race' }], zavore: [{}, { zavore: 'Sport pads' }, { zavore: 'Racing discs' }, { zavore: 'Ceramic' }],
    gume: [{}, { gume: 'Premium Summer' }, { gume: 'Street Semi-slick' }, { gume: 'Track Slick' }] };
  function levelParts(parts, k, n) { const o = {}; for (const el in parts) if (!EL[el] || EL[el].k !== k) o[el] = parts[el];
    const set = LEVEL_SET[k][n] || {}; for (const el in set) { const v = findOpt(el, set[el]); if (v) o[el] = v; } return o; }
  // the real profile from the career: its coins, the cars it has (a retired model's: its heir), each car's parts, colour and wear (the
  // garage's, kept in the career) with the game's levels: a level the game set (its upgrade screen) the parts of it
  function fromCareer() {
    const c = careerRead(), g = c.garage && typeof c.garage === 'object' ? c.garage : {}, gc = g.cars && typeof g.cars === 'object' ? g.cars : {};
    const d = { v: 2, mode: 'game', money: Number.isFinite(c.money) ? Math.max(0, Math.floor(c.money)) : 0, car: CAR0, cars: {}, lang: S0lang(), sound: true, guide: 0, flag: '' };
    const has = new Set((Array.isArray(c.cars) ? c.cars : []).map(heirId)); has.add(CAR0);
    for (const id of ORDER) { const k = d.cars[id] = carNew(id, has.has(id)); if (gc[id] && typeof gc[id] === 'object') carFrom(k, gc[id]); else if (k.own) k.color = S0color();
      if (!k.own) continue; const want = careerUpg(c, id);
      for (const u of ['motor', 'gume', 'zavore', 'aero']) if (levels(k.parts)[u] !== want[u]) k.parts = levelParts(k.parts, u, want[u]); }
    if (ORDER.includes(heirId(g.car))) d.car = heirId(g.car);
    d.rent = rentFrom(c.rent, d); for (const id of ORDER) haveFitted(d.cars[id]);
    return d;
  }
  // and back into it: the coins, the cars (the career's order, a new one after them), their levels from their parts, the garage's own of
  // each car (bought, or not as new: its parts, colour); the rest of the career (its races, wins, rival, on or not) as it was
  function toCareer() {
    const c = careerRead(), cars = (Array.isArray(c.cars) ? c.cars : []).map(heirId).filter((id, i, a) => S.cars[id] && S.cars[id].own && a.indexOf(id) === i);
    for (const id of ORDER) if (S.cars[id].own && !cars.includes(id)) cars.push(id);
    c.money = Math.max(0, Math.round(S.money)); c.cars = cars; c.upg = {}; for (const id of cars) c.upg[id] = levels(S.cars[id].parts);
    const gc = {}; for (const id of ORDER) { const k = S.cars[id], d = toDeli(k.parts);
      if (k.own || Object.keys(d).length || k.color !== color0(id) || !k.stripe) gc[id] = { deli: d, color: k.color, stripe: k.stripe, cond: Object.assign({}, k.cond), have: JSON.parse(JSON.stringify(k.have)) }; }
    c.garage = { car: S.car, cars: gc }; if (S.rent) c.rent = { id: S.rent }; else delete c.rent;
    keepItem(CKEY, JSON.stringify(c));
  }
  const C = () => S.cars[S.car], M = () => model(S.car);
  const locked = (id) => S.mode === 'free' && !FREE.includes(id) && !S.cars[id].own;
  // the game's four upgrade levels from a car's parts (parts: those, or another set to try)
  function levels(parts) { const L = { motor: 0, gume: 0, zavore: 0, aero: 0 }, sum = { motor: 0, aero: 0, zavore: 0 };
    for (const el in parts) { const E = EL[el], [t, j] = parts[el]; if (!E || !E.k) continue; if (E.k === 'gume') L.gume = t; else sum[E.k] += opt(el, t, j)[3]; }
    for (const k in sum) L[k] = LV[k].filter(v => sum[k] >= v).length; return L; }
  const worth = (id) => Math.max(20000, PRICE[id] || 48000);
  // the paint: one price by the car's size (the user's choice 2. and 3. 11. 2026: no tabs of finishes): a kart (under 4 m² of ground)
  // 600, a truck (4 t and more) 12.000, any other car 3.500
  const paintPrice = (id) => { const Mm = model(id); return Mm.len * Mm.wid < 4 ? 600 : Mm.mass >= 4000 ? 12000 : 3500; };
  const srvPrice = (s, c, id) => { const w = 1 - c.cond[s.id]; if (w < 0.02) return 0; const f = Math.pow(worth(id) / 68000, s.e); return round((s.a + s.b * Math.pow(w, s.p)) * f); };
  const spec = (id) => { const c = S.cars[id]; return { M: model(id), color: COLORS[c.color][0], stripe: c.stripe, upg: levels(c.parts), deli: toDeli(c.parts), cond: Object.assign({}, c.cond), num: 0 }; };
  // (the aero kits' RACE tab is locked till the SPORT kit or more is fitted)
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
    zamasek: (t) => '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" fill="#9aa2ae"/><circle cx="22" cy="22" r="13" fill="' + TONE[t] + '"/><circle cx="22" cy="22" r="6" fill="#c8ced8"/><rect x="11" y="19.5" width="22" height="5" rx="2.5" fill="#e8ebf0" transform="rotate(-34 22 22)"/></svg>',
    dim_gum: (t, j) => { const c = [['#e8ebf0', '#e8ebf0', '#e8ebf0', '#e8ebf0'], ['#47a3ff', '#ff4a3a', '#ffd23f', '#a35bff'], ['#1d6fb8', '#2fbf5a', '#ff8a1a', '#ff7ac0'], ['#47a3ff', '#ff4a3a', '#2fbf5a', '#e8ebf0']][t][j];
      return '<svg viewBox="0 0 44 44"><circle cx="15" cy="26" r="9" fill="' + c + '"/><circle cx="25" cy="20" r="11" fill="' + c + '"/><circle cx="31" cy="28" r="8" fill="' + c + '" opacity=".85"/><circle cx="10" cy="36" r="5" fill="#1d1f24"/></svg>'; },
    barva: (t, j, hex) => '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" fill="' + CSS(hex) + '" stroke="#d6dde8" stroke-width="2.5"/>' + (t === 1 ? '<path d="M12 30l20-16" stroke="rgba(255,255,255,.35)" stroke-width="5"/>' : '<ellipse cx="16" cy="15" rx="6" ry="3.5" fill="rgba(255,255,255,' + (0.25 + 0.12 * t) + ')"/>') + '</svg>',
    servis: (i) => ['<svg viewBox="0 0 44 44"><path d="M22 6c7 9 11 15 11 20a11 11 0 0 1-22 0c0-5 4-11 11-20z" fill="#47a3ff"/></svg>',
      '<svg viewBox="0 0 44 44"><path d="M5 30v-6l5-2 5-7h15l7 7 3 2v6z" fill="#7b8594"/><path d="M33 6l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#ffd23f"/></svg>',
      '<svg viewBox="0 0 44 44"><path d="M8 18h21l6-6h3v6l-7 7v8H8z" fill="#4a5160"/><path d="M13 18v-5h9v5" fill="none" stroke="#4a5160" stroke-width="3"/><path d="M22 33c3-4 5-6 5-8a5 5 0 0 0-10 0c0 2 2 4 5 8z" fill="#d9a520"/></svg>',
      '<svg viewBox="0 0 44 44"><path d="M29 6a9 9 0 0 0-8 12L7 32v5h5l14-14a9 9 0 0 0 12-8l-5 2-4-4 2-5z" fill="#2f9e5b"/></svg>'][i],
    // (the cabinet's drawers: hex the car's colour, for its body-coloured ones)
    zarometi: (t, j) => { const c = [['#fff1c4', '#f4f6fa', '#f4f6fa', '#fff1c4'], ['#e8f2ff', '#ffd23f', '#5a6170', '#e8f2ff'], ['#cfe3ff', '#6d7686', '#cfe3ff', '#e8f2ff'], ['#bfe0ff', '#6d7686', '#9fd0ff', '#9fd0ff']][t][j];
      return '<svg viewBox="0 0 44 44"><rect x="3" y="12" width="38" height="20" rx="6" fill="' + (t === 0 && j === 2 ? '#0e0f12' : '#2b2e35') + '"/>' + [15, 29].map(x => '<circle cx="' + x + '" cy="22" r="6" fill="' + c + '"/>' +
        (t >= 2 ? '<circle cx="' + x + '" cy="22" r="8" fill="none" stroke="#7fc4ff" stroke-width="1.6"/>' : '')).join('') + (t === 1 && j === 3 ? '<path d="M8 29h28" stroke="#e8f2ff" stroke-width="2"/>' : '') + '</svg>'; },
    zadnje_luci: (t, j) => { const c = [['#d8261d', '#5a1418', '#e8ebf0', '#d8261d'], ['#d8261d', '#5a1418', '#ff4a3a', '#d8261d'], ['#c41f1a', '#5a1418', '#ff4a3a', '#c41f1a'], ['#ff3a30', '#6a1a1e', '#ff4a3a', '#ff3a30']][t][j];
      return '<svg viewBox="0 0 44 44"><rect x="3" y="13" width="38" height="18" rx="4" fill="#1d1f24"/>' + (t === 0 && j === 3 ? '<circle cx="15" cy="22" r="6" fill="' + c + '"/><circle cx="29" cy="22" r="6" fill="' + c + '"/>' : '<rect x="6" y="16" width="32" height="12" rx="2.5" fill="' + c + '"/>') +
        (j === 3 && t ? '<rect x="7" y="20.5" width="30" height="3" rx="1.5" fill="#ffb3ad"/>' : '') + (t === 0 && j === 2 ? [14, 22, 30].map(x => '<circle cx="' + x + '" cy="22" r="2.5" fill="#d8261d"/>').join('') : '') + '</svg>'; },
    luc_pod_avtom: (t, j) => '<svg viewBox="0 0 44 44">' + (t === 0 ? '<ellipse cx="22" cy="33" rx="19" ry="4.5" fill="' + ['#47a3ff', '#2fe0d0', '#a35bff', '#ff4a3a'][j] + '"/>' : ['#ff4a3a', '#2fbf5a', '#47a3ff'].map((c, k) => '<ellipse cx="' + (10 + k * 12) + '" cy="33" rx="7.5" ry="4" fill="' + c + '"/>').join('')) +
      '<path d="M3 28v-5l5-1 5-7h15l7 6 6 2v5z" fill="#4a5160"/><circle cx="12" cy="29" r="4" fill="#1d1f24"/><circle cx="32" cy="29" r="4" fill="#1d1f24"/></svg>',
    zmigavci: (t, j) => { const chrome = j === 3 && t < 2, lens = [['#ffb02e', '#e8ebf0', '#5a6170', '#ffb02e'], ['#e8ebf0', '#5a6170', '#ffb02e', '#ffb02e'], ['#ffb02e', '#5a6170', '#ffb02e', '#ffb02e'], ['#ffb02e', '#ffb02e', '#ffb02e', '#ffb02e']][t][j];
      return '<svg viewBox="0 0 44 44"><rect x="4" y="14" width="36" height="16" rx="4" fill="' + (chrome ? '#c8ced8' : '#1d1f24') + '"/><rect x="7" y="17" width="30" height="10" rx="2" fill="' + lens + '"/>' +
        (t >= 2 ? [0, 1, 2].map(k => '<path d="M' + (13 + k * 7) + ' 18.5l3.5 3.5-3.5 3.5" fill="none" stroke="#fff3c4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>').join('') : '<circle cx="22" cy="22" r="3" fill="#ff8a1a"/>') + '</svg>'; },
    maska: (t, j, hex) => { const fr = t === 1 ? (j === 3 ? CSS(hex || 0x3b78d8) : '#c8ced8') : t === 3 && (j === 1 || j === 3) ? '#47a3ff' : '#2b2e35', grid = t >= 2 && !(t === 2 && j === 2);
      const pat = grid ? Array.from({ length: 16 }, (_, k) => '<rect x="' + (9 + (k % 4) * 6.5) + '" y="' + (15 + (k >> 2) * 3.6) + '" width="6.5" height="3.6" fill="' + ((k + (k >> 2)) & 1 ? '#3a3f48' : '#16181c') + '"/>').join('') :
        t === 0 && j === 1 ? Array.from({ length: 10 }, (_, k) => '<circle cx="' + (12 + (k % 5) * 5 + (k >= 5 ? 2.5 : 0)) + '" cy="' + (k >= 5 ? 25 : 19.5) + '" r="2" fill="#4a5160"/>').join('') :
        t === 1 && j === 1 ? '<path d="M10 18h24M10 22h24M10 26h24" stroke="#eef1f5" stroke-width="2.2"/>' : '<path d="M9 15l7 14M16 15l7 14M23 15l7 14M30 15l5 10M9 29l7-14M16 29l7-14M23 29l7-14M30 29l5-10" stroke="#6d7686" stroke-width="1.2"/>';
      return '<svg viewBox="0 0 44 44"><rect x="5" y="11" width="34" height="22" rx="5" fill="' + fr + '"/><rect x="8.5" y="14.5" width="27" height="15" rx="2" fill="#16181c"/>' + pat + '</svg>'; },
    nalepke: (t, j) => { const k = [['star', 'bolt', 'cheq', 'flame'], ['star', 'flame', 'cheq', 'bolt'], ['flame', 'cheq', 'stripe', 'band'], ['stripe', 'camo', 'band', 'custom']][t][j], sm = t === 0;
      const M = { star: '<path d="M22 8l4.1 8.6 9.4 1-7 6.4 2 9.3-8.5-4.8-8.5 4.8 2-9.3-7-6.4 9.4-1z" fill="#ffc21a"/>', bolt: '<path d="M26 6L12 25h8.5l-3.5 13 15.5-20H24z" fill="#ffc21a"/>',
        cheq: Array.from({ length: 12 }, (_, q) => ((q % 4) + (q >> 2)) & 1 ? '<rect x="' + (10 + (q % 4) * 6) + '" y="' + (13 + (q >> 2) * 6) + '" width="6" height="6" fill="#1d1f24"/>' : '').join(''),
        flame: '<path d="M8 33c3-3 5-7 5-12 3 2 4 5 4 8 2-4 2-9 1-14 5 3 8 9 8 15 2-2 3-5 3-8 3 3 6 7 7 11z" fill="#ff5a1a"/><path d="M14 33c1-2 2-4 2-6 2 2 3 4 3 6 1-2 2-5 2-8 3 2 4 6 4 8z" fill="#ffd23f"/>',
        stripe: '<path d="M17 6v32M27 6v32" stroke="#d8261d" stroke-width="5"/>', band: '<path d="M6 30l32-16M6 36l32-16" stroke="#ff8a1a" stroke-width="4"/><path d="M6 24l32-16" stroke="#ffc21a" stroke-width="4"/>',
        camo: '<path d="M8 12c6-3 10 2 15 0s9 2 12 6c-4 3-9 0-13 3s-10 3-14-1z" fill="#5d6b3a"/><path d="M10 30c4-4 9-1 13-3s8 1 11 4c-5 3-9 1-13 2s-8 0-11-3z" fill="#3e4a26"/>',
        custom: ['#d8261d', '#ffc21a', '#2fbf5a', '#47a3ff'].map((c, q) => '<circle cx="' + (15 + (q & 1) * 14) + '" cy="' + (15 + (q >> 1) * 14) + '" r="5.5" fill="' + c + '"/>').join('') }[k];
      return '<svg viewBox="0 0 44 44"><rect x="6" y="6" width="32" height="32" rx="3" fill="#eef0f3"/>' + (sm ? '<g transform="translate(6.6 6.6) scale(.7)">' + M + '</g>' : M) + '</svg>'; },
    celjusti: (t, j, hex) => { const c = [['#d8261d', '#ffc21a', '#d9a520', ''], ['#d8261d', '#ffc21a', '#d9a520', ''], ['#d8261d', '#ffc21a', '#d9a520', '#d8261d'], ['#e0362c', '#2f7fe0', '#e0b030', '#e0e4ea']][t][j] || CSS(hex || 0x3b78d8);
      return '<svg viewBox="0 0 44 44"><circle cx="22" cy="25" r="15" fill="#7b8594"/><circle cx="22" cy="25" r="5" fill="#4a5160"/><path d="M8 19.5a15 15 0 0 1 28 0l-6 2.6a8.6 8.6 0 0 0-16 0z" fill="' + c + '"/>' +
        (t === 2 && j === 3 ? '<path d="M22 10a15 15 0 0 1 14 9.5l-6 2.6A8.6 8.6 0 0 0 22 16.4z" fill="#1d1f24"/>' : '') + '</svg>'; },
  };

  /* ---------------- the cabinet's three cars: YOUR CAR the player's (the one on the table when it is theirs, else the last that was),
     RENT A CAR and FOR SALE two others they can have (not theirs, not only in the full game): the next ones after theirs in the order
     (FOR SALE the first, RENT A CAR the second); none left: no maquette ---------------- */
  // (a rented car: one race, no service after it (odlocitve 30. 10.); its rent 5 % of the car's price, at least 1.000 (3. 11.))
  const rentOf = (id) => Math.max(1000, Math.round((PRICE[id] || 0) * 0.05 / 50) * 50);
  let mineId = null;
  function cabinet() {
    if (C().own) mineId = S.car; if (!mineId || !S.cars[mineId] || !S.cars[mineId].own) mineId = ORDER.find(id => S.cars[id].own) || null;
    const i0 = Math.max(0, ORDER.indexOf(mineId)), free = [];
    for (let k = 1; k < ORDER.length && free.length < 2; k++) { const id = ORDER[(i0 + k) % ORDER.length]; if (!S.cars[id].own && !locked(id)) free.push(id); }
    return [mineId, free[1] || null, free[0] || null];
  }

  /* ---------------- the IZBERI PROGO button: the flag of the selected track's country, no words (odlocitve 30. 10.); the country from the
     game (index.html opens the garage with &drzava=, kept in the profile); none known: a chequered flag ---------------- */
  // (each a flag in 30 x 20: [its field, stretched over the button; its emblem, kept in proportion; where the emblem stands])
  const hz = (...c) => c.map((f, i) => '<rect y="' + (i * 20 / c.length).toFixed(2) + '" width="30" height="' + (20 / c.length + 0.05).toFixed(2) + '" fill="' + f + '"/>').join('');
  const vt = (...c) => c.map((f, i) => '<rect x="' + (i * 10) + '" width="10.05" height="20" fill="' + f + '"/>').join('');
  const star = (cx, cy, r, f) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.4 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * q).toFixed(2) + ' ' + (cy + Math.sin(a) * q).toFixed(2); } return '<path d="' + d + 'Z" fill="' + f + '"/>'; };
  const FLAGS = {
    'Slovenija': [hz('#fff', '#0b4ea2', '#ed1c24'), '<g transform="translate(3 0)"><path d="M5.6 3.6h6.4v5.8c0 2.9-1.6 4.4-3.2 5.1-1.6-.7-3.2-2.2-3.2-5.1z" fill="#0b4ea2" stroke="#ed1c24" stroke-width=".7"/><path d="M6.1 10.4l1.3-2.2.9 1.3.5-.8 1.6 2.6c-.6 1.4-1.4 2.1-1.6 2.3-.4-.2-2.1-1.3-2.7-3.2z" fill="#fff"/><g fill="#ffd200"><circle cx="7" cy="5.2" r=".45"/><circle cx="8.8" cy="4.7" r=".45"/><circle cx="10.6" cy="5.2" r=".45"/></g></g>', 'xMinYMid'],
    'Nemčija': [hz('#000', '#dd0000', '#ffce00')], 'Avstrija': [hz('#c8102e', '#fff', '#c8102e')], 'Rusija': [hz('#fff', '#0039a6', '#d52b1e')], 'Monako': [hz('#ce1126', '#fff')],
    'Belgija': [vt('#000', '#fdda24', '#ef3340')], 'Francija': [vt('#0055a4', '#fff', '#ef4135')], 'Italija': [vt('#009246', '#fff', '#ce2b37')],
    'Tajska': ['<rect width="30" height="20" fill="#a51931"/><rect y="3.33" width="30" height="13.34" fill="#f4f5f8"/><rect y="6.67" width="30" height="6.67" fill="#2d2a4a"/>'],
    'Finska': ['<rect width="30" height="20" fill="#fff"/><rect y="7.25" width="30" height="5.5" fill="#002f6c"/>', '<rect x="8" width="5.5" height="20" fill="#002f6c"/>', 'xMinYMid'],
    'Anglija': ['<rect width="30" height="20" fill="#fff"/><rect y="8" width="30" height="4" fill="#ce1124"/>', '<rect x="13" width="4" height="20" fill="#ce1124"/>', 'xMidYMid'],
    'Japonska': ['<rect width="30" height="20" fill="#fff"/>', '<circle cx="15" cy="10" r="6" fill="#bc002d"/>', 'xMidYMid'],
    'ZDA': ['<rect width="30" height="20" fill="#fff"/>' + Array.from({ length: 7 }, (_, i) => '<rect y="' + (i * 40 / 13).toFixed(2) + '" width="30" height="' + (20 / 13).toFixed(2) + '" fill="#b22234"/>').join(''),
      '<rect width="12" height="10.77" fill="#3c3b6e"/>' + Array.from({ length: 20 }, (_, i) => '<circle cx="' + (1.2 + (i % 5) * 2.4 + ((i / 5 | 0) % 2) * 1.2).toFixed(1) + '" cy="' + (1.3 + (i / 5 | 0) * 2.6).toFixed(1) + '" r=".42" fill="#fff"/>').join(''), 'xMinYMin'],
    'Kanada': ['<rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#d52b1e"/><rect x="22.5" width="7.5" height="20" fill="#d52b1e"/>',
      '<path d="M15 4l1 2.2 1.2-.6-.4 3 2.2-1.6-.4 1.4 2 .4-1 1.4.6.6-3.2 2.2.4 1-2.1-.3V16h-.6v-2.3l-2.1.3.4-1-3.2-2.2.6-.6-1-1.4 2-.4-.4-1.4 2.2 1.6-.4-3 1.2.6z" fill="#d52b1e"/>', 'xMidYMid'],
    'Avstralija': ['<rect width="30" height="20" fill="#012169"/>', '<rect width="15" height="10" fill="#012169"/><path d="M0 0L15 10M15 0L0 10" stroke="#fff" stroke-width="2"/><path d="M0 0L15 10M15 0L0 10" stroke="#c8102e" stroke-width=".8"/><path d="M7.5 0V10M0 5H15" stroke="#fff" stroke-width="3.3"/><path d="M7.5 0V10M0 5H15" stroke="#c8102e" stroke-width="2"/>'
      + star(7.5, 15, 2.2, '#fff') + star(22.5, 15.8, 1, '#fff') + star(20, 9.2, 1, '#fff') + star(22.5, 4.2, 1, '#fff') + star(25.4, 8, 1, '#fff') + star(23.6, 11, 0.55, '#fff'), 'xMinYMid'],
    'Brazilija': ['<rect width="30" height="20" fill="#009c3b"/>', '<path d="M15 2.2L27.6 10 15 17.8 2.4 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.4" fill="#002776"/><path d="M10.8 9.2q4.6-1.4 8.6 1.6" stroke="#fff" stroke-width=".7" fill="none"/>', 'xMidYMid'],
    'Čile': [hz('#fff', '#d52b1e'), '<rect width="10" height="10" fill="#0039a6"/>' + star(5, 5, 2.4, '#fff'), 'xMinYMin'],
    'Južna Afrika': ['<rect width="30" height="10" fill="#e03c31"/><rect y="10" width="30" height="10" fill="#001489"/><rect y="7" width="30" height="6" fill="#fff"/><rect y="8.2" width="30" height="3.6" fill="#007749"/>',
      '<path d="M0 0h4.6L14 7h.2v6H14l-9.4 7H0z" fill="#fff"/><path d="M0 0h2.6l10 8.2v3.6l-10 8.2H0z" fill="#007749"/><path d="M0 3.4L9 10 0 16.6z" fill="#ffb81c"/><path d="M0 5L7 10 0 15z" fill="#000"/>', 'xMinYMid'],
    'Kitajska': ['<rect width="30" height="20" fill="#de2910"/>', star(5, 5, 3, '#ffde00') + star(10, 2, 1, '#ffde00') + star(12, 4, 1, '#ffde00') + star(12, 7, 1, '#ffde00') + star(10, 9, 1, '#ffde00'), 'xMinYMin'],
    'Maroko': ['<rect width="30" height="20" fill="#c1272d"/>', '<path d="M15 5.2L17.8 13.9 10.4 8.5h9.2L12.2 13.9z" stroke="#006233" stroke-width=".8" fill="none" stroke-linejoin="round"/>', 'xMidYMid'],
  };
  const CHECK = ['<rect width="30" height="20" fill="#fff"/>' + Array.from({ length: 30 }, (_, i) => (i % 10 + (i / 10 | 0)) % 2 ? '' : '<rect x="' + (i % 10) * 3 + '" y="' + (i / 10 | 0) * 6.67 + '" width="3" height="6.67" fill="#111"/>').join('')];
  function flagButton() {
    const b = $('g-track'), k = FLAGS[S.flag] ? S.flag : ''; b.setAttribute('aria-label', tr('Izberi progo')); b.title = tr('Izberi progo'); if (b.dataset.flag === k && b.firstElementChild) return;
    const f = FLAGS[k] || CHECK; b.dataset.flag = k; b.classList.add('flag');
    b.innerHTML = '<svg class="fl" viewBox="0 0 30 20" preserveAspectRatio="none" aria-hidden="true">' + f[0] + '</svg>' + (f[1] ? '<svg class="fl" viewBox="0 0 30 20" preserveAspectRatio="' + (f[2] || 'xMidYMid') + ' meet" aria-hidden="true">' + f[1] + '</svg>' : '');
  }

  /* ---------------- the page's buttons: the money, the car's name, the cars before and after it, the go button ---------------- */
  let thumbs = {}, thumbQ = [];
  function head() {
    const Mm = M(), c = C(), own = c.own, rented = S.rent === S.car, cab = cabinet();
    $('g-money').textContent = num(S.money);
    $('g-name').textContent = Mm.name;
    $('g-sub').textContent = own ? '' : rented ? tr('NAJET ZA ENO DIRKO') : locked(S.car) ? tr('V POLNI IGRI') : eur(PRICE[S.car] || 0);
    // the go button: choose this car (the player's, or rented), buy it, or it comes with the full game; the RENT A CAR maquette's car
    // can be rented for one race too (its own button before it)
    const go = $('g-go'), rb = $('g-rent'), rentable = !own && !rented && !locked(S.car) && cab[1] === S.car; go.className = 'g-btn g-btn-go';
    rb.hidden = !rentable; rb.parentElement.classList.toggle('two', rentable);
    if (rentable) rb.innerHTML = esc(tr('Najemi')) + '<small>' + esc(eur(rentOf(S.car))) + '</small>';   // (two buttons: each its word over its price)
    if (own || rented) { go.textContent = tr('Izberi'); go.dataset.act = 'go'; }
    else if (rentable) { go.innerHTML = esc(tr('Kupi')) + '<small>' + esc(eur(PRICE[S.car] || 0)) + '</small>'; go.className += ' buy'; go.dataset.act = 'buy'; }
    else if (locked(S.car)) { go.textContent = tr('V polni igri'); go.className += ' lock'; go.dataset.act = 'locked'; }
    else { go.textContent = tr('Kupi · {0}', eur(PRICE[S.car] || 0)); go.className += ' buy'; go.dataset.act = 'buy'; }
    // the cars before and after it: their pictures (as they stand in their colour, half a metre further back), their names to the ear
    const i = ORDER.indexOf(S.car), pv = ORDER[(i - 1 + ORDER.length) % ORDER.length], nx = ORDER[(i + 1) % ORDER.length];
    for (const [el, id] of [[$('g-prev'), pv], [$('g-next'), nx]]) { const k = S.cars[id], t = thumbs[id] && thumbs[id][k.color]; el.querySelector('.th').innerHTML = t ? '<img alt="" src="' + t + '">' : ''; el.querySelector('.nm').textContent = model(id).name;
      el.setAttribute('aria-label', (el.id === 'g-prev' ? tr('Prejšnji avto') : tr('Naslednji avto')) + ': ' + model(id).name); }
    fitNames(); queueThumbs([pv, nx]);
    // IZBERI PROGO: the flag, for the player's car or one rented; else grey, its words: buy or rent the car first (answer 3 of 2. 11.)
    const tb = $('g-track');
    if (own || rented) { tb.disabled = false; tb.classList.remove('not'); flagButton(); }
    else { tb.disabled = true; tb.classList.remove('flag'); tb.classList.add('not'); tb.dataset.flag = '-'; tb.textContent = tr('Najprej kupi ali najemi avto'); tb.removeAttribute('aria-label'); tb.title = ''; }
    // the cabinet: the three cars' maquettes, the lamps over the one on the table (none: another car), the one for sale locked, the
    // tags' prices (the rent, the car's price)
    const on = cab.indexOf(S.car);
    G.front({ cars: cab.map(id => id && spec(id)), lit: on >= 0 ? on : 3, lock: [false, false, !!cab[2]], price: [cab[1] ? eur(rentOf(cab[1])) : '', cab[2] ? eur(PRICE[cab[2]] || 0) : ''] });
  }
  function render() { head(); if (menu) drawMenu(); }

  /* ---------------- the car pictures for the buttons (drawn by Garage3D one at a time, between frames) ---------------- */
  function queueThumbs(ids) {
    for (const id of ids) { const k = S.cars[id]; if (!(thumbs[id] && thumbs[id][k.color]) && !thumbQ.some(q => q[0] === id && q[1] === k.color)) thumbQ.push([id, k.color]); }
  }
  function thumbStep() {
    if (!thumbQ.length || G.busy || G.thumbed) return;
    const [id, col] = thumbQ.shift(), k = S.cars[id];
    try { (thumbs[id] = thumbs[id] || {})[col] = G.thumb({ M: model(id), color: COLORS[col][0], stripe: k.stripe, upg: levels(k.parts) }, 160, 72, { back: 0.5 }); } catch (e) { console.error(e); return; }
    head();
  }

  /* ---------------- the menu of a tapped part: four tabs (its categories: the name and the prices), four tiles (the options: the chosen
     one blue, the others orange), back and buy; ↺ SERIJSKO when the car has something else than its own; the service's and the paint's
     the same (the service: its four as the tiles, no tabs; the paint: the colour of the circle tapped, its four kinds of work) ---------------- */
  let menu = null;   // { el, tab, sel: [t, j], key: the tapped thing, color (the paint's) }
  const tabRange = (el, t) => { const o = EL[el].c[t][1].map((q, j) => price(el, t, j)); return num(Math.min(...o)) + '–' + eur(Math.max(...o)); };   // (850–1.400 🪙 / 850–1,400 🪙)
  // (the things on the screen of an element's menu: the regal's parts with its options, its drawer, the circles)
  function keysOf(el) { return G.items.filter(it => (it.kind !== 'car') && ((it.name && sold(it.name) && REGAL[it.name][0] === el) || (it.kind === 'drw' && it.el === el) || (el === 'barva' && it.kind === 'col') || (el === 'servis' && it.kind === 'service'))).map(it => it.key); }
  // (an option's thing: its part on the regal, else its drawer (from: the menu's tapped thing, kept when it holds the option too))
  const inDrawer = (el, t, j) => !!DRAWER[el] && DRAWER[el].some(n => { const o = findOpt(el, n); return !!o && o[0] === t && o[1] === j; });
  function keyOfOpt(el, t, j, from) {
    if (from && from.startsWith('drw:') && inDrawer(el, t, j)) return from;
    for (const n in REGAL) if (REGAL[n][0] === el) { const o = findOpt(el, REGAL[n][1]); if (o && o[0] === t && o[1] === j) return 'rgl:' + n; }
    return inDrawer(el, t, j) ? 'drw:' + el : null; }
  function openMenu(m) {
    const c = C(); if (!c.own) { toast(locked(S.car) ? tr('{0} je na voljo v polni igri.', M().name) : S.rent === S.car ? tr('Najet avto vozi tak, kot je.') : tr('Najprej kupi avto.'), true); return; }
    menu = m; if (!menu.sel) menu.sel = has(c, m.el) && m.el !== 'barva' ? has(c, m.el).slice() : m.el === 'servis' ? [0, 3] : [0, 0]; if (menu.tab == null) menu.tab = menu.sel[0];
    $('g-low').classList.add('hide'); drawMenu(); requestAnimationFrame(() => { if (menu) $('g-menu').classList.add('on'); });
  }
  function closeMenu() { if (!menu) return; menu = null; $('g-menu').classList.remove('on'); $('g-low').classList.remove('hide'); G.markOff(); G.ghostOff(); G.drawer(null); G.drop(0); }
  function drawMenu() {
    const m = menu, c = C(), el = m.el, box = $('g-menu'), en = Lang.cur === 'en';
    let html = '', buy = '', can = true, ok = false, note = '';
    if (el === 'servis') {
      const ps = SRV.map(s => srvPrice(s, c, S.car)), all = fullPrice(ps);
      html += '<div class="g-mh"><h3>' + esc(tr('Servis')) + '</h3><span>' + esc(tr('Stanje {0} %', Math.round((c.cond.clean + c.cond.body + c.cond.engine) / 3 * 100))) + '</span></div><div class="g-mg">' +
        GarageShop.SERVICE.map((q, i) => { const p = i < 3 ? ps[i] : all, done = !p; return '<button class="g-tl' + (m.sel[1] === i ? ' sel' : '') + (done ? ' fit' : '') + '" data-tile="0,' + i + '"><span class="pi">' + ICON.servis(i) + '</span><div><b>' + esc(L2(q[0])) + '</b><small>' + esc(i < 3 ? tr('Stanje {0} %', Math.round(c.cond[SRV[i].id] * 100)) : L2(q[1])) + '</small><i>' + (done ? '✓' : eur(p)) + '</i></div></button>'; }).join('') + '</div>';
      const p = m.sel[1] < 3 ? ps[m.sel[1]] : all; ok = !p; buy = ok ? tr('KOT NOV ✓') : tr('SERVIS · {0}', eur(p)); can = !ok;
      if (!ok && p > S.money) note = tr('premalo denarja · imaš {0}', eur(S.money));
    } else if (el === 'barva') {   // (the eight colours as the circles round the ring, one price: the car's size)
      const cur = m.color != null ? m.color : c.color, p = paintPrice(S.car);
      html += '<div class="g-mh"><h3>' + esc(L2(EL.barva.n)) + '</h3><span>' + esc(tr(COLORS[cur][1])) + '</span></div><div class="g-mg g-mc">' + COLORS.map((q, i) => '<button class="g-tl' + (i === cur ? ' sel' : '') + (i === c.color ? ' fit' : '') + '" data-col="' + i + '" aria-label="' + esc(tr(q[1])) + '"><span class="pi">' + ICON.barva(0, 0, q[0]) + '</span></button>').join('') + '</div>';
      ok = cur === c.color; can = !ok; buy = ok ? tr('NAMEŠČENO ✓') : tr('KUPI IN NAMESTI · {0}', eur(p));
      if (!ok && p > S.money) note = tr('premalo denarja · imaš {0}', eur(S.money));
    } else {
      const E = EL[el], t = m.tab;
      html += '<div class="g-mt">' + E.c.map((q, i) => '<button class="' + (i === t ? 'sel' : '') + '" data-tab="' + i + '"><b>' + esc(L2(q[0])) + '</b><small>' + tabRange(el, i) + '</small></button>').join('') + '</div>';
      const col = el === 'barva' ? COLORS[m.color != null ? m.color : c.color] : null;
      html += '<div class="g-mh"><h3>' + esc(L2(E.n)) + '</h3>' + (col ? '<span>' + esc(tr(col[1])) + '</span>' : '') + '</div><div class="g-mg">' + E.c[t][1].map((o, j) => {
        const fit = el === 'barva' ? (c.parts.barva ? c.parts.barva[0] === t && c.parts.barva[1] === j : false) && m.color === c.color : !!has(c, el) && has(c, el)[0] === t && has(c, el)[1] === j;
        const lock = el === 'aero' && t >= 2 && raceLocked(c), pr = price(el, t, j), promo = pr !== o[1], mine = !fit && haveIt(c, el, [t, j]);
        return '<button class="g-tl' + (m.sel[0] === t && m.sel[1] === j ? ' sel' : '') + (fit ? ' fit' : '') + (lock ? ' lock' : '') + '" data-tile="' + t + ',' + j + '"><span class="pi">' + ICON[el](t, j, col ? col[0] : COLORS[c.color] && COLORS[c.color][0]) + '</span><div><b>' + esc(L2(o[0])) + '</b><small>' + esc(lock ? tr('🔒 najprej športni paket') : L2(o[2])) + '</small><i>' +
          (mine ? '<em class="own">' + esc(tr('tvoj')) + '</em>' : promo ? '<s>' + eur(o[1]) + '</s><em>' + eur(pr) + '</em>' : eur(pr)) + '</i></div></button>'; }).join('') + '</div>';
      const [st, sj] = m.sel, fitSel = el === 'barva' ? !!c.parts.barva && c.parts.barva[0] === st && c.parts.barva[1] === sj && m.color === c.color : !!has(c, el) && has(c, el)[0] === st && has(c, el)[1] === sj;
      const lockSel = el === 'aero' && st >= 2 && raceLocked(c), mineSel = haveIt(c, el, [st, sj]);
      ok = fitSel; can = !fitSel && !lockSel; buy = fitSel ? tr('NAMEŠČENO ✓') : lockSel ? tr('🔒 ZAKLENJENO') : mineSel ? tr('NAMESTI') : tr('KUPI IN NAMESTI · {0}', eur(price(el, st, sj)));
      if (!fitSel && !lockSel && !mineSel && price(el, st, sj) > S.money) note = tr('premalo denarja · imaš {0}', eur(S.money));
      if (el !== 'barva' && c.parts[el] && !isStock(el, c.parts[el])) html += '<div class="g-mx"><button data-mact="stock">↺ ' + esc(tr('SERIJSKO')) + '</button></div>';
    }
    html += '<div class="g-mb"><button class="back" data-mact="close">‹ ' + esc(tr('NAZAJ')) + '</button><button class="buy' + (ok ? ' ok' : '') + '" data-mact="buy"' + (can ? '' : ' disabled') + '>' + esc(buy) + (note ? '<small>' + esc(note) + '</small>' : '') + '</button></div>';
    box.innerHTML = html; void en;
    // the marks: the thing of the chosen tile blue (else the one tapped), the others of this menu orange; the new part seen on the car
    const kb = (el === 'barva' ? 'col' + (m.color != null ? m.color : c.color) : keyOfOpt(el, m.sel[0], m.sel[1], m.key)) || m.key;
    G.mark(kb, keysOf(el), !!m.car);   // (the car bright in the veil only when it was tapped)
    G.drawer(kb && kb.startsWith('drw:') ? el : null);   // (the chosen part's drawer out)
    const E = EL[el]; if (E && E.k) { const P = Object.assign({}, c.parts, { [el]: m.sel }), L0 = levels(c.parts), L1 = levels(P); if (L1[E.k] !== L0[E.k]) G.ghost(E.k, L1[E.k]); else G.ghostOff(); } else G.ghostOff();
    // the menu at the bottom when at the top it would cover what was tapped; a drawer: the menu stays at the top, the picture lowered
    // till the drawer is under it (when it fits on the screen; measured as the picture stands without it)
    box.classList.remove('bot'); const b = kb && G.box(kb), top = box.offsetTop, h = box.offsetHeight || 330, dw = !!kb && kb.startsWith('drw:') && G.drawerBox(kb.slice(4));
    let drop = 0; if (dw) { const need = Math.ceil(top + h + 8 - dw.y); if (need > 0 && dw.y + dw.h + need <= $('g-stage').clientHeight - 4) drop = need; }
    G.drop(drop); box.classList.toggle('bot', !dw && !!b && b.y < top + h + 8 && b.y + b.h > top);   // (measured where it stands at the top)
  }
  function tile(t, j) { if (!menu) return; menu.sel = [t, j]; drawMenu(); }
  // buying the chosen option: paid, fitted, the menu closed; the car's upgrade played when one of its four levels changes, else a word
  // that it is done (the paint: the chamber; the service: the arms)
  function buyMenu() {
    const m = menu, c = C(); if (!m || !c.own) return; const el = m.el;
    if (el === 'servis') { const ids = m.sel[1] === 3 ? ['clean', 'body', 'engine'] : [SRV[m.sel[1]].id], p = svcCost(c, ids).p; if (S.money < p) { pay(p); return; } closeMenu(); doService(ids); return; }   // (too little money: the menu stays, as a part's)
    const [t, j] = m.sel; if (el === 'aero' && t >= 2 && raceLocked(c)) return;
    if (el === 'barva') { const col = m.color != null ? m.color : c.color, p = paintPrice(S.car); if (col === c.color) return; if (S.money < p) { pay(p); return; } closeMenu(); doPaint(col, true); return; }
    const mine = haveIt(c, el, [t, j]), p = mine ? 0 : price(el, t, j); if (!pay(p)) { drawMenu(); return; }   // (a part the car has: fitted again free)
    const from = m.key; haveAdd(c, el, [t, j]); closeMenu(); fit(el, [t, j], from);
  }
  function fit(el, v, from) {
    const c = C(), L0 = levels(c.parts), was = c.parts[el]; if (v && !isStock(el, v)) c.parts[el] = v; else delete c.parts[el]; const L1 = levels(c.parts), k = EL[el].k; save(); render();
    const name = L2(EL[el].n) + ' · ' + (v ? L2(opt(el, v[0], v[1])[0]) : tr('serijsko'));
    lastFit = name;
    // (a tyre or a rim: an arm puts it on, from the regal when it stands there, else off the trolley; KONČANO when it is on)
    if (el === 'gume' || el === 'platisca') { const key = v ? keyOfOpt(el, v[0], v[1]) : null; G.fit(el, spec(S.car), { src: key && key.startsWith('rgl:') ? key : null }); return; }
    // (the other parts, sklop 8: an arm puts it on (off the regal, out of its drawer, else off the trolley) and gives the old one back;
    // a level changed: the car with the old levels, its upgrade's show at the end (its parts, the chip MOČ), KONČANO else)
    const key = v ? keyOfOpt(el, v[0], v[1], from) : null, lvc = !!k && L1[k] !== L0[k], sp = spec(S.car), real = (w) => w && !isStock(el, w) ? w : null; if (lvc) sp.upg = L0;
    G.fitPart(el, sp, { src: key, from: real(was) ? optN(was) : 0, to: real(v) ? optN(v) : 0, fromK: slotOf(el, real(was)), toK: slotOf(el, real(v)), up: lvc ? [k, L1[k]] : null });
  }
  let lastFit = null;
  // (an option's place among its drawer's four, -1: not in it)
  const slotOf = (el, v) => !v || !DRAWER[el] ? -1 : DRAWER[el].findIndex(n => { const o = findOpt(el, n); return !!o && o[0] === v[0] && o[1] === v[1]; });
  function stock() { if (!menu) return; const el = menu.el; closeMenu(); fit(el, null); }

  /* ---------------- what the buttons and the taps do ---------------- */
  const G = Garage3D;
  let toastT = 0, chipT = 0;
  function toast(t, bad) { const el = $('g-toast'); el.textContent = t; el.className = 'g-toast on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => { el.className = 'g-toast'; }, 2600); }
  // (the chip over the car: a word with its picture (as the game's stats: the power's bolt, the state's wrench), what changed: before → after)
  const CHIP_I = {
    power: '<svg viewBox="0 0 32 32"><path d="M18 3L7 18h8l-2 11 12-16h-8z" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/></svg>',
    cond: '<svg viewBox="0 0 32 32"><path d="M20.5 4.5a6.5 6.5 0 0 0-6 9L5 23v4h4l9.5-9.5a6.5 6.5 0 0 0 9-6l-4 1.5-3-3 1.5-4z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>' };
  let lastChip = null;
  function chip(small, big, icon) { const el = $('g-chip'); lastChip = { small, big: big.replace(/<[^>]+>/g, ''), icon: icon || '' };
    el.innerHTML = '<small>' + (icon ? '<i>' + CHIP_I[icon] + '</i>' : '') + esc(small) + '</small><b>' + big + '</b>'; el.className = 'g-chip on'; clearTimeout(chipT); chipT = setTimeout(() => { el.className = 'g-chip'; }, 2400); }
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
  function carAgain() { if (G.cur && G.cur.M.id === S.car) G.reshow(spec(S.car)); else G.swap(spec(S.car)); }   // (queued: not over a show that plays)
  function step(d) { const i = ORDER.indexOf(S.car); pickCar(ORDER[(i + d + ORDER.length) % ORDER.length]); }
  // (what a service costs: the items it does (not those as new), their price (more than one: the full service's 15 % off))
  function svcCost(c, ids) { const list = SRV.filter(s => ids.includes(s.id) && srvPrice(s, c, S.car) > 0); return { list, p: fullPrice(list.map(s => srvPrice(s, c, S.car))) }; }
  const condPc = (c) => Math.round((c.cond.clean + c.cond.body + c.cond.engine) / 3 * 100);   // (the state: as the service's menu says it)
  let svcChip = null;
  function doService(ids) {
    const c = C(); if (!c.own) return;
    const { list, p } = svcCost(c, ids);
    if (!list.length) return;
    if (!pay(p)) return;
    const a = condPc(c); for (const s of list) c.cond[s.id] = 1;
    svcChip = { a, b: condPc(c), left: list.length };   // (its end on the chip: the state before → after, as the power after an upgrade)
    save(); render();
    G.service(list.map(s => s.id), { clean: 1, body: 1, engine: 1 });
  }
  // (paid: the paint's price, paintPrice; else free, as the colour the game brings)
  function doPaint(col, paid) {
    const c = C(); if (!c.own || col === c.color) return;
    if (!pay(paid ? paintPrice(S.car) : 0)) return;
    c.color = col; c.cond.clean = 1; c.cond.body = 1; save(); render(); queueThumbs([S.car]);
    G.paint(COLORS[col][0], c.stripe);
  }
  function buy() {
    const id = S.car, p = PRICE[id] || 0;
    if (S.cars[id].own || !pay(p)) return;
    S.cars[id].own = true; if (S.rent === id) S.rent = null; save(); render(); G.sfx('ping');
    chip(tr('NOV AVTO V GARAŽI'), esc(M().name));
  }
  // RENT A CAR: the car for one race (its rent paid now; another rented before is given back), driven as it is, no service after
  // (one car rented at a time: another one rented before the race gives the first back, its rent paid back)
  function rent() {
    const id = S.car, old = S.rent && S.rent !== id ? S.rent : null; if (S.cars[id].own || S.rent === id || locked(id)) return;
    const net = rentOf(id) - (old ? rentOf(old) : 0); if (net > 0 && !pay(net)) return;
    if (net < 0) { const from = S.money; S.money -= net; countMoney(from, S.money); }
    S.rent = id; save(); render(); G.sfx('ping'); if (old) toast(tr('{0} je vrnjen, najemnina povrnjena.', model(old).name));
    chip(tr('NAJET ZA ENO DIRKO'), esc(M().name));
  }
  // a tap on the picture: a part of the regal (its element's menu, its option chosen), a drawer of the cabinet (its element's menu, it comes
  // out), a maquette (its car onto the table), the SERVICE button,
  // a colour circle (the paint in that colour), the lift's plate (the car up or down), the car (its wheels: the tyres; its body: the
  // aero kits); elsewhere: the menu closed
  function onTap(x, y) {
    const h = G.pick(x, y); G.sound(S.sound);
    if (!h) { closeMenu(); return; }
    if (h.kind === 'lift') { closeMenu(); G.lift(); return; }
    let m = null;
    if (h.kind === 'mq') { const id = cabinet()[h.i]; closeMenu(); if (id) pickCar(id); return; }   // (a maquette: its car onto the table)
    if (h.kind === 'service') m = { el: 'servis', key: h.key };
    else if (h.kind === 'drw' && EL[h.el]) m = { el: h.el, key: h.key, sel: has(C(), h.el) ? null : findOpt(h.el, DRAWER[h.el][0]) };   // (a drawer: the part on the car, else its drawer's first)
    else if (h.kind === 'col') m = { el: 'barva', key: h.key, color: h.i, sel: [0, 0] };
    else if (h.key === 'car:wheel') m = { el: 'gume', key: null, car: true };
    else if (h.key === 'car:body') m = { el: 'aero', key: null, car: true };   // (the aero kits: a tap on the car (odlocitve 30. 10., V1 b); the paint: the circles)
    else if (h.name && sold(h.name)) { const [el, en] = REGAL[h.name]; m = { el, key: h.key, sel: findOpt(el, en) }; }
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
      case 'rent': rent(); break;
      case 'locked': toast(tr('{0} je na voljo v polni igri.', M().name)); break;
      case 'go': { const go = $('g-go'); go.classList.add('done'); go.textContent = tr('Izbran ✓'); toast(tr('{0} je izbran za naslednjo dirko.', M().name)); setTimeout(() => head(), 1600); break; }
      case 'back': location.href = 'index.html?zaslon=avto' + (GAME_CAR ? '&avto=' + encodeURIComponent(S.car) : ''); break;   // (the game's car screen, on the car shown)
      case 'track': if (!C().own && S.rent !== S.car) break; location.href = 'index.html?zaslon=avto&avto=' + encodeURIComponent(S.car) + '&naprej=proga'; break;   // (the game's track screen with the car shown, when it is the player's)
      case 'coins': toast(tr('Imaš {0}.', eur(S.money))); break;
      case 'sound': S.sound = !S.sound; save(); G.sound(S.sound); $('g-snd').classList.toggle('mute', !S.sound); break;
      case 'lang': S.lang = S.lang === 'en' ? 'sl' : 'en'; save(); setLang(); break;
      case 'reset': if (S.mode === 'game') break; { const g = S.guide, fl = S.flag; S = profile(S.mode); S.demo = true; S.guide = g; S.flag = fl; } save(); thumbs = {}; closeMenu(); render(); carAgain(); toast(tr('Profil je ponastavljen.')); break;
      case 'demo-off': $('g-demo').classList.add('off'); S.demo = false; save(); resize(); break;   // (the buttons at the top higher: the picture fitted again)
    }
  }
  function setLang() { Lang.set(S.lang); Lang.apply(document.body); $('g-lang').textContent = S.lang === 'en' ? 'SL' : 'EN'; render(); }

  /* ---------------- the guide on the first visit: what can be tapped, one thing at a time ---------------- */
  const GUIDE_AT = ['rgl:TURBO', 'mq0,mq1,mq2', 'drw:zarometi,drw:zavore', 'service', 'col0', '#g-prev,#g-next'];   // (what each step rings: things in the picture (one ring round them), or the page's elements, each its own ring)
  const GUIDE = [
    ['Deli na regalu', 'Tapni del na regalu: odpre se meni z možnostmi in cenami. Izbrani del vidiš prosojno na avtu.'],
    ['Avti na omarici', 'Na omarici so tvoj avto, avto za najem in avto naprodaj. Tapni maketo in avto se pripelje na ploščo.'],
    ['Predali', 'V predalih omarice so luči, maske, nalepke, čeljusti in zavore. Tapni predal in izvleče se.'],
    ['Servis', 'Rdeči gumb SERVICE: pranje, karoserija, motor in olje.'],
    ['Barva', 'Tapni barvni krog: avto prebarvamo v stekleni komori.'],
    ['Drugi avti', 'Spodnja gumba pripeljeta prejšnji ali naslednji avto.'],
  ];
  let gStep = -1;
  function guide(i) {
    const el = $('g-guide'); gStep = i; if (i >= GUIDE.length) { el.className = 'g-guide'; el.innerHTML = ''; S.guide = 1; save(); return; }
    const k = GUIDE_AT[i], [t, p] = GUIDE[i], app = $('g-app').getBoundingClientRect(), pad = 10;
    const uni = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; }, bs = k[0] === '#' ? [] : k.split(',').map(q => G.box(q)).filter(Boolean);
    const rs = k[0] === '#' ? [...document.querySelectorAll(k)].map(e => e.getBoundingClientRect()).filter(b => b.width).map(b => ({ x: b.left - app.left, y: b.top - app.top, w: b.width, h: b.height })) : bs.length ? [bs.reduce(uni)] : [];
    const ring = rs.map(r => '<i class="ring" style="left:' + (r.x - pad) + 'px;top:' + (r.y - pad) + 'px;width:' + (Math.max(44, r.w) + 2 * pad) + 'px;height:' + (Math.max(44, r.h) + 2 * pad) + 'px"></i>').join('');
    const r = rs.length ? rs.reduce(uni) : null;
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
      if (t.dataset.col) { G.sound(S.sound); if (menu) { menu.color = +t.dataset.col; drawMenu(); } return; }
      if (t.dataset.mact) { G.sound(S.sound); if (t.dataset.mact === 'close') closeMenu(); else if (t.dataset.mact === 'buy') buyMenu(); else if (t.dataset.mact === 'stock') stock(); return; }
      if (t.dataset.mode) { const g = S.guide, fl = S.flag; S = t.dataset.mode === 'game' ? fromCareer() : profile(t.dataset.mode); S.demo = true; S.guide = g; S.flag = fl; save(); thumbs = {}; closeMenu(); markMode(); render(); carAgain(); return; }
    });
    document.addEventListener('pointerdown', () => G.sound(S.sound), { once: true });
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'Escape') closeMenu(); });
    G.onTap = onTap;
    G.onHud = (k, d) => {
      if (k === 'busy') { $('g-stage').classList.toggle('busy', !!d); return; }
      if (k === 'power') { const kw = d.kw || M().kw, a = kw * [1, 1.08, 1.16, 1.25][d.from], b = kw * [1, 1.08, 1.16, 1.25][d.lv];   // (the upgraded car's: another may be chosen meanwhile)
        chip(tr('MOČ'), Math.round(a) + ' kW → <em>' + Math.round(b) + ' kW</em>', 'power'); }
      else if (k === 'done') { if (d.kind === 'motor') { lastFit = null; return; }
        if (svcChip && SRV.some(s => s.id === d.kind) && --svcChip.left <= 0) { const q = svcChip; svcChip = null;   // (the service's last item done: the state before → after)
          chip(tr('STANJE'), q.a + ' % → <em>' + q.b + ' %</em>', 'cond'); lastFit = null; return; }
        const n = { clean: 'Pranje', body: 'Karoserija', engine: 'Motor in olje', paint: 'Barva' }[d.kind];
        chip(tr('KONČANO'), esc(lastFit || (n ? tr(n) : '')) + (lastFit ? '' : ' ✓')); lastFit = null; }
    };
  }
  function markMode() { document.querySelectorAll('#g-modes button').forEach(b => b.classList.toggle('sel', b.dataset.mode === S.mode)); $('g-demo').classList.toggle('game', S.mode === 'game'); }   // (the real profile: no reset)
  // the picture over the whole page, raised a little (its foot under the buttons): the regal's top under the buttons at the top, the plan
  // chest down to the cars' buttons (Garage3D.fitShift; lying down the whole regal, odlocitve 8. 11.)
  // (the cars' names in their buttons: a word not broken, the letters smaller till the longest fits (a narrow button: lying down))
  function fitNames() { for (const el of [$('g-prev'), $('g-next')]) { const n = el.querySelector('.nm'); n.style.fontSize = ''; for (let f = 12; f > 8 && n.scrollWidth > n.clientWidth + 0.5; ) n.style.fontSize = --f + 'px'; } }
  function resize() { const st = $('g-stage'), r = st.getBoundingClientRect(); fitNames();
    const a = $('g-track').getBoundingClientRect(), b = $('g-prev').getBoundingClientRect();
    G.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2));
    G.fitShift(a.bottom - r.top, b.top - r.top); }

  // opened from the game's car screen (a tap on its car: garaza.html?car=<id>&color=<rrggbb>): that car on the table in that colour (a
  // retired model's: its heir); the money and the cars stay the profile's (the real one: the career's). Without them: the profile's car
  let GAME_CAR = null;
  function fromGame() {
    let P = null; try { P = new URLSearchParams(location.search); } catch (_) { return; }
    const id = heirId((P.get('car') || '').trim().toLowerCase()); if (!ORDER.includes(id)) return;
    GAME_CAR = id; S.car = id;
    const hx = parseInt(P.get('color') || '', 16), ci = COLORS.findIndex(c => c[0] === hx); if (ci >= 0) S.cars[id].color = ci;
    const dz = (P.get('drzava') || '').trim(); if (FLAGS[dz]) S.flag = dz;   // (the selected track's country: its flag on IZBERI PROGO)
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
    window.__garage = { get chip() { return lastChip; }, get S() { return S; }, get gameCar() { return GAME_CAR; }, ORDER, G, onAct, onTap, pickCar, doService, doPaint, buy, rent, rentOf, paintPrice, cabinet, fit, levels, price, findOpt, openMenu, closeMenu, tile, buyMenu, guide, get menu() { return menu; }, thumbs: () => thumbs, render, REGAL, DRAWER,
      set hold(v) { hold = !!v; }, advance(sec) { for (let t = 0; t < sec; t += 1 / 30) G.frame(1 / 30, true); G.frame(0.0001); } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
