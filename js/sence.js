/* ---------------- Sence: the game's colours past a browser that darkens the page by force ----------------
   Samsung Internet's dark mode repaints every colour the page draws with CSS (backgrounds, borders, text, inline SVG, pictures),
   and no page can switch it off (js/menu.js forcedDark, temni-nacin.html). It leaves alone what it does not take for a colour of the
   page: a text-shadow's colour, the colours of an SVG filter (feFlood, feComponentTransfer) and a 2D canvas (temni-nacin.html, the
   phone's test of 11. 11. 2026: rows 4 and 5 and the canvas row as they should be). So in that browser (its UA; ?sence=1 to try it
   anywhere, ?sence=0 off) the game's colours are drawn that way:
   - text: transparent, its glyphs drawn again by a text-shadow in the colour (--sd-c, beside every colour of the CSS; --sd-ts, the
     rule's own shadows after it);
   - a surface (background colour or gradient, border): the element's own made transparent, its colours kept in --sd-bgc, --sd-bgi,
     --sd-bc; a layer under its content (a free ::before or ::after, [data-sdl]) draws the same box in black of a few levels of
     opacity, and an SVG filter (ensure) turns each level into its colour (feComponentTransfer: a table of the colours, the box's
     own edges kept). A pseudo-element with a surface of its own gets the same filter on itself ([data-sdb], [data-sda]);
   - inline SVG: each icon flooded with its colour (feFlood);
   - a picture (<img>): drawn into a canvas in its place (canvas[data-sdimg], the CSS's img rules for it too).
   Elsewhere the module does nothing: the game is the same to the pixel (Sence.on false). The menu's shadow root (js/menu.js init)
   and the game's own page (css/style.css: the HUD) are each rewritten once and watched (a MutationObserver: new elements, a changed
   class) — a text that changes in a race (the HUD's numbers) costs nothing more than its text-shadow. */
