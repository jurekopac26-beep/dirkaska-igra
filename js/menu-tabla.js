/* =========================================================================
   MENU TABLA — the road sign behind the car on the new menu's track step (js/menu.js: the yard's .sign), in its country's own style
   (docs/meni-izbira-proge.md, sklop 11; from the mockup maketa-menija/izbira-proge/wxfx.js: SIGNS and signLook; each country's sign,
   its rules, colours, frame and lettering, researched in maketa-menija/izbira-proge/table-drzav.json from the sign regulations and
   Wikipedia, never from map pictures).
   Each country its real place-name or guide sign (Slovenia and Germany the yellow town sign with its black frame, France and Monaco the
   white one with the red band, Austria white with its blue band, Czechia, Denmark, Spain, Portugal, Ireland, Wales, Kazakhstan, Mexico
   ... white with a black frame, Finland, Belgium, Brazil, Japan, China, Romania, Russia, Sweden, the Netherlands, Switzerland, Georgia
   and Italy blue, the USA, Canada, Chile, Australia, South Africa, Thailand, South Korea, Sri Lanka, Tanzania and England green ...), a
   little worn as such signs are there (dirt, salt, dust in the land's colour, mud, moss, fading, rust under the bolts, streaks,
   scratches), the sheeting's grain and a sheen. The country's name in the middle of the sign, in English, smaller where it would not fit;
   where a tall car (a truck) hides the sign's left part, right of it (as far as it must), smaller to fit there; where the real signs have
   two lines (the country's own script or language over the English name: Japan, China, Thailand, Russia, Morocco, Romania, Monaco,
   Wales, Ireland, Georgia, Kazakhstan, Sri Lanka, South Korea) two. A country without a sign of its own here, or a test track without a
   country: the menu's plain blue sign. No flag on the sign (the flag is in the row).
   MenuTabla.look(sign, country, name, left): the look on the sign element (its <b>: the name; the wear drawn once per country and size
   into a canvas in it, kept for the screen's next drawing; left: px of the sign the car hides, js/menu-car.js cover); on(sign, country,
   name, left): look and again whenever the sign's size changes (the phone
   turned: lying, the sign is not shown); has(country): a sign of its own; key(country): its key in SIGNS; info(sign): for the tests.
   ========================================================================= */
