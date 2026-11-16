/* =========================================================================
   TESTER — Test s prijatelji: how much a friend plays (docs/test-s-prijatelji.md; the user's wish of 12. 11. 2026)
   ---------------------------------------------------------------------------------------------------------------------------
   Off for everyone. On only on a device opened with index.html?tester=<code> (T1 .. T30, from the user) and after the tester said
   Strinjam se to the short notice the first time; then the code and the consent are kept on the device (localStorage rra-tester),
   so the installed game and later visits count too; ?tester=off forgets them. A browser driven by a test (navigator.webdriver) never
   sends. What it sends (the counter, server/test-s-prijatelji/worker.js), nothing else: the code; a visit's start, a beat a minute
   while the game is seen, its end (a visit: a random id of its own, a new one after the game was away 2 min or more); each race at
   its end: the track, the mode, the weather, the car (the game's own name), its seconds, over the finish / retired / left, the place
   (null where a place has no meaning: police, time trial, the fun modes ...); the seconds the game was seen on a track, in the menus and
   in the garage (garaza.html loads this too; a visit goes on across the two pages); the device (phone, tablet or desktop, the system and
   the browser, no versions) and the game's stamp. No names, no IP kept, no cookies. Slovenian only, its own DOM (as js/napake.js and
   js/denar.js: no tr()). js/game.js calls Tester.zacni / konec / pusti only when Tester.on (the 12. 11. fixes: the user's test).
   ========================================================================= */