(function () {
  'use strict';
  const q = location.search;
  // (temni-nacin.html: window.SenceRoots, on everywhere but only for the roots it hands in, its own rows of the page left as they are)
  const roots = !!window.SenceRoots;
  const on = roots || /[?&]sence=1/.test(q) || (/SamsungBrowser/i.test(navigator.userAgent) && !/[?&]sence=0/.test(q));
  const Sence = window.Sence = { on, root: () => {}, rewriteSheet: () => {}, stats: { rules: 0, layers: 0, filters: 0, imgs: 0, svgs: 0, ms: 0 } };
  if (!on) return;
  const ST = Sence.stats;
  if (!roots) document.documentElement.setAttribute('data-sence', '');

  // ---- colours ----
  const cx = document.createElement('canvas').getContext('2d');
  const colCache = new Map();
  function col(s) {   // a CSS colour → [r, g, b, a] (0–255, a 0–1); null when it is none
    s = (s || '').trim();
    if (!s || s === 'none' || s === 'transparent') return [0, 0, 0, 0];
    let c = colCache.get(s); if (c) return c;
    let m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(s);
    if (!m) { cx.fillStyle = '#000'; cx.fillStyle = s; const f = cx.fillStyle; m = /^#([\da-f]{6})$/i.exec(f); if (m) c = [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4), 16), 1]; else m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(f); }
    if (!c) c = m ? [+m[1], +m[2], +m[3], m[4] == null ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4]] : [0, 0, 0, 0];
    colCache.set(s, c); return c;
  }
  const over = (a, b) => {   // colour a over colour b
    const A = a[3] + b[3] * (1 - a[3]); if (A <= 0) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (a[i] * a[3] + b[i] * b[3] * (1 - a[3])) / A).concat(A);
  };
  const isColTok = (t) => /^(#|rgba?\(|hsla?\(|hwb\(|lab\(|lch\(|oklab\(|oklch\(|color\(|color-mix\(|var\()/i.test(t) || (/^[a-z]+$/i.test(t) && t !== 'none' && CSS.supports('color', t));

  // ---- text splitting (top-level commas, spaces; declarations) ----
  function split(s, sep) {
    const out = []; let d = 0, qt = '', cur = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (qt) { cur += ch; if (ch === qt && s[i - 1] !== '\\') qt = ''; continue; }
      if (ch === '"' || ch === "'") { qt = ch; cur += ch; continue; }
      if (ch === '(') d++; else if (ch === ')') d--;
      if (d === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) { if (cur.trim() || sep !== ' ') out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim() || (sep !== ' ' && out.length)) out.push(cur.trim());
    return out.filter((x, i) => sep !== ' ' || x);
  }
  const cur = (v) => v.replace(/currentcolor/gi, 'var(--sd-c)');
  // the colour of a border shorthand (its third part; none: the text's)
  function borderCol(v) {
    const t = split(v, ' ').filter((x) => !/^(-?[\d.]+(px|em|rem|%|vw|vh|vmin|vmax)?|thin|medium|thick|none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|calc\(.*|initial|inherit|unset)$/i.test(x));
    return t.length ? t.join(' ') : 'var(--sd-c)';
  }
  // a background shorthand → [images (the layers without the colour), colour]
  function bgSplit(v) {
    if (/^(none|transparent|initial|inherit|unset)$/i.test(v.trim())) return ['none', /^inherit$/i.test(v.trim()) ? 'inherit' : 'transparent'];
    const L = split(v, ','), last = split(L[L.length - 1], ' ');
    let c = 'transparent';
    const hard = last.findIndex((t) => isColTok(t) && !/^var\(/i.test(t));
    const vi = last.findIndex((t) => /^var\(/i.test(t));
    const k = hard >= 0 ? hard : (vi >= 0 && L.length === 1 && last.length === 1 ? vi : -1);
    if (k >= 0) { c = last[k]; last.splice(k, 1); }
    L[L.length - 1] = last.join(' ');
    const img = L.filter((x) => x).join(', ');
    return [img || 'none', c];
  }

  // ---- the rules: every colour beside the browser's, in a custom property ----
  const BGP = /^background(-color|-image)?$/, BCP = /^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?$/;
  function decls(text) {   // a declaration block's text → [[name, value, important]]
    return split(text, ';').filter((d) => d.includes(':')).map((d) => {
      const i = d.indexOf(':'), n = d.slice(0, i).trim(); let v = d.slice(i + 1).trim(), imp = false;
      if (/!\s*important$/i.test(v)) { imp = true; v = v.replace(/!\s*important$/i, '').trim(); }
      return [n, v, imp];
    });
  }
  function rewriteDecls(text) {
    const D = decls(text); let ch = false; const out = [];
    for (const [n, v0, imp] of D) {
      let v = v0; const add = (nn, vv) => { out.push([nn, vv, imp]); ch = true; };
      const N = n.toLowerCase();
      if (N.startsWith('--')) { out.push([n, v, imp]); continue; }
      if (N === 'color') { out.push([n, v, imp]); add('--sd-c', /^currentcolor$/i.test(v) ? 'inherit' : cur(v)); continue; }
      if (N === 'text-shadow') { out.push([n, v, imp]); add('--sd-ts', /^none$/i.test(v) ? '0 0 transparent' : cur(v)); continue; }
      if (BGP.test(N) && !/url\(|image-set\(|element\(|var\(--pic/i.test(v)) {
        if (N === 'background-color') { add('--sd-bgc', cur(v)); add(n, 'transparent'); continue; }
        if (N === 'background-image') { add('--sd-bgi', cur(v)); add(n, 'none'); continue; }
        const [im, c] = bgSplit(cur(v));
        // (no picture in it, only where and how big one would be: that stays, for a picture an element gets by its style="")
        if (im !== 'none' && !/(gradient|url|image-set|var)\(/i.test(im)) { add(n, im); add('--sd-bgi', 'none'); add('--sd-bgc', c); continue; }
        add('--sd-bgi', im); add('--sd-bgc', c); add('background-color', 'transparent'); add('background-image', 'none');
        continue;
      }
      if (BCP.test(N) && !/^border-(.*-)?(width|style|radius)$/.test(N)) {
        if (/^(none|0|0px|hidden)$/i.test(v)) { out.push([n, v, imp]); continue; }
        const c = N.endsWith('-color') ? split(v, ' ')[0] : borderCol(v);
        add('--sd-bc', cur(c));
        if (N.endsWith('-color')) add(n, 'transparent'); else { out.push([n, v, imp]); add(N === 'border' ? 'border-color' : N + '-color', 'transparent'); }
        continue;
      }
      if (/currentcolor/i.test(v)) { add(n, cur(v)); continue; }
      out.push([n, v, imp]);
    }
    return ch ? out.map(([n, v, i]) => n + ': ' + v + (i ? ' !important' : '')).join('; ') : null;
  }
  const IMG = /(^|[\s>+~(,])img(?=$|[\s.:#[>+~),])/g, CNV = /(^|[\s>+~(,])canvas(?=$|[\s.:#[>+~),])/g;
  function rewriteRules(list) {
    for (const r of Array.from(list)) {
      if (r.cssRules && !(r instanceof CSSKeyframesRule) && r.type !== 1) { rewriteRules(r.cssRules); continue; }
      if (r instanceof CSSKeyframesRule) { for (const k of Array.from(r.cssRules)) { const t = rewriteDecls(k.style.cssText); if (t != null) k.style.cssText = t; } continue; }
      if (!r.style) continue;
      // (a picture's canvas takes the picture's rules and not the canvases' ones; :where adds nothing to a rule's weight)
      const sel = r.selectorText;
      if (sel && /(^|[^\w-])(img|canvas)([^\w-]|$)/.test(sel)) {
        const t = sel.replace(CNV, '$1canvas:where(:not([data-sdimg]))').replace(IMG, '$1:is(img, :where(canvas[data-sdimg]))');
        if (t !== sel) r.selectorText = t;
      }
      const t = rewriteDecls(r.style.cssText); if (t != null) { r.style.cssText = t; ST.rules++; }
      if (r.cssRules && r.cssRules.length) rewriteRules(r.cssRules);
    }
  }
  function rewriteSheet(sh) { try { if (sh && !sh.__sd) { sh.__sd = 1; rewriteRules(sh.cssRules); } } catch (_) { /* (another origin's sheet) */ } }
  Sence.rewriteSheet = rewriteSheet;

  // ---- the custom properties and the rules of the layers ----
  try {
    const reg = (name, syntax, inherits, initialValue) => { try { CSS.registerProperty(initialValue == null ? { name, syntax, inherits } : { name, syntax, inherits, initialValue }); } catch (_) { /* (registered) */ } };
    reg('--sd-c', '<color>', true, getComputedStyle(document.documentElement).color || '#000');
    reg('--sd-bgc', '<color>', false, 'transparent'); reg('--sd-bc', '<color>', false, 'transparent'); reg('--sd-bgi', '*', false);
  } catch (_) { /* (no CSS.registerProperty: the colours only change, not ease) */ }
  const BASE = ':root,:host{--sd-ts:0 0 transparent}' +
    '*:not(svg):not(svg *),*::before,*::after,*::placeholder,*::marker{color:transparent!important;caret-color:var(--sd-c)!important;text-shadow:0 0 0 var(--sd-c),var(--sd-ts)!important;-webkit-text-fill-color:transparent!important}' +
    'svg{color:var(--sd-c)!important}' +
    '[data-sdo]{overflow:clip!important;overflow-clip-margin:border-box!important}[data-sdo=f]{display:flow-root!important}' +
    '[data-sdl]{isolation:isolate}[data-sdp]{position:relative}' +
    '[data-sdl=b]::before,[data-sdl=a]::after{content:""!important;position:absolute!important;inset:var(--sd-li,0)!important;z-index:-1!important;pointer-events:none!important;' +
    'border-radius:inherit!important;box-sizing:border-box!important;border-style:inherit!important;border-width:inherit!important;border-color:var(--sd-lk,transparent)!important;' +
    'background:var(--sd-lb,none)!important;background-color:var(--sd-lc,transparent)!important;background-clip:padding-box!important;filter:var(--sd-lf,none)!important;' +
    'margin:0!important;padding:0!important;transform:none!important;opacity:1!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;' +
    'display:block!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important;animation:none!important;transition:none!important;box-shadow:none!important;outline:0!important}' +
    '[data-sdb]::before{background:var(--sd-Bb,none)!important;background-color:var(--sd-Bc,transparent)!important;border-color:var(--sd-Bk,transparent)!important;filter:var(--sd-Bf,none)!important;background-clip:padding-box!important}' +
    '[data-sda]::after{background:var(--sd-Ab,none)!important;background-color:var(--sd-Ac,transparent)!important;border-color:var(--sd-Ak,transparent)!important;filter:var(--sd-Af,none)!important;background-clip:padding-box!important}' +
    '[data-sdn]{background:var(--sd-nb,none)!important;background-color:var(--sd-nc,transparent)!important;border-color:var(--sd-nk,transparent)!important}' +
    '[data-sdu]{background-image:none!important;isolation:isolate}[data-sdu][data-sdl]{background-color:transparent!important}[data-sdu][data-sdl=a]::after{z-index:-2!important}' +
    'canvas[data-sdbg]{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:-1!important;pointer-events:none!important;border-radius:inherit;display:block!important;margin:0!important;padding:0!important;border:0!important;transform:none!important;filter:none!important;opacity:1!important}';

  // ---- the filters (one per set of colours, in each tree's own <svg>) ----
  const A0 = 0.2;
  const lvl = (i, n) => (n === 1 ? 1 : A0 + (1 - A0) * i / (n - 1));
  const fmt = (x) => +x.toFixed(4);
  function defsOf(root) {
    if (root.__sdDefs) return root.__sdDefs;
    const host = root === document ? document.body : root;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('data-sddefs', '');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    host.appendChild(s);
    root.__sdDefs = { svg: s, ids: new Map() };
    return root.__sdDefs;
  }
  let fid = 0;
  function filterFor(root, pal, svgShape) {
    const D = defsOf(root), key = (svgShape ? 's' : '') + pal.map((c) => c.map((x) => fmt(x)).join(',')).join(';');
    let id = D.ids.get(key); if (id) return id;
    id = 'sd' + (++fid); D.ids.set(key, id); ST.filters++;
    const box = svgShape ? 'x="-50%" y="-50%" width="200%" height="200%"' : 'x="0" y="0" width="1" height="1"';
    let h;
    if (pal.length === 1) {
      const c = pal[0];
      h = '<feFlood flood-color="rgb(' + c.slice(0, 3).map(Math.round).join(',') + ')" flood-opacity="' + fmt(c[3]) + '"/><feComposite in2="SourceAlpha" operator="in"/>';
    } else {
      const k = 1 / (1 - A0), b = -A0 / (1 - A0), row = '0 0 0 ' + fmt(k) + ' ' + fmt(b);
      const tab = (i) => pal.map((c) => fmt(i < 3 ? c[i] / 255 : c[3])).join(' ');
      h = '<feComponentTransfer in="SourceAlpha" result="m"><feFuncA type="linear" slope="' + fmt(1 / A0) + '" intercept="0"/></feComponentTransfer>' +
        '<feColorMatrix in="SourceGraphic" type="matrix" values="' + row + ' ' + row + ' ' + row + ' 0 0 0 0 1"/>' +
        '<feComponentTransfer><feFuncR type="table" tableValues="' + tab(0) + '"/><feFuncG type="table" tableValues="' + tab(1) + '"/><feFuncB type="table" tableValues="' + tab(2) + '"/><feFuncA type="table" tableValues="' + tab(3) + '"/></feComponentTransfer>' +
        '<feComposite in2="m" operator="in"/>';
    }
    D.svg.insertAdjacentHTML('beforeend', '<filter id="' + id + '" ' + box + ' color-interpolation-filters="sRGB">' + h + '</filter>');
    return id;
  }

  // ---- a box's colours → what its layer draws ----
  const GR = /(repeating-)?(linear|radial|conic)-gradient\(/gi;
  const specCache = new Map();
  function spec(root, bgc, bgi, bc, border) {
    const key = bgc + '|' + bgi + '|' + (border ? bc : '');
    let s = specCache.get(root) && specCache.get(root).get(key); if (s) return s;
    s = make(root, bgc, bgi, bc, border);
    if (!specCache.has(root)) specCache.set(root, new Map()); specCache.get(root).set(key, s);
    return s;
  }
  function make(root, bgc, bgi, bc, border) {
    const imgs = bgi && bgi !== 'none' ? bgi : '';
    const nGr = (imgs.match(GR) || []).length;
    if (/url\(|image-set\(/i.test(imgs) || nGr > 1 || (imgs && !nGr)) return { native: true };
    const base = col(bgc);
    let stops = [], pre = '', post = '', fn = '', head = null, inner = '';
    if (nGr) {
      GR.lastIndex = 0; const m = GR.exec(imgs); GR.lastIndex = 0;
      let d = 0, j = m.index + m[0].length;
      for (; j < imgs.length; j++) { const c = imgs[j]; if (c === '(') d++; else if (c === ')') { if (d === 0) break; d--; } }
      pre = imgs.slice(0, m.index); fn = m[0]; inner = imgs.slice(m.index + m[0].length, j); post = imgs.slice(j);
      const args = split(inner, ',');
      if (args.length && !isColTok(split(args[0], ' ')[0])) head = args.shift();
      for (const a of args) {
        const t = split(a, ' '); const ci = t.findIndex(isColTok);
        if (ci < 0) { stops.push({ hint: a }); continue; }
        const c = t.splice(ci, 1)[0];
        stops.push({ c: col(c), pos: t.join(' ') });
      }
      const real = stops.filter((x) => x.c);
      if (real.length < 1) return { native: true };
      // a clear stop takes its neighbour's hue (CSS blends gradients premultiplied, the table does not)
      real.forEach((x, i) => {
        if (x.c[3] > 0) return;
        const nb = real.slice(i + 1).find((y) => y.c[3] > 0) || real.slice(0, i).reverse().find((y) => y.c[3] > 0);
        if (nb) x.c = [nb.c[0], nb.c[1], nb.c[2], 0];
      });
    }
    const real = stops.filter((x) => x.c);
    const pal = [];
    if (border) pal.push(over(col(bc), real.length ? over(real[0].c, base) : base));
    if (real.length) for (const x of real) pal.push(over(x.c, base));
    else if (base[3] > 0) pal.push(base);
    if (!pal.length) return null;
    // only black (of any alpha): the browser's darkening keeps it as it is, so no layer and no filter for it (the race's vignette over
    // the 3D picture, the shades of dialogs: a filter there would cost every frame)
    if (pal.every((p) => p[0] + p[1] + p[2] < 6)) return { native: true };
    const n = pal.length, off = border ? 1 : 0, blk = (i) => 'rgba(0,0,0,' + fmt(lvl(i, n)) + ')';
    let b = 'none', c = 'transparent';
    if (real.length) {
      let i = 0;
      const a2 = stops.map((x) => (x.c ? blk(off + i++) + (x.pos ? ' ' + x.pos : '') : x.hint));
      b = pre + fn + (head ? head + ', ' : '') + a2.join(', ') + post;
    } else if (base[3] > 0) c = blk(off);
    return { b, c, k: border ? blk(0) : 'transparent', f: 'url(#' + filterFor(root, pal) + ')' };
  }

  // ---- the elements ----
  const NOLAYER = /^(html|body|img|canvas|input|select|textarea|video|iframe|picture|br|wbr|hr|option|optgroup|template|slot|script|style|link|meta)$/;
  const TRANSP = /^(transparent|rgba\(0, 0, 0, 0\))$/;
  const orig = new WeakMap();
  function boxOf(cs) {
    const bgc = cs.getPropertyValue('--sd-bgc').trim(), bgi = cs.getPropertyValue('--sd-bgi').trim(), bc = cs.getPropertyValue('--sd-bc').trim();
    const w = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(parseFloat);
    const border = !!bc && !TRANSP.test(bc) && w.some((x) => x > 0);
    const bg = (!!bgc && !TRANSP.test(bgc)) || (!!bgi && bgi !== 'none');
    return { bgc, bgi, bc, w, border, bg };
  }
  function clearVars(el, pre) { for (const k of ['b', 'c', 'k', 'f', 'i']) el.style.removeProperty('--sd-' + pre + k); }
  function setVars(el, pre, s) { el.style.setProperty('--sd-' + pre + 'b', s.b); el.style.setProperty('--sd-' + pre + 'c', s.c); el.style.setProperty('--sd-' + pre + 'k', s.k); el.style.setProperty('--sd-' + pre + 'f', s.f); }
  const free = (el, p) => { const c = getComputedStyle(el, p).content; return !c || c === 'none' || c === 'normal'; };
  function element(el, root) {
    const tag = el.localName;
    if (inlineStyle(el)) { /* (moved into the custom properties) */ }
    if (tag === 'img') { toCanvas(el); return; }
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const B = boxOf(cs);
    // a picture behind it (url()): the pictures into a canvas of its own under its content, its colour and gradients into its layer
    let bi = cs.backgroundImage;
    if (el.hasAttribute('data-sdu')) { el.removeAttribute('data-sdu'); bi = getComputedStyle(el).backgroundImage; el.setAttribute('data-sdu', ''); }
    if (/url\(/i.test(bi) && !NOLAYER.test(tag)) {
      const L = split(bi, ','), rest = L.filter((x) => !/url\(/i.test(x));
      if (!B.bgc || TRANSP.test(B.bgc)) B.bgc = cs.backgroundColor;
      if (!B.bgi || B.bgi === 'none') B.bgi = rest.join(', ');
      B.bg = (!!B.bgc && !TRANSP.test(B.bgc)) || !!B.bgi;
      if (cs.position === 'static') el.setAttribute('data-sdp', '');
      bgCanvas(el, cs, L, bi);
    } else if (el.__sdbg) dropBg(el);
    // the element's own surface
    if (B.bg || B.border) {
      let slot = el.getAttribute('data-sdl');
      if (!slot && !NOLAYER.test(tag) && !el.hasAttribute('data-sdn')) slot = free(el, '::before') ? 'b' : free(el, '::after') ? 'a' : '';
      // a box that clips its content (overflow: hidden) would clip its own layer's border too: it clips at its border's outer edge
      // instead (overflow: clip with overflow-clip-margin; a block keeps its own formatting context), its content painting over the
      // border where it reaches it. One that scrolls keeps its border as it was.
      let clip = cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
      if (clip && B.border && slot && /^(hidden|clip)$/.test(cs.overflowX) && /^(hidden|clip)$/.test(cs.overflowY) && !el.scrollTop && !el.scrollLeft) {
        if (!el.hasAttribute('data-sdo')) el.setAttribute('data-sdo', cs.display === 'block' ? 'f' : '');
        clip = false;
      }
      const s = slot ? spec(root, B.bgc, B.bgi, B.bc, B.border && !clip) : null;
      if (s && !s.native) {
        el.removeAttribute('data-sdn'); clearVars(el, 'n');
        if (el.getAttribute('data-sdl') !== slot) { el.setAttribute('data-sdl', slot); ST.layers++; }
        if (cs.position === 'static') el.setAttribute('data-sdp', '');
        setVars(el, 'l', s);
        el.style.setProperty('--sd-li', B.border && !clip ? B.w.map((x) => -x + 'px').join(' ') : '0');
        if (B.border && clip) { el.setAttribute('data-sdn', ''); el.style.setProperty('--sd-nk', B.bc); el.style.setProperty('--sd-nb', 'none'); el.style.setProperty('--sd-nc', 'transparent'); }
      } else {   // no layer for it: its colours as they were (the browser's darkening and all)
        unlayer(el);
        el.setAttribute('data-sdn', '');
        el.style.setProperty('--sd-nb', B.bgi || 'none'); el.style.setProperty('--sd-nc', B.bgc || 'transparent'); el.style.setProperty('--sd-nk', B.border ? B.bc : 'transparent');
      }
    } else if (el.hasAttribute('data-sdl') || el.hasAttribute('data-sdn')) { unlayer(el); el.removeAttribute('data-sdn'); clearVars(el, 'n'); }
    // its pseudo-elements' own surfaces
    for (const [p, a, pre] of [['::before', 'data-sdb', 'B'], ['::after', 'data-sda', 'A']]) {
      if (el.getAttribute('data-sdl') === (p === '::before' ? 'b' : 'a')) continue;
      if (free(el, p) && !el.hasAttribute(a)) continue;
      const pc = getComputedStyle(el, p), P = boxOf(pc);
      if (!P.bg && !P.border) { if (el.hasAttribute(a)) { el.removeAttribute(a); clearVars(el, pre); } continue; }
      let s = spec(root, P.bgc, P.bgi, P.bc, P.border);
      const k = el; let of = orig.get(k); if (!of) orig.set(k, of = {});
      if (of[p] == null) of[p] = el.hasAttribute(a) ? '' : (pc.filter !== 'none' ? pc.filter : '');
      if (!s || s.native) s = { b: P.bgi || 'none', c: P.bgc || 'transparent', k: P.border ? P.bc : 'transparent', f: of[p] || 'none' };
      else s = Object.assign({}, s, { f: s.f + (of[p] ? ' ' + of[p] : '') });
      el.setAttribute(a, ''); setVars(el, pre, s);
    }
  }
  function unlayer(el) { if (el.hasAttribute('data-sdl')) { el.removeAttribute('data-sdl'); el.removeAttribute('data-sdp'); clearVars(el, 'l'); el.style.removeProperty('--sd-li'); } }
  // an element's own style="" colours (the game's buttons of a colour, the HUD's swatches) → the custom properties
  function inlineStyle(el) {
    const s = el.style; if (!s || !s.length) return false;
    const t = s.cssText;
    // (our own rewrite coming back through the observer: left as it is, else a rewrite that is not its own fixed point would go round
    // without end in the observer's microtasks)
    if (t === el.__sdcss) return false;
    if (!/(^|;)\s*(color|background|border|text-shadow)[a-z-]*\s*:/i.test(t)) return false;
    const pick = t.split(';').filter((d) => /^\s*(color|background|border|text-shadow)/i.test(d)).join(';');
    if (/background-color:\s*transparent|--sd-c:/.test(t) && !/(^|;)\s*color\s*:/.test(t.replace(/--sd-c:[^;]*/g, '').replace(/caret-color[^;]*/g, '')) && !/background(-image)?:\s*(?!none)[^;]*gradient|background(-color)?:\s*(?!transparent)#|background:\s*rgb/.test(pick)) return false;
    const r = rewriteDecls(t); if (r == null) return false;
    if (r === t) { el.__sdcss = t; return false; }
    s.cssText = r; el.__sdcss = s.cssText; return true;
  }

  // ---- pictures and icons ----
  // the url() pictures of an element's background, drawn as the browser would (size, position, repeat) on a canvas under its content
  const pics = new Map();
  function pic(u, then) {
    let p = pics.get(u);
    if (!p) { p = { im: new Image(), wait: new Set() }; pics.set(u, p); p.im.onload = () => { for (const f of p.wait) f(); p.wait.clear(); }; p.im.src = u; }
    if (p.im.complete && p.im.naturalWidth) return p.im;
    p.wait.add(then); return null;
  }
  const len = (t, all, rest) => (/%$/.test(t) ? parseFloat(t) / 100 * all : /px$/.test(t) ? parseFloat(t) : rest);
  let ro = null;
  function bgCanvas(el, cs, L, bi) {
    const S = split(cs.backgroundSize, ','), P = split(cs.backgroundPosition, ','), R = split(cs.backgroundRepeat, ',');
    const key = bi + '|' + cs.backgroundSize + '|' + cs.backgroundPosition + '|' + cs.backgroundRepeat;
    let c = el.__sdbg;
    if (!c || !c.isConnected || c.parentNode !== el) {
      c = el.__sdbg = document.createElement('canvas'); c.setAttribute('data-sdbg', ''); c.setAttribute('aria-hidden', 'true');
      el.appendChild(c); el.setAttribute('data-sdu', ''); ST.imgs++;
      if (!ro && window.ResizeObserver) ro = new ResizeObserver((es) => { for (const e of es) if (e.target.__sdbg) draw(e.target); });
      if (ro) ro.observe(el);
    }
    c.__k = key; c.__L = L; c.__S = S; c.__P = P; c.__R = R;
    draw(el);
  }
  function draw(el) {
    const c = el.__sdbg; if (!c) return;
    const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    const d = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(w * d), H = Math.round(h * d);
    const k = c.__k + '|' + W + 'x' + H; if (c.__drawn === k) return;
    const ims = [];
    for (const x of c.__L) {
      const m = /url\(\s*(['"]?)(.*?)\1\s*\)/i.exec(x); if (!m) { ims.push(null); continue; }
      const im = pic(m[2], () => { if (el.__sdbg === c) draw(el); }); if (!im) return; ims.push(im);
    }
    c.width = W; c.height = H; const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    for (let i = ims.length - 1; i >= 0; i--) {
      const im = ims[i]; if (!im) continue;
      const iw = im.naturalWidth, ih = im.naturalHeight;
      const sz = (c.__S[i % c.__S.length] || 'auto').trim(), ps = split((c.__P[i % c.__P.length] || '0% 0%').trim(), ' '), rp = (c.__R[i % c.__R.length] || 'repeat').trim();
      let dw = iw, dh = ih;
      if (sz === 'cover' || sz === 'contain') { const r = (sz === 'cover' ? Math.max : Math.min)(w / iw, h / ih); dw = iw * r; dh = ih * r; }
      else {
        const [a, b = 'auto'] = split(sz, ' ');
        const A = len(a, w, null), Bh = len(b, h, null);
        if (A != null && Bh != null) { dw = A; dh = Bh; } else if (A != null) { dw = A; dh = ih * A / iw; } else if (Bh != null) { dh = Bh; dw = iw * Bh / ih; }
      }
      const px = (t, free) => (/%$/.test(t) ? parseFloat(t) / 100 * free : parseFloat(t) || 0);
      const x0 = px(ps[0] || '0%', w - dw), y0 = px(ps[1] || ps[0] || '0%', h - dh);
      const rx = !/^(no-repeat|repeat-y)/.test(rp), ry = !/^(no-repeat|repeat-x)/.test(rp) && !/^repeat-x/.test(rp);
      const xs = rx ? x0 - Math.ceil(x0 / dw) * dw : x0, ys = ry ? y0 - Math.ceil(y0 / dh) * dh : y0;
      for (let y = ys; y < (ry ? h : ys + 1); y += dh) for (let x = xs; x < (rx ? w : xs + 1); x += dw) g.drawImage(im, x, y, dw, dh);
    }
    c.__drawn = k;
  }
  function dropBg(el) { const c = el.__sdbg; el.__sdbg = null; if (c) c.remove(); el.removeAttribute('data-sdu'); if (ro) ro.unobserve(el); }
  function toCanvas(img) {
    if (img.__sd) return; img.__sd = 1;
    const go = () => {
      if (!img.isConnected || !img.naturalWidth) return;
      // its own size (the layout the same: a CSS that sizes it by one side keeps its shape)
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      try { c.getContext('2d').drawImage(img, 0, 0); } catch (_) { return; }
      for (const a of Array.from(img.attributes)) if (a.name !== 'src' && a.name !== 'srcset' && a.name !== 'alt' && a.name !== 'loading' && a.name !== 'decoding') c.setAttribute(a.name, a.value);
      if (img.alt) { c.setAttribute('role', 'img'); c.setAttribute('aria-label', img.alt); }
      c.setAttribute('data-sdimg', img.getAttribute('src') || '');
      img.replaceWith(c); ST.imgs++;
    };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  }
  const SHAPES = 'path,rect,circle,ellipse,line,polyline,polygon,text,use';
  // a paint of a shape (fill or stroke) → rgba, or null when it draws nothing or draws a picture (url(): left as it is)
  function paint(v, op) {
    if (!v || v === 'none' || /url\(/.test(v)) return null;
    const c = col(v); return c[3] * op > 0 ? [c[0], c[1], c[2], c[3] * op] : null;
  }
  const BLACK0 = 'rgba(0,0,0,' + A0 + ')';
  function svgIcon(svg, root) {
    if (svg.hasAttribute('data-sddefs') || svg.closest('[data-sddefs]')) return;
    const sh = Array.from(svg.querySelectorAll(SHAPES)).filter((e) => !e.closest('defs,clipPath,mask,pattern,symbol,filter'));
    // (the colours as the page sets them: ours off first, so a class changed since is read anew)
    if (svg.hasAttribute('data-sdf')) { svg.style.removeProperty('filter'); svg.removeAttribute('data-sdf'); }
    for (const e of sh) if (e.hasAttribute('data-sdf')) { for (const p of ['filter', 'fill', 'stroke', 'fill-opacity', 'stroke-opacity']) e.style.removeProperty(p); e.removeAttribute('data-sdf'); }
    const own = getComputedStyle(svg).filter;
    const ps = sh.map((e) => {
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return null;
      const f = paint(cs.fill, +cs.fillOpacity), k = +parseFloat(cs.strokeWidth) > 0 ? paint(cs.stroke, +cs.strokeOpacity) : null;
      return f || k ? { f, k } : null;
    });
    if (!ps.some(Boolean)) return;
    const one = (p) => p.f && p.k ? null : p.f || p.k, ones = ps.map((p) => p && one(p));
    const keys = new Set(ones.filter(Boolean).map((c) => c.join(',')));
    // one colour in the whole icon, and the icon has no filter of its own: one filter on the icon
    if (keys.size === 1 && ps.every((p) => !p || one(p)) && (!own || own === 'none')) {
      svg.style.filter = 'url(#' + filterFor(root, [ones.find(Boolean)]) + ')'; svg.setAttribute('data-sdf', ''); ST.svgs++; return;
    }
    sh.forEach((e, i) => {
      const p = ps[i]; if (!p) return;
      if (one(p)) e.style.filter = 'url(#' + filterFor(root, [one(p)], true) + ')';
      else {
        // a fill and a stroke of two colours: the fill drawn faint black, the stroke black, a filter turns the two into their colours
        e.style.fill = BLACK0; e.style.stroke = '#000'; e.style.fillOpacity = e.style.strokeOpacity = '1';
        e.style.filter = 'url(#' + filterFor(root, [p.f, p.k], true) + ')';
      }
      e.setAttribute('data-sdf', '');
    });
    ST.svgs++;
  }

  // ---- a tree: rewritten once, watched after ----
  function scan(root, top) {
    const t0 = performance.now();
    const list = top && top.nodeType === 1 ? [top].concat(Array.from(top.querySelectorAll('*'))) : Array.from(root.querySelectorAll('*'));
    for (const el of list) {
      if (el.namespaceURI === 'http://www.w3.org/2000/svg') { if (el.localName === 'svg' && !(el.parentNode && el.parentNode.namespaceURI === 'http://www.w3.org/2000/svg')) svgIcon(el, root); continue; }
      try { element(el, root); } catch (_) { /* (one element: the rest go on) */ }
    }
    ST.ms += performance.now() - t0;
  }
  function watch(root) {
    const todo = new Set(); let raf = 0;
    const run = () => {
      raf = 0; const all = Array.from(todo); todo.clear();
      for (const n of all) if (n.isConnected && !all.some((m) => m !== n && m.contains(n))) scan(root, n);
    };
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        if (r.type === 'childList') {
          for (const n of r.addedNodes) if (n.nodeType === 1 && !n.hasAttribute('data-sddefs') && !n.hasAttribute('data-sdbg')) todo.add(n);
          if (r.target.__sdbg && !r.target.__sdbg.isConnected) todo.add(r.target);   // (its picture's canvas went with its old content)
        }
        else if (r.type === 'attributes' && r.target.nodeType === 1) {
          if (r.attributeName === 'style') { if (inlineStyle(r.target)) todo.add(r.target); }
          else todo.add(r.target);
        }
      }
      if (todo.size && !raf) raf = requestAnimationFrame(run);
    });
    mo.observe(root === document ? document.documentElement : root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'src'] });
    return mo;
  }
  function addBase(root) {
    const st = document.createElement('style'); st.setAttribute('data-sence', ''); st.textContent = BASE;
    (root === document ? document.head : root).appendChild(st);
  }
  // the menu's shadow root (js/menu.js init, once its <style> is in)
  Sence.root = function (root) {
    if (!root || root.__sd) return; root.__sd = 1;
    for (const sh of Array.from(root.styleSheets || [])) rewriteSheet(sh);
    addBase(root); scan(root); watch(root);
  };
  function page() {
    for (const sh of Array.from(document.styleSheets)) rewriteSheet(sh);
    addBase(document); scan(document); watch(document);
  }
  if (roots) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', page); else page();
})();