window.MenuTabla = (function () {
  'use strict';
  // frame: 'line' = a line inset from the edge [colour, width, inset], 'band' = a coloured band at the edge [colour, width, the white edge
  // outside it], 'edge' = a light border at the edge [colour, width]; r: its corners (px); font: [weight, letter spacing px], cond: the
  // lettering condensed; arrow: the pointed blade; two: the name's two lines [the first, the second] (null: the English name); wear: fade,
  // grime, dust (the land's colour), mud, salt, moss, streaks, scratch, sparkle, rust (under the bolts), sheen and the bolts (2 at the ends, 4
  // at the corners). (Romania: not in the research, a blue place-name sign with its own name; the mockup's. Denmark to South Korea: the
  // countries of the new tracks for 1.0, researched with fewer sources (most of it estimated: table-drzav.json says what is confirmed).)
  const SIGNS = {
    Slovenia:       { bg: '#f0ca00', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.6, 3], r: 6, font: [700, 0.5], wear: { fade: 0.08, grime: 0.32, bolts: 2 } },
    Germany:        { bg: '#f0ca00', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.6, 3], r: 6, font: [700, 0.2], cond: 1, wear: { grime: 0.25, bolts: 2, sparkle: 0.4 } },
    Austria:        { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['band', '#0e518d', 5], r: 5, font: [700, 0.6], wear: { grime: 0.18, bolts: 2, sheen: 0.32 } },
    Belgium:        { bg: '#0e518d', fg: '#f6f6f6', frame: ['line', '#f6f6f6', 2, 3], r: 6, font: [700, 0.6], wear: { streaks: 1, fade: 0.06, bolts: 2 } },
    Finland:        { bg: '#0a5ca8', fg: '#ffffff', frame: ['line', '#ffffff', 2, 3], r: 6, font: [700, 0.8], wear: { salt: 1, fade: 0.12, bolts: 2 } },
    England:        { bg: '#33533b', fg: '#ffffff', frame: ['edge', '#ffffff', 3.6], r: 8, font: [700, 0.3], wear: { grime: 0.22, bolts: 2 } },
    France:         { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['band', '#c1121c', 5, 1.5], r: 7, font: [800, 1.2], wear: { grime: 0.12, bolts: 2 } },
    Italy:          { bg: '#0e518d', fg: '#ffffff', frame: ['edge', '#ffffff', 2.4], r: 3, arrow: 1, font: [700, 0.8], wear: { fade: 0.18, grime: 0.2, scratch: 1 } },
    Monaco:         { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['band', '#c1121c', 5, 1.5], r: 7, font: [800, 1.2], two: [null, 'MÙNEGU'], wear: { bolts: 2, sheen: 0.3 } },
    Russia:         { bg: '#1c5aa6', fg: '#ffffff', frame: ['edge', '#ffffff', 2.2], r: 3, font: [700, 0.6], two: ['РОССИЯ', null], wear: { fade: 0.14, mud: 1, bolts: 2 } },
    USA:            { bg: '#006747', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 8, font: [600, 1], wear: { fade: 0.1, sparkle: 1, rust: 1, bolts: 4 } },
    Canada:         { bg: '#006747', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 7, font: [600, 1], wear: { salt: 1, grime: 0.22, bolts: 4 } },
    Brazil:         { bg: '#003166', fg: '#ffffff', frame: ['line', '#ffffff', 2.2, 2.6], r: 5, font: [700, 0.6], wear: { fade: 0.16, dust: '160,80,40', bolts: 2 } },
    Chile:          { bg: '#006747', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 6, font: [700, 0.8], wear: { fade: 0.14, dust: '170,150,120', bolts: 2 } },
    Australia:      { bg: '#005a3c', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 6, font: [600, 0.8], wear: { fade: 0.16, dust: '175,85,45', bolts: 2 } },
    'South Africa': { bg: '#00683f', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 4, font: [600, 0.4], cond: 1, wear: { fade: 0.18, dust: '165,90,55', bolts: 2 } },
    Morocco:        { bg: '#ffffff', fg: '#000000', frame: ['band', '#cc0605', 5, 1.5], r: 7, font: [800, 1], two: ['المغرب', null], wear: { fade: 0.12, dust: '190,160,120', bolts: 2 } },
    Romania:        { bg: '#0b4ea2', fg: '#ffffff', frame: ['line', '#ffffff', 2.2, 2.6], r: 5, font: [700, 0.6], two: ['ROMÂNIA', null], wear: { fade: 0.1, grime: 0.18, bolts: 2 } },
    Japan:          { bg: '#005898', fg: '#ffffff', frame: ['line', '#ffffff', 2.2, 2.2], r: 5, font: [600, 0.4], two: ['日本', 'Japan'], wear: { bolts: 4, sheen: 0.24 } },
    China:          { bg: '#1450a0', fg: '#ffffff', frame: ['line', '#ffffff', 2, 2.4], r: 4, font: [600, 0.4], two: ['中国', 'China'], wear: { bolts: 4, sheen: 0.2 } },
    Thailand:       { bg: '#006a3a', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 4, font: [600, 0.3], two: ['ประเทศไทย', 'Thailand'], wear: { fade: 0.12, streaks: 1, bolts: 2 } },
    Denmark:        { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.2, 2.6], r: 6, font: [700, 0.4], wear: { grime: 0.2, streaks: 1, bolts: 2 } },
    Sweden:         { bg: '#0b5aa2', fg: '#ffffff', frame: ['line', '#ffffff', 1.8, 2.8], r: 5, font: [700, 0.7], wear: { salt: 1, fade: 0.06, grime: 0.14, bolts: 2 } },
    Czechia:        { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 3, 2.4], r: 5, font: [700, 0.3], wear: { grime: 0.22, streaks: 1, bolts: 2 } },
    Wales:          { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.2, 2.4], r: 7, font: [700, 0.3], two: ['CYMRU', null], wear: { moss: 0.4, streaks: 1, grime: 0.22, bolts: 2 } },
    Ireland:        { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.2, 2.2], r: 6, font: [700, 0.3], two: ['Éire', null], wear: { moss: 0.3, mud: 1, grime: 0.2, bolts: 2 } },
    Latvia:         { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.4, 2.2], r: 4, font: [700, 0.6], wear: { grime: 0.3, bolts: 2 } },
    Spain:          { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2, 2.4], r: 5, font: [700, 0.5], wear: { dust: '190,160,115', grime: 0.1, bolts: 2 } },
    Montenegro:     { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.4, 2.6], r: 4, font: [700, 0.5], wear: { dust: '200,190,170', grime: 0.12, rust: 1, bolts: 2 } },
    Netherlands:    { bg: '#0a4f94', fg: '#ffffff', frame: ['line', '#ffffff', 2.2, 2.2], r: 6, font: [700, 0.6], wear: { grime: 0.08, streaks: 1, sheen: 0.2, bolts: 2 } },
    'Cape Verde':   { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['edge', '#1e1e1e', 2.6], r: 5, font: [700, 0.5], wear: { dust: '150,125,95', grime: 0.1, rust: 1, bolts: 2 } },
    Tanzania:       { bg: '#00714a', fg: '#ffffff', frame: ['edge', '#ffffff', 2.6], r: 4, font: [600, 0.5], wear: { fade: 0.16, dust: '185,100,60', grime: 0.1, bolts: 2 } },
    'Sri Lanka':    { bg: '#0b6b45', fg: '#ffffff', frame: ['edge', '#ffffff', 2.4], r: 5, font: [600, 0.5], two: ['ශ්‍රී ලංකාව', null], wear: { fade: 0.1, moss: 0.45, streaks: 1, bolts: 2 } },
    Mexico:         { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.4, 2.2], r: 4, font: [700, 0.5], wear: { dust: '190,150,100', grime: 0.14, rust: 1, bolts: 2 } },
    Switzerland:    { bg: '#09509a', fg: '#ffffff', frame: ['line', '#ffffff', 1.8, 2.6], r: 6, font: [600, 0.5], wear: { sheen: 0.24, bolts: 2 } },
    Georgia:        { bg: '#0f59a8', fg: '#ffffff', frame: ['line', '#ffffff', 2, 2.6], r: 4, font: [700, 0.6], two: ['საქართველო', null], wear: { fade: 0.14, mud: 1, rust: 1, bolts: 2 } },
    Kazakhstan:     { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.4, 2.4], r: 3, font: [700, 0.5], two: ['ҚАЗАҚСТАН', null], wear: { dust: '195,170,125', grime: 0.18, bolts: 2 } },
    Albania:        { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.4, 2.4], r: 4, font: [700, 0.5], wear: { dust: '180,150,110', grime: 0.2, bolts: 2 } },
    Portugal:       { bg: '#f6f6f6', fg: '#1e1e1e', frame: ['line', '#1e1e1e', 2.4, 2.2], r: 5, font: [700, 0.5], wear: { moss: 0.15, streaks: 1, grime: 0.14, bolts: 2 } },
    'South Korea':  { bg: '#04694a', fg: '#ffffff', frame: ['line', '#ffffff', 2, 2.6], r: 6, font: [600, 0.4], two: ['대한민국', null], wear: { fade: 0.04, sheen: 0.22, bolts: 4 } },
  };
  // (a country without a sign of its own, a test track without a country: the menu's plain blue sign, as before the countries' signs)
  const PLAIN = { bg: '#1e4a8e', fg: '#f4f7fb', frame: ['edge', '#e9eef6', 3], r: 6, font: [800, 0.6], wear: { grime: 0.12, bolts: 2 } };
  // (the names a track's English name may give a country in another form)
  const ALIAS = { 'United States': 'USA', 'Czech Republic': 'Czechia', 'Korea': 'South Korea', 'Republic of Korea': 'South Korea', 'Cabo Verde': 'Cape Verde', 'The Netherlands': 'Netherlands', 'Holland': 'Netherlands' };
  const key = (c) => { c = String(c || '').trim(); return SIGNS[c] ? c : ALIAS[c] && SIGNS[ALIAS[c]] ? ALIAS[c] : ''; };
  const has = (c) => !!key(c);
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

  // the wear (and the arrow's border), drawn once per country and size: kept, and moved into the screen's next sign (a copy while the one
  // drawn is still shown: the old screen fading over the new one)
  const made = new Map();
  function wearOf(k, S, w, h) {
    const dp = Math.min(2, window.devicePixelRatio || 1), id = (k || '-') + '|' + w + '|' + h + '|' + dp;
    let c = made.get(id);
    if (!c) {
      c = paint(k, S, w, h, dp);
      made.set(id, c); if (made.size > 8) made.delete(made.keys().next().value);
    }
    if (!c.isConnected) return c;
    const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; o.className = c.className; o.setAttribute('aria-hidden', 'true');
    o.getContext('2d').drawImage(c, 0, 0); return o;
  }
  function paint(k, S, w, h, dp) {
    const c = document.createElement('canvas'); c.className = 'wear'; c.setAttribute('aria-hidden', 'true'); c.width = Math.round(w * dp); c.height = Math.round(h * dp);
    const g = c.getContext('2d'), f = S.frame, W = S.wear || {}, kk = k || 'Plain', r = rng(kk.length * 97 + kk.charCodeAt(0) * 31 + kk.charCodeAt(1)); g.scale(dp, dp);
    if (S.arrow) {   // the pointed blade: its white edge along the cut
      const p = h * 0.42; g.strokeStyle = f[1]; g.lineWidth = f[2] * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(w - p, 0); g.lineTo(w, h / 2); g.lineTo(w - p, h); g.lineTo(0, h); g.closePath(); g.stroke();
    }
    for (let i = 0; i < w * h / 3; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * w, r() * h, 1, 1); }   // (the sheeting's grain)
    if (W.fade) { const fd = g.createLinearGradient(0, 0, w, h); fd.addColorStop(0, 'rgba(255,255,255,' + W.fade + ')'); fd.addColorStop(1, 'rgba(255,255,255,' + W.fade * 0.3 + ')'); g.fillStyle = fd; g.fillRect(0, 0, w, h); }
    const shn = W.sheen || 0.2, sg = g.createLinearGradient(0, 0, w, h); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.36, 'rgba(255,255,255,' + shn + ')'); sg.addColorStop(0.45, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, h);
    const bottom = (rgb, a) => { const gd = g.createLinearGradient(0, h * 0.5, 0, h); gd.addColorStop(0, 'rgba(' + rgb + ',0)'); gd.addColorStop(1, 'rgba(' + rgb + ',' + a + ')'); g.fillStyle = gd; g.fillRect(0, 0, w, h); };
    if (W.grime) { bottom('70,55,35', W.grime); for (let i = 0; i < 9; i++) { const x = r() * w, l = 5 + r() * 12; g.strokeStyle = 'rgba(70,55,35,' + W.grime * 0.45 + ')'; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, h - l); g.lineTo(x + r() * 2 - 1, h); g.stroke(); } }
    if (W.dust) { bottom(W.dust, 0.42); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(' + W.dust + ',' + (0.2 + r() * 0.35) + ')'; g.fillRect(r() * w, h - Math.pow(r(), 2) * h * 0.45, 1.2, 1.2); } }
    if (W.mud) { bottom('60,45,30', 0.35); for (let i = 0; i < 14; i++) { const x = r() * w, y0 = h * (0.45 + r() * 0.3); g.strokeStyle = 'rgba(60,45,30,' + (0.15 + r() * 0.2) + ')'; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + r() * 3 - 1.5, h); g.stroke(); } }
    if (W.salt) for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(235,238,240,' + (0.25 + r() * 0.5) + ')'; g.fillRect(r() * w, h - Math.pow(r(), 1.6) * h * 0.4, 0.9 + r(), 0.9 + r()); }
    if (W.moss) { bottom('70,95,45', 0.22 * W.moss); for (let i = 0; i < 90 * W.moss; i++) { const x = r() < 0.5 ? r() * w * 0.18 : w - r() * w * 0.18; g.fillStyle = 'rgba(' + (70 + r() * 30 | 0) + ',' + (100 + r() * 40 | 0) + ',45,' + (0.25 + r() * 0.35) + ')'; g.fillRect(x, h - Math.pow(r(), 1.4) * h * 0.5, 1.4, 1.4); } }
    if (W.streaks) for (let i = 0; i < 12; i++) { const x = r() * w, l = h * (0.25 + r() * 0.6), gr = g.createLinearGradient(0, 0, 0, l); gr.addColorStop(0, 'rgba(40,35,30,.32)'); gr.addColorStop(1, 'rgba(40,35,30,0)'); g.strokeStyle = gr; g.lineWidth = 1 + r() * 2.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + r() - 0.5, l); g.stroke(); }
    if (W.scratch) for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, l = 6 + r() * 18, an = -0.4 + r() * 0.3; g.strokeStyle = 'rgba(255,255,255,' + (0.12 + r() * 0.18) + ')'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); }
    if (W.sparkle) for (let i = 0; i < 70 * W.sparkle; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.25 + r() * 0.55) + ')'; g.fillRect(r() * w, r() * h, 0.9, 0.9); }
    const bolts = W.bolts === 4 ? [[0.04, 0.24], [0.96, 0.24], [0.04, 0.76], [0.96, 0.76]] : W.bolts === 2 ? [[0.035, 0.5], [0.965, 0.5]] : [];
    for (const [bx, by] of bolts) {
      const x = bx * w - (S.arrow && bx > 0.5 ? h * 0.42 : 0), y = by * h;
      if (W.rust) { const rg = g.createLinearGradient(0, y, 0, y + 22); rg.addColorStop(0, 'rgba(150,70,25,.55)'); rg.addColorStop(1, 'rgba(150,70,25,0)'); g.fillStyle = rg; g.beginPath(); g.moveTo(x - 2, y); g.quadraticCurveTo(x - 1, y + 14, x + 0.5, y + 22); g.quadraticCurveTo(x + 1.5, y + 12, x + 2.2, y); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 0.6, y + 0.9, 2.4, 0, 7); g.fill();
      const bg = g.createRadialGradient(x - 0.8, y - 0.9, 0.2, x, y, 2.4); bg.addColorStop(0, '#f4f6f8'); bg.addColorStop(0.6, '#9aa3ad'); bg.addColorStop(1, '#5e6670'); g.fillStyle = bg; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill();
    }
    return c;
  }

  // the look on the sign: its colours, frame and corners, the name in its middle (one line or two; smaller until it fits, the tag of a test
  // track or of one awaiting the choice beside it), the wear over it all
  function look(el, country, name, left) {
    if (!el) return null;
    const b = el.querySelector('b'); if (!b) return null;
    if (name == null) name = el.dataset.name != null ? el.dataset.name : b.textContent;
    el.dataset.name = name;
    const k = key(country), S = k ? SIGNS[k] : PLAIN, f = S.frame, w = el.offsetWidth, h = el.offsetHeight;
    el.dataset.sign = k || 'plain';
    Object.assign(el.style, { background: S.bg, color: S.fg, border: 'none', borderRadius: S.r + 'px', filter: 'none', clipPath: '' });
    const sh = ['0 0 0 1px rgba(0,0,0,.45)', '3px 5px 0 rgba(0,0,0,.35)', '0 10px 18px rgba(0,0,0,.35)'];
    if (f[0] === 'band') { sh.unshift('inset 0 0 0 ' + f[2] + 'px ' + f[1]); if (f[3]) sh.splice(1, 0, '0 0 0 ' + f[3] + 'px #fff'); }
    if (f[0] === 'edge' && !S.arrow) sh.unshift('inset 0 0 0 ' + f[2] + 'px ' + f[1]);
    if (f[0] === 'line') sh.unshift('inset 0 0 0 ' + f[3] + 'px ' + S.bg, 'inset 0 0 0 ' + (f[3] + f[2]) + 'px ' + f[1]);
    el.style.boxShadow = sh.join(', ');
    if (S.arrow && h) { el.style.clipPath = 'polygon(0 0, calc(100% - ' + (h * 0.42).toFixed(1) + 'px) 0, 100% 50%, calc(100% - ' + (h * 0.42).toFixed(1) + 'px) 100%, 0 100%)'; el.style.boxShadow = 'none'; }
    // the name: the English one in capitals, or the country's own script or language over it
    const NAME = String(name).toUpperCase(), two = S.two && (S.two[0] || S.two[1]), l1 = two ? (S.two[0] || NAME) : NAME, l2 = two ? (S.two[1] || NAME) : '';
    Object.assign(b.style, { fontWeight: S.font[0], letterSpacing: S.font[1] + 'px', fontStretch: S.cond ? '87%' : '100%', fontSize: '', color: S.fg, textTransform: 'none' });
    b.classList.toggle('two', !!two);
    b.innerHTML = '';
    const a = document.createElement('span'); a.className = 'l1'; a.textContent = l1; b.appendChild(a);
    if (two) { const c = document.createElement('span'); c.className = 'l2'; c.textContent = l2; b.appendChild(c); }
    el.style.paddingLeft = ''; el.dataset.cover = Math.round(Math.max(0, +left || 0));
    if (w && h) {
      // the name (and the tag) in the middle of the sign, clear of its frame (the arrow's point: half of it); where the car hides the
      // sign's left part (left: px from the sign's left edge, a truck's), moved right just enough to stand clear of it; smaller until it
      // fits there, as high as 0.9 of the sign. (The sign's padding is 12 px a side: a left padding of 12 + 2 s moves the middle by s.)
      const tag = el.querySelector('i'), tw = tag ? tag.offsetWidth + 8 : 0, m = (f[0] === 'band' ? f[2] : f[0] === 'line' ? f[2] + f[3] : f[2]) + 12;
      const R = w - m - (S.arrow ? h * 0.21 : 0), L0 = Math.max(m, +el.dataset.cover + 6), avail = Math.min(2 * R - w, R - L0);
      let fs = parseFloat(getComputedStyle(b).fontSize) || 30;
      const fit = () => b.scrollWidth + tw <= avail + 0.5 && b.scrollHeight <= h * 0.9 + 0.5;
      if (!fit()) { fs = Math.max(11, Math.floor(fs * Math.min(Math.max(1, avail - tw) / Math.max(1, b.scrollWidth), h * 0.9 / Math.max(1, b.scrollHeight)))); b.style.fontSize = fs + 'px'; }
      while (!fit() && fs > 11) { fs -= 1; b.style.fontSize = fs + 'px'; }
      const sh = Math.max(0, L0 - (w - b.scrollWidth - tw) / 2);
      if (sh > 0.5) el.style.paddingLeft = (12 + 2 * sh).toFixed(1) + 'px';
      const old = el.querySelector('canvas.wear'), c = wearOf(k, S, w, h);
      Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: w + 'px', height: h + 'px', pointerEvents: 'none', borderRadius: 'inherit' });
      if (old && old !== c) old.remove();
      if (c.parentNode !== el) el.appendChild(c);
    }
    return el;
  }
  // the look, and again when the sign's size changes (the phone turned: lying the sign is not shown, upright it is drawn then)
  let ro = null, cur = null;
  function on(el, country, name, left) {
    cur = el ? { el, country, left, w: el.offsetWidth, h: el.offsetHeight } : null;
    look(el, country, name, left);
    if (!window.ResizeObserver) return;
    if (!ro) ro = new ResizeObserver(() => {
      const c = cur; if (!c || !c.el.isConnected) return;
      const w = c.el.offsetWidth, h = c.el.offsetHeight;
      if (w && h && (w !== c.w || h !== c.h)) { c.w = w; c.h = h; look(c.el, c.country, undefined, c.left); }
    });
    ro.disconnect(); if (el) ro.observe(el);
  }
  // (tests) what a sign shows: its key, the lines of its name, its colours, the wear drawn on it and the name's box in it
  function info(el) {
    if (!el) return null;
    const b = el.querySelector('b'), c = el.querySelector('canvas.wear'), cs = getComputedStyle(el), r = el.getBoundingClientRect(), n = b ? b.getBoundingClientRect() : null;
    return { key: el.dataset.sign || '', lines: b ? [...b.querySelectorAll('span')].map(s => s.textContent) : [], bg: cs.backgroundColor, fg: b ? getComputedStyle(b).color : '', wear: !!c && c.width > 0,
      fs: b ? parseFloat(getComputedStyle(b).fontSize) : 0, mid: n ? +((n.left + n.width / 2) - (r.left + r.width / 2)).toFixed(1) : null, cover: +el.dataset.cover || 0, nameLeft: n ? +(n.left - r.left).toFixed(1) : null, fits: n ? n.left >= r.left - 0.5 && n.right <= r.right + 0.5 && n.top >= r.top - 0.5 && n.bottom <= r.bottom + 0.5 : false, made: made.size };
  }
  return { SIGNS, PLAIN, key, has, look, on, info };
})();
