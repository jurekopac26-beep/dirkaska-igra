/* The quick list of the track step (js/menu.js: a tap on the flag in the row; the mockup's maketa-menija/izbira-proge/izbor.js, ported).
   A sheet from the bottom (lying: a panel on the right) with the flags of the countries that have tracks in the mode, by continent and
   A to Z in each (the shown track's country gold, a count on a flag with more tracks), the test tracks apart in a tile of their own at the
   end (they leave the game before its release). A country with one track opens its card at once, one with more its tracks (picture,
   length, climb or corners, type, PENDING, TEST). Over the flags a search (a place or a country, the accents left out: the answer is the
   tracks) and the four categories as filters, each with its icon (Circuit, Open road, Rally: the menu's groups; Ice: a track on ice, the
   track's def.ice): with any of them on, the tracks found instead of the flags. A track's card: its shape from above (MENU.shapes; a test
   track: its picture), its facts, the player's best and its heights,
   Select (the screen goes to it) and Race! (the race on it). The progress (a medal for the best place or a time trial's medal time, a tick
   for a track driven, NEW for one not driven yet) on the flags, the rows, the card and the screen's row (menu.js). Tap outside the sheet,
   the cross or Back (the phone's too: the history) to close it.
   MenuIzbor.open(o): o.root the menu's element (#mn in its shadow root), o.cur the id of the track shown, o.list the mode's tracks in the
   list's order ({ id, name, country, flag (the flag's address or ''), img, img2 (a picture for a missing img, or ''), km, alt, corners, group,
   test, pending, open, ice, lat, lon }),
   o.shape(id) (x, y pairs or null), o.heights(id) ({ L, H, real } or null), o.prog(id) (the game's progress: js/game.js MenuBridge.progress),
   o.pick(id), o.race(id), o.buzz(), o.click(); o.nu ({ top: the menu's buttons over it }): NEUPORABNO's list (nuView: the hidden tracks, js/menu.js
   nuSheet) instead of the countries. MenuIzbor.close(now), back() (Esc, the pad's B: the layer under it, else closed), isOpen(),
   sheet() (the gamepad's part of the screen), mark(p) (a progress mark: the screen's row); use(o) (the Earth's cards: the rows and the
   track's card, js/menu-zemlja.js) and nazaj (the history of the layers, the Earth's too). */
