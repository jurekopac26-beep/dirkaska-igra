/* =========================================================================
   GARAGE — the garage page (garaza.html): the cars, their upgrades, service and paint, the credits. The pictures and the
   animations are Garage3D's; this file keeps the garage's own state (a demo profile for now: joined with the menu and the career
   later) and draws the card under the picture.
   ========================================================================= */
(function () {
  'use strict';
  const tr = (s, ...a) => Lang.tr(s, ...a);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const num = (n) => Lang.thou(n);
  const MODELS = Core.MODELS, PRICE = Core.CAREER.car, UPG = Core.UPG;
  // the game's colours (game.js PLAYER_COLORS), their names
  const COLORS = [[0xd81f2a, 'Rdeča'], [0xf5f5f0, 'Bela'], [0x1c5fd6, 'Modra'], [0xf2c230, 'Rumena'], [0x1a1a1f, 'Črna'], [0x2fa84f, 'Zelena'], [0xff7a1a, 'Oranžna'], [0x8e3bd6, 'Vijolična']];
  const CSS = (h) => '#' + h.toString(16).padStart(6, '0');
  // the cars in the garage's order: by price, the cheapest first
  const ORDER = MODELS.map(m => m.id).sort((a, b) => (PRICE[a] || 0) - (PRICE[b] || 0));
  const model = (id) => MODELS.find(m => m.id === id);
  const BODY = { coupe: 'Kupe', sedan: 'Limuzina', hatch: 'Hatchback', wedge: 'Športni avto', rally: 'Reli', formula: 'Formula', lm: 'Prototip', muscle: 'Muscle car', ev: 'Električni', truck: 'Terenec' };
  const COLOR0 = { pico: 2, kaze: 0, muscle: 6, strega: 3, vortex: 1, truck: 4, rally: 1, ev: 5, formula: 0, lm: 2 };
  const FREE = ['pico', 'kaze', 'muscle'];   // (the free game's cars; the rest come with the full game)
  // service prices (CR): a wash, the body (scratches, dents), the engine and its oil; a full service 15 % off
  const SRV = [
    { id: 'clean', name: 'Pranje', desc: 'Pena, voda, vosek', base: 150, k: 450 },
    { id: 'body', name: 'Karoserija', desc: 'Praske in udrtine', base: 300, k: 2200 },
    { id: 'engine', name: 'Motor in olje', desc: 'Olje, filtri, svečke', base: 400, k: 2600 },
  ];
  const PAINT = 1500, STRIPE = 500;

  /* ---------------- the state: money, the cars (bought or not), each car's parts, wear and colour ---------------- */
  const KEY = 'apex-garage';
  const carNew = (id, own) => ({ own: !!own, upg: { motor: 0, gume: 0, zavore: 0, aero: 0 }, max: { motor: 0, gume: 0, zavore: 0, aero: 0 }, color: COLOR0[id] || 0, stripe: true, cond: { clean: 1, body: 1, engine: 1 } });
  function profile(mode) {   // the mockup's three profiles: a new player (free), the full game, a veteran
    const S = { v: 1, mode, money: 11500, car: 'pico', cars: {}, lang: S0lang(), sound: true };
    for (const id of ORDER) S.cars[id] = carNew(id, id === 'pico');
    S.cars.pico.cond = { clean: 0.35, body: 0.6, engine: 0.42 };
    if (mode === 'vet') {
      S.money = 248500; S.car = 'kaze';
      const set = (id, u, c) => { const k = S.cars[id]; k.own = true; Object.assign(k.upg, u); Object.assign(k.max, u); if (c) k.cond = c; };
      set('pico', { motor: 2, gume: 1, zavore: 1, aero: 1 }, { clean: 0.9, body: 0.85, engine: 0.8 });
      set('kaze', { motor: 3, gume: 2, zavore: 2, aero: 3 }, { clean: 0.55, body: 0.72, engine: 0.66 });
      set('muscle', { motor: 3, gume: 1 }); set('strega', { aero: 2, gume: 2 }); set('vortex', {}); set('rally', { motor: 2, gume: 3, zavore: 2 }, { clean: 0.2, body: 0.5, engine: 0.7 }); set('ev', { motor: 1 });
    }
    return S;
  }
  function S0lang() { try { const s = JSON.parse(localStorage.getItem('tdgp-settings') || 'null'); if (s && s.lang === 'en') return 'en'; } catch (_) { } return 'sl'; }
  let S = null;
  function load() {
    let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { s = null; }
    if (!s || s.v !== 1 || !s.cars || !s.mode) return profile('full');
    const d = profile(s.mode);
    for (const id of ORDER) { const c = s.cars[id], o = d.cars[id]; if (!c) continue; o.own = !!c.own; for (const k of ['motor', 'gume', 'zavore', 'aero']) { o.upg[k] = lv(c.upg && c.upg[k]); o.max[k] = Math.max(o.upg[k], lv(c.max && c.max[k])); }
      o.color = Number.isInteger(c.color) && c.color >= 0 && c.color < COLORS.length ? c.color : o.color; o.stripe = c.stripe !== false;
      for (const k of ['clean', 'body', 'engine']) o.cond[k] = c.cond && Number.isFinite(c.cond[k]) ? Math.min(1, Math.max(0, c.cond[k])) : o.cond[k]; }
    d.money = Number.isFinite(s.money) ? Math.max(0, Math.round(s.money)) : d.money; d.car = ORDER.includes(s.car) ? s.car : d.car; d.lang = s.lang === 'en' ? 'en' : 'sl'; d.sound = s.sound !== false; d.demo = s.demo !== false;
    if (!d.cars.pico.own) d.cars.pico.own = true;
    return d;
  }
  const lv = (x) => Number.isInteger(x) && x >= 0 && x <= 3 ? x : 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { } }
  const C = () => S.cars[S.car], M = () => model(S.car);
  const locked = (id) => S.mode === 'free' && !FREE.includes(id) && !S.cars[id].own;
  const condAvg = (c) => (c.cond.clean + c.cond.body + c.cond.engine) / 3;
  const srvPrice = (s, c) => { const w = 1 - c.cond[s.id]; return w < 0.02 ? 0 : Math.round((s.base + s.k * w) / 50) * 50; };
  const spec = (id) => { const c = S.cars[id]; return { M: model(id), color: COLORS[c.color][0], stripe: c.stripe, upg: Object.assign({}, c.upg), cond: Object.assign({}, c.cond), num: 0 }; };

  /* ---------------- icons ---------------- */
  const I = {
    power: '<svg viewBox="0 0 32 32"><path d="M18 3L7 18h8l-2 11 12-16h-8z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    weight: '<svg viewBox="0 0 32 32"><path d="M10 11h12l4 16H6z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="16" cy="7.5" r="3.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    cond: '<svg viewBox="0 0 32 32"><path d="M20.5 4.5a6.5 6.5 0 0 0-6 9L5 23v4h4l9.5-9.5a6.5 6.5 0 0 0 9-6l-4 1.5-3-3 1.5-4z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/></svg>',
    car: '<svg viewBox="0 0 32 32"><path d="M4 21v-4l3-1 3-5h11l5 5 3 1v4h-3" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><circle cx="9.5" cy="21.5" r="2.8" fill="none" stroke="currentColor" stroke-width="2.3"/><circle cx="22.5" cy="21.5" r="2.8" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M12.3 21.5h7.4" stroke="currentColor" stroke-width="2.3"/></svg>',
    upg: '<svg viewBox="0 0 32 32"><path d="M16 4l9 9h-5.5v8h-7v-8H7z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M8 26h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    srv: '<svg viewBox="0 0 32 32"><path d="M20.5 4.5a6.5 6.5 0 0 0-6 9L5 23v4h4l9.5-9.5a6.5 6.5 0 0 0 9-6l-4 1.5-3-3 1.5-4z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/></svg>',
    paint: '<svg viewBox="0 0 32 32"><path d="M6 6h17v6H6z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M23 9h3v6l-11 2v4" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><rect x="12.5" y="21" width="5" height="7" rx="1.5" fill="currentColor"/></svg>',
    motor: '<svg viewBox="0 0 32 32"><path d="M7 12h4l2-3h7l2 3h3v4h2v-3h2v10h-2v-3h-2v4h-5l-3 3H11l-2-3H7z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="M3 15v6M3 18h4" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>',
    gume: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8" stroke="currentColor" stroke-width="2"/></svg>',
    zavore: '<svg viewBox="0 0 32 32"><circle cx="15" cy="17" r="10" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="15" cy="17" r="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M19 4.5a10 10 0 0 1 9 9l-5 1a5.5 5.5 0 0 0-5-5z" fill="currentColor"/></svg>',
    aero: '<svg viewBox="0 0 32 32"><path d="M3 11c7-3 18-3 26 0l-1 4c-7-2-17-2-24 0z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M9 14v9M23 14v9M5 25h22" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>',
    clean: '<svg viewBox="0 0 32 32"><path d="M16 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M12.5 20a3.5 3.5 0 0 0 3.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    body: '<svg viewBox="0 0 32 32"><path d="M4 21v-4l3-1 3-5h11l5 5 3 1v4" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M8 25h16" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><path d="M24 4l1.2 2.6L28 8l-2.8 1.3L24 12l-1.2-2.7L20 8l2.8-1.4z" fill="currentColor"/></svg>',
    engine: '<svg viewBox="0 0 32 32"><path d="M6 13h15l4-4h3v4l-5 5v6H6z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M10 13V9h6v4M3 16v5" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" fill="none"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  /* ---------------- the card ---------------- */
  let panel = 'home', thumbs = {}, thumbQ = [];
  function head() {
    const Mm = M(), c = C(), st = Core.upgStats(Mm, c.upg), own = c.own;
    $('g-money').textContent = num(S.money);
    $('g-name').textContent = Mm.name;
    $('g-drive').textContent = Mm.drive;
    $('g-tag').textContent = (Mm.drive + ' · ' + tr(BODY[Mm.body] || '')).toUpperCase();
    const nOwn = ORDER.filter(id => S.cars[id].own).length;
    $('g-sub').textContent = tr('V GARAŽI {0}/{1}', nOwn, ORDER.length);
    const q = Math.round(condAvg(c) * 100);
    $('g-stats').innerHTML = stat(I.power, tr('Moč'), Math.round(st.kw) + ' kW') + stat(I.weight, tr('Masa'), num(Mm.mass) + ' kg') +
      stat(I.cond, tr('Stanje'), own ? q + ' %' : '–', q < 50 ? 'bad' : q < 75 ? 'warn' : '');
    $('g-dots').innerHTML = ORDER.map(id => '<i class="' + (id === S.car ? 'sel ' : '') + (S.cars[id].own ? 'own' : '') + '"></i>').join('');
    // the go button: choose this car, buy it, or it comes with the full game
    const go = $('g-go'); go.className = 'g-btn g-btn-go';
    if (own) { go.textContent = tr('Izberi'); go.dataset.act = 'go'; }
    else if (locked(S.car)) { go.textContent = tr('V polni igri'); go.className += ' lock'; go.dataset.act = 'locked'; }
    else { go.textContent = tr('Kupi · {0} CR', num(PRICE[S.car] || 0)); go.className += ' buy'; go.dataset.act = 'buy'; }
  }
  const stat = (ic, l, v, cls) => '<div class="g-stat">' + ic + '<div><small>' + esc(l) + '</small><b class="' + (cls || '') + '">' + esc(v) + '</b></div></div>';
  const ph = (t, sub) => '<div class="g-ph"><button data-act="home" aria-label="' + esc(tr('Nazaj')) + '">' + I.back + '</button><h3>' + esc(t) + '</h3>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>';
  function body() {
    const c = C(), Mm = M(), b = $('g-body');
    document.querySelector('.g-card').classList.toggle('open', panel !== 'home');   // (a panel open: the numbers row gives it its room)
    if (panel === 'home') {
      const nu = ['motor', 'gume', 'zavore', 'aero'].reduce((a, k) => a + c.upg[k], 0), q = condAvg(c), col = COLORS[c.color];
      const tile = (act, ic, label, val, extra, dim) => '<button class="g-tile' + (dim ? ' dim' : '') + '" data-act="' + act + '"><span class="ic">' + ic + '</span><span><small>' + esc(label) + '</small><b>' + esc(val) + '</b>' + (extra || '') + '</span></button>';
      const th = thumbs[S.car] && thumbs[S.car][c.color + (c.stripe ? 's' : '')];
      b.innerHTML = '<div class="g-grid">' +
        tile('p-car', th ? '<img alt="" src="' + th + '">' : I.car, tr('Avto'), (ORDER.indexOf(S.car) + 1) + ' / ' + ORDER.length) +
        tile('p-upg', I.upg, tr('Nadgradnje'), nu + ' / 12', '', !c.own) +
        tile('p-srv', I.srv, tr('Servis'), c.own ? Math.round(q * 100) + ' %' : '–', c.own ? '<div class="bar"><i style="width:' + Math.round(q * 100) + '%;background:' + condCol(q) + '"></i></div>' : '', !c.own) +
        tile('p-paint', '<i style="width:30px;height:30px;border-radius:50%;background:' + CSS(col[0]) + ';border:2.5px solid #d8e0ea;display:block"></i>', tr('Barva'), tr(col[1]), '', !c.own) +
        '</div><p class="g-hint">' + esc(c.own ? tr('Povleci po sliki levo ali desno, da zavrtiš kamero okoli avta. Tapni med animacijo, da jo pospešiš.') : locked(S.car) ? tr('{0} je na voljo v polni igri.', Mm.name) : tr('{0} še ni tvoj: kupiš ga z gumbom spodaj.', Mm.name)) + '</p>';
    } else if (panel === 'car') {
      const st = Core.upgStats(Mm, c.upg), b0 = Core.upgStats(Mm, null);
      b.innerHTML = ph(tr('Avto'), tr('{0} od {1}', ORDER.indexOf(S.car) + 1, ORDER.length)) + '<div class="g-cars" id="g-cars">' + ORDER.map(id => {
        const k = S.cars[id], m = model(id), t = thumbs[id] && thumbs[id][k.color + (k.stripe ? 's' : '')];
        const s2 = k.own ? '<small class="own">' + esc(tr('V GARAŽI')) + '</small>' : locked(id) ? '<small class="lock">🔒 ' + esc(tr('POLNA IGRA')) + '</small>' : '<small class="pr">' + num(PRICE[id] || 0) + ' CR</small>';
        return '<button class="g-car' + (id === S.car ? ' sel' : '') + (locked(id) ? ' locked' : '') + '" data-car="' + id + '"><div class="th">' + (t ? '<img alt="" src="' + t + '">' : '<i></i>') + '</div><b>' + esc(m.name) + '</b>' + s2 + '</button>';
      }).join('') + '</div>' + '<div class="g-meter">' + METER.map(([l, k]) =>
        '<small>' + esc(tr(l)) + '</small><span><i class="up" style="width:' + st[k] * 10 + '%"></i><i style="width:' + b0[k] * 10 + '%"></i></span><b>' + (Math.round(st[k] * 10) / 10).toFixed(1).replace('.', Lang.cur === 'en' ? '.' : ',') + '</b>').join('') + '</div>' +
        '<p class="g-hint">' + esc(tr(CARDESC[Mm.id] || Mm.desc)) + '</p>';
      requestAnimationFrame(() => { const el = document.querySelector('.g-car.sel'); if (el) el.scrollIntoView({ block: 'nearest', inline: 'center' }); });
      queueThumbs();
    } else if (panel === 'upg') {
      const tabs = ['motor', 'gume', 'zavore', 'aero'];
      b.innerHTML = ph(tr('Nadgradnje'), ['motor', 'gume', 'zavore', 'aero'].reduce((a, k) => a + c.upg[k], 0) + ' / 12') + tabs.map(k => {
        const u = UPG.find(x => x.id === k), cur = c.upg[k], mx = c.max[k];
        const next = cur < 3 ? (cur + 1 <= mx ? 0 : Core.careerUpgPrice(mx, cur + 1)) : -1;
        return '<div class="g-row"><span class="ic">' + I[k] + '</span><span class="tx"><b>' + esc(tr(u.name)) + '</b><small>' + esc(tr(u.lv[cur])) + (UPG_FX[k][cur] ? ' · ' + esc(tr(UPG_FX[k][cur])) : '') + '</small></span>' +
          '<span class="g-lv">' + [0, 1, 2, 3].map(l => '<button data-upg="' + k + '" data-lv="' + l + '" class="' + (l === cur ? 'fit' : l <= mx ? 'got' : 'buy') + '" aria-label="' + esc(tr(u.lv[l])) + '">' + (l === 0 ? 'S' : l) + '</button>').join('') + '</span></div>';
      }).join('') + '<p class="g-hint">' + esc(tr('S = serijsko. Rumena pika: še ni kupljeno. Cena stopnje 1, 2, 3: {0}, {1}, {2} CR.', num(Core.CAREER.upg[1]), num(Core.CAREER.upg[2]), num(Core.CAREER.upg[3]))) + '</p>';
    } else if (panel === 'srv') {
      let all = 0;
      const rows = SRV.map(s => { const p = srvPrice(s, c), q = c.cond[s.id]; all += p;
        return '<div class="g-row"><span class="ic">' + I[s.id] + '</span><span class="tx"><b>' + esc(tr(s.name)) + ' <span style="font-style:normal;font-weight:700;color:' + condCol(q) + '">' + Math.round(q * 100) + ' %</span></b><small>' + esc(tr(s.desc)) + '</small><div class="g-bar"><i style="width:' + Math.round(q * 100) + '%;background:' + condCol(q) + '"></i></div></span>' +
          (p ? '<button class="g-fix' + (S.money < p ? ' poor' : '') + '" data-srv="' + s.id + '">' + num(p) + ' CR</button>' : '<button class="g-fix" disabled>✓</button>') + '</div>'; }).join('');
      const full = Math.round(all * 0.85 / 50) * 50;
      b.innerHTML = ph(tr('Servis'), tr('Stanje {0} %', Math.round(condAvg(c) * 100))) + rows + '<button class="g-wide" data-srv="all"' + (all ? '' : ' disabled') + '>' + esc(tr('Popoln servis')) + (all ? '<small>' + num(full) + ' CR · −15 %</small>' : '') + '</button>';
    } else if (panel === 'paint') {
      b.innerHTML = ph(tr('Barva'), tr('Barvanje {0} CR', num(PAINT))) + '<div class="g-swatches">' + COLORS.map((col, i) => '<button class="g-sw' + (i === c.color ? ' sel' : '') + '" data-col="' + i + '"><i style="background:' + CSS(col[0]) + '"></i><small>' + esc(tr(col[1])) + '</small></button>').join('') + '</div>' +
        '<div class="g-row"><span class="ic">' + I.paint + '</span><span class="tx"><b>' + esc(tr('Dirkalne črte')) + '</b><small>' + esc(tr('Druga barva na pokrovu in bokih · {0} CR', num(STRIPE))) + '</small></span><span class="g-seg"><button data-stripe="1" class="' + (c.stripe ? 'sel' : '') + '">' + esc(tr('Da')) + '</button><button data-stripe="0" class="' + (c.stripe ? '' : 'sel') + '">' + esc(tr('Ne')) + '</button></span></div>';
    }
  }
  const condCol = (q) => q < 0.5 ? '#ff6b5b' : q < 0.75 ? '#f5c84c' : '#5fd38a';
  const METER = [['Moč', 'power'], ['Oprijem', 'grip'], ['Teža', 'weight'], ['Drift', 'drift']];   // (the stat bars of the car panel)
  const DONE_NAME = { gume: 'Gume', zavore: 'Zavore', aero: 'Aerodinamika', motor: 'Motor', clean: 'Pranje', body: 'Karoserija', engine: 'Motor in olje', paint: 'Barva' };
  const UPG_FX = { motor: ['', 'Športni izpuh', 'Dvojni izpuh, zračniki', 'Štirje izpuhi, zajemalnik'], gume: ['', 'Bel napis', 'Rumen pas', 'Rdeč pas'], zavore: ['', 'Rdeče čeljusti', 'Rumene čeljusti', 'Zlate, karbonski diski'], aero: ['', 'Spojler, spodnja ustnica', 'Zadnje krilo', 'Krilo GT, krilca, pragovi'] };
  // the cars' words (game.js CAR_DESC)
  const CARDESC = { kaze: 'Rad obrne rep, rojen za drift.', vortex: 'Veliko oprijema, stabilen tudi na robu.', pico: 'Lahek in okreten, rad podvija.', strega: 'Oster in živahen, hitro zavrti.', rally: 'Relijski dirkač iz 80-ih, ogromno moči, rojen za drift.', formula: 'Odprta kolesa in krila, ki ga pri hitrosti pritisnejo ob cesto. Zavira izjemno, na travi in makadamu pa drsi. Z njim dirkaš proti samim formulam.',
    lm: 'Prototip za 24 ur Le Mansa: zaprta kabina, veliko zadnje krilo. Na ravninah najhitrejši avto v igri, v hitrih ovinkih ga krila držijo ob cesti. Z njim dirkaš proti samim prototipom.',
    muscle: 'Ameriški »muscle car« iz 70-ih z velikim V8. Na ravnini ga je težko ujeti, v ovinkih pa rad obrne rep: kralj drifta.',
    ev: 'Električni hiperšportnik s štirimi motorji: najhitrejši pospešek med cestnimi avti in skoraj brez zvoka, a težek.',
    truck: 'Terenski dirkalni tovornjak z velikimi kolesi. Na asfaltu počasen, na makadamu in travi pa ima največ oprijema in najhitreje pospeši; po skokih mehko pristane.' };
  function render() { head(); body(); }

  /* ---------------- the car pictures for the list (drawn by Garage3D one at a time, between frames) ---------------- */
  function queueThumbs(ids) {
    for (const id of ids || ORDER) { const k = S.cars[id], key = k.color + (k.stripe ? 's' : ''); if (!(thumbs[id] && thumbs[id][key]) && !thumbQ.some(q => q[0] === id && q[1] === key)) thumbQ.push([id, key]); }
  }
  function thumbStep() {
    if (!thumbQ.length || G.busy) return;
    const [id, key] = thumbQ.shift(), k = S.cars[id];
    try { (thumbs[id] = thumbs[id] || {})[key] = G.thumb({ M: model(id), color: COLORS[k.color][0], stripe: k.stripe, upg: k.upg }, 132, 72); } catch (e) { console.error(e); return; }
    const el = document.querySelector('.g-car[data-car="' + id + '"] .th'); if (el && S.cars[id].color + (S.cars[id].stripe ? 's' : '') === key) el.innerHTML = '<img alt="" src="' + thumbs[id][key] + '">';
    if (panel === 'home' && id === S.car) body();
  }

  /* ---------------- what the buttons do ---------------- */
  const G = Garage3D;
  let toastT = 0, chipT = 0;
  function toast(t, bad) { const el = $('g-toast'); el.textContent = t; el.className = 'g-toast on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => { el.className = 'g-toast'; }, 2600); }
  function chip(small, big) { const el = $('g-chip'); el.innerHTML = '<small>' + esc(small) + '</small><b>' + big + '</b>'; el.className = 'g-chip on'; clearTimeout(chipT); chipT = setTimeout(() => { el.className = 'g-chip'; }, 2400); }
  function pay(p) {
    if (S.money < p) { const el = $('g-cr'); el.classList.remove('poor'); void el.offsetWidth; el.classList.add('poor'); setTimeout(() => el.classList.remove('poor'), 500); toast(tr('Premalo kreditov: potrebuješ {0} CR, imaš {1} CR.', num(p), num(S.money)), true); return false; }
    if (p > 0) { const from = S.money; S.money -= p; countMoney(from, S.money); const el = $('g-cr'); el.classList.remove('pay'); void el.offsetWidth; el.classList.add('pay'); G.sfx('coin'); }
    return true;
  }
  let moneyAnim = 0;
  function countMoney(a, b) { cancelAnimationFrame(moneyAnim); const t0 = performance.now(), el = $('g-money'); const st = (t) => { const k = Math.min(1, (t - t0) / 700); el.textContent = num(Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)))); if (k < 1) moneyAnim = requestAnimationFrame(st); }; moneyAnim = requestAnimationFrame(st); }
  function pickCar(id) {
    if (id === S.car) return;
    S.car = id; save(); queueThumbs([id]); render();
    $('g-name').parentElement.classList.remove('new'); void $('g-name').offsetWidth; $('g-name').parentElement.classList.add('new');
    G.swap(spec(id));
  }
  function step(d) { const i = ORDER.indexOf(S.car); pickCar(ORDER[(i + d + ORDER.length) % ORDER.length]); }
  function fitUpg(part, l) {
    const c = C(); if (!c.own) { toast(tr('Najprej kupi avto.'), true); return; }
    const cur = c.upg[part]; if (l === cur) return;
    if (l > c.max[part]) { const p = Core.careerUpgPrice(c.max[part], l); if (!pay(p)) return; c.max[part] = l; }
    c.upg[part] = l; save(); render();
    G.upgrade(part, l);
  }
  function doService(id) {
    const c = C(); if (!c.own) return;
    const list = id === 'all' ? SRV.filter(s => srvPrice(s, c) > 0) : SRV.filter(s => s.id === id);
    if (!list.length) return;
    const p = id === 'all' ? Math.round(list.reduce((a, s) => a + srvPrice(s, c), 0) * 0.85 / 50) * 50 : srvPrice(list[0], c);
    if (!pay(p)) return;
    for (const s of list) c.cond[s.id] = 1;
    save(); render();
    G.service(list.map(s => s.id), { clean: 1, body: 1, engine: 1 });
  }
  function doPaint(col, stripe) {
    const c = C(); if (!c.own) return;
    if (col === c.color && stripe === c.stripe) return;
    const p = (col !== c.color ? PAINT : 0) + (stripe !== c.stripe ? STRIPE : 0);
    if (!pay(p)) return;
    c.color = col; c.stripe = stripe; c.cond.clean = 1; c.cond.body = 1; save(); render(); queueThumbs([S.car]);
    G.paint(COLORS[col][0], stripe);
  }
  function buy() {
    const id = S.car, p = PRICE[id] || 0;
    if (!pay(p)) return;
    S.cars[id].own = true; save(); render(); G.sfx('ping');
    chip(tr('NOV AVTO V GARAŽI'), esc(M().name));
  }
  function onAct(act) {
    G.sound(S.sound);
    switch (act) {
      case 'prev': step(-1); break;
      case 'next': step(1); break;
      case 'home': panel = 'home'; body(); break;
      case 'p-car': panel = 'car'; body(); break;
      case 'p-upg': if (!C().own) { toast(locked(S.car) ? tr('{0} je na voljo v polni igri.', M().name) : tr('Najprej kupi avto.'), true); break; } panel = 'upg'; body(); break;
      case 'p-srv': if (!C().own) { toast(tr('Najprej kupi avto.'), true); break; } panel = 'srv'; body(); break;
      case 'p-paint': if (!C().own) { toast(tr('Najprej kupi avto.'), true); break; } panel = 'paint'; body(); break;
      case 'buy': buy(); break;
      case 'locked': toast(tr('{0} je na voljo v polni igri.', M().name)); break;
      case 'go': { const go = $('g-go'); go.classList.add('done'); go.textContent = tr('Izbran ✓'); toast(tr('{0} je izbran za naslednjo dirko.', M().name)); setTimeout(() => head(), 1600); break; }
      case 'back': toast(tr('Nazaj v meni (garaža bo kasneje povezana z menijem).')); break;
      case 'sound': S.sound = !S.sound; save(); G.sound(S.sound); $('g-snd').classList.toggle('mute', !S.sound); break;
      case 'lang': S.lang = S.lang === 'en' ? 'sl' : 'en'; save(); setLang(); break;
      case 'reset': S = profile(S.mode); S.demo = true; save(); thumbs = {}; panel = 'home'; render(); G.swap(spec(S.car)); toast(tr('Profil je ponastavljen.')); break;
      case 'demo-off': $('g-demo').classList.add('off'); S.demo = false; save(); resize(); break;
    }
  }
  function setLang() { Lang.set(S.lang); Lang.apply(document.body); $('g-lang').textContent = S.lang === 'en' ? 'SL' : 'EN'; render(); }

  /* ---------------- the page ---------------- */
  function bind() {
    document.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.act) return onAct(t.dataset.act);
      if (t.dataset.car) { G.sound(S.sound); pickCar(t.dataset.car); document.querySelectorAll('.g-car').forEach(x => x.classList.toggle('sel', x.dataset.car === S.car)); return; }
      if (t.dataset.upg) { G.sound(S.sound); return fitUpg(t.dataset.upg, +t.dataset.lv); }
      if (t.dataset.srv) { G.sound(S.sound); return doService(t.dataset.srv); }
      if (t.dataset.col) { G.sound(S.sound); return doPaint(+t.dataset.col, C().stripe); }
      if (t.dataset.stripe) { G.sound(S.sound); return doPaint(C().color, t.dataset.stripe === '1'); }
      if (t.dataset.mode) { S = profile(t.dataset.mode); S.demo = true; save(); thumbs = {}; panel = 'home'; markMode(); render(); G.swap(spec(S.car)); return; }
      if (t.dataset.view) { G.view(t.dataset.view === 'spin' ? 'spin' : +t.dataset.view); document.querySelectorAll('#g-views button').forEach(x => x.classList.toggle('sel', x === t)); }
    });
    document.addEventListener('pointerdown', () => G.sound(S.sound), { once: true });
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); });
    G.onHud = (k, d) => {
      if (k === 'busy') { if (d) document.querySelectorAll('#g-views button').forEach(x => x.classList.toggle('sel', x.dataset.view === '0')); $('g-stage').classList.toggle('busy', !!d); return; }
      if (k === 'power') { const Mm = M(), a = Core.upgStats(Mm, Object.assign({}, C().upg, { motor: d.from })).kw, b = Core.upgStats(Mm, Object.assign({}, C().upg, { motor: d.lv })).kw;
        chip(tr('MOČ'), Math.round(a) + ' → <em>' + Math.round(b) + ' kW</em>'); }
      else if (k === 'done') { const n = DONE_NAME[d.kind];
        if (d.kind !== 'motor') chip(tr('KONČANO'), esc(tr(n)) + (d.lv != null ? ' · ' + esc(tr(UPG.find(u => u.id === d.kind).lv[d.lv])) : ' ✓')); }
    };
  }
  function markMode() { document.querySelectorAll('#g-modes button').forEach(b => b.classList.toggle('sel', b.dataset.mode === S.mode)); }
  function resize() { const st = $('g-stage'), r = st.getBoundingClientRect(); G.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2)); }

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
    S = load(); Lang.set(S.lang);
    if (S.demo === false) $('g-demo').classList.add('off');
    bind(); markMode(); setLang();
    $('g-snd').classList.toggle('mute', !S.sound);
    G.init($('g-gl')); resize();
    G.show(spec(S.car));
    queueThumbs([S.car]);   // (the car shown: its picture on the Avto tile; the others when the car panel opens)
    render();
    requestAnimationFrame((t) => { last = t; loop(t); setTimeout(() => $('g-load').classList.add('done'), 120); });
    window.__garage = { get S() { return S; }, G, onAct, pickCar, fitUpg, doService, doPaint, buy, get panel() { return panel; }, set panel(p) { panel = p; body(); }, thumbs: () => thumbs, render,
      set hold(v) { hold = !!v; }, advance(sec) { for (let t = 0; t < sec; t += 1 / 30) G.frame(1 / 30, true); G.frame(0.0001); } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
