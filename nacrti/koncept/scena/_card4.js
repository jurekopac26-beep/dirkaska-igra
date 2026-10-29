// ==== _card4.js: THE MENU CARD WITH FOUR OPTIONS (round MN; the user: "V meniju naj se vedno odprejo 4 možnosti, posodobi design menuja";
//      "Ko uporabnik klikne na element, naj se takoj pokaže na avtu ta element v 3D obliki, prosojen ... Vedno je eden od 4 izbran že pod
//      defaultom, in to je najcenejši.") ====
// README (how to call it; load it after the shared bodies and the store, before your frames: it uses window.MENUS / MENUS_W, div(), FONT,
// T, G3, and for the pictures the store's builders when they exist: amSrc / amModel / amMat / amClass / amPaint (the turntable's car),
// tyre / TSETS, itemExhaust / exh6 / EX6, rimD / RIM4, U5P / U5M, vSigLamp, vTailLit, lampPart, grillePart, pdCaliper, discPart, vDecalTex,
// GLOW_COLS, PCOL10, and the regal's wings (pass st)):
//   const spec = MN4.menu('tyres', 'Gume', { sel: 'Dirkališče' });   // the menu's four parts (pages when it has more), the stock button, the
//                                                                    // selected one (the tapped part, else the CHEAPEST of the four)
//   MN4.pics(spec, st);                                              // the tiles' pictures (data URLs, cached; st: the scene's stores, for the wings)
//   const C = MN4.card(spec, { top: 68, layout: '2x2', cr: 11500 }); // draws the card (a fixed div, class qov); C.rect its box on the screen
//   MN4.LIST                                                         // every menu and tab: [part, tab]; MN4.info(spec) its data (four, cheapest, how, cut)
// The card: the whole width (6 px margins), the head (the title, the tabs, the page dots, the time), FOUR tiles (2 x 2: a picture, the name,
// the stat line, the price; the selected one with the turquoise frame and the yellow rim; a locked one greyed with its padlock and what
// unlocks it; one from another menu marked "iz: ..."), the bottom row (‹ NAZAJ, the stock button "✓ serijsko nameščeno" / "↺ SERIJSKO",
// KUPI IN NAMESTI · the price: red, or grey with "premalo kreditov" when the player cannot pay it, or ZAKLENJENO). layout 'row': the same in
// one row of four tall tiles (the alternative). Over four parts: pages of four (the dots in the head, ‹ › at the tiles' ends; the last page
// shows the last four); under four: filled with a part from a related menu or one locked part, never a hole. The stock part is never a tile.
// ======================================================================================================================================
const MN4 = (() => {
  const F = (v, n = 1) => +(+v).toFixed(n), num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const parts = () => ((window.MENUS && MENUS.parts) || []).concat((window.MENUS_W && MENUS_W.parts) || []);
  const P = (id) => parts().find(p => p.id === id) || { id, title: id, name: id, tabs: [], options: [], durationSec: 0 };
  const owned = (o) => /✓|namešč|izbran|trenutno/.test(o.price || '');
  const priceN = (s) => { const m = String(s || '').match(/([\d.]+)\s*CR/); return m ? +m[1].replace(/\./g, '') : 0; };
  const opt = (part, tab, name) => (P(part).options || []).find(o => o.name === name && (!tab || !o.tab || o.tab === tab));
  const from = (part, tab, name, label) => Object.assign({}, opt(part, tab, name), { from: label, fromPart: part, fromTab: tab });
  const lock = (name, price, effect, unlock) => ({ name, price, effect, locked: true, unlock, ocena: true });
  const add = (name, price, effect) => ({ name, price, effect, added: true, ocena: true });
  // ---- every menu and tab: its group on the board, its stock part (the button, not a tile), what is cut, added, filled; the cut proposal
  //      for the menus that keep more than four (the user prefers exactly four) ----
  const ACC = [['roof', 'Dodatki', 'Antena'], ['roof', 'Dodatki', 'Strešna zajemalka'], ['aero', 'Dodatki', 'Kljuke za vleko'], ['aero', 'Dodatki', 'Lovilci blata']];
  const TINT = { stock: 'Serijska', how: 'štiri zatemnitve; serijsko steklo = gumb ↺ SERIJSKO' };
  const D = {
    'body|Klasične': { g: 'barva', stock: 'Modra', how: 'štiri barve; tovarniška Modra = gumb ↺ SERIJSKO' },
    'body|Žive': { g: 'barva', stock: null, stockName: 'Modra', how: 'pet barv: dve strani po štiri (zadnja kaže zadnje štiri)', cut: ['Turkizna'], why: 'najbližja modri in zeleni' },
    'roof|Klasične': { g: 'barva', stock: 'Kot karoserija', how: 'štiri barve; "kot karoserija" = gumb ↺ SERIJSKO' },
    'roof|Žive': { g: 'barva', stock: null, stockName: 'Kot karoserija', how: 'pet barv: dve strani po štiri', cut: ['Turkizna'], why: 'najbližja modri in zeleni' },
    'stripes|Klasične': { g: 'barva', stock: 'Bela', how: 'štiri (Brez črt, Rdeča, Črna, Srebrna); bele črte = gumb ↺ SERIJSKO' },
    'stripes|Žive': { g: 'barva', stock: null, stockName: 'Bela', how: 'pet barv: dve strani po štiri', cut: ['Turkizna'], why: 'najbližja modri in zeleni' },
    'stripes|Nalepke': { g: 'spredaj', stock: 'Brez nalepk', add: [add('Strela', '500 CR', 'samo videz')], how: 'trije + Strela (nova, kot četrta nalepka v predalu DECALS)' },
    'stripes|Številka': { g: 'avto', stock: 'Brez številke', how: 'pet številk: dve strani po štiri', cut: ['12'], why: 'brez "12" ostanejo štiri jasno različne' },
    'hood|Hauba': { g: 'avto', stock: 'Serijska', lock: [lock('Dirkalna hauba', '3.600 CR', '−10 kg · hitre zaponke', 'zmagaj 5 dirk')], how: 'trije + ena zaklenjena (Dirkalna hauba)' },
    'hood|Motor': { g: 'regal', stock: 'Serijski motor', how: 'štirje deli z regala (polica D); serijski motor = gumb' },
    'boot|Pokrov': { g: 'avto', stock: 'Serijski', from: [from('aero', 'Krilo', 'Lok', 'Aero › Krilo')], how: 'trije + Lok iz menija Aero › Krilo (sedi na pokrovu)' },
    'boot|Motor': { g: 'regal', stock: 'Serijski motor', how: 'kot Hauba › Motor (avti z motorjem zadaj; VIHAR ga nima)' },
    'doors|Vrata': { g: 'avto', stock: 'Serijska', lock: [lock('Vrata z mrežo', '3.400 CR', 'dirkalna mreža v oknu', 'zmagaj 5 dirk')], how: 'trije + ena zaklenjena' },
    'doors|Ogledala': { g: 'avto', stock: 'Serijska', lock: [lock('Ogledala z LED', '1.400 CR', 'žmigavec v ohišju', 'zmagaj 4 dirke')], how: 'trije + ena zaklenjena (VIHAR ogledal nima)' },
    'roof|Dodatki': { g: 'avto', stock: null, stockName: 'Brez dodatkov', list: ACC, how: 'dodatki strehe in aero (Antena, Strešna zajemalka, Kljuke, Lovilci): isti štirje v obeh menijih' },
    'aero|Dodatki': { g: 'avto', stock: null, stockName: 'Brez dodatkov', list: ACC, how: 'isti štirje dodatki kot Streha › Dodatki' },
    'glass|': Object.assign({ g: 'avto' }, TINT),
    'headlights|Žarometi': { g: 'spredaj', stock: 'Serijski', how: 'štirje iz predala HEADLAMPS (LED, YELLOW, SMOKED, BI-LED)' },
    'headlights|Žmigavci': { g: 'spredaj', stock: 'Serijski', add: [add('Kromirani', '300 CR', 'kromiran okvir, oranžna luč')], how: 'trije + Kromirani (nov, četrti v predalu INDICATORS)' },
    'headlights|Relijske luči': { g: 'avto', stock: 'Brez', lock: [lock('LED-letev v maski', '1.800 CR', 'bela luč za masko', 'zmagaj 4 dirke')], how: 'trije + ena zaklenjena' },
    'taillights|': { g: 'spredaj', stock: 'Serijske', how: 'štiri iz predala TAIL LAMPS' },
    'grille|Maska': { g: 'spredaj', stock: 'Serijska', drop: ['V barvi avta'], how: 'štiri iz predala GRILLES; "V barvi avta" je ven (ni ga več v omari)' },
    'grille|Hupa': { g: 'regal', stock: 'Serijska', from: [from('exhaust', 'Dve cevi', 'Dirkalni', 'Auspuh'), from('exhaust', 'Ena cev', 'Ravni', 'Auspuh')], lock: [lock('Trotonska', '250 CR', 'tri toni', 'zmagaj 3 dirke')], how: 'Dvotonska + dva zvoka iz Auspuha + ena zaklenjena' },
    'aero|Paket': { g: 'spredaj', stock: 'Serijski', locked: { 'Dirkalni': 'zmagaj 3 dirke', 'Paket GT': 'zmagaj 6 dirk' }, how: 'štirje paketi; Dirkalni zaklenjen (kupola v omari), Paket GT zaklenjen (makete ni več)' },
    'aero|Krilo': { g: 'regal', stock: 'Brez krila', how: 'pet kril z regala: dve strani po štiri', cut: ['Kratko krilo'], why: 'med Lokom in Nizkim, s kamere najmanj drugačno' },
    'exhaust|*': { g: 'regal', stock: 'Serijski', merge: ['Ena cev', 'Dve cevi'], how: 'šest auspuhov z regala (zavihka združena): dve strani po štiri', cut: ['Dvojni', 'Ravni'], why: 'ostanejo Športni, Dirkalni, Karbonski, Titanov (vsak drugačen)' },
    'tyres|Gume': { g: 'regal', stock: 'Cesta', how: 'štiri: Sneg, Makadam, Dirkališče, Gorska (Makadam nima mesta na regalu)' },
    'tyres|Dim gum': { g: 'regal', stock: 'Bel', how: 'štiri barve kartuš z regala; bel dim = gumb' },
    'rims|Platišča': { g: 'regal', stock: 'Serijska', how: 'štiri pari z regala' },
    'rims|Matice': { g: 'spredaj', stock: 'Serijske', replace: [add('Rdeče', '200 CR', 'aluminij, rdeče'), add('Modre', '200 CR', 'aluminij, modre'), add('Zlate', '200 CR', 'aluminij, zlate'), add('Črne', '200 CR', 'aluminij, črne')], how: '"Barvne" razdeljene na štiri barve (izbira kot barva, brez predala)' },
    'brakes|Zaviranje': { g: 'spredaj', stock: 'Serijske', add: [add('Športni diski', '7.000 CR', '+12 % zavorne moči')], order: ['Športne ploščice', 'Športni diski', 'Dirkalni diski', 'Keramične'], how: 'štirje iz predala BRAKES (ploščice, športni, dirkalni, keramični diski)' },
    'brakes|Čeljusti': { g: 'spredaj', stock: 'Sive čeljusti', how: 'štiri iz predala CALIPERS' },
    'brakes|Podvozje': { g: 'regal', stock: null, stockName: 'Serijsko podvozje', add: [add('Opornik blatnikov', '1.100 CR', 'oprijem v ovinku +1 %')], how: 'trije z regala + Opornik blatnikov (nov, na mestu ploščic na regalu)' },
    'underglow|Barva': { g: 'spredaj', stock: 'Brez', drop: ['Zelena'], how: 'štiri iz predala UNDERGLOW; Zelena je ven' },
    'underglow|Način': { g: 'spredaj', stock: null, how: 'štirje načini, vsi brezplačni' },
    'windscreen|Zatemnitev': Object.assign({ g: 'avto' }, TINT),
    'windscreen|Senčni pas': { g: 'avto', stock: 'Brez', how: 'pet pasov: dve strani po štiri', cut: ['Bel'], why: 'bel pas se na svetlem nebu komaj vidi' },
    'door_l|': Object.assign({ g: 'avto' }, TINT), 'door_r|': Object.assign({ g: 'avto' }, TINT),
    'quarter_l|Zatemnitev': Object.assign({ g: 'avto' }, TINT), 'quarter_r|Zatemnitev': Object.assign({ g: 'avto' }, TINT),
    'quarter_l|Številka': { g: 'avto', stock: 'Brez', lock: [lock('Krog z obrobo', '300 CR', 'črna obroba', 'zmagaj 2 dirki')], how: 'trije + ena zaklenjena' },
    'quarter_r|Številka': { g: 'avto', stock: 'Brez', lock: [lock('Krog z obrobo', '300 CR', 'črna obroba', 'zmagaj 2 dirki')], how: 'trije + ena zaklenjena' },
    'rear_window|Žaluzije': { g: 'avto', stock: 'Črne', lock: [lock('Kromirane', '600 CR', 'kromirane letvice', 'zmagaj 3 dirke')], how: 'trije + ena zaklenjena' },
    'rear_window|Zatemnitev': Object.assign({ g: 'avto' }, TINT),
    'srv|': { g: 'spredaj', stock: null, how: 'Servis: tri popravila + Popoln servis (−15 %)' } };
  const LIST = [];
  parts().forEach(p => { const tabs = p.tabs && p.tabs.length ? p.tabs : ['']; if (p.id === 'exhaust') { LIST.push(['exhaust', '*']); return; } tabs.forEach(t => LIST.push([p.id, t])); });
  LIST.push(['srv', '']);
  // the service rows (js/garage.js SRV, srvPrice; the car's condition c)
  const SRV = [{ id: 'clean', name: 'Pranje', desc: 'pena, voda, vosek', base: 150, k: 450 }, { id: 'body', name: 'Karoserija', desc: 'praske in udrtine', base: 300, k: 2200 }, { id: 'engine', name: 'Motor in olje', desc: 'olje, filtri, svečke', base: 400, k: 2600 }];
  const COND = { clean: 0.62, body: 0.81, engine: 0.7 };
  // ---- the menu's four: { part, tab, title, tabs, time, tiles (all: four or more), pages, stock, sel, cheapest, how, cut, why } ----
  const menu = (part, tab, o = {}) => { const key = part + '|' + (tab || ''), d = D[key] || {}, p = part === 'srv' ? { id: 'srv', title: 'Servis', tabs: [], durationSec: 12, options: [] } : P(part);
    let all = part === 'srv' ? [] : d.merge ? p.options.filter(q => d.merge.includes(q.tab)) : (p.options || []).filter(q => !tab || !q.tab || q.tab === tab);
    if (d.list) all = d.list.map(([pp, tt, nn]) => Object.assign({}, opt(pp, tt, nn), pp !== part ? { from: pp === 'aero' ? 'Aero › Dodatki' : 'Streha › Dodatki' } : {}));
    const stockOpt = d.stock !== undefined ? (d.stock ? all.find(q => q.name === d.stock) : null) : all.find(owned);
    let tiles = all.filter(q => q !== stockOpt && !(d.drop || []).includes(q.name) && !owned(q));   // (drop: taken out of the menu now; cut: only proposed, the pages stay)
    if (d.replace) tiles = d.replace.slice();
    if (d.add) tiles = tiles.concat(d.add);
    if (d.order) tiles = d.order.map(n => tiles.find(q => q.name === n)).filter(Boolean);
    if (d.merge) tiles = tiles.slice().sort((a, b) => priceN(a.price) - priceN(b.price));
    if (d.locked) tiles = tiles.map(q => d.locked[q.name] ? Object.assign({}, q, { locked: true, unlock: d.locked[q.name] }) : q);
    if (part === 'srv') tiles = SRV.map(s => { const w = 1 - COND[s.id], pr = w < 0.02 ? 0 : Math.round((s.base + s.k * w) / 50) * 50; return { name: s.name, effect: s.desc + ' · ' + Math.round(COND[s.id] * 100) + ' %', price: num(pr) + ' CR', srv: s.id }; })
      .concat([{ name: 'Popoln servis', effect: 'vse tri · −15 %', price: num(Math.round(SRV.reduce((a, s) => a + Math.round((s.base + s.k * (1 - COND[s.id])) / 50) * 50, 0) * 0.85 / 50) * 50) + ' CR', srv: 'all' }]);
    if (d.from) tiles = tiles.concat(d.from);
    if (d.lock) tiles = tiles.concat(d.lock);
    const n = tiles.length, pages = Math.max(1, Math.ceil(n / 4)), buyable = tiles.filter(q => !q.locked), cheapest = buyable.slice().sort((a, b) => priceN(a.price) - priceN(b.price))[0];
    const sel = o.sel && tiles.find(q => q.name === o.sel) ? o.sel : cheapest ? cheapest.name : tiles[0].name, si = tiles.findIndex(q => q.name === sel);
    const page = pages > 1 ? Math.min(pages - 1, Math.floor(si / 4)) : 0;
    const tabs = d.merge ? [] : (p.tabs || []);
    return { key, part, tab: d.merge ? '' : tab, title: p.title || p.name, tabs, time: p.durationSec, tiles, n, pages, page, sel, cheapest: cheapest ? cheapest.name : null,
      stock: part === 'srv' || part === 'underglow' && tab === 'Način' ? null : { name: stockOpt ? stockOpt.name : (d.stockName || 'serijsko'), on: o.stockOn !== false },
      how: d.how || '', cut: d.cut || [], why: d.why || '', drop: d.drop || [], group: d.g || 'avto' }; };
  // the four tiles on the shown page (the last page shows the last four)
  const shown = (spec, page) => { const pg = page != null ? page : spec.page, a = Math.min(pg * 4, Math.max(0, spec.n - 4)); return spec.tiles.slice(a, a + 4); };
  const info = (spec) => ({ meni: spec.title, del: spec.part, zavihek: spec.tab || null, moznosti: spec.tiles.map(q => ({ ime: q.name, cena: q.price, kaj_nudi: q.effect, iz: q.from || null, zaklenjeno: q.locked ? q.unlock : null, nova: q.added || null, ocena: q.ocena || null })),
    stevilo: spec.n, strani: spec.pages, najcenejsa: spec.cheapest, serijsko: spec.stock ? spec.stock.name : null, kako: spec.how, izpusceno: spec.drop.length ? spec.drop : null, rez_predlog: spec.cut.length ? { izrezi: spec.cut, zakaj: spec.why } : null });
  // ---- THE CARD ----
  const PAD = '<svg viewBox="0 0 16 16" width="12" height="12" style="vertical-align:-1px"><rect x="2.5" y="7" width="11" height="8" rx="1.6" fill="currentColor"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  // (OZ: the shadows: the tile's drop shadow (two layers: a crisp 1 px edge and a soft blur under it) and the part's contact shadow (a soft
  //  dark ellipse at the picture's foot, behind the part))
  const MN4SH = { tile: '0 1px 0 rgba(13,22,38,.10),0 3px 7px rgba(13,22,38,.18)', contact: '<span style="position:absolute;left:14%;right:14%;bottom:1px;height:8px;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(13,22,38,.42) 0%,rgba(13,22,38,.18) 45%,rgba(13,22,38,0) 72%)"></span>' };
  // ---- (OZ) THE DETAIL BOX: the stat lines parsed into measures ("oprijem +6 %", "−2 km/h", "suho +18"): { key, label, unit, values } ----
  const mn4Stats = (eff) => { const out = {}; String(eff || '').split('·').forEach(t => { const m = t.trim().match(/^([A-Za-zČŠŽčšž ]*?)\s*([+−-])\s*(\d+(?:[.,]\d+)?)\s*(%|km\/h|kg|KM)?$/); if (!m) return;
    const v = (m[2] === '+' ? 1 : -1) * parseFloat(m[3].replace(',', '.')), unit = m[4] || '', label = (m[1] || '').trim() || (unit === 'km/h' ? 'hitrost' : unit === 'kg' ? 'masa' : unit === 'KM' ? 'moč' : ''); if (!label && !unit) return;
    out[(label + '|' + unit).toLowerCase()] = { label, unit, v }; }); return out; };
  const mn4Icon = (k) => k === 'tyre' ? '<svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><circle cx="8" cy="8" r="7.3" fill="#1f2328"/><circle cx="8" cy="8" r="4.3" fill="#c3cad3"/><circle cx="8" cy="8" r="1.6" fill="#1f2328"/></svg>'
    : k === 'speedo' ? '<svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><path d="M2 12 A6.5 6.5 0 1 1 14 12" fill="none" stroke="#1f2328" stroke-width="2" stroke-linecap="round"/><path d="M8 11 L12 5.5" stroke="#e23a2e" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="11" r="1.6" fill="#1f2328"/></svg>'
    : k === 'engine' ? '<svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><path d="M2 6 H10 L12 4 H14 V12 H4 L2 10 Z" fill="#1f2328"/><rect x="4" y="2.5" width="5" height="2" fill="#1f2328"/><rect x="5" y="7" width="2" height="3" fill="#c3cad3"/><rect x="8.5" y="7" width="2" height="3" fill="#c3cad3"/></svg>'
    : k === 'weight' ? '<svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><path d="M5.2 5 A2.8 2.8 0 1 1 10.8 5" fill="none" stroke="#1f2328" stroke-width="1.6"/><path d="M3.5 6 H12.5 L14 14 H2 Z" fill="#1f2328"/></svg>'
    : '<svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><circle cx="8" cy="8" r="4" fill="#1f2328"/></svg>';   // (OZ7: an engine for KM, a weight for kg)
  const mn4Detail = (spec, four, sel, o) => { const D0 = o === true ? {} : o, NEW = '#2f7fe0', GH = '#bcd3f2', TRK = '#e9eef4', ZR = '#9aa5b3';
    const allOpt = (P(spec.part).options || []).filter(q => !spec.tab || !q.tab || q.tab === spec.tab), byName = (n) => allOpt.find(q => q.name === n) || four.find(q => q.name === n) || null;
    const selQ = byName(sel) || {}, prevQ = byName(D0.prev || D0.now || (spec.stock && spec.stock.name)) || {}, st = allOpt.map(q => mn4Stats(q.effect)), keys = []; st.forEach(m => Object.keys(m).forEach(k => { if (!keys.includes(k)) keys.push(k); }));
    const ms = keys.slice(0, 2).map(k => { const any = st.find(m => m[k])[k], mx = Math.max(...st.map(m => m[k] ? Math.abs(m[k].v) : 0), 1), g = (q) => (mn4Stats(q.effect)[k] || { v: 0 }).v;
      return { k, icon: any.unit === 'km/h' ? 'speedo' : any.unit === 'KM' ? 'engine' : any.unit === 'kg' ? 'weight' : /oprijem|suho|mokro|sneg|makadam/.test(k) ? 'tyre' : 'dot', prev: g(prevQ), next: g(selQ), max: mx }; });
    const ms2 = ms.filter(m => m.prev || m.next); if (!ms2.length) return '';   // (OZ7: a measure that is 0 before and after (e.g. kg for TURBO) is not drawn)
    const half = (v, m) => (Math.abs(v) / m * 50).toFixed(2) + '%', side = (v) => v >= 0 ? 'left:50%;border-radius:0 4px 4px 0' : 'right:50%;border-radius:4px 0 0 4px';
    const row = (m) => `<div style="display:flex;align-items:center;gap:8px;height:22px"><span style="flex:none">${mn4Icon(m.icon)}</span><span style="position:relative;flex:1;height:12px;border-radius:6px;background:${TRK}">`
      + `<i style="position:absolute;top:0;height:12px;${side(m.prev)};width:${half(m.prev, m.max)};background:${GH}"></i>`
      + `<i data-to="${half(m.next, m.max)}" style="position:absolute;top:3px;height:6px;${side(m.next)};width:${half(Math.sign(m.prev) === Math.sign(m.next) || !m.prev ? m.prev : 0, m.max)};background:${NEW};transition:width .4s cubic-bezier(.33,1,.68,1)"></i>`
      + `<i style="position:absolute;left:50%;top:-2px;width:1px;height:16px;margin-left:-.5px;background:${ZR}"></i></span></div>`;
    return `<div class="mn4-detail" style="margin-top:7px;padding:2px 6px 2px"><div style="font-size:19px;font-style:italic;font-weight:900;letter-spacing:.01em;color:#0d1626;white-space:nowrap;margin-bottom:4px">${String(sel).toUpperCase()}${spec.part === 'aero' && spec.tab === 'Paket' ? ' ' + String(spec.title || '').toUpperCase() : ''}</div>${ms2.map(row).join('')}</div>`; };   // (the name alone (TURBO), the kit's with its menu (ŠPORTNI AERO PAKET))
  const card = (spec, o = {}) => { const lay = o.layout || '2x2', cr = o.cr != null ? o.cr : 11500, page = o.page != null ? o.page : spec.page, four = shown(spec, page), mg = o.margin != null ? o.margin : 6, sel = o.sel || spec.sel, row = lay === 'row';
    const dots = spec.pages > 1 ? `<span style="display:inline-flex;gap:4px;align-items:center;margin-right:6px">${Array.from({ length: spec.pages }, (_, i) => `<i style="display:block;width:${i === page ? 14 : 6}px;height:6px;border-radius:3px;background:${i === page ? '#47c6ff' : '#c8d2e0'}"></i>`).join('')}</span>` : '';
    const head = `<div style="display:flex;align-items:center;gap:5px;white-space:nowrap;height:20px"><b style="font-size:14px;font-style:italic;margin-right:3px">${spec.title}</b>${spec.tabs.map(t => `<span style="display:inline-block;padding:2px 9px;border-radius:8px;font-size:11.5px;${t === spec.tab ? 'background:#47c6ff;color:#06203a' : 'background:#e8edf3;color:#334'}">${t}</span>`).join('')}<span style="flex:1"></span>${dots}</div>`;   // (OZ: no time label: the user "Zbriši zgoraj desno 9 s")
    const tile = (q) => { const on = q.name === sel, lk = !!q.locked, pc = /brezpla/.test(q.price || '') ? '#16a34a' : '#0d1626';
      const frame = on ? `background:#e0f2ff;box-shadow:inset 0 0 0 2px #47c6ff,0 0 0 2px #ffd23f,${MN4SH.tile}` : `background:#f1f4f8;box-shadow:${MN4SH.tile}`;   // (OZ: the tiles raised: a soft drop shadow)
      const pic = `<span style="position:relative;flex:none;display:block;width:${row ? '100%' : '66px'};height:${row ? 44 : o.detail ? 34 : 40}px;border-radius:6px;background:${q.url ? 'transparent' : (q.sw || '#dfe5ec')}">${q.url ? `${MN4SH.contact}<img src="${q.url}" style="position:relative;display:block;width:100%;height:100%;object-fit:contain;${lk ? 'filter:grayscale(1) brightness(1.08);opacity:.55' : ''}">` : ''}${lk ? `<span style="position:absolute;right:2px;top:2px;color:#fff;background:#8a6d1a;border-radius:6px;padding:1px 3px;line-height:1">${PAD}</span>` : ''}${q.from ? `<span style="position:absolute;left:2px;top:2px;font-size:8.5px;font-weight:900;color:#fff;background:#2a5bd7;border-radius:5px;padding:1px 4px;line-height:1.1">iz: ${q.from}</span>` : ''}</span>`;
      const price = lk ? `<span style="color:#8a6d1a;font-size:10px">${PAD} ${q.unlock}</span>` : `<span style="color:${pc}">${String(q.price || '').replace(/\s*\((−[^)]*)\)/, ' <span style="color:#e5484d">$1</span>')}</span>`;
      const nl = String(q.name).length, el = String(q.effect || '').length, name = `<span style="display:block;font-size:${row ? (nl > 13 ? 10 : 11.5) : nl > 15 ? 10.6 : nl > 12 ? 11.3 : 12}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-top:2px;margin-top:-2px">${q.name}</span>`;   // (the padding: the capitals' carons Š Č Ž are not clipped)
      const eff = `<span style="display:block;font-size:${row ? 9 : el > 21 ? 8.7 : el > 18 ? 9.1 : 9.6}px;color:#556;font-weight:700;${row ? 'line-height:1.15;height:21px;overflow:hidden' : 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis'}">${q.effect || ''}</span>`;
      if (row) return `<div style="display:flex;flex-direction:column;gap:2px;min-width:0;height:100px;box-sizing:border-box;padding:3px 4px 3px;border-radius:9px;${frame}">${pic}<span style="min-width:0;line-height:1.12">${name}${eff}<span style="display:block;font-size:10.5px;white-space:nowrap">${price}</span></span></div>`;
      return `<div style="display:flex;align-items:center;gap:6px;min-width:0;height:${o.detail ? 40 : 48}px;box-sizing:border-box;padding:3px 6px 3px 3px;border-radius:9px;${frame}">${pic}<span style="flex:1;min-width:0;line-height:1.12">${name}${eff}<span style="display:block;font-size:10.5px;white-space:nowrap">${price}</span></span></div>`; };
    const arrows = spec.pages > 1 ? ['‹', '›'].map((a, i) => `<span style="position:absolute;${i ? 'right' : 'left'}:-5px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,.4);color:#0d1626;font-size:16px;line-height:18px;text-align:center;font-weight:900;opacity:${(i ? page < spec.pages - 1 : page > 0) ? 1 : 0.35}">${a}</span>`).join('') : '';
    const grid = `<div style="position:relative;display:grid;grid-template-columns:${row ? 'repeat(4,1fr)' : '1fr 1fr'};gap:4px;margin-top:4px">${four.map(tile).join('')}${arrows}</div>`;
    const sq = four.find(q => q.name === sel) || four[0], sp = priceN(sq.price), poor = !sq.locked && sp > cr;
    // (OZ: the bottom row in the GAME's own buttons (css/garage.css .g-btn-back / .g-btn-go, the garage's footer, the look of the track screen's
    //  Race button the user showed): the back button a grey rounded square with the white arrow (no text); KUPI IN NAMESTI the red glossy
    //  button (the gradient, the light rim, the dark red step under it, the soft red glow; white italic 900 capitals with a dark shadow),
    //  filling the row; when the player cannot buy it (too few credits, locked) the game's own .lock look (dark slate, grey-blue letters).
    //  Scaled to the card: 38 px tall (the game's 62 / 50 px), the corners and the step in proportion)
    const GBTN = { h: 38, r: 11, f: 15.5 };
    const gGo = (txt, sub, kind) => { const lk = kind === 'lock', bg = lk ? 'linear-gradient(180deg,#3a4456,#2a3242)' : 'linear-gradient(180deg,#ee4b3f,#c8261d)', bd = lk ? '#56627a' : '#ff7a6e', sh = lk ? '0 4px 0 #161b25' : '0 4px 0 #8e1a14,0 6px 16px rgba(226,56,45,.35)';
      return `<span style="flex:1 1 auto;min-width:0;height:${GBTN.h}px;box-sizing:border-box;border-radius:${GBTN.r}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${bg};border:2px solid ${bd};box-shadow:${sh};color:${lk ? '#b9c4d8' : '#fff'};font:italic 900 ${sub ? GBTN.f - 2 : GBTN.f}px/1.05 ${FONT};letter-spacing:.01em;text-shadow:${lk ? 'none' : '0 2px 0 rgba(0,0,0,.35)'};white-space:nowrap;overflow:hidden">${txt}${sub ? `<span style="font:700 9.5px/1.1 ${FONT};font-style:normal;letter-spacing:0;text-shadow:none;color:${lk ? '#9aa6bb' : '#ffd9d4'}">${sub}</span>` : ''}</span>`; };
    const gBack = `<span style="flex:0 0 auto;width:${GBTN.h}px;height:${GBTN.h}px;box-sizing:border-box;border-radius:${GBTN.r}px;display:grid;place-items:center;color:#fff;background:linear-gradient(180deg,#5d636d,#454a53);border:2px solid #8d939d;box-shadow:0 4px 0 #262a31"><svg viewBox="0 0 24 24" width="20" height="20" style="display:block"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    const buy = sq.locked ? gGo(`${PAD} ZAKLENJENO`, sq.unlock, 'lock')
      : poor ? gGo(`KUPI IN NAMESTI · ${String(sq.price).replace(/\s*\(.*\)/, '')}`, `premalo kreditov · imaš ${num(cr)} CR`, 'lock')
      : gGo(/brezpla/.test(sq.price || '') ? 'IZBERI · brezplačno' : spec.part === 'srv' ? 'POPRAVI · ' + sq.price : 'KUPI IN NAMESTI · ' + String(sq.price).replace(/\s*\(.*\)/, ''), '', 'go');
    const stock = spec.stock ? (spec.stock.on ? '' : `<span style="flex:0 0 auto;height:${GBTN.h}px;box-sizing:border-box;border-radius:${GBTN.r}px;display:grid;place-items:center;padding:0 9px;color:#fff;background:linear-gradient(180deg,#5d636d,#454a53);border:2px solid #8d939d;box-shadow:0 4px 0 #262a31;font:italic 900 12px/1 ${FONT};white-space:nowrap">↺ SERIJSKO</span>`) : '';   // (the user: "Zbriši serijsko nameščeno": nothing when the stock part is on)
    const foot = `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;height:${GBTN.h + 4}px;padding-bottom:4px;box-sizing:border-box">${gBack}${stock}${buy}</div>`;
    const det = o.detail ? mn4Detail(spec, four, sel, o.detail) : '';   // (OZ: the detail box, an option)
    const d = div(`left:${mg}px;right:${mg}px;top:${o.top != null ? o.top : 68}px;background:#fff;border-radius:14px;padding:6px 7px 7px;z-index:64;box-shadow:0 6px 18px rgba(0,0,0,.45);font-weight:800;color:#0d1626;box-sizing:border-box`, head + grid + det + foot);
    if (o.cls) d.classList.add(o.cls);
    if (o.detail) { const go = () => d.querySelectorAll('[data-to]').forEach(e => { e.style.width = e.dataset.to; }); if (o.detailAt === 'end') go(); else requestAnimationFrame(() => requestAnimationFrame(go)); }   // (OZ: the bars move from the previous value to the new one)
    const r = d.getBoundingClientRect(); return { d, rect: [F(r.left), F(r.top), F(r.width), F(r.height)], four: four.map(q => q.name), sel, poor, page }; };
  // ---- THE PICTURES (data URLs, 96 x 56 shown at 72 x 42 or 86 x 44; rendered at 3 x, then scaled down; the background see-through) ----
  const TW = 96, TH = 56, CACHE = {};
  const rt = (sc, cam, k = 3) => { const R = G3.renderer, w = TW * k, h = TH * k, t = new T.WebGLRenderTarget(w, h), px = new Uint8Array(w * h * 4);
    const oc = R.getClearColor(new T.Color()), oa = R.getClearAlpha(), ost = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.setRenderTarget(t); R.setClearColor(0x000000, 0); R.clear(); R.render(sc, cam);
    R.readRenderTargetPixels(t, 0, 0, w, h, px); R.setRenderTarget(null); R.setClearColor(oc, oa); R.shadowMap.autoUpdate = ost; t.dispose();
    const c0 = document.createElement('canvas'); c0.width = w; c0.height = h; const g0 = c0.getContext('2d'), im = g0.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((h - 1 - y) * w + x) * 4, j = (y * w + x) * 4; for (let q = 0; q < 4; q++) im.data[j + q] = px[i + q]; }
    g0.putImageData(im, 0, 0); const c = document.createElement('canvas'); c.width = TW * 2; c.height = TH * 2; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c0, 0, 0, TW * 2, TH * 2); return c; };
  const lights = (sc, k = 1) => { sc.add(new T.HemisphereLight(0xffffff, 0x6b7280, 0.8 * k)); const a = new T.DirectionalLight(0xffffff, 0.75 * k); a.position.set(-3, 6, 4); sc.add(a); const b = new T.DirectionalLight(0xffffff, 0.32 * k); b.position.set(4, 2, -3); sc.add(b); };
  // a part seen along dir, fitted by an orthographic camera
  const partPic = (obj, dir = [0.45, 0.4, 1], m = 1.08) => { const sc = new T.Scene(); lights(sc, 0.78); sc.add(obj); obj.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(obj), c = bb.getCenter(V()), d = V(...dir).normalize();
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.01, 100); cam.position.copy(c).addScaledVector(d, 20); cam.lookAt(c); cam.updateMatrixWorld(true); const inv = cam.matrixWorldInverse.clone(), p = V();
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; obj.traverse(q => { if (!q.isMesh || !q.visible) return; const A = q.geometry.attributes.position; for (let i = 0; i < A.count; i++) { p.fromBufferAttribute(A, i).applyMatrix4(q.matrixWorld).applyMatrix4(inv); a0 = Math.min(a0, p.x); a1 = Math.max(a1, p.x); b0 = Math.min(b0, p.y); b1 = Math.max(b1, p.y); } });
    const mx = (a0 + a1) / 2, my = (b0 + b1) / 2, s = Math.max((a1 - a0) / TW, (b1 - b0) / TH) * m; cam.left = mx - s * TW / 2; cam.right = mx + s * TW / 2; cam.top = my + s * TH / 2; cam.bottom = my - s * TH / 2; cam.updateProjectionMatrix(); return rt(sc, cam).toDataURL('image/png'); };
  const grp = (fn) => { const g = new T.Group(); fn(g); return g; };
  // ---- the turntable's car (the game's mesh, AMA's amSrc: x forward, y up, z right), its vertex classes and regions, recoloured by a
  //      function and with extra parts (boxes, planes) in its own frame; views from fixed cameras ----
  let CAR = null;
  const car = () => { if (CAR) return CAR; const S = amSrc(), K = S.K, paint = AMSRC.paint || (AMSRC.paint = amPaint(S)), n = S.P.length / 3, cls = new Array(n);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9; for (let i = 0; i < n; i++) { x0 = Math.min(x0, S.P[i * 3]); x1 = Math.max(x1, S.P[i * 3]); y0 = Math.min(y0, S.P[i * 3 + 1]); }
    for (let i = 0; i < n; i++) { const c = amClass(S.C[i * 3], S.C[i * 3 + 1], S.C[i * 3 + 2], paint), y = S.P[i * 3 + 1]; cls[i] = c === 'dark' && S.C[i * 3 + 2] - S.C[i * 3] > 0.025 && y > 0.8 && S.P[i * 3] < K.hoodX - 1.0 && S.P[i * 3] > K.rear + 0.35 ? 'glass' : c; }   // (the glass: the body's dark navy (b over r), over the belt line, between the bonnet and the tail)   // (the glass: dark, over the belt line, between the bonnet and the tail)
    // the windows by their normals: front (windscreen), rear, the sides (door: ahead of the glass' middle, quarter: behind it)
    const W = new Array(n).fill(null), tri = []; let gx0 = 1e9, gx1 = -1e9;
    for (let t = 0; t + 2 < n; t += 3) { if (cls[t] !== 'glass' || cls[t + 1] !== 'glass' || cls[t + 2] !== 'glass') continue; let cx = 0, cz = 0, nz = 0; for (let j = 0; j < 3; j++) { cx += S.P[(t + j) * 3] / 3; cz += S.P[(t + j) * 3 + 2] / 3; nz += S.N[(t + j) * 3 + 2] / 3; } tri.push([t, cx, cz, nz]); gx0 = Math.min(gx0, cx); gx1 = Math.max(gx1, cx); }
    const side = tri.filter(q => Math.abs(q[3]) > 0.5), xsplit = side.length ? side.reduce((a, q) => a + q[1], 0) / side.length : 0, xmid = (gx0 + gx1) / 2;
    tri.forEach(([t, cx, cz, nz]) => { const w = Math.abs(nz) > 0.5 ? (cx > xsplit ? 'door' : 'quarter') + (cz < 0 ? '_l' : '_r') : cx > xmid ? 'windscreen' : 'rear_window'; W[t] = W[t + 1] = W[t + 2] = w; });
    const win = (i) => cls[i] !== 'glass' ? null : (W[i] || 'glass');
    let wsTop = -1e9, wsX = 0; for (let i = 0; i < n; i++) if (win(i) === 'windscreen' && S.P[i * 3 + 1] > wsTop) { wsTop = S.P[i * 3 + 1]; wsX = S.P[i * 3]; }
    let wsBase = 1e9; for (let i = 0; i < n; i++) if (win(i) === 'windscreen') wsBase = Math.min(wsBase, S.P[i * 3]);
    let rwx0 = 1e9, rwx1 = -1e9, rwy0 = 1e9, rwy1 = -1e9; for (let i = 0; i < n; i++) if (win(i) === 'rear_window') { rwx0 = Math.min(rwx0, S.P[i * 3]); rwx1 = Math.max(rwx1, S.P[i * 3]); rwy0 = Math.min(rwy0, S.P[i * 3 + 1]); rwy1 = Math.max(rwy1, S.P[i * 3 + 1]); }
    let rx0 = 1e9, rx1 = -1e9; for (let i = 0; i < n; i++) if (S.P[i * 3 + 1] > K.top - 0.04) { rx0 = Math.min(rx0, S.P[i * 3]); rx1 = Math.max(rx1, S.P[i * 3]); }
    let qx = 0, qy = 0, qn = 0; for (let i = 0; i < n; i++) if (win(i) === 'quarter_r') { qx += S.P[i * 3]; qy += S.P[i * 3 + 1]; qn++; }
    const hAt = (x, z) => { let h = -1; for (let i = 0; i < n; i++) if (Math.abs(S.P[i * 3] - x) < 0.07 && Math.abs(S.P[i * 3 + 2] - z) < 0.12 && cls[i] !== 'glass') h = Math.max(h, S.P[i * 3 + 1]); return h; };
    const R = { hood: (x, y, z) => x > wsBase + 0.05 && y > K.hoodY - 0.16 && Math.abs(z) < K.hw - 0.06, roof: (x, y) => y > K.top - 0.13, deck: (x, y, z) => x < rwx0 + 0.02 && y > K.deckY - 0.12 && Math.abs(z) < K.hw - 0.06,
      door: (x, y, z) => x > K.wrx + K.wr + 0.12 && x < K.wfx - K.wr - 0.08 && y > 0.36 && y < 0.92 && Math.abs(z) > K.hw - 0.3 };
    { const cnt = {}; for (let i = 0; i < n; i++) { const w = win(i); if (w) cnt[w] = (cnt[w] || 0) + 1; } console.error('MN4GLASS ' + JSON.stringify(cnt)); }
    CAR = { S, K, cls, win, roofX: [rx0, rx1], xsplit, wsTop, wsX, wsBase, rw: [rwx0, rwx1, rwy0, rwy1], q: qn ? [qx / qn, qy / qn] : [K.wrx + 0.5, 1.0], hAt, R, x0, x1, y0, cx: (x0 + x1) / 2 };
    console.error('MN4CAR ' + JSON.stringify({ n, xsplit: F(xsplit, 3), wsTop: F(wsTop, 3), wsBase: F(wsBase, 3), rw: CAR.rw.map(v => F(v, 3)), q: CAR.q.map(v => F(v, 3)), K: { hw: F(K.hw, 3), wfx: F(K.wfx, 3), wrx: F(K.wrx, 3), wr: F(K.wr, 3), top: F(K.top, 3), deckX: F(K.deckX, 3), deckY: F(K.deckY, 3), hoodY: F(K.hoodY, 3) } })); return CAR; };
  const VIEWS = { side: [21, 1.0, 1.35, 8.8, 0, 0.62, 0], side_l: [21, 1.0, 1.35, -8.8, 0, 0.62, 0], front: [22, 6.6, 2.0, 4.6, 0.8, 0.62, 0], rear: [22, -6.6, 2.0, 4.6, -0.8, 0.66, 0],
    top: [24, 5.4, 4.4, 3.4, 0.5, 0.75, 0], rearlow: [15, -6.2, 1.3, 3.6, -1.7, 1.0, 0], wheel: [17, 2.6, 0.9, 4.2, 1.45, 0.4, 0.9] };
  const col3 = (c) => { const q = new T.Color(c); return [q.r, q.g, q.b]; };
  const carPic = (view, recol, extras, o = {}) => { const C = car(), S = C.S, n = S.P.length / 3, P = new Float32Array(S.P), N = new Float32Array(S.N), Cc = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const x = S.P[i * 3], y = S.P[i * 3 + 1], z = S.P[i * 3 + 2], c = recol ? recol(C.cls[i], x, y, z, i) : null; const v = c || [S.C[i * 3], S.C[i * 3 + 1], S.C[i * 3 + 2]]; Cc[i * 3] = v[0]; Cc[i * 3 + 1] = v[1]; Cc[i * 3 + 2] = v[2]; }
    const G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(P, 3)); G.setAttribute('normal', new T.BufferAttribute(N, 3)); G.setAttribute('color', new T.BufferAttribute(Cc, 3));
    const sc = new T.Scene(); lights(sc); const root = new T.Group(); root.position.set(-C.cx, -C.y0, 0); sc.add(root); root.add(new T.Mesh(G, amMat('carpaint'))); if (extras) extras(root, C);
    const v = VIEWS[view] || VIEWS.side, cam = new T.PerspectiveCamera(v[0], TW / TH, 0.1, 100); cam.position.set(v[1], v[2], v[3]); cam.lookAt(v[4], v[5], v[6]); cam.updateProjectionMatrix(); root.updateMatrixWorld(true);
    const cv = rt(sc, cam); G.dispose(); if (o.under || o.over) { const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const g = c2.getContext('2d'); if (o.under) o.under(g, c2.width, c2.height, cam, root); g.drawImage(cv, 0, 0); if (o.over) o.over(g, c2.width, c2.height, cam, root); return c2.toDataURL('image/png'); }
    return cv.toDataURL('image/png'); };
  const box = (g, w, h, d, x, y, z, col, o = {}) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), o.mat || new T.MeshPhongMaterial({ color: col, shininess: o.sh || 60, emissive: o.em ? new T.Color(col).multiplyScalar(o.em) : 0 })); m.position.set(x, y, z); if (o.r) m.rotation.set(...o.r); g.add(m); return m; };
  const cyl = (g, r, h, x, y, z, col, ax = 'y', o = {}) => { const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 20), new T.MeshPhongMaterial({ color: col, shininess: 80, emissive: o.em ? new T.Color(col).multiplyScalar(o.em) : 0 })); m.position.set(x, y, z); if (ax === 'x') m.rotation.z = Math.PI / 2; if (ax === 'z') m.rotation.x = Math.PI / 2; g.add(m); return m; };
  const plane = (g, tex, w, h, x, y, z, ry = 0) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
  const roundel = (txt, bg = '#f4f6f8', fg = '#0d1626', ring = null) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = bg; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); if (ring) { g.lineWidth = 10; g.strokeStyle = ring; g.stroke(); }
    if (txt) { g.fillStyle = fg; g.font = '900 70px Roboto, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 70); } return new T.CanvasTexture(c); };
  const CARBON = [0.16, 0.17, 0.19], SILVER = [0.78, 0.8, 0.83], PAINTC = () => { const p = AMSRC.paint || [0.11, 0.37, 0.84]; return p; };
  const PC = (n) => col3((typeof PCOL10 !== 'undefined' && PCOL10[n]) || ({ 'Kot karoserija': '#1c5fd6', 'Brez črt': null }[n]) || '#888888');
  const TINTS = { 'Serijska': [0.1, 0.13, 0.19], 'Rahla folija': [0.27, 0.3, 0.35], 'Temna folija': [0.08, 0.09, 0.11], 'Črna folija': [0.02, 0.02, 0.03], 'Modra zrcalna': [0.25, 0.55, 0.95] };
  const GLOWC = { 'Modra': '#2a8cff', 'Turkizna': '#17e0d0', 'Vijolična': '#b05cff', 'Rdeča': '#ff2d3a', 'Zelena': '#37e35a' };
  const glowUnder = (hex, k = 1) => (g, W, H) => { const gr = g.createRadialGradient(W / 2, H * 0.84, 2, W / 2, H * 0.84, W * 0.5); gr.addColorStop(0, hex); gr.addColorStop(0.5, hex + 'aa'); gr.addColorStop(1, hex + '00'); g.save(); g.globalAlpha = k; g.scale(1, 0.32); g.translate(0, H * 0.84 / 0.32 - H * 0.84); g.fillStyle = gr; g.beginPath(); g.arc(W / 2, H * 0.84, W * 0.5, 0, 7); g.fill(); g.restore(); };
  const draw = (fn) => { const c = document.createElement('canvas'); c.width = TW * 2; c.height = TH * 2; fn(c.getContext('2d'), c.width, c.height); return c.toDataURL('image/png'); };
  const smoke = (c, e) => draw((g, W, H) => { [[0.3, 0.62, 0.24], [0.5, 0.45, 0.3], [0.72, 0.6, 0.22], [0.55, 0.7, 0.2], [0.38, 0.4, 0.18]].forEach(([x, y, r]) => { const gr = g.createRadialGradient(x * W - r * H * 0.25, y * H - r * H * 0.3, 1, x * W, y * H, r * H * 1.25); gr.addColorStop(0, c); gr.addColorStop(0.7, c); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x * W, y * H, r * H * 1.25, 0, 7); g.fill(); }); g.strokeStyle = e; g.globalAlpha = 0.5; g.lineWidth = 2; g.beginPath(); g.arc(0.5 * W, 0.45 * H, 0.33 * H, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); });
  const srvIcon = (k) => draw((g, W, H) => { g.fillStyle = '#dbe8ff'; g.beginPath(); g.arc(W / 2, H / 2, H * 0.44, 0, 7); g.fill(); g.strokeStyle = '#2a5bd7'; g.fillStyle = '#2a5bd7'; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round'; const cx = W / 2, cy = H / 2;
    if (k === 'clean') { g.beginPath(); g.moveTo(cx, cy - 30); g.bezierCurveTo(cx + 22, cy - 2, cx + 22, cy + 26, cx, cy + 26); g.bezierCurveTo(cx - 22, cy + 26, cx - 22, cy - 2, cx, cy - 30); g.stroke(); }
    else if (k === 'body') { g.beginPath(); g.moveTo(cx - 32, cy + 12); g.lineTo(cx - 32, cy); g.lineTo(cx - 20, cy - 4); g.lineTo(cx - 10, cy - 18); g.lineTo(cx + 14, cy - 18); g.lineTo(cx + 26, cy - 4); g.lineTo(cx + 32, cy); g.lineTo(cx + 32, cy + 12); g.stroke(); g.beginPath(); g.arc(cx - 18, cy + 14, 6, 0, 7); g.arc(cx + 18, cy + 14, 6, 0, 7); g.fill(); }
    else if (k === 'engine') { g.strokeRect(cx - 26, cy - 14, 44, 28); g.beginPath(); g.moveTo(cx + 18, cy - 6); g.lineTo(cx + 30, cy - 14); g.lineTo(cx + 30, cy + 6); g.moveTo(cx - 18, cy - 14); g.lineTo(cx - 18, cy - 24); g.lineTo(cx + 2, cy - 24); g.lineTo(cx + 2, cy - 14); g.stroke(); }
    else { g.beginPath(); g.moveTo(cx + 18, cy - 26); g.arc(cx + 14, cy - 14, 13, -1.2, 2.4, true); g.lineTo(cx - 24, cy + 24); g.stroke(); g.beginPath(); g.arc(cx - 26, cy + 26, 5, 0, 7); g.fill(); } });
  const mirror = (kind) => grp(g => { const C = { 'Serijska': 0x1c5fd6, 'Športna': 0x1c5fd6, 'Karbonska': 0x26282d, 'Dirkalna': 0x26282d, 'Ogledala z LED': 0x1c5fd6 }[kind] || 0x1c5fd6;
    if (kind === 'Dirkalna') { box(g, 0.03, 0.03, 0.16, 0, 0, 0, 0x26282d); box(g, 0.06, 0.07, 0.12, 0, 0.02, 0.12, 0x26282d); box(g, 0.004, 0.06, 0.1, 0.031, 0.02, 0.12, 0x9fb7d0, { sh: 160 }); }
    else { const b = new T.Mesh(new T.SphereGeometry(0.1, 20, 12), new T.MeshPhongMaterial({ color: C, shininess: 90 })); b.scale.set(0.8, kind === 'Športna' ? 0.55 : 0.65, 1.1); b.position.set(0, 0.02, 0.12); g.add(b); box(g, 0.004, 0.08, 0.15, 0.08, 0.02, 0.12, 0x9fb7d0, { sh: 160 }); box(g, 0.04, 0.03, 0.12, -0.02, -0.02, 0.0, C);
      if (kind === 'Karbonska') box(g, 0.002, 0.06, 0.12, -0.08, 0.02, 0.12, 0x3a3d42); if (kind === 'Ogledala z LED') box(g, 0.01, 0.012, 0.13, 0.081, -0.02, 0.12, 0xffa01a, { em: 0.8 }); } });
  const nutsSet = (hex) => grp(g => { const NM = new T.MeshPhongMaterial({ color: hex, shininess: 120, specular: 0x999999 }), HUB = new T.MeshPhongMaterial({ color: 0xb9c0c8, shininess: 90 }); const r = 0.1;
    const add = (geo, m, x, y, z, rx = Math.PI / 2) => { const q = new T.Mesh(geo, m); q.position.set(x, y, z); q.rotation.x = rx; g.add(q); };
    add(new T.CylinderGeometry(r, r, 0.01, 32), new T.MeshPhongMaterial({ color: 0x1c1e23 }), 0, 0, 0.005); add(new T.CylinderGeometry(r * 0.66, r * 0.7, 0.012, 32), HUB, 0, 0, 0.016);
    for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * 2 * Math.PI / 5; add(new T.CylinderGeometry(r * 0.15, r * 0.15, 0.02, 6), NM, Math.cos(a) * r * 0.44, Math.sin(a) * r * 0.44, 0.032); } });
  // ---- one picture: by the menu (part, tab) and the option ----
  const picOf = (part, tab, q, st) => { const nm = q.name, key = part + '|' + tab + '|' + nm; if (CACHE[key] !== undefined) return CACHE[key]; let u = null;
    try {
      const fromP = q.fromPart, fromT = q.fromTab; if (fromP) return (CACHE[key] = picOf(fromP, fromT, { name: nm }, st));
      if (part === 'body') { const c = PC(nm); u = carPic('side', (k) => k === 'paint' ? c : null); }
      else if (part === 'roof' && tab !== 'Dodatki') { const c = nm === 'Kot karoserija' ? null : PC(nm); u = carPic('top', (k, x, y, z) => c && (k === 'paint' || k === 'stripe') && car().R.roof(x, y, z) ? c : null); }
      else if (part === 'stripes' && (tab === 'Klasične' || tab === 'Žive')) { const c = nm === 'Brez črt' ? PAINTC() : PC(nm); u = carPic('top', (k) => k === 'stripe' ? c : null); }
      else if (part === 'stripes' && tab === 'Nalepke') { const kd = { 'Plameni': 'flames', 'Šahovnica': 'check', 'Zvezda': 'star', 'Strela': 'bolt' }[nm]; u = carPic('side', null, (g, C) => { if (kd) plane(g, vDecalTex(kd), 1.0, 0.66, (C.K.wfx + C.K.wrx) / 2, 0.66, C.K.hw + 0.03); }); }
      else if (part === 'stripes' && tab === 'Številka') { u = carPic('side', null, (g, C) => plane(g, roundel(nm === 'Svoja številka' ? '#' : nm), 0.5, 0.5, (C.K.wfx + C.K.wrx) / 2, 0.64, C.K.hw + 0.03)); }
      else if (part === 'hood' && tab === 'Hauba') { const C0 = car(); u = carPic('top', (k, x, y, z) => (nm === 'Karbonska' || nm === 'Dirkalna hauba') && (k === 'paint' || k === 'stripe') && C0.R.hood(x, y, z) ? CARBON : null, (g, C) => {
          const hx = C.wsBase + 0.45; if (nm === 'Z režami' || nm === 'Dirkalna hauba') for (let i = 0; i < 5; i++) { const x = hx + 0.12 + i * 0.1, y = Math.max(C.hAt(x, 0.3), C.hAt(x, -0.3)); box(g, 0.05, 0.03, 0.8, x, y + 0.012, 0, 0x050506); }
          if (nm === 'Z zajemalko') { const x = hx + 0.3, y = C.hAt(x, 0); box(g, 0.6, 0.13, 0.46, x, y + 0.06, 0, 0x2a2c31); box(g, 0.02, 0.1, 0.38, x + 0.305, y + 0.07, 0, 0x050506); }
          if (nm === 'Dirkalna hauba') for (const z of [-0.5, 0.5]) cyl(g, 0.03, 0.03, C.K.front - 0.25, C.hAt(C.K.front - 0.25, z) + 0.01, z, 0xd81f2a); }); }
      else if ((part === 'hood' || part === 'boot') && tab === 'Motor') { const k = { 'Filter zraka': 'filter', 'Čip': 'chip', 'Turbo': 'turbo', 'Lahek akumulator': 'batt' }[nm]; if (k) u = partPic(grp(g => g.add(U5P[k](U5M())))); }
      else if (part === 'doors' && tab === 'Vrata') { const c = { 'Karbonska': CARBON, 'Aluminijasta': SILVER, 'Dirkalna': [0.12, 0.12, 0.13], 'Vrata z mrežo': CARBON }[nm]; u = carPic('side', null, (g, C) => { const K = C.K, L = (K.wfx - K.wrx) - 2 * K.wr - 0.3, xm = (K.wfx + K.wrx) / 2 + 0.05; if (!c) return; box(g, L, 0.42, 0.02, xm, 0.62, K.hw - 0.005, new T.Color(...c).getHex(), { sh: nm === 'Aluminijasta' ? 120 : 40 });
          if (nm === 'Dirkalna') box(g, L, 0.035, 0.022, xm, 0.5, K.hw, 0xd81f2a); if (nm === 'Vrata z mrežo') for (let i = 0; i < 5; i++) box(g, 0.012, 0.3, 0.024, xm - L / 2 + 0.15 + i * (L - 0.3) / 4, 0.95, K.hw - 0.12, 0xdfe3e8); }); }
      else if (part === 'doors' && tab === 'Ogledala') u = partPic(mirror(nm), [0.9, 0.35, 0.6]);
      else if (part === 'boot' && tab === 'Pokrov') { const c = { 'Aluminijast': SILVER, 'Karbonski': CARBON, 'Dirkalni': CARBON }[nm]; u = carPic('rear', (k, x, y, z) => c && (k === 'paint' || k === 'stripe') && car().R.deck(x, y, z) ? c : null, (g, C) => { if (nm === 'Dirkalni') for (const z of [-0.55, 0.55]) cyl(g, 0.035, 0.03, C.K.rear + 0.15, C.hAt(C.K.rear + 0.15, z) + 0.01, z, 0xd81f2a); }); }
      else if ((part === 'roof' || part === 'aero') && tab === 'Dodatki') { u = carPic(nm === 'Kljuke za vleko' ? 'front' : 'side', null, (g, C) => { const K = C.K;
          if (nm === 'Antena') { const x = C.roofX[0] + 0.12, y = K.top - 0.01; cyl(g, 0.014, 0.7, x, y + 0.35, 0.35, 0x15171c); cyl(g, 0.03, 0.03, x, y + 0.01, 0.35, 0x15171c); }
          if (nm === 'Strešna zajemalka') { const x = (C.roofX[0] + C.roofX[1]) / 2 + 0.1, y = K.top - 0.01; box(g, 0.5, 0.11, 0.42, x, y + 0.05, 0, 0x2a2c31); box(g, 0.02, 0.08, 0.34, x + 0.255, y + 0.06, 0, 0x050506); }
          if (nm === 'Kljuke za vleko') for (const z of [-0.55, 0.55]) { box(g, 0.2, 0.06, 0.1, K.front + 0.05, 0.34, z, 0xd81f2a); box(g, 0.05, 0.12, 0.1, K.front + 0.14, 0.38, z, 0xd81f2a); }
          if (nm === 'Lovilci blata') for (const x of [K.wfx - K.wr - 0.07, K.wrx - K.wr - 0.07]) box(g, 0.03, 0.32, 0.3, x, 0.2, K.hw - 0.13, 0xd81f2a); }); }
      else if (part === 'glass' || ['windscreen', 'door_l', 'door_r', 'quarter_l', 'quarter_r', 'rear_window'].includes(part) && tab !== 'Senčni pas' && tab !== 'Številka' && tab !== 'Žaluzije') { const t = TINTS[nm], which = part === 'glass' ? null : part.replace(/_.$/, '') === 'door' || part.replace(/_.$/, '') === 'quarter' ? part : part;
        const view = part === 'windscreen' ? 'front' : part === 'rear_window' ? 'rear' : /_l$/.test(part) ? 'side_l' : 'side'; u = carPic(view, (k, x, y, z, i) => t && k === 'glass' && (!which || car().win(i) === which) ? t : null); }
      else if (part === 'windscreen' && tab === 'Senčni pas') { const c = { 'Moder prehod': 0x2a5bd7, 'Črn': 0x0b0c0f, 'Bel': 0xf2f2ee, 'Rumen': 0xf2c230, 'V barvi črt': 0xf2f2ee }[nm]; u = carPic('front', null, (g, C) => { if (c != null) { const m = box(g, 0.05, 0.13, 1.18, C.wsX - 0.02, C.wsTop - 0.07, 0, c, { sh: 30 }); m.rotation.z = 0.95; } }); }
      else if (/^quarter_/.test(part) && tab === 'Številka') { const r = { 'Bel krog': ['#f4f6f8', null], 'Rumen krog': ['#f2c230', null], 'Krog v barvi črt': ['#f2f2ee', null], 'Krog z obrobo': ['#f4f6f8', '#0d1626'] }[nm] || ['#f4f6f8', null]; u = carPic(/_l$/.test(part) ? 'side_l' : 'side', null, (g, C) => plane(g, roundel('7', r[0], '#0d1626', r[1]), 0.24, 0.24, C.q[0], C.q[1], (/_l$/.test(part) ? -1 : 1) * (C.K.hw - 0.08), /_l$/.test(part) ? Math.PI : 0)); }
      else if (part === 'rear_window' && tab === 'Žaluzije') { const c = { 'Črne': 0x15171c, 'V barvi avta': 0x1c5fd6, 'V barvi črt': 0xf2f2ee, 'Kromirane': 0xdfe3e8 }[nm]; u = carPic('rear', null, (g, C) => { if (c == null) return; const [x0, x1, y0, y1] = C.rw; for (let i = 0; i < 6; i++) { const f = (i + 0.5) / 6, x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f + 0.02; box(g, 0.035, 0.012, 1.1, x, y, 0, c, { sh: c === 0xdfe3e8 ? 160 : 40 }); } }); }
      else if (part === 'headlights' && tab === 'Žarometi') { const k = { 'LED': 'led', 'Rumeni': 'rum', 'Dimljeni': 'dim', 'Bi-LED': 'bil' }[nm]; if (k) u = partPic(grp(g => { for (const s of [-1, 1]) { const l = lampPart(k); l.position.z = s * 0.1; g.add(l); } }), [1, 0.25, 0.45]); }
      else if (part === 'headlights' && tab === 'Žmigavci') { const k = { 'Prozorni': 'proz', 'Dimljeni': 'dim', 'Tekoči': 'tek', 'Kromirani': 'krom' }[nm]; if (k) u = partPic(grp(g => g.add(vSigLamp(k))), [0.3, 0.25, 1]); }
      else if (part === 'headlights' && tab === 'Relijske luči') { u = carPic('front', null, (g, C) => { const K = C.K, L = (x, y, z, r = 0.07) => { cyl(g, r, 0.06, x, y, z, 0x15171c, 'x'); cyl(g, r * 0.8, 0.065, x + 0.004, y, z, 0xfff3c4, 'x', { em: 0.5 }); };
          if (nm === 'Dve okrogli') for (const z of [-0.45, 0.45]) L(K.front + 0.06, 0.42, z); if (nm === 'Štiri okrogle') for (const z of [-0.5, -0.17, 0.17, 0.5]) L(K.front + 0.08, 0.62, z, 0.065);
          if (nm === 'Letev') { const x = C.roofX[1] - 0.12, y = K.top - 0.01; box(g, 0.1, 0.07, 1.25, x, y + 0.06, 0, 0x15171c); for (let i = 0; i < 5; i++) box(g, 0.012, 0.045, 0.17, x + 0.055, y + 0.06, -0.48 + i * 0.24, 0xfff3c4, { em: 0.6 }); }
          if (nm === 'LED-letev v maski') box(g, 0.03, 0.035, 0.9, K.front + 0.01, 0.6, 0, 0xeaf6ff, { em: 0.8 }); }); }
      else if (part === 'taillights') { const k = { 'Dimljene': 'dim', 'Prozorne': 'proz', 'Okrogle': 'okr', 'LED-trak': 'led' }[nm]; if (k) u = partPic(grp(g => g.add(vTailLit(k))), [0.25, 0.3, 1]); }
      else if (part === 'grille' && tab === 'Maska') { const k = { 'Satasta': 'sat', 'Mrežasta': 'mrez', 'Kromirana': 'krom', 'Karbonska': 'karb', 'V barvi avta': 'barva' }[nm]; if (k) u = partPic(grp(g => { const q = grillePart(k); q.rotation.z = Math.PI / 2; g.add(q); }), [0.25, 0.25, 1]); }
      else if (part === 'grille' && tab === 'Hupa') { if (nm === 'Dvotonska' || nm === 'Trotonska') u = partPic(grp(g => g.add(U5P.horn(U5M())))); }
      else if (part === 'aero' && tab === 'Paket') { const k = { 'Cestni': 1, 'Športni': 2, 'Dirkalni': 3, 'Paket GT': 4 }[nm]; if (k) { const sc = new T.Scene(); lights(sc); const M0 = amModel('carpaint', k, 1); sc.add(new T.Mesh(M0.geo, amMat('carpaint'))); const v = VIEWS.front, cam = new T.PerspectiveCamera(v[0], TW / TH, 0.1, 100); cam.position.set(v[1], v[2], v[3]); cam.lookAt(v[4], v[5], v[6]); cam.updateProjectionMatrix(); u = rt(sc, cam).toDataURL('image/png'); } }
      else if (part === 'aero' && tab === 'Krilo') { const W5 = { 'Lok': 0, 'Nizko krilo': 1, 'Kratko krilo': 2, 'GT krilo': 3, 'Dvojno krilo': 4 }, kk = W5[nm]; const wings = st && st.regal ? st.regal.wings : [];
        const wi = wings.findIndex((w, i) => (FO.wk ? FO.wk[i] : WG5[i][2]) === kk); u = carPic('rearlow', null, wi < 0 ? null : (g, C) => { const cl = wings[wi].clone(true); cl.position.set(C.K.deckX + 0.06, C.K.deckY - 0.01, 0); cl.rotation.set(0, -Math.PI / 2, 0); cl.scale.setScalar(kk === 2 ? 0.95 : 1.0); cl.traverse(m => { if (m.isMesh) { const mt = [].concat(m.material)[0]; if (mt && (mt.transparent || mt.depthWrite === false)) m.visible = false; } }); g.add(cl); }); }
      else if (part === 'exhaust') { const D2 = [-0.35, 0.5, 1]; const k = EX6.indexOf(nm); if (nm === 'Serijski') u = partPic(grp(g => itemExhaust(g, 0)), D2); else if (k >= 0) u = partPic(grp(g => exh6(g, k, null)), D2); }
      else if (part === 'tyres' && tab === 'Gume') { const si = TSETS.findIndex(t => t[0] === nm); if (si >= 0) u = partPic(grp(g => tyre(g, si, 0, 0, 0, 'up')), [1, 0.32, 0.6]); }
      else if (part === 'tyres' && tab === 'Dim gum') { const c = { 'Bel': ['#dfe4ea', '#7b8494'], 'Moder': ['#2a8cff', '#1257b8'], 'Rdeč': ['#e0262f', '#8f1218'], 'Rumen': ['#f2c230', '#b8860b'], 'Vijoličen': ['#a855f7', '#6b21a8'] }[nm]; if (c) u = smoke(c[0], c[1]); }
      else if (part === 'rims' && tab === 'Platišča') { const r = RIM4.find(q => q.nm.toLowerCase() === nm.toLowerCase()); u = partPic(grp(g => rimD(g, r || { p: 'split', c: 0xb8bec6 })), [0.22, 0.12, 1]); }
      else if (part === 'rims' && tab === 'Matice') { const c = { 'Rdeče': 0xd81f2a, 'Modre': 0x2a5bd7, 'Zlate': 0xd4a52a, 'Črne': 0x1c1e23 }[nm]; if (c != null) u = partPic(nutsSet(c), [0.2, 0.15, 1]); }
      else if (part === 'brakes' && tab === 'Zaviranje') { if (nm === 'Športne ploščice') u = partPic(grp(g => g.add(U5P.pads(U5M())))); else { const k = { 'Športni diski': 'sport', 'Dirkalni diski': 'dirk', 'Keramične': 'ker' }[nm]; if (k) u = partPic(grp(g => g.add(discPart(k))), [0.3, 0.3, 1]); } }
      else if (part === 'brakes' && tab === 'Čeljusti') { const k = { 'Rdeče čeljusti': 'rde', 'Rumene čeljusti': 'rum', 'Zlate čeljusti': 'zla', 'V barvi avta': 'barva' }[nm]; if (k) u = partPic(grp(g => g.add(pdCaliper(k))), [0.3, 0.2, 1]); }
      else if (part === 'brakes' && tab === 'Podvozje') { const k = { 'Vzmeti': 'springs', 'Amortizerji': 'dampers', 'Stabilizatorji': 'arb', 'Opornik blatnikov': 'brace' }[nm]; if (k && U5P[k]) u = partPic(grp(g => g.add(U5P[k](U5M())))); }
      else if (part === 'underglow' && tab === 'Barva') { const c = GLOWC[nm]; if (c) u = carPic('side', null, null, { under: glowUnder(c) }); }
      else if (part === 'underglow' && tab === 'Način') { u = carPic('side', null, null, { under: (g, W, H) => { if (nm === 'Mavrica') { ['#ff2d3a', '#f2c230', '#37e35a', '#2a8cff', '#b05cff'].forEach((c, i) => { g.save(); g.globalAlpha = 0.75; glowUnder(c, 0.6)(g, W, H); g.restore(); g.translate(W * 0.06, 0); }); g.setTransform(1, 0, 0, 1, 0, 0); } else glowUnder('#2a8cff', nm === 'Dihajoča' ? 0.45 : 1)(g, W, H); },
          over: (g, W, H) => { g.fillStyle = '#0d1626'; g.strokeStyle = '#0d1626'; g.lineWidth = 3; if (nm === 'Ob zaviranju') { g.fillStyle = '#e5484d'; g.beginPath(); g.arc(W - 16, 16, 11, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 16px Roboto, Arial'; g.textAlign = 'center'; g.fillText('!', W - 16, 22); } if (nm === 'Dihajoča') { for (const r of [6, 11]) { g.beginPath(); g.arc(W - 16, 16, r, 0, 7); g.stroke(); } } } }); }
      else if (part === 'srv') u = srvIcon(q.srv);
    } catch (e) { console.error('MN4PIC ' + key + ' ' + e.message); u = null; }
    return (CACHE[key] = u); };
  const pics = (spec, st) => { spec.tiles.forEach(q => { if (!q.url) q.url = picOf(spec.part, spec.tab || (q.tab || ''), q, st); }); return spec; };
  // ---- the preview on the car: a part's meshes (in the world or the car's frame) translucent in their own colours, a light outline, a soft glow ----
  const ghost = (objs, parent, o = {}) => { const g = new T.Group(); g.name = 'mn4Ghost'; (parent || PR.group()).add(g); objs.forEach(src => { src.updateMatrixWorld(true); src.traverse(m => { if (!m.isMesh || !m.visible) return; const mt = [].concat(m.material)[0]; if (mt && (mt.transparent && mt.opacity < 0.5)) return;
      const c = o.col != null ? new T.Color(o.col) : mt && mt.color ? mt.color.clone() : new T.Color(0xffffff), geo = m.geometry, M = m.matrixWorld.clone(); const inv = new T.Matrix4().copy(g.parent.matrixWorld).invert(), L = inv.multiply(M);
      const a = new T.Mesh(geo, new T.MeshLambertMaterial({ color: c, emissive: c.clone().multiplyScalar(0.35), transparent: true, opacity: o.op || 0.5, depthWrite: false, depthTest: o.xray ? false : true })); a.applyMatrix4(L); a.renderOrder = 16; g.add(a);
      if (o.edges === false) return; const e = new T.LineSegments(new T.EdgesGeometry(geo, 30), new T.LineBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.7, depthWrite: false, depthTest: o.xray ? false : true })); e.applyMatrix4(L); e.renderOrder = 17; g.add(e); }); });
    g.updateMatrixWorld(true); return g; };
  return { stats: mn4Stats, menu, card, pics, picOf, shown, info, ghost, carPic, partPic, LIST, D, priceN, car, VIEWS, TW, TH };
})();