window.MenuIzbor = (function () {
  'use strict';
  /* The phone's Back (NAZAJ): every layer opened over the screen (the quick list, a country's tracks in it, a card) is one step in the
     history (history.pushState, its number in the state); Back closes the top one (popstate). A layer closed by its own button takes its
     step back out (history.go) and nothing new is written until that is done (a layer opened meanwhile waits for it). A browser that
     never answers the step back: taken as done after 1.5 s */
  const NAZAJ = (function () {
    const st = [];   // (the layers, the top last: { who, f (its own closing, without the history), h (its step written) })
    let want = -1, after = [], waiting = [], guard = 0, popping = false;
    const steps = () => st.reduce((n, l) => n + (l.h ? 1 : 0), 0);
    const write = () => { try { history.pushState({ nazaj: steps() + 1 }, '', location.href); return true; } catch (_) { return false; } };
    function done() {
      clearTimeout(guard); want = -1;
      for (const l of waiting) l.h = write();
      waiting = [];
      const a = after; after = []; a.forEach(f => f());
    }
    function back(k, then) {
      if (then) after.push(then);
      if (!k) { if (want < 0) done(); return; }
      want = steps(); clearTimeout(guard); guard = setTimeout(done, 1500);
      try { history.go(-k); } catch (_) { done(); }
    }
    addEventListener('popstate', (e) => {
      const n = e.state && typeof e.state.nazaj === 'number' ? e.state.nazaj : 0;
      if (want >= 0) { if (n <= want) done(); return; }   // (our own step back)
      popping = true;
      try { while (st.length && steps() > n) { const l = st.pop(); l.f(); } } finally { popping = false; }
    });
    function push(who, f) { const l = { who, f, h: false }; st.push(l); if (want >= 0) waiting.push(l); else l.h = write(); }
    // a layer closed by itself: n of who's top layers (all of them if left out), their steps taken out of the history
    function drop(who, n) {
      if (popping) return;   // (Back is closing it: its step is gone already)
      let k = 0, i = 0;
      while (st.length && st[st.length - 1].who === who && (n == null || i < n)) {
        const l = st.pop(); i++; if (l.h) k++;
        const w = waiting.indexOf(l); if (w >= 0) waiting.splice(w, 1);
      }
      if (k) back(k);
    }
    // every layer gone at once (a track chosen): their steps out of the history, then (then) what was waiting for it
    function clear(then) { const k = steps(); st.length = 0; waiting = []; back(k, then); }
    return { push, drop, clear, depth: (who) => st.filter(l => !who || l.who === who).length };
  })();

  /* the progress marks: p the game's progress ({ done, pos, medal, txt, what }) */
  const TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.6 8.4l2.9 2.9 5.9-6.6" fill="none" stroke="#062a14" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const KIND = ['done', 'gold', 'silver', 'bronze'], RANK = ['gold', 'silver', 'bronze', 'done'];
  const KNAME = { gold: 'Gold medal', silver: 'Silver medal', bronze: 'Bronze medal', done: 'Finished', new: 'Not driven yet' };
  const kindOf = (p) => !p || !p.done ? 'new' : KIND[p.medal] || 'done';
  const mark = (p) => { const k = kindOf(p); return '<i class="pr ' + k + '" role="img" aria-label="' + KNAME[k] + '">' + (k === 'new' ? 'NEW' : k === 'done' ? TICK : p.medal) + '</i>'; };
  const bestOf = (ps) => { let b = null; for (const p of ps) { const k = kindOf(p); if (k !== 'new' && (!b || RANK.indexOf(k) < RANK.indexOf(kindOf(b)))) b = p; } return b; };
  const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

  const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>';
  const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const GO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const LOUPE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#c9d6ec" stroke-width="2.6"/><path d="M15.5 15.5l5 5" stroke="#c9d6ec" stroke-width="2.8" stroke-linecap="round"/></svg>';
  // the filters (kept while the page lives): the four categories, each with its icon (the chip's text colour: dark on the gold chip, light on the
  // others), several on = either. A track is in one of them: Ice (def.ice: the road's surface is ice) before its group (js/menu.js: test, rally
  // or descent, open road, circuit); a test track in none
  const F = { q: '', type: new Set() };
  const LN = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const ic = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  const TYPES = [
    ['circuit', 'Circuit', ic('<rect x="2.6" y="6.2" width="18.8" height="11.6" rx="5.8" ' + LN + ' stroke-width="2.3"/><circle cx="8.8" cy="6.2" r="2.4" fill="currentColor"/>')],   // (an oval track, its start)
    ['road', 'Open road', ic('<path d="M9.6 3L3 21M14.4 3L21 21" ' + LN + ' stroke-width="2.3"/><path d="M12 4.2v3M12 10v3.6M12 16.4v4.2" ' + LN + ' stroke-width="2.2"/>')],   // (a road to the horizon)
    ['rally', 'Rally', ic('<g transform="translate(3.6 -1.2) scale(.84)"><path fill="currentColor" fill-rule="evenodd" d="M2.6 17.4v-3.8c0-.9.6-1.5 1.4-1.7l2.4-.6L8.1 8c.3-.6.8-1 1.5-1h4.6c.6 0 1.1.3 1.5.8l1.9 2.9 2.2.5c1 .2 1.6 1 1.6 2v3.2h-1.1a3.1 3.1 0 0 0-6.2 0H10.1a3.1 3.1 0 0 0-6.2 0H2.6zM9.3 8.5L8 11.1h7.6l-1.8-2.6z"/>' +
      '<circle cx="7" cy="17.4" r="2.2" fill="currentColor"/><circle cx="17.2" cy="17.4" r="2.2" fill="currentColor"/><path d="M2.4 10.6v-3M2.4 8h4.2" ' + LN + ' stroke-width="1.9"/></g>' +
      '<circle cx="3.2" cy="19.4" r="2" fill="currentColor"/><circle cx="6.2" cy="21" r="1.4" fill="currentColor"/><circle cx="1.6" cy="15.8" r="1.3" fill="currentColor"/>')],   // (a rally car with its wing, the dust behind it)
    ['ice', 'Ice', ic('<g ' + LN + ' stroke-width="1.9"><path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5"/><path d="M9.6 3.9L12 6l2.4-2.1M9.6 20.1L12 18l2.4 2.1M3.3 10.4l3.1-.7-1-3M20.7 13.6l-3.1.7 1 3M3.3 13.6l3.1.7-1 3M20.7 10.4l-3.1-.7 1-3"/></g>')]];   // (the snowflake: the menu's Snow)
  const NAMES = { circuit: 'Circuit', road: 'Open road', rally: 'Rally', ice: 'Ice' };
  const catOf = (t) => t.ice ? 'ice' : NAMES[t.group] ? t.group : '';
  const typeOf = (t) => NAMES[catOf(t)] || (t.open ? 'Open road' : 'Circuit');
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const filtered = () => !!(F.q.trim() || F.type.size);
  function match(t) {
    const hay = norm(t.name + ' ' + t.country);
    return norm(F.q).split(/\s+/).filter(Boolean).every(w => hay.includes(w)) && (!F.type.size || F.type.has(catOf(t)));
  }
  // the continents (the grid's sections): a country by its name, one not named here by where its tracks are
  const CONT = ['Europe', 'North America', 'South America', 'Africa', 'Asia', 'Oceania'];
  const IN = {};
  [['Albania Andorra Austria Belgium Bulgaria Croatia Czechia Denmark England Estonia Finland France Germany Greece Hungary Iceland Ireland Italy Latvia ' +
    'Lithuania Luxembourg Monaco Montenegro Netherlands Norway Poland Portugal Romania Russia Scotland Serbia Slovakia Slovenia Spain Sweden Switzerland Ukraine Wales', 0],
  ['Canada Mexico USA', 1], ['Argentina Bolivia Brazil Chile Colombia Ecuador Peru Uruguay', 2], ['Kenya Morocco Namibia Tanzania Tunisia South_Africa', 3],
  ['China India Japan Kazakhstan Malaysia Nepal South_Korea Thailand Turkey Vietnam', 4], ['Australia New_Zealand Palau', 5]].forEach(([s, k]) => s.split(' ').forEach(c => { IN[c.replace(/_/g, ' ')] = k; }));
  const contOf = (c) => IN[c.name] != null ? IN[c.name] : c.lat == null ? 0 : c.lon < -30 ? (c.lat > 12 ? 1 : 2) : c.lon > 110 && c.lat < -10 ? 5 : c.lat < 35 && c.lon > -20 && c.lon < 52 ? 3 : c.lon > 60 ? 4 : 0;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const num = (n) => Math.round(n).toLocaleString('en-US');
  // a flag in a 3:2 box, as the mockup's (stretched to it); a country without a flag: its first letters
  const flag = (url, name) => url ? '<svg viewBox="0 0 30 20" preserveAspectRatio="none" aria-hidden="true"><image href="' + esc(url) + '" width="30" height="20" preserveAspectRatio="none"/></svg>'
    : '<span class="nf" aria-hidden="true">' + esc(String(name || '?').slice(0, 3).toUpperCase()) + '</span>';
  const TEST = '<span class="tst" aria-hidden="true">TEST</span>';

  let o = null, el = null, view = null, prevs = [], P = {};   // (view: what the sheet shows; prevs: the views under it, Back returns to them; P: the progress)
  const byId = (id) => o.list.find(t => t.id === id);
  const prog = (id) => id in P ? P[id] : (P[id] = o.prog ? o.prog(id) : null);
  // the countries A to Z (the test tracks apart), each with its tracks in the list's order and where they are (their middle)
  function countries() {
    const by = new Map();
    for (const t of o.list) {
      if (t.test) continue;
      const k = t.country || t.name; if (!by.has(k)) by.set(k, { name: k, flag: t.flag, ids: [], lat: 0, lon: 0, n: 0 });
      const c = by.get(k); c.ids.push(t.id); if (t.lat != null && t.lon != null) { c.lat += t.lat; c.lon += t.lon; c.n++; }
    }
    for (const c of by.values()) { if (c.n) { c.lat /= c.n; c.lon /= c.n; } else c.lat = c.lon = null; }
    return [...by.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  }
  const tests = () => o.list.filter(t => t.test);
  const third = (t) => t.alt ? [(t.alt[1] < t.alt[0] ? '−' : '+') + num(Math.abs(t.alt[1] - t.alt[0])) + ' m', t.alt[1] < t.alt[0] ? 'Descent' : 'Climb']
    : t.corners != null ? [String(t.corners), 'Corners'] : null;
  const facts = (t) => { const c = third(t); return t.km.toFixed(2) + ' km' + (c ? ' · ' + (c[1] === 'Corners' ? c[0] + ' corners' : c[0]) : '') + ' · ' + typeOf(t); };
  const tracks = (n) => n + (n === 1 ? ' track' : ' tracks');
  // a track's row: its picture with the mark, the name (wf: its country's flag before it: the search's answers), the facts, the best, the tag
  function row(id, wf) {
    const t = byId(id), p = prog(id), tag = t.test ? '<em>TEST</em>' : t.pending ? '<em class="p">PENDING</em>' : '';
    const best = kindOf(p) !== 'new' && (p.txt || p.pos) ? '<span class="bt">' + esc(p.txt || '') + (p.pos ? '<small>' + ord(p.pos) + '</small>' : '') + '</span>' : '';
    return '<button class="izb-t' + (id === o.cur ? ' on' : '') + '" data-t="' + esc(id) + '"><span class="izb-im"><img src="' + esc(t.img) + '"' + (t.img2 ? ' data-alt="' + esc(t.img2) + '"' : '') + ' alt="" loading="lazy" decoding="async">' + mark(p) + '</span>' +
      '<span class="tx"><b>' + (wf && t.flag ? '<span class="izb-mf">' + flag(t.flag, t.country) + '</span>' : '') + esc(t.name) + '</b><small>' + facts(t) + '</small>' + best + tag + '</span><span class="izb-go">' + GO + '</span></button>';
  }
  function head(title, sub, left) {
    return '<div class="izb-head">' + (left || '') + '<div class="t"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div><button class="izb-btn" data-x aria-label="Close">' + X + '</button></div>';
  }
  const backBtn = (what) => '<button class="izb-btn" data-back aria-label="' + what + '">' + BACK + '</button>';
  function tools() {
    return '<div class="izb-tools"><label class="izb-q' + (F.q ? ' has' : '') + '">' + LOUPE + '<input type="search" placeholder="Search a place or a country" value="' + esc(F.q) + '" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" aria-label="Search a place or a country">' +
      '<button class="izb-qx" data-qx aria-label="Clear the search">' + X + '</button></label><div class="izb-chips" role="group" aria-label="Categories">' +
      TYPES.map(([k, s, i]) => '<button class="' + (F.type.has(k) ? 'on' : '') + '" data-f="' + k + '" aria-pressed="' + F.type.has(k) + '">' + i + '<span>' + s + '</span></button>').join('') + '</div></div>';
  }
  function grid() {
    const C = countries(), n = C.reduce((a, c) => a + c.ids.length, 0);
    return head('Choose a country', C.length + (C.length === 1 ? ' country · ' : ' countries · ') + tracks(n)) + tools() + '<div class="izb-body in">' + gridBody() + '</div>';
  }
  // nothing found: a category with no track in this list at all (Ice, until the first ice track; Rally in a mode without rally tracks) says so, never "yet"; else try another
  function none() {
    const names = TYPES.filter(([k]) => F.type.has(k)).map(([k, s]) => s.toLowerCase());
    if (!F.q.trim() && names.length && !o.list.some(t => F.type.has(catOf(t)))) return 'No ' + names.join(' or ') + ' tracks here.';
    return 'No track found.<br>Try another place or filter.';
  }
  // the flags by continent and the test tracks' tile, or (a search or a filter on) the tracks found
  function gridBody() {
    if (filtered()) {
      const ids = o.list.filter(match).map(t => t.id);
      return ids.length ? '<div class="izb-sub">' + tracks(ids.length) + '</div><div class="izb-list">' + ids.map(id => row(id, true)).join('') + '</div>'
        : '<p class="izb-none">' + none() + '</p>';
    }
    const C = countries(), cur = byId(o.cur), curC = cur && !cur.test ? cur.country || cur.name : null, by = CONT.map(() => []);
    for (const c of C) by[contOf(c)].push(c);
    const sec = (name, n, tiles) => '<div class="izb-ct">' + name + '<small>' + n + '</small></div><div class="izb-grid">' + tiles + '</div>';
    const T = tests();
    return by.map((cs, k) => !cs.length ? '' : sec(CONT[k], cs.reduce((a, c) => a + c.ids.length, 0), cs.map(c => {
      const one = c.ids.length === 1, t = byId(c.ids[0]);
      return '<button class="izb-c' + (c.name === curC ? ' on' : '') + '" data-c="' + esc(c.name) + '" aria-label="' + esc(c.name + ': ' + (one ? t.name : tracks(c.ids.length))) + '"><span class="f">' + flag(c.flag, c.name) +
        (one ? '' : '<span class="n">' + c.ids.length + '</span>') + '<span class="izb-pm">' + mark(bestOf(c.ids.map(prog))) + '</span></span><b>' + esc(c.name) + '</b><small>' + esc(one ? t.name : tracks(c.ids.length)) + '</small></button>';
    }).join(''))).join('') + (!T.length ? '' : sec('For testing', T.length, '<button class="izb-c' + (cur && cur.test ? ' on' : '') + '" data-test aria-label="Test tracks: ' + tracks(T.length) + '"><span class="f t">' + TEST +
      '<span class="n">' + T.length + '</span><span class="izb-pm">' + mark(bestOf(T.map(t => prog(t.id)))) + '</span></span><b>Test tracks</b><small>' + tracks(T.length) + '</small></button>'));
  }
  // NEUPORABNO (js/menu.js nuSheet, o.nu; CLAUDE.md »Pred izidom: NEUPORABNO«): what does not go into version 1.0 in one list: the menu's
  // buttons on top (o.nu.top: NEW VERSION · TEST 1, the missions, the cups), then the tracks awaiting the user's choice (PENDING: one of a
  // country's stays) and the test tracks (TEST: to be removed), each a row as a country's
  function nuView() {
    const Pn = o.list.filter(t => t.pending && !t.test).map(t => t.id), Tn = tests().map(t => t.id);
    const sec = (name, ids) => !ids.length ? '' : '<div class="izb-ct">' + name + '<small>' + ids.length + '</small></div><div class="izb-list">' + ids.map(id => row(id)).join('') + '</div>';
    return head('NEUPORABNO', [Pn.length ? Pn.length + ' pending' : '', Tn.length ? Tn.length + ' test' : '', 'not in version 1.0'].filter(Boolean).join(' · ')) +
      '<div class="izb-body in">' + (o.nu.top || '') + sec('Pending · one per country stays', Pn) + sec('Test · to be removed', Tn) + '</div>';
  }
  const home = () => o && o.nu ? nuView : grid;   // (the sheet's first view: the countries, or NEUPORABNO's list)
  function country(name) {
    const c = countries().find(k => k.name === name); if (!c) return grid();
    return head(c.name, tracks(c.ids.length), backBtn('All countries') + '<span class="izb-hf">' + flag(c.flag, c.name) + '</span>') +
      '<div class="izb-body in"><div class="izb-list">' + c.ids.map(id => row(id)).join('') + '</div></div>';
  }
  function testList() {
    const T = tests();
    return head('Test tracks', tracks(T.length) + ' · to be removed', backBtn('All countries') + '<span class="izb-hf t">' + TEST + '</span>') +
      '<div class="izb-body in"><div class="izb-list">' + T.map(t => row(t.id)).join('') + '</div></div>';
  }
  // a track's card: its shape from above (the game's road from the start line, simplified: tools/menu-lens.js; the start gold, an open
  // road's finish white), its facts, the player's best there (as the screen's row names it), its heights (the screen's graph's: L, H),
  // Select and Race!; ph (the Earth's card): its picture beside the shape, the facts in a row under them (the user, 12. 11. 2026)
  function card(id, ph) {
    const t = byId(id), S = o.shape ? o.shape(id) : null, n = S ? S.length : 0, p = prog(id), k = kindOf(p);
    let pic;
    if (n >= 4) {
      let w = 1, h = 1, d = '';
      for (let i = 0; i < n; i += 2) { w = Math.max(w, S[i]); h = Math.max(h, S[i + 1]); d += (i ? 'L' : 'M') + S[i] + ' ' + S[i + 1]; }
      if (!t.open) d += 'Z';
      const dot = (i, c) => '<circle class="' + c + '" cx="' + S[i] + '" cy="' + S[i + 1] + '" r="7"/>';
      pic = '<div class="izb-shape" role="img" aria-label="The track from above"><svg viewBox="-16 -16 ' + (w + 32) + ' ' + (h + 32) + '" aria-hidden="true"><path class="o" d="' + d + '"/><path class="r" d="' + d + '"/>' +
        (t.open ? dot(n - 2, 'f') : '') + dot(0, 's') + '</svg></div>';
    } else pic = '<div class="izb-shape pic"><img src="' + esc(t.img) + '"' + (t.img2 ? ' data-alt="' + esc(t.img2) + '"' : '') + ' alt=""></div>';
    const c = third(t), fact = (v, l) => '<div><b>' + esc(v) + '</b><small>' + l + '</small></div>';
    const facts = '<div class="izb-facts">' + fact(t.km.toFixed(2) + ' km', 'Length') + (c ? fact(c[0], c[1]) : '') + fact(typeOf(t), 'Type') + '</div>';
    const what = esc((p && p.what) || 'Best race');
    const best = k === 'new' ? '<div class="izb-best new">' + mark(p) + '<small>' + what + '</small><b>Not driven yet</b></div>'
      : '<div class="izb-best">' + mark(p) + '<small>' + what + '</small><b>' + esc(p.txt || '—') + (p.pos ? '<span>' + ord(p.pos) + ' place</span>' : '') + '</b></div>';
    const photo = ph && t.img ? '<div class="izb-photo"><img src="' + esc(t.img) + '" alt="' + esc(t.name) + '"></div>' : '';
    return '<div class="izb-body in izb-tc' + (photo ? ' ph' : '') + '"><div class="izb-tcr">' + photo + pic + facts + '</div>' + best + graph(o.heights ? o.heights(id) : null) +
      '<div class="izb-btns"><button class="izb-sel" data-sel="' + esc(id) + '">Select</button><button class="izb-race" data-race="' + esc(id) + '">Race!</button></div></div>';
  }
  function graph(g) {
    const H = g && g.H; if (!H || H.length < 2) return '';
    let lo = Infinity, hi = -Infinity; for (const v of H) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const span = hi - lo, m = H.length - 1, y = (v) => span < 1 ? 50 : 96 - (v - lo) / span * 88;
    const pts = H.map((v, i) => (i * 300 / m).toFixed(1) + ' ' + y(v).toFixed(1)).join('L');
    return '<div class="izb-hg"><span class="ttl">Height</span>' + (g.real ? '<span class="top">▲ ' + num(hi) + ' m</span>' : '') +
      '<svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="M0 100L' + pts + 'L300 100Z"/><path class="l" d="M' + pts + '"/></svg>' +
      '<span class="k0">0</span><span class="k1">' + (g.L / 1000).toFixed(1) + ' km</span></div>';
  }
  function cardView(id, ph) {
    const t = byId(id);
    return head(t.name, (t.country || '') + (t.test ? (t.country ? ' · ' : '') + 'TEST' : t.pending ? ' · PENDING' : ''), backBtn('Back') + '<span class="izb-hf' + (t.test ? ' t' : '') + '">' + (t.test ? TEST : flag(t.flag, t.country)) + '</span>') + card(id, ph);
  }
  const sheetEl = () => el && el.querySelector('.izb-sheet');
  function refresh() {   // (the answers change: the sheet keeps its height, it does not jump under the finger)
    const sh = sheetEl(), b = el.querySelector('.izb-body'); if (!sh || !b) return;
    if (!sh.style.height) sh.style.height = sh.offsetHeight + 'px';
    b.classList.remove('in'); b.innerHTML = gridBody(); b.scrollTop = 0;
  }
  function show(html) { const sh = sheetEl(); sh.style.height = ''; sh.innerHTML = '<i class="izb-grab" aria-hidden="true"></i>' + html; }
  function go2(v, top) {   // (v: a view; top: where its list was scrolled)
    view = v; show(v.f());
    if (top) { const b = el.querySelector('.izb-body'); if (b) { b.classList.remove('in'); b.scrollTop = top; } }
  }
  function toView(f) {   // a layer over the view: Back (the phone's, the head's) returns to the one under it
    const b = el.querySelector('.izb-body'); prevs.push({ v: view, top: b ? b.scrollTop : 0 });
    go2({ f }); NAZAJ.push('izbor', () => { if (el) up(); });
  }
  const up = () => { const p = prevs.pop(); go2(p ? p.v : { f: home() }, p && p.top); };
  const toCard = (id) => toView(() => cardView(id));
  function open(opts) {
    if (el) close(true);
    o = opts; P = {}; prevs = [];
    el = document.createElement('div'); el.className = 'izb';
    el.innerHTML = '<div class="izb-dim"></div><div class="izb-sheet' + (o.nu ? ' nu' : '') + '" role="dialog" aria-modal="true" aria-label="' + (o.nu ? 'NEUPORABNO: not in version 1.0' : 'Choose a track') + '"></div>';
    o.root.appendChild(el); go2({ f: home() });
    NAZAJ.push('izbor', () => close());
    el.addEventListener('click', onClick);
    el.addEventListener('input', (e) => { if (!e.target.matches('.izb-q input')) return; F.q = e.target.value; e.target.parentNode.classList.toggle('has', !!F.q); refresh(); });
    // the search's keys stay its own (the game reads the window's for driving, js/input.js; the menu the document's): Enter (Search on the
    // keyboard) puts the keyboard away with the answers kept, Esc empties the search, then leaves it
    const own = (e) => {
      if (!e.target.matches || !e.target.matches('.izb-q input')) return;
      e.stopPropagation();
      if (e.type !== 'keydown') return;
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); if (e.target.value) { e.target.value = F.q = ''; e.target.parentNode.classList.remove('has'); refresh(); } else e.target.blur(); }
    };
    for (const k of ['keydown', 'keyup', 'keypress']) el.addEventListener(k, own);
    el.addEventListener('error', (e) => {   // (a picture that is not there: the other one (a route's flyover), else the row's own colour)
      const im = e.target; if (im.tagName !== 'IMG') return;
      if (im.dataset.alt) { im.src = im.dataset.alt; im.removeAttribute('data-alt'); } else im.style.visibility = 'hidden';
    }, true);
    const on = el.querySelector('.izb-c.on'), b = el.querySelector('.izb-body');   // (the shown track's country in sight: the list scrolled, not the menu)
    if (on && b) { const r = on.getBoundingClientRect(), rb = b.getBoundingClientRect(); if (r.bottom > rb.bottom - 8) b.scrollTop += r.bottom - rb.bottom + 16; }
    requestAnimationFrame(() => requestAnimationFrame(() => { if (el) el.classList.add('on'); }));
  }
  function onClick(e) {
    const b = e.target.closest('button');
    if (e.target.classList.contains('izb-dim') || (b && b.hasAttribute('data-x'))) { o.click(); return close(); }
    if (!b) return;
    if (b.hasAttribute('data-back')) { o.click(); NAZAJ.drop('izbor', 1); return up(); }
    if (b.dataset.f) {
      o.click(); const k = b.dataset.f;
      if (F.type.has(k)) F.type.delete(k); else F.type.add(k);
      b.classList.toggle('on', F.type.has(k)); b.setAttribute('aria-pressed', F.type.has(k)); return refresh();
    }
    if (b.hasAttribute('data-qx')) { e.preventDefault(); o.click(); const i = el.querySelector('.izb-q input'); i.value = F.q = ''; i.parentNode.classList.remove('has'); refresh(); return; }
    if (b.dataset.c) {
      o.click(); o.buzz(); const c = countries().find(x => x.name === b.dataset.c); if (!c) return;
      return c.ids.length === 1 ? toCard(c.ids[0]) : toView(() => country(c.name));
    }
    if (b.hasAttribute('data-test')) { o.click(); o.buzz(); return toView(testList); }
    if (b.dataset.t) { o.click(); o.buzz(); return toCard(b.dataset.t); }
    if (b.dataset.sel) { o.click(); return choose(b.dataset.sel, b); }
    if (b.dataset.race) { o.buzz(); const id = b.dataset.race; NAZAJ.clear(); close(true); o.race(id); }   // (at once, in the tap: the race's sounds may start)
  }
  function choose(id, b) {   // (the choice lights up a moment, then the screen goes to it under the closing sheet)
    el.querySelectorAll('.izb-t.on').forEach(x => x.classList.remove('on')); b.classList.add('on');
    setTimeout(() => { if (!el) return; if (id !== o.cur) o.pick(id); close(); }, 160);
  }
  // closed (now: at once, without sliding away: another screen comes, the race starts)
  function close(now) {
    if (!el) return;
    NAZAJ.drop('izbor');
    const e = el; el = null; view = null; prevs = [];
    if (now) { e.remove(); return; }
    e.classList.remove('on'); e.style.pointerEvents = 'none'; setTimeout(() => e.remove(), 330);
  }
  function back() { if (!el) return; if (prevs.length) { NAZAJ.drop('izbor', 1); up(); } else close(); }
  // the Earth's cards (js/menu-zemlja.js) are the quick list's: its rows and its track's card with o as open's (the quick list closed)
  function use(opts) {
    if (el) close(true);
    o = opts; P = {};
    return { head, row, cardView, flag, tracks, kind: (id) => kindOf(prog(id)) };
  }
  return { open, close, back, mark, use, nazaj: NAZAJ, isOpen: () => !!el, sheet: () => sheetEl(), depth: () => NAZAJ.depth('izbor') };
})();
