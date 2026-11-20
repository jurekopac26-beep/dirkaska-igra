/* =========================================================================
   DENAR — test money in the address (a tester's aid: hidden in the Google Play build, sklop 8 of docs/orodje-za-napake.md)
   ---------------------------------------------------------------------------------------------------------------------------
   garaza.html?denar=<amount> and index.html?denar=<amount> set the career's money (tdgp-career.money) to the amount, 0 .. 999.999.999
   (the user's wish of 9. 11. 2026: a link for trying the new cars with money enough); ?denar alone (or empty): 50.000.000. The career is
   not switched on or off (its on stays as it was); none yet: a new one as the game makes it (js/game.js careerNew). The money before is
   kept once, in rra-denar-prej ({ money: the amount, or null: no career before; t: ms }), never overwritten. Then a toast, and the
   parameter is taken out of the address (history.replaceState), so a reload does not do it again; the other parameters stay as they
   were (e.g. car=cisterna in the garage). Loaded after js/core.js and js/shramba.js and before the career is read (js/game.js at its
   load, js/garage.js load(): the garage opens on the real profile, Kariera, to show the money), so the new amount is there at once.
   Slovenian only, its own DOM (as js/napake.js: no tr()). Denar.set: what this visit did ({ money, prev }), else null; Denar.note: the
   toast's words ({ txt, bad }).
   ========================================================================= */
const Denar = (function () {
  'use strict';
  const KEY = 'tdgp-career', PREJ = 'rra-denar-prej', DEF = 50000000, MAX = 999999999;
  // the amount from the address: '' (?denar, ?denar=) the default; digits, also with dots in threes (50.000.000) or spaces; else NaN
  function amount(s) {
    let t = String(s == null ? '' : s).replace(/[\s_]/g, '');
    if (t === '') return DEF;
    if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    const n = Number(t);
    return Number.isFinite(n) ? Math.min(MAX, Math.max(0, Math.floor(n))) : NaN;
  }
  const dots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  let note = null;   // (the last toast's words: { txt, bad }, for the tests; the garage's 3D may load longer than it shows)
  function toast(txt, bad) {
    note = { txt, bad: !!bad };
    const show = () => {
      const el = document.createElement('div'); el.id = 'denar-toast'; el.setAttribute('role', 'status'); el.textContent = txt;
      el.style.cssText = 'position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top, 0px));transform:translateX(-50%);z-index:2147483000;max-width:calc(100% - 32px);'
        + 'padding:10px 16px;border-radius:12px;background:rgba(12,16,22,.94);color:#fff;font:600 14px/1.35 system-ui,sans-serif;text-align:center;pointer-events:none;'
        + 'border:1px solid ' + (bad ? '#e5484d' : '#e8b04a') + ';box-shadow:0 6px 24px rgba(0,0,0,.45);transition:opacity .4s';
      const old = document.getElementById('denar-toast'); if (old) old.remove();
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 450); }, 6000);
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show, { once: true });
  }
  function run() {
    let P = null; try { P = new URLSearchParams(location.search); } catch (_) { return null; }
    if (!P.has('denar')) return null;
    const raw = P.get('denar'), money = amount(raw);
    // the parameter out of the address, the rest as it was (each part verbatim)
    try { const rest = location.search.slice(1).split('&').filter(p => p && p.split('=')[0] !== 'denar');
      history.replaceState(history.state, '', location.pathname + (rest.length ? '?' + rest.join('&') : '') + location.hash); } catch (_) { }
    if (Number.isNaN(money)) { toast('Testni denar: neveljaven znesek »' + raw + '« (denar je ostal, kot je bil).', true); return null; }
    let c = null; try { c = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { c = null; }
    const had = !!(c && typeof c === 'object' && !Array.isArray(c) && c.v === 1);
    const prev = had ? (Number.isFinite(c.money) ? Math.max(0, Math.floor(c.money)) : 0) : null;
    if (!had) { const car0 = Core.CAREER.car0, upg = {}; for (const u of Core.UPG) upg[u.id] = 0;
      c = { v: 1, on: true, money: Core.CAREER.start, cars: [car0], upg: { [car0]: upg }, earned: 0, races: 0, wins: 0 }; }   // (as js/game.js careerNew)
    try { if (localStorage.getItem(PREJ) === null) localStorage.setItem(PREJ, JSON.stringify({ money: prev, t: Date.now() })); } catch (_) { }
    c.money = money;
    const txt = JSON.stringify(c);
    let ok = false; try { ok = typeof Shramba !== 'undefined' ? Shramba.keep(KEY, txt) : (localStorage.setItem(KEY, txt), true); } catch (_) { ok = false; }
    if (!ok) { toast('Testni denar: shranjevanje ni uspelo (shramba je polna?).', true); return null; }
    toast('Testni denar: ' + dots(money) + (prev == null ? ' (nova kariera)' : ' (prej ' + dots(prev) + ')'));
    return { money, prev };
  }
  return { set: run(), amount, get note() { return note; } };
})();
