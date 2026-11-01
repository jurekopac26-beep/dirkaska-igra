/* =========================================================================
   ZABAVA — the novelties that make the game more interesting (docs/zabava.md): the team's goals, the elimination race, rivals who
   remember, the coach, the challenges by the road, the pursuit, the living road. Each one is a file of its own in js/zabava/
   (Zabava.add); the game has only short hooks (ZB in js/game.js, next to the special missions' MS).
   ========================================================================= */
const Zabava = (function () {
  'use strict';
  const F = [];   // the novelties, in the order they were added
  let G = null;   // the game's bridge (init: ZbBridge in js/game.js)
  let R = null, C = null;   // the race now and its context (newRace: md, on, tt, quali, chal, cr, school, nv, mis, career)
  const tr = (s, ...a) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s, ...a) : String(s).replace(/\{(\d+)\}/g, (m, i) => (a[i] != null ? a[i] : m)));   // (no Lang: Node's tests, the Slovenian with its slots filled)
  const el = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);   // (an element of the page; none in Node's tests)
  const ord = (n) => (typeof Lang !== 'undefined' && Lang.ord ? Lang.ord(n) : n + '.');   // (a place: 3. / 3rd)
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // a test may switch the novelties on: window.__zabava = true (all) or { izzivi: 1, ... } (those), or zabava=1 in the address
  function forced(key) {
    const w = typeof window !== 'undefined' ? window.__zabava : null;
    if (w === true || w === 1) return true;
    if (w && typeof w === 'object') return !!w[key];
    return typeof location !== 'undefined' && /[?&]zabava=1(&|$)/.test(location.search || '');
  }
  // automated tests (the quick entry's test mode, a browser driven by a tool) keep the game as the other tests know it: the races,
  // the pictures and the load they compare stay the same; the novelties' own tests switch them on (forced)
  function auto() {
    if (G && G.repro && G.repro()) return true;
    return typeof navigator !== 'undefined' && !!navigator.webdriver;
  }
  // a novelty on? key: its own name; set: the setting that switches it (Nastavitve: 1 on, 0 off)
  function on(key, set) {
    if (forced(key)) return true;
    if (auto()) return false;
    return !set || !G || !G.S || G.S[set] !== 0;
  }

  // the kept things: one entry in the browser (rra-zabava), a part per novelty
  let store = null;
  function load() {
    if (store) return store;
    try { const j = JSON.parse(localStorage.getItem('rra-zabava') || 'null'); store = j && typeof j === 'object' && !Array.isArray(j) ? j : {}; } catch (_) { store = {}; }
    return store;
  }
  function part(k) { const s = load(); if (!s[k] || typeof s[k] !== 'object') s[k] = {}; return s[k]; }
  function save() { try { localStorage.setItem('rra-zabava', JSON.stringify(load())); } catch (_) { } }

  // the results: one block under the head (#res-zb), filled by the novelties (resEnd), empty and hidden otherwise
  function resBox() {
    let el = document.getElementById('res-zb');
    if (!el) {
      const head = document.getElementById('res-head'); if (!head) return null;
      el = document.createElement('div'); el.id = 'res-zb'; el.className = 'zb-res off'; head.insertAdjacentElement('afterend', el);
    }
    return el;
  }
  function resClear() { const el = resBox(); if (el) { el.innerHTML = ''; el.classList.add('off'); } }
  function resAdd(html) { const el = resBox(); if (!el || !html) return; el.insertAdjacentHTML('beforeend', html); el.classList.remove('off'); }

  // a card over the game before the start (the team's goals): a title, a line under it, the choices as buttons (the first focused);
  // a tap, Enter, the number keys 1-9, or the game pad (up / down, A to choose, B the last choice) pick one; onPick(value) then
  let card = null;
  function cardOpen(o) {
    cardClose();
    const el = document.createElement('div'); el.id = 'zb-card'; el.className = 'zb-card'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', o.title);
    el.innerHTML = '<div class="zb-cbox"><b class="zb-ct">' + esc(o.title) + '</b>' + (o.sub ? '<p class="zb-cs">' + esc(o.sub) + '</p>' : '') +
      o.items.map((it, i) => '<button type="button" class="zb-ci' + (it.ghost ? ' ghost' : '') + '" data-zb="' + i + '"><span>' + esc(it.label) + '</span>' + (it.tag ? '<em>' + esc(it.tag) + '</em>' : '') + '</button>').join('') + '</div>';
    document.body.appendChild(el);
    const btns = [...el.querySelectorAll('.zb-ci')];
    const pick = (i) => { if (!card || !o.items[i]) return; const v = o.items[i].v; cardClose(); o.onPick(v); };
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-zb]'); if (b) { e.preventDefault(); e.stopPropagation(); pick(+b.dataset.zb); } });
    const key = (e) => {
      if (!card) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= btns.length) { e.preventDefault(); pick(n - 1); return; }
      const at = btns.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const j = at < 0 ? 0 : (at + (e.key === 'ArrowDown' ? 1 : btns.length - 1)) % btns.length; btns[j].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); pick(btns.length - 1); }
    };
    window.addEventListener('keydown', key, true);
    card = { el, key, pick, btns, pad: { prev: [], at: 0 } };
    setTimeout(() => { if (card && card.el === el) btns[0].focus({ preventScroll: true }); }, 0);
    return card;
  }
  function cardClose() {
    if (!card) return;
    window.removeEventListener('keydown', card.key, true); card.el.remove(); card = null;
  }
  // the game pad on the card (the game's own pad reading leaves a race's presses alone while nothing is on the screen)
  function cardPad() {
    if (!card || typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gp = [...navigator.getGamepads()].find(p => p && p.connected); if (!gp) return;
    const P = card.pad, b = gp.buttons.map(x => !!(x && x.pressed)), was = (i) => !!P.prev[i], hit = (i) => b[i] && !was(i);
    const ax = gp.axes[1] || 0, axHit = Math.abs(ax) > 0.6 && !(Math.abs(P.ax || 0) > 0.6);
    let at = card.btns.indexOf(document.activeElement); if (at < 0) at = 0;
    if (hit(13) || (axHit && ax > 0)) card.btns[(at + 1) % card.btns.length].focus();
    else if (hit(12) || (axHit && ax < 0)) card.btns[(at + card.btns.length - 1) % card.btns.length].focus();
    else if (hit(0) || hit(9)) card.pick(at);
    else if (hit(1)) card.pick(card.btns.length - 1);
    P.prev = b; P.ax = ax;
  }

  /* ---- the hooks the game calls (js/game.js) ---- */
  const each = (fn) => { for (const f of F) { try { fn(f); } catch (e) { if (typeof console !== 'undefined') console.error('zabava', f.id, e); } } };
  const api = {
    add(f) { F.push(f); if (G && f.init) f.init(G); return f; },
    init(bridge) { G = bridge; each(f => f.init && f.init(G)); },
    // the novelties' own modes a track has on top of its ways (L): the elimination race, the pursuit
    modes(d, L) { const out = []; each(f => { if (f.modes) for (const m of f.modes(d, L) || []) out.push(m); }); return out; },
    // the race's options over the game's own (a mode's field, laps, traffic ...); null: none
    opts(ctx) { let o = null; each(f => { const r = f.opts && f.opts(ctx); if (r) o = Object.assign(o || {}, r); }); return o; },
    made(race, ctx) { R = race; C = ctx || {}; each(f => f.made && f.made(race, C)); },
    begin(race, ctx) { R = race; C = ctx || C || {}; resClear(); each(f => f.begin && f.begin(race, C)); },
    // the race waits on the grid (a card to answer first)
    hold() { if (card) cardPad(); return !!card || F.some(f => f.hold && f.hold(R)); },
    step(dt) { if (R) each(f => f.step && f.step(R, dt)); },
    // the race over by a novelty's rule: { msg, cls, say } for the finish (the results after it, finishRace)
    over() { if (!R) return null; for (const f of F) { const o = f.over && f.over(R); if (o) return o; } return null; },
    // the timing tower: extra classes of a car's row; the word in place of a retired car's gap
    cls(c) { let s = ''; for (const f of F) if (f.cls) s += f.cls(c, R) || ''; return s; },
    rows(O) { const out = []; for (const f of F) if (f.rows) for (const i of f.rows(O, R) || []) out.push(i); return out; },
    outWord(c) { for (const f of F) { const w = f.outWord && f.outWord(c, R); if (w) return w; } return ''; },
    noPodium() { return F.some(f => f.noPodium && f.noPodium(R)); },
    // the results: a novelty that draws them itself (true), the head's words, the career's extra pay (text), the block under the head
    finish() { if (!R) return false; for (const f of F) if (f.finish && f.finish(R)) return true; return false; },
    resBase(info) { if (R) each(f => f.resBase && f.resBase(R, info)); },
    resPay(info) { let s = ''; if (R) each(f => { if (f.resPay) s += f.resPay(R, info) || ''; }); return s; },
    resEnd(kind, info) { if (R) each(f => { if (f.resEnd) resAdd(f.resEnd(R, kind, info || {})); }); },
    // online: a message of the novelties ({ t: 'zb', k }), the room (host: the switches), the host's setup about to go to every phone
    net(m, from, host) { each(f => f.net && f.net(m, from, host, R)); },
    room(host, busy) { each(f => f.room && f.room(host, busy)); },
    netSetup() { each(f => f.netSetup && f.netSetup()); },
    stop() { cardClose(); each(f => f.stop && f.stop(R)); R = null; },
    // for the novelties
    on, forced, auto, tr, ord, esc, el, part, save, cardOpen, cardClose, resAdd,
    get G() { return G; }, get race() { return R; }, get ctx() { return C; }, get card() { return card; }, get list() { return F; },
  };
  return api;
})();
if (typeof window !== 'undefined') window.Zabava = Zabava;
if (typeof module !== 'undefined') module.exports = Zabava;
