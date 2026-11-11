/* The frame against forced darkening (Samsung Internet's dark mode).

   Such a browser repaints every element of the page whatever the page declares (color-scheme: only dark included),
   because the player's preferred scheme stays light (js/menu.js, forcedDark). A document inside a frame whose own
   color-scheme is dark is told that the preferred scheme is dark, and what declares a dark scheme there is left as
   it is (Chromium 129+, Samsung Internet 28+). So where forced darkening is found, the page loads itself once more
   inside such a frame and shows only that: the menu and the HUD keep their own colours.

   The script runs first in <head> (index.html, garaza.html), synchronously and alone:
     outside  decides (decide), writes the frame over the whole screen and swallows the rest of its own document,
              so the game loads and runs once, inside the frame; then it hands on what only the top page gets
              (keys, the notch's safe areas, the install prompt, a typed #link);
     inside   (the same script, in the page the frame loads) says it is there and keeps the tab's address, title
              and bar colour in step with the page in the frame (a reload and a shared link open the same page).
   Where no forced darkening is found nothing changes: no frame, no attribute, no listener.

     ?okvir=0  never the frame (kept for the tab);  ?okvir=1  always the frame (trials, tests)
     localStorage['rr-okvir']  { do, ua, zakaj }: the frame failed in this browser, none until `do` (the title's
                               notice from js/menu.js is back); a browser update (another ua) tries again
     data-poroca on the script (temni-nacin.html): only tell the decision, in window.__okvirPoroca */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;   // (the tests load the page's scripts into Node: tests/lib/core.js)
  var W = window, D = document, VER = 1, KEY = 'rr-okvir';
  var me = D.currentScript, onlyTell = !!(me && me.hasAttribute('data-poroca'));
  var prefersDark = function (w) { try { return (w || W).matchMedia('(prefers-color-scheme: dark)').matches; } catch (_) { return false; } };

  // ---- inside the frame (or inside anything else of ours: never a frame in a frame) ----
  var P = null, nested = false;
  try {
    if (W.frameElement && W.frameElement.id === 'okvir' && W.parent !== W && W.parent.__okvir) P = W.parent;
    for (var a = W; a.parent && a.parent !== a;) { a = a.parent; if (a.__okvir) nested = true; }
  } catch (_) { }
  if (P && !onlyTell) { try { inside(P); } catch (_) { } return; }

  // the same probe as forcedDark() in js/menu.js: the system colour Canvas of a light element is dark only when forced
  function forced() {
    try {
      if (prefersDark()) return false;
      var d = D.createElement('div'); d.style.cssText = 'display:none;background-color:canvas;color-scheme:light';
      D.documentElement.appendChild(d); var c = getComputedStyle(d).backgroundColor; d.remove();
      var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(c);
      return !!m && (m[4] == null || +m[4] > 0.5) && (299 * m[1] + 587 * m[2] + 114 * m[3]) / 1000 < 128;
    } catch (_) { return false; }
  }
  // does a frame with a dark color-scheme tell its document that the player prefers dark?
  function probe() {
    var f = null, yes = false;
    try {
      f = D.createElement('iframe'); f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;color-scheme:dark';
      D.documentElement.appendChild(f);
      getComputedStyle(f).colorScheme;   // (the frame's own style first: its document asks it)
      yes = prefersDark(f.contentWindow);
    } catch (_) { yes = false; }
    try { if (f) f.remove(); } catch (_) { }
    return yes;
  }
  function record() {
    try {
      var r = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (r && r.do > Date.now() && r.ua === navigator.userAgent) return r;
    } catch (_) { }
    return null;
  }
  function decide() {
    var m = /[?&]okvir=([01])(?=&|$)/.exec(location.search), tab = null;
    var o = { okvir: false, zakaj: '', vsiljeno: forced(), poskus: null, zapis: null, zahteva: m ? m[1] : '' };
    try { tab = sessionStorage.getItem(KEY); } catch (_) { }
    if (onlyTell) { o.poskus = probe(); o.zapis = record(); }
    if (nested) { o.zakaj = 'že v okvirju'; return o; }
    if (m && m[1] === '0') { if (!onlyTell) { try { sessionStorage.setItem(KEY, '0'); } catch (_) { } } o.zakaj = '?okvir=0'; return o; }
    if (m && m[1] === '1') { if (!onlyTell) { try { sessionStorage.removeItem(KEY); } catch (_) { } } o.okvir = true; o.zakaj = '?okvir=1'; return o; }
    if (tab === '0') { o.zakaj = 'izklopljen v tem zavihku (?okvir=0)'; return o; }
    if (!o.vsiljeno) { o.zakaj = 'ni vsiljenega temnenja'; return o; }
    o.zapis = record(); if (o.zapis) { o.zakaj = 'zapis rr-okvir: ' + o.zapis.zakaj; return o; }
    if (o.poskus == null) o.poskus = probe();
    if (!o.poskus) { o.zakaj = 'okvir ne pove temne sheme'; return o; }
    o.okvir = true; o.zakaj = 'vsiljeno temnenje'; return o;
  }

  var dec = decide();
  if (onlyTell) { W.__okvirPoroca = dec; return; }
  if (dec.okvir) outside(dec);

  // ---- outside: the frame over the whole screen, the rest of this document swallowed ----
  function outside(dec) {
    var asked = dec.zahteva === '1';
    var st = W.__okvir = { v: VER, zahtevan: asked, dok: null, temno: null, robovi: ['0px', '0px', '0px', '0px'], tu: here };
    var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var tc = D.querySelector('meta[name="theme-color"]'), bg = tc && /^#[0-9a-f]{3,8}$/i.test(tc.content) ? tc.content : '#161b23';
    var f = null, first = true, saved = null;
    D.documentElement.style.cssText = 'height:100%;overflow:hidden;overscroll-behavior:none;background:' + bg;
    // <plaintext> takes everything the parser still reads: no style sheet, no script and no element of the page out here
    D.write('<body style="margin:0;height:100%;overflow:hidden;overscroll-behavior:none;background:' + bg + '">'
      + '<iframe id="okvir" title="Real Roads Atlas" allowfullscreen style="position:fixed;left:0;top:0;width:100%;height:100%;border:0;color-scheme:dark" src="' + esc(location.href) + '"></iframe>'
      + '<div id="okvir-robovi" style="position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;'
      + 'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)"></div>'
      + '<plaintext style="display:none">');
    f = D.getElementById('okvir');
    if (!f) return;

    // the page in the frame says it is there (inside(), at its very start)
    function here(doc, temno) { st.dok = doc; st.temno = !!temno; }
    // the frame does not do its work here: note it, and back to the page as it was (with the title's notice)
    function fail(zakaj, days) {
      if (asked) return;   // (asked for by hand: stay, the trial shows what the frame does)
      try { localStorage.setItem(KEY, JSON.stringify({ do: Date.now() + days * 864e5, ua: navigator.userAgent, zakaj: zakaj })); } catch (_) { }
      location.replace(location.pathname + location.search + (location.search ? '&' : '?') + 'okvir=0' + location.hash);
    }
    var inner = function () { try { return f.contentWindow; } catch (_) { return null; } };
    var innerDoc = function () { try { return f.contentDocument; } catch (_) { return null; } };
    var focusIn = function () { try { var w = inner(); if (w) w.focus(); } catch (_) { } };

    // the notch and the rounded corners: env(safe-area-inset-*) is zero inside a frame, so the page gets them as --okvir-*
    function edges() {
      try {
        var cs = getComputedStyle(D.getElementById('okvir-robovi'));
        st.robovi = [cs.paddingTop || '0px', cs.paddingRight || '0px', cs.paddingBottom || '0px', cs.paddingLeft || '0px'];
        var d = innerDoc(); if (d && d === st.dok) setEdges(d.documentElement, st.robovi);
      } catch (_) { }
    }
    // "Install the game" is offered to the top page only: the page in the frame gets it as its own event
    function offer() {
      try {
        var w = inner(), s = saved; if (!s || !w || innerDoc() !== st.dok) return;
        var e = new w.Event('beforeinstallprompt', { cancelable: true });
        e.platforms = s.platforms; e.userChoice = s.userChoice;
        e.prompt = function () { if (saved === s) saved = null; return s.prompt(); };
        w.dispatchEvent(e);
      } catch (_) { }
    }

    f.addEventListener('load', function () {
      var ok = !!st.dok && innerDoc() === st.dok;
      if (first) {
        first = false;
        if (!ok) { fail('stran v okvirju se ni javila', 1); return; }
        if (!st.temno) { fail('stran v okvirju ne dobi temne sheme', 7); return; }
        if (asked) { try { localStorage.removeItem(KEY); } catch (_) { } }
      }
      if (!ok) return;
      focusIn(); edges(); offer();
    });
    W.addEventListener('focus', focusIn);
    W.addEventListener('resize', edges);
    W.addEventListener('orientationchange', edges);
    D.addEventListener('fullscreenchange', edges);
    D.addEventListener('webkitfullscreenchange', edges);
    W.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); saved = e; offer(); });
    W.addEventListener('appinstalled', function () {
      saved = null;
      try { var w = inner(); if (w && innerDoc() === st.dok) w.dispatchEvent(new w.Event('appinstalled')); } catch (_) { }
    });
    // a #link typed or opened in this tab reaches the top page only (the page's own changes come back without an event)
    W.addEventListener('hashchange', function () {
      try {
        var w = inner(); if (!w || innerDoc() !== st.dok || w.location.hash === location.hash) return;
        if (location.hash) w.location.replace(location.hash);
        else w.history.replaceState(w.history.state, '', w.location.pathname + w.location.search);
      } catch (_) { }
    });
  }

  function setEdges(root, v) {
    var n = ['--okvir-t', '--okvir-r', '--okvir-b', '--okvir-l'];
    for (var i = 0; i < 4; i++) {
      if (v[i] && parseFloat(v[i]) > 0) root.style.setProperty(n[i], v[i]); else root.style.removeProperty(n[i]);
    }
  }

  // ---- inside: the page the frame loads (the game, the garage) ----
  function inside(P) {
    var st = P.__okvir, root = D.documentElement;
    // the outer page is from another release than this one (the game reloaded itself after an update): load both anew, once
    if (st.v !== VER) {
      var again = false;
      try { again = sessionStorage.getItem(KEY + '-v') !== String(VER); if (again) sessionStorage.setItem(KEY + '-v', String(VER)); } catch (_) { }
      if (again) { P.location.reload(); return; }
    }
    // the colours of the page as it is without the frame: there the player prefers light (css/style.css, css/garage.css)
    if (!prefersDark(P)) root.setAttribute('data-theme', 'light');
    st.tu(D, prefersDark());
    try { setEdges(root, st.robovi); } catch (_) { }

    // the tab's address follows the page in the frame (?okvir=1 stays when the frame was asked for by hand)
    function mirror() {
      try {
        var s = location.search;
        if (st.zahtevan && !/[?&]okvir=1(?=&|$)/.test(s)) s += (s ? '&' : '?') + 'okvir=1';
        var u = location.pathname + s + location.hash;
        if (P.location.pathname + P.location.search + P.location.hash !== u) P.history.replaceState(P.history.state, '', u);
      } catch (_) { }
    }
    // ... and its title and the colour of the browser's bar
    function look() {
      try {
        if (D.title && P.document.title !== D.title) P.document.title = D.title;
        var a = D.querySelector('meta[name="theme-color"]'), b = P.document.querySelector('meta[name="theme-color"]');
        if (a && b && b.content !== a.content) b.content = a.content;
      } catch (_) { }
    }
    ['replaceState', 'pushState'].forEach(function (n) {
      var own = history[n];
      history[n] = function () { var r = own.apply(this, arguments); mirror(); return r; };
    });
    W.addEventListener('popstate', mirror);
    W.addEventListener('hashchange', mirror);
    W.addEventListener('pageshow', function () { mirror(); look(); });
    mirror(); look();
  }
})();