const Tester = (function () {
  'use strict';
  const URL_E = 'https://stevec.rra-test.workers.dev/e', KEY = 'rra-tester', SKEY = 'rra-tester-seja', BEAT = 60000, AWAY = 120000;
  const T = { on: false };
  const GARAZA = /garaza\.html$/.test(location.pathname);
  let koda = null, seja = null, beat = 0, skrit = 0, dirka = null, sent = [];
  // where the game is seen (garaza: the garage page; proga: a race on; meni: the rest) and its seconds there, not sent yet
  let kje = GARAZA ? 'garaza' : 'meni', od = 0, cas = { meni: 0, proga: 0, garaza: 0 };
  const vidno = () => document.visibilityState !== 'hidden';
  let vis = vidno();   // (seen since od: its own, as the event 'hidden' comes when the page is hidden already)
  function stej() { const t = performance.now(); if (od && vis) cas[kje] += t - od; od = t; }
  function kam(k) { stej(); kje = GARAZA ? 'garaza' : k; }
  function casi() { stej(); const o = { cm: Math.round(cas.meni / 1000), cp: Math.round(cas.proga / 1000), cg: Math.round(cas.garaza / 1000) };
    cas.meni -= o.cm * 1000; cas.proga -= o.cp * 1000; cas.garaza -= o.cg * 1000; return o; }

  const rid = () => { try { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join(''); } catch (_) { return (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 24); } };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } };
  const save = (v) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (_) { } };
  const zig = () => { const e = document.querySelector('script[src^="js/game.js"]'), m = e && /[?&]v=(\w+)/.exec(e.getAttribute('src')); return m ? m[1] : GARAZA ? 'garaza' : 'lokalno'; };
  // a visit goes on across the game and the garage (sessionStorage: this tab only), unless away 2 min or more
  const sejaLoad = () => { try { const v = JSON.parse(sessionStorage.getItem(SKEY) || 'null'); return v && v.k === koda && Date.now() - v.t < AWAY ? v.s : null; } catch (_) { return null; } };
  const sejaSave = () => { try { sessionStorage.setItem(SKEY, JSON.stringify({ s: seja, k: koda, t: Date.now() })); } catch (_) { } };
  function naprava() {
    const u = navigator.userAgent || '', touchMac = /Macintosh/.test(u) && navigator.maxTouchPoints > 1;
    const tip = /iPad/.test(u) || touchMac || (/Android/.test(u) && !/Mobile/.test(u)) ? 'tablica' : /Mobi|iPhone|iPod|Android/.test(u) ? 'telefon' : 'namizje';
    const os = /Android/.test(u) ? 'Android' : /iPhone|iPad|iPod/.test(u) || touchMac ? 'iOS' : /Windows/.test(u) ? 'Windows' : /CrOS/.test(u) ? 'ChromeOS' : /Mac OS X/.test(u) ? 'macOS' : /Linux/.test(u) ? 'Linux' : 'drugo';
    const br = /Edg\//.test(u) ? 'Edge' : /SamsungBrowser/.test(u) ? 'Samsung' : /OPR\/|Opera/.test(u) ? 'Opera' : /Firefox|FxiOS/.test(u) ? 'Firefox' : /Chrome|CriOS/.test(u) ? 'Chrome' : /Safari/.test(u) ? 'Safari' : 'drugo';
    return { naprava: tip, os, brskalnik: br };
  }
  function send(o) {
    if (!T.on) return;
    if (o.t !== 'start') Object.assign(o, casi());
    const body = JSON.stringify(Object.assign({ k: koda, s: seja }, o)); sejaSave();
    sent.push(o.t); if (sent.length > 50) sent.shift();
    try {
      fetch(URL_E, { method: 'POST', body, keepalive: true, mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'text/plain' } }).catch(() => { });
    } catch (_) { try { navigator.sendBeacon(URL_E, new Blob([body], { type: 'text/plain' })); } catch (__) { } }
  }
  function start(go) { seja = (go && sejaLoad()) || rid(); od = performance.now(); send(Object.assign({ t: 'start', zig: zig() }, naprava())); }
  function tick() { if (T.on && vidno()) send({ t: 'beat' }); }
  function race(izid, mesto) {
    if (!dirka) return;
    const d = dirka; dirka = null;
    kam('meni');
    send({ t: 'dirka', proga: d.proga, nacin: d.nacin, vreme: d.vreme, avto: d.avto, trajanje: Math.round((performance.now() - d.t0) / 100) / 10, izid,
      mesto: Number.isInteger(mesto) && mesto >= 1 ? mesto : null });
  }
  function begin() {
    T.on = true; start(true);
    beat = setInterval(tick, BEAT);
    document.addEventListener('visibilitychange', () => {
      if (!T.on) return;
      if (document.visibilityState === 'hidden') { skrit = Date.now(); stej(); vis = false; send({ t: 'end' }); }   // (its seconds counted up to now, then none while hidden)
      else if (skrit && Date.now() - skrit >= AWAY) { skrit = 0; vis = true; start(false); }   // (away a while: a new visit; the race open meanwhile stays open)
      else { skrit = 0; vis = true; od = performance.now(); send({ t: 'beat' }); }
    });
    addEventListener('pagehide', () => { if (T.on) { race('zapustil', null); send({ t: 'end' }); } });
  }
  // the notice the first time (or for a new code): Strinjam se starts the counting, Ne keeps it off (and is remembered, no asking again)
  function ask(k) {
    const show = () => {
      const w = document.createElement('div'); w.id = 'tester-ok';
      w.style.cssText = 'position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6);font:15px/1.45 system-ui,sans-serif';
      const b = document.createElement('div');
      b.style.cssText = 'max-width:420px;width:100%;box-sizing:border-box;padding:18px 18px 14px;border-radius:14px;background:#12161d;color:#eef0f4;border:1px solid #e8b04a;box-shadow:0 8px 30px rgba(0,0,0,.5)';
      const h = document.createElement('div'); h.textContent = 'Test s prijatelji (' + k + ')'; h.style.cssText = 'font-weight:700;font-size:17px;margin-bottom:8px';
      const p = document.createElement('div');
      p.textContent = 'Igra bo avtorju pošiljala, koliko igraš: začetek in konec igranja, dirke (proga, način, vreme, trajanje, cilj ali odstop, mesto), '
        + 'vrsto naprave in brskalnika ter različico igre. Brez imen, brez IP in brez piškotkov. Izklop: povezava s ?tester=off.';
      const r = document.createElement('div'); r.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:14px';
      const mk = (txt, id, main) => { const x = document.createElement('button'); x.type = 'button'; x.id = id; x.textContent = txt;
        x.style.cssText = 'min-height:44px;padding:0 18px;border-radius:10px;font:600 15px system-ui,sans-serif;cursor:pointer;border:1px solid #e8b04a;'
          + (main ? 'background:#e8b04a;color:#14181f' : 'background:transparent;color:#eef0f4'); return x; };
      const no = mk('Ne', 'tester-ne', false), yes = mk('Strinjam se', 'tester-da', true);
      no.onclick = () => { save({ koda: k, ok: false, t: Date.now() }); w.remove(); };
      yes.onclick = () => { save({ koda: k, ok: true, t: Date.now() }); w.remove(); koda = k; begin(); };
      r.append(no, yes); b.append(h, p, r); w.append(b); document.body.appendChild(w); yes.focus();
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show, { once: true });
  }
  function run() {
    let q = null;
    try { q = new URLSearchParams(location.search).get('tester'); } catch (_) { }
    if (q != null && /^(off|izklop|ne)$/i.test(q.trim())) { save(null); return; }
    const k = q != null && /^[A-Za-z0-9]{1,8}$/.test(q.trim()) ? q.trim().toUpperCase() : null, st = load();
    if (navigator.webdriver && !window.__testerTest) return;   // (a test's browser: never, unless the tester's own test says so)
    if (k) { if (st && st.koda === k) { if (st.ok) { koda = k; begin(); } } else ask(k); return; }
    if (st && st.ok && st.koda) { koda = st.koda; begin(); }   // (no code in the address: a device that said yes before, e.g. the installed game)
  }
  T.zacni = (info) => { if (!T.on) return; race('zapustil', null); kam('proga');
    dirka = { proga: String(info.proga || ''), nacin: String(info.nacin || ''), vreme: String(info.vreme || ''), avto: String(info.avto || '').slice(0, 24), t0: performance.now() }; };
  T.konec = (izid, mesto) => { if (T.on) race(izid, mesto); };
  T.pusti = (mesto) => { if (T.on) race('zapustil', mesto); };   // (the place at the moment it was left, null where it has no meaning)
  T.state = () => ({ on: T.on, koda, seja, kje, dirka: dirka && { proga: dirka.proga, nacin: dirka.nacin, vreme: dirka.vreme, avto: dirka.avto }, sent: sent.slice() });   // (for the tests)
  run();
  return T;
})();
