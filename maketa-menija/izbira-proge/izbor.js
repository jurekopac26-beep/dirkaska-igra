// The quick list of every track (mockup): a tap on the flag in the row opens it from the bottom. The countries as their flags, A to Z
// (the country shown gold); a country with one track takes you to it at once, one with more opens its tracks (their model, length, climb or
// corners, PENDING for the ones being decided, TEST for a test track). Tap outside the sheet, the cross or Back to close it.
// IZBOR.open({ cur, order, all, flag, pick }): cur the track shown, order the list, all its facts by id (vse-proge.js), flag(cc) a flag's
// svg for a 30 x 20 box, pick(id) to go to a track.
window.IZBOR = (() => {
  const CSS = `

// The phone's Back (NAZAJ): every layer opened over the screen (the quick list, a country's tracks in it, the Earth, its card) is one step
// in the history (history.pushState); Back closes the top one (popstate). A layer closed by its own button takes its step back out
// (history.go), and nothing new is written while such a step back is under way. NAZAJ.push(who, close) when a layer opens (close: the
// layer's own closing, without the history), NAZAJ.drop(who, n) when it closes by itself (n of who's layers, all if left out),
// NAZAJ.clear(then) to take every step back out before going to another track; NAZAJ.buzz(): a short tremble (choosing a country or a track).
window.NAZAJ = (() => {
  const st = []; let skip = 0, popping = false, after = [], waiting = [];
  const write = (n) => { try { history.pushState({ nazaj: n }, '', location.href); return true; } catch (e) { return false; } };
  const back = (k, then) => { if (then) after.push(then); if (!k) { if (!skip) run(); return; } skip++; history.go(-k); };
  const run = () => { const a = after; after = []; for (const l of waiting) l.h = write(st.length); waiting = []; a.forEach(f => f()); };
  addEventListener('popstate', () => {
    if (skip) { if (--skip === 0) run(); return; }
    const l = st.pop(); if (!l) return;
    popping = true; try { l.f(); } finally { popping = false; }
  });
  function push(who, f) { const l = { who, f, h: false }; st.push(l); if (skip) waiting.push(l); else l.h = write(st.length); }
  function drop(who, n) {
    if (popping) return;   // (Back itself is closing it: its step is already gone)
    let k = 0, i = 0;
    while (st.length && st[st.length - 1].who === who && (n == null || i < n)) { const l = st.pop(); i++; if (l.h) k++; const w = waiting.indexOf(l); if (w >= 0) waiting.splice(w, 1); }
    if (k) back(k);
  }
  function clear(then) { let k = 0; for (const l of st) if (l.h) k++; st.length = 0; waiting = []; back(k, then); }
  const buzz = () => { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} };
  return { push, drop, clear, buzz, depth: (who) => st.filter(l => !who || l.who === who).length };
})();

  .izb { position: absolute; inset: 0; z-index: 40; font-family: var(--f-ui); }
  .izb-dim { position: absolute; inset: 0; background: rgba(4, 8, 16, .58); opacity: 0; transition: opacity .25s; }
  .izb.on .izb-dim { opacity: 1; }
  .izb-sheet { position: absolute; left: 0; right: 0; bottom: 0; max-height: 820px; display: flex; flex-direction: column; border-radius: 18px 18px 0 0;
    background: linear-gradient(180deg, #1a2742 0, #111c31 120px, #0b1424 100%); box-shadow: 0 -10px 30px rgba(0, 0, 0, .55), inset 0 1px 0 rgba(255, 255, 255, .14);
    transform: translateY(100%); transition: transform .32s cubic-bezier(.2, .8, .25, 1); }
  .izb.on .izb-sheet { transform: none; }
  .izb-grab { display: block; width: 44px; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, .28); margin: 9px auto 0; }
  .izb-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px 12px; }
  .izb-head .t { flex: 1 1 auto; min-width: 0; }
  .izb-head b { display: block; font: 800 italic 22px/1.05 var(--f-ui); letter-spacing: .3px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .izb-head small { display: block; margin-top: 4px; font: 600 12px/1 var(--f-ui); color: var(--lbl, #9fb3d6); }
  .izb-btn { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 10px; border: 1.5px solid rgba(255, 255, 255, .35); background: linear-gradient(180deg, #666d7b, #3b414d);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .3), 0 3px 0 #1f232b; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }
  .izb-btn svg { width: 20px; height: 20px; }
  .izb-hf { flex: 0 0 auto; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 6px rgba(0, 0, 0, .5); }
  .izb-hf svg { width: 100%; height: 100%; display: block; }
  .izb-body { overflow-y: auto; padding: 2px 14px 22px; -webkit-overflow-scrolling: touch; }
  .izb-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 8px; }
  .izb-c { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 0; border: 0; background: none; color: #fff; cursor: pointer; text-align: center; font-family: var(--f-ui); }
  .izb-c .f { position: relative; display: block; aspect-ratio: 3 / 2; border-radius: 7px; overflow: hidden; box-shadow: 0 3px 8px rgba(0, 0, 0, .55), inset 0 0 0 1px rgba(255, 255, 255, .12); }
  .izb-c .f svg { width: 100%; height: 100%; display: block; }
  .izb-c .f::after { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(255, 255, 255, .28), rgba(255, 255, 255, 0) 45%, rgba(0, 0, 0, .18)); }
  .izb-c .n { position: absolute; right: 4px; top: 4px; z-index: 1; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; background: rgba(8, 12, 20, .82);
    font: 800 italic 12px/20px var(--f-ui); color: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .5); }
  .izb-c b { font: 800 italic 11.5px/1.1 var(--f-ui); text-transform: uppercase; letter-spacing: .2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .izb-c small { margin-top: -3px; font: 600 10.5px/1.1 var(--f-ui); color: var(--lbl, #9fb3d6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .izb-c.on .f { box-shadow: 0 0 0 3px #ffc629, 0 0 16px rgba(255, 198, 41, .55); }
  .izb-c.on b { color: #ffc629; }
  .izb-c:active .f { transform: scale(.95); }
  .izb-list { display: flex; flex-direction: column; gap: 10px; }
  .izb-t { display: flex; align-items: center; gap: 12px; padding: 8px 10px 8px 8px; border-radius: 12px; border: 1.5px solid rgba(255, 255, 255, .1); background: rgba(255, 255, 255, .05);
    color: #fff; cursor: pointer; text-align: left; font-family: var(--f-ui); }
  .izb-t img { flex: 0 0 auto; width: 92px; height: 62px; object-fit: cover; border-radius: 8px; background: #1b2a44; }
  .izb-t .tx { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
  .izb-t b { font: 800 italic 17px/1.05 var(--f-ui); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .izb-t small { font: 600 12px/1 var(--f-ui); color: var(--lbl, #9fb3d6); white-space: nowrap; }
  .izb-t em { align-self: flex-start; font: 800 italic 10px/1 var(--f-ui); letter-spacing: .5px; padding: 3px 6px; border-radius: 4px; background: rgba(255, 255, 255, .14); color: #e9eef8; }
  .izb-t em.p { background: rgba(255, 138, 42, .22); color: #ffb067; }
  .izb-t .izb-go { flex: 0 0 auto; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, .1); }
  .izb-t .izb-go svg { width: 14px; height: 14px; }
  .izb-t.on { border-color: #ffc629; background: rgba(255, 198, 41, .1); }
  .izb-t.on b { color: #ffc629; }
  .izb-t.on .izb-go { background: #ffc629; }
  .izb-t.on .izb-go path { stroke: #1b1404; }
  .izb-t:active { transform: scale(.98); }
  .izb-body.in { animation: izbIn .22s ease-out; }
  @keyframes izbIn { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: none; } }
  `;
  const X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>';
  const BACK = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const GO = '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let el = null, o = null;
  const flag = (cc) => '<svg viewBox="0 0 30 20" preserveAspectRatio="none">' + o.flag(cc) + '</svg>';
  // the countries A to Z, each with its tracks in the list's order
  function countries() {
    const by = new Map();
    for (const id of o.order) { const t = o.all[id]; if (!by.has(t.country)) by.set(t.country, { name: t.country, flag: t.flag, ids: [] }); by.get(t.country).ids.push(id); }
    return [...by.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
  const facts = (t) => {
    const third = t.alt ? (t.alt[1] < t.alt[0] ? '−' : '+') + Math.round(Math.abs(t.alt[1] - t.alt[0])).toLocaleString('en-US') + ' m' : t.corners ? t.corners + ' corners' : '';
    return t.km.toFixed(2) + ' km' + (third ? ' · ' + third : '') + ' · ' + (t.open ? 'Open road' : 'Circuit');
  };
  function head(title, sub, left) {
    return '<div class="izb-head">' + (left || '') + '<div class="t"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div><button class="izb-btn" data-x aria-label="Close">' + X + '</button></div>';
  }
  function grid() {
    const C = countries(), curC = o.all[o.cur].country, n = o.order.length;
    return head('Choose a country', C.length + ' countries · ' + n + ' tracks') + '<div class="izb-body in"><div class="izb-grid">' + C.map(c => {
      const one = c.ids.length === 1, t = o.all[c.ids[0]];
      return '<button class="izb-c' + (c.name === curC ? ' on' : '') + '" data-c="' + esc(c.name) + '" aria-label="' + esc(c.name) + '"><span class="f">' + flag(c.flag) + (one ? '' : '<span class="n">' + c.ids.length + '</span>') + '</span>' +
        '<b>' + esc(c.name) + '</b><small>' + esc(one ? t.name : c.ids.length + ' tracks') + '</small></button>';
    }).join('') + '</div></div>';
  }
  function country(name) {
    const c = countries().find(k => k.name === name);
    return head(c.name, c.ids.length + ' tracks', '<button class="izb-btn" data-back aria-label="All countries">' + BACK + '</button><span class="izb-hf">' + flag(c.flag) + '</span>') +
      '<div class="izb-body in"><div class="izb-list">' + c.ids.map(id => {
        const t = o.all[id], tag = t.test ? '<em>TEST</em>' : t.pending ? '<em class="p">PENDING</em>' : '';
        return '<button class="izb-t' + (id === o.cur ? ' on' : '') + '" data-t="' + id + '"><img src="assets/tracks/' + id + '.webp" alt="" loading="lazy"><span class="tx"><b>' + esc(t.name) + '</b><small>' + facts(t) + '</small>' + tag + '</span><span class="izb-go">' + GO + '</span></button>';
      }).join('') + '</div></div>';
  }
  function style() { if (!document.getElementById('izb-css')) { const st = document.createElement('style'); st.id = 'izb-css'; st.textContent = CSS; document.head.appendChild(st); } }   // (the Earth's card uses it too)
  function show(html) { el.querySelector('.izb-sheet').innerHTML = '<i class="izb-grab"></i>' + html; }
  function open(opts) {
    o = opts;
    style();
    if (el) el.remove();
    el = document.createElement('div'); el.className = 'izb'; el.innerHTML = '<div class="izb-dim"></div><div class="izb-sheet" role="dialog" aria-label="Choose a track"></div>';
    document.body.appendChild(el); show(grid());
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-x]') || e.target.classList.contains('izb-dim')) return close();
      if (e.target.closest('[data-back]')) { NAZAJ.drop('izbor', 1); return show(grid()); }
      const c = e.target.closest('[data-c]');
      if (c) { NAZAJ.buzz(); const k = countries().find(x => x.name === c.dataset.c); if (k.ids.length === 1) return choose(k.ids[0], c); show(country(k.name)); NAZAJ.push('izbor', () => el && show(grid())); return; }
      const t = e.target.closest('[data-t]'); if (t) { NAZAJ.buzz(); choose(t.dataset.t, t); }
    });
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  }
  function choose(id, b) {   // (the choice lights up a moment, then the screen goes to it)
    el.querySelectorAll('.on').forEach(x => x !== el && x.classList.remove('on')); b.classList.add('on');
    setTimeout(() => { if (id === o.cur) close(); else o.pick(id); }, 160);
  }
  function close() { if (!el) return; NAZAJ.drop('izbor'); const e = el; el = null; e.classList.remove('on'); setTimeout(() => e.remove(), 330); }
  return { open, close, style, facts, isOpen: () => !!el };
})();
    NAZAJ.push('izbor', () => close());
