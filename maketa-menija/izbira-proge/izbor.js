// The quick list of every track (mockup): a tap on the flag in the row opens it from the bottom. The countries as their flags, by continent
// and A to Z in each (the country shown gold); a country with one track takes you to it at once, one with more opens its tracks (their model,
// length, climb or corners, PENDING for the ones being decided, TEST for a test track). Over the flags a search (a place or a country: the
// answer is the tracks) and filters (Circuit, Open road, Rally: the game's groups; the length): with any of them on, the tracks found instead
// of the flags. Tap outside the sheet, the cross or Back to close it.
// IZBOR.open({ cur, order, all, flag, pick }): cur the track shown, order the list, all its facts by id (vse-proge.js), flag(cc) a flag's
// svg for a 30 x 20 box, pick(id) to go to a track.

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

// Progress (NAPREDEK): the best race, a medal for the best place (1, 2, 3), NEW (not driven yet), a tick (driven, no medal); on the
// quick list's flags and rows, on the Earth's pins and cards and in the screen's row (Best race). The game's records where the mockup
// runs on the game's own address (js/game.js: localStorage 'tdgp-records', tracks[id] = { bestRace, bestPos, ... }), else a sample.
window.NAPREDEK = (() => {
  const SAMPLE = { rbring: [91.452, 1], suzuka: [125.316, 2], pikes: [245.917, 1], spa: [148.73, 3], ouninpohja: [291.664, 5], nring: [451.208, 4],
    troisrivieres: [58.906, 2], medvode: [262.54, 1], bathurst: [141.882, 6] };
  let REC = null, src = 'sample';
  function load() {
    if (REC) return REC;
    try { const j = JSON.parse(localStorage.getItem('tdgp-records') || 'null'); if (j && j.tracks && typeof j.tracks === 'object' && Object.keys(j.tracks).length) { src = 'game'; return (REC = j.tracks); } } catch (e) {}
    REC = {}; for (const k in SAMPLE) REC[k] = { bestRace: SAMPLE[k][0], bestPos: SAMPLE[k][1] };
    return REC;
  }
  const num = (v) => typeof v === 'number' && isFinite(v) && v > 0 ? v : null;
  function of(id) {
    const r = load()[id] || {}, time = num(r.bestRace) || num(r.bestTime), pos = num(r.bestPos);
    if (!time && !pos) return { k: 'new' };
    return { k: pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : 'done', time, pos };
  }
  const fmt = (s) => { const m = Math.floor(s / 60); return String(m).padStart(2, '0') + ':' + (s - m * 60).toFixed(3).padStart(6, '0'); };
  const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const TICK = '<svg viewBox="0 0 16 16"><path d="M3.6 8.4l2.9 2.9 5.9-6.6" fill="none" stroke="#062a14" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const NAME = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze', done: 'Finished', new: 'New' };
  // the mark: a medal with its place, a tick or NEW (p: of(id), or a country's best)
  function mark(id, p) { p = p || of(id); return p.k === 'new' ? '<i class="pr new" title="Not driven yet">NEW</i>' : '<i class="pr ' + p.k + '" title="' + NAME[p.k] + '">' + (p.k === 'done' ? TICK : p.pos) + '</i>'; }
  // a country: its best medal, else a tick when one of its tracks is driven, else NEW
  function best(ids) { const R = ['gold', 'silver', 'bronze', 'done']; let b = null; for (const id of ids) { const p = of(id); if (p.k !== 'new' && (!b || R.indexOf(p.k) < R.indexOf(b.k))) b = p; } return b || { k: 'new' }; }
  const CSS = `
  .pr { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; box-sizing: border-box; width: 18px; height: 18px; border-radius: 50%; font: 900 11px/1 var(--f-ui, Arial);
    font-style: normal; color: #2a1b02; text-shadow: none; box-shadow: 0 1px 3px rgba(0, 0, 0, .55), inset 0 0 0 1.5px rgba(255, 255, 255, .6); vertical-align: middle; }
  .pr.gold { background: radial-gradient(circle at 35% 30%, #fff4b8, #ffc629 48%, #c48600); }
  .pr.silver { background: radial-gradient(circle at 35% 30%, #ffffff, #d3d9e2 48%, #8b96a6); color: #1c2430; }
  .pr.bronze { background: radial-gradient(circle at 35% 30%, #ffdcb8, #d98b47 48%, #8d4c1a); color: #2a1404; }
  .pr.done { background: radial-gradient(circle at 35% 30%, #cbffdc, #45d27e 50%, #1b8a46); }
  .pr.done svg { width: 12px; height: 12px; display: block; }
  .pr.new { width: auto; height: 16px; padding: 0 5px; border-radius: 4px; background: linear-gradient(180deg, #7fe8ff, #2fa8e6); color: #03202d; font: 900 italic 10px/1 var(--f-ui, Arial); letter-spacing: .4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .55); }
  `;
  if (!document.getElementById('pr-css')) { const st = document.createElement('style'); st.id = 'pr-css'; st.textContent = CSS; document.head.appendChild(st); }
  return { of, fmt, ord, mark, best, src: () => (load(), src) };
})();

window.IZBOR = (() => {
  const CSS = `
  .izb { position: absolute; inset: 0; z-index: 40; font-family: var(--f-ui); }
  .izb-dim { position: absolute; inset: 0; background: rgba(4, 8, 16, .58); opacity: 0; transition: opacity .25s; }
  .izb.on .izb-dim { opacity: 1; }
  .izb-sheet { position: absolute; left: 0; right: 0; bottom: 0; max-height: 820px; display: flex; flex-direction: column; border-radius: 18px 18px 0 0;
    background: linear-gradient(180deg, #1a2742 0, #111c31 120px, #0b1424 100%); box-shadow: 0 -10px 30px rgba(0, 0, 0, .55), inset 0 1px 0 rgba(255, 255, 255, .14);
    transform: translateY(100%); transition: transform .32s cubic-bezier(.2, .8, .25, 1); }
  .izb.on .izb-sheet { transform: none; }
  body.land .izb { right: auto; bottom: auto; width: var(--pw); height: var(--ph); }   /* (lying: a panel on the right) */
  body.land .izb-sheet { left: auto; top: 0; width: 412px; max-height: none; border-radius: 18px 0 0 18px; transform: translateX(100%); box-shadow: -10px 0 30px rgba(0, 0, 0, .55), inset 1px 0 0 rgba(255, 255, 255, .14); }
  body.land .izb.on .izb-sheet { transform: none; }
  body.land .izb-grab { visibility: hidden; height: 0; margin: 0; }
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
  .izb-t .izb-mf { display: inline-block; width: 21px; height: 14px; margin-right: 7px; vertical-align: 0; border-radius: 2px; overflow: hidden; box-shadow: 0 0 0 1px rgba(255, 255, 255, .2); }
  .izb-mf svg { width: 100%; height: 100%; display: block; }
  .izb-tools { flex: 0 0 auto; display: flex; flex-direction: column; gap: 9px; padding: 0 14px 12px; }
  .izb-q { position: relative; display: flex; align-items: center; height: 42px; padding: 0 6px 0 38px; border-radius: 12px; background: rgba(255, 255, 255, .07); border: 1.5px solid rgba(255, 255, 255, .15); }
  .izb-q:focus-within { border-color: #ffc629; box-shadow: 0 0 0 3px rgba(255, 198, 41, .18); }
  .izb-q > svg { position: absolute; left: 11px; top: 10.5px; width: 18px; height: 18px; }
  .izb-q input { flex: 1 1 auto; min-width: 0; height: 100%; border: 0; outline: 0; background: none; color: #fff; font: 700 15px/1 var(--f-ui); -webkit-appearance: none; appearance: none; }
  .izb-q input::placeholder { color: rgba(214, 226, 246, .5); font-weight: 600; }
  .izb-q input::-webkit-search-cancel-button { display: none; }
  .izb-qx { flex: 0 0 auto; width: 30px; height: 30px; border-radius: 50%; border: 0; padding: 0; background: rgba(255, 255, 255, .12); display: none; align-items: center; justify-content: center; cursor: pointer; }
  .izb-qx svg { width: 14px; height: 14px; }
  .izb-q.has .izb-qx { display: flex; }
  .izb-chips { display: flex; gap: 6px; }
  .izb-chips button { flex: 1 1 auto; height: 30px; padding: 0 4px; border-radius: 15px; border: 1.5px solid rgba(255, 255, 255, .18); background: rgba(255, 255, 255, .05); color: #dfe8f6;
    font: 800 italic 12px/1 var(--f-ui); white-space: nowrap; cursor: pointer; }
  .izb-chips button.on { background: linear-gradient(180deg, #ffe07a, #ffc629 55%, #f0ad0c); border-color: #fff0b0; color: #1b1404; box-shadow: 0 0 8px rgba(255, 198, 41, .35); }
  .izb-chips i { flex: 0 0 1.5px; margin: 5px 2px; border-radius: 1px; background: rgba(255, 255, 255, .2); }
  .izb-ct { display: flex; align-items: center; gap: 8px; margin: 16px 0 10px; font: 800 italic 12.5px/1 var(--f-ui); letter-spacing: 1.2px; color: var(--lbl, #9fb3d6); text-transform: uppercase; }
  .izb-ct:first-child { margin-top: 4px; }
  .izb-ct small { font: 700 11px/1 var(--f-ui); letter-spacing: 0; color: rgba(159, 179, 214, .65); }
  .izb-ct::after { content: ''; flex: 1 1 auto; height: 1px; background: rgba(255, 255, 255, .1); }
  .izb-sub { margin: 4px 0 10px; font: 800 italic 12.5px/1 var(--f-ui); letter-spacing: 1.2px; color: var(--lbl, #9fb3d6); text-transform: uppercase; }
  .izb-none { margin: 30px 0; text-align: center; font: 700 italic 15px/1.4 var(--f-ui); color: var(--lbl, #9fb3d6); }
  .izb-body.in { animation: izbIn .22s ease-out; }
  @keyframes izbIn { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: none; } }
  .izb-im { position: relative; flex: 0 0 auto; display: block; }
  .izb-im img { display: block; }
  .izb-im .pr { position: absolute; left: -6px; top: -6px; }
  .izb-im .pr.new { left: -5px; top: -5px; }
  .izb-t .bt { display: flex; align-items: center; gap: 6px; font: 800 italic 12.5px/1 var(--f-ui); color: #ffc629; }
  .izb-t .bt small { font: 700 11px/1 var(--f-ui); color: var(--lbl, #9fb3d6); }
  .izb-c .izb-pm { position: absolute; left: 4px; bottom: 4px; z-index: 1; display: flex; }
  .izb-best { display: flex; align-items: center; gap: 9px; flex: 0 0 auto; height: 40px; padding: 0 12px; border-radius: 12px; background: rgba(255, 198, 41, .08); border: 1.5px solid rgba(255, 198, 41, .28); }
  .izb-best .pr { width: 22px; height: 22px; font-size: 12.5px; }
  .izb-best .pr.new { width: auto; height: 18px; font-size: 11px; }
  .izb-best small { font: 800 10.5px/1 var(--f-ui); letter-spacing: 1.1px; text-transform: uppercase; color: var(--lbl, #9fb3d6); }
  .izb-best b { margin-left: auto; font: 900 italic 18px/1 var(--f-ui); color: #ffc629; }
  .izb-best b span { margin-left: 8px; font: 700 12px/1 var(--f-ui); color: #dfe8f6; }
  .izb-best.new { background: rgba(63, 192, 255, .08); border-color: rgba(111, 227, 255, .3); }
  .izb-best.new b { color: #bfefff; font-size: 14px; }
  .izb-tc { display: flex; flex-direction: column; gap: 12px; }
  .izb-tcr { display: flex; gap: 12px; }
  .izb-shape { flex: 0 0 156px; height: 136px; border-radius: 12px; background: radial-gradient(130% 110% at 30% 15%, #2b3b55, #121a28 75%); border: 1.5px solid rgba(255, 255, 255, .12); overflow: hidden; }
  .izb-shape svg { display: block; width: 100%; height: 100%; }
  .izb-shape path { fill: none; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
  .izb-shape .o { stroke: rgba(0, 0, 0, .6); stroke-width: 7px; }
  .izb-shape .r { stroke: #f4f7fc; stroke-width: 3px; }
  .izb-shape circle { stroke: #10151f; stroke-width: 2px; vector-effect: non-scaling-stroke; }
  .izb-shape .s { fill: #ffc629; }
  .izb-shape .f { fill: #fff; }
  .izb-facts { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 11px; }
  .izb-facts div { display: flex; flex-direction: column; gap: 4px; }
  .izb-facts b { font: 900 italic 21px/1 var(--f-ui); color: #fff; white-space: nowrap; }
  .izb-facts small { font: 800 10.5px/1 var(--f-ui); letter-spacing: 1.1px; text-transform: uppercase; color: var(--lbl, #9fb3d6); }
  .izb-hg { position: relative; flex: 0 0 auto; height: 76px; border-radius: 12px; background: rgba(255, 255, 255, .05); border: 1.5px solid rgba(255, 255, 255, .1); }
  .izb-hg svg { position: absolute; left: 10px; top: 22px; width: calc(100% - 20px); height: 34px; overflow: visible; }
  .izb-hg .a { fill: rgba(255, 198, 41, .16); }
  .izb-hg .l { fill: none; stroke: #ffc629; stroke-width: 2px; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .izb-hg span { position: absolute; font: 700 10.5px/1 var(--f-ui); color: var(--lbl, #9fb3d6); }
  .izb-hg .ttl { left: 10px; top: 7px; font-weight: 800; letter-spacing: 1.1px; text-transform: uppercase; }
  .izb-hg .top { right: 10px; top: 6px; color: #fff; font: 800 italic 12px/1 var(--f-ui); }
  .izb-hg .k0 { left: 10px; bottom: 6px; }
  .izb-hg .k1 { right: 10px; bottom: 6px; }
  .izb-btns { flex: 0 0 auto; display: flex; gap: 10px; padding-bottom: 5px; }
  .izb-btns button { height: 52px; border-radius: 13px; color: #fff; cursor: pointer; }
  .izb-btns button:active { transform: translateY(2px); }
  .izb-sel { flex: 0 0 36%; border: 1.5px solid rgba(255, 255, 255, .35); background: linear-gradient(180deg, #666d7b, #3b414d); font: 900 italic 17px/1 var(--f-ui); }
  .izb-race { flex: 1 1 auto; border: 1px solid rgba(255, 140, 120, .55); background: linear-gradient(180deg, var(--curb-hi, #ff5145), #e0231f 55%, var(--curb-lo, #c9191a));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .35), 0 4px 0 var(--curb-sh, #7d0f0f); font: 900 italic 24px/1 var(--f-ui); text-shadow: 0 2px 0 rgba(120, 0, 0, .45); }
  `;
  const X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>';
  const BACK = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const GO = '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const LOUPE = '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#c9d6ec" stroke-width="2.6"/><path d="M15.5 15.5l5 5" stroke="#c9d6ec" stroke-width="2.8" stroke-linecap="round"/></svg>';
  // the filters (kept while the page lives): the game's groups (js/menu.js: test, rally or descent, open road, circuit) and the length
  const F = { q: '', type: new Set(), len: new Set() };
  const TYPES = [['circuit', 'Circuit'], ['road', 'Open road'], ['rally', 'Rally']], LENS = [['s', '< 3 km', 0, 3], ['m', '3–6 km', 3, 6.0001], ['l', '> 6 km', 6.0001, 1e9]];
  const groupOf = (t) => t.group || (t.test ? 'test' : t.open ? 'road' : 'circuit');
  const NAMES = { circuit: 'Circuit', road: 'Open road', rally: 'Rally' };
  const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const on = () => !!(F.q.trim() || F.type.size || F.len.size);
  function match(t) {
    const hay = norm(t.name + ' ' + t.country);
    return norm(F.q).split(/\s+/).filter(Boolean).every(w => hay.includes(w)) && (!F.type.size || F.type.has(groupOf(t))) &&
      (!F.len.size || LENS.some(L => F.len.has(L[0]) && t.km >= L[2] && t.km < L[3]));
  }
  // the continents (the grid's sections): the game's countries by name, a new one by where its tracks are
  const CONT = ['Europe', 'North America', 'South America', 'Africa', 'Asia', 'Oceania'];
  const IN = { Austria: 0, Belgium: 0, England: 0, Finland: 0, Germany: 0, Italy: 0, Romania: 0, Russia: 0, Slovenia: 0, Canada: 1, USA: 1, Brazil: 2, Chile: 2,
    Morocco: 3, 'South Africa': 3, China: 4, Japan: 4, Thailand: 4, Australia: 5 };
  const contOf = (c) => IN[c.name] != null ? IN[c.name] : c.lon < -30 ? (c.lat > 12 ? 1 : 2) : c.lon > 110 && c.lat < -10 ? 5 : c.lat < 35 && c.lon > -20 && c.lon < 52 ? 3 : c.lon > 60 ? 4 : 0;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let el = null, o = null, view = null, prevs = [];   // (view: what the sheet shows; prevs: the views under it, Back returns to them)
  const flag = (cc) => '<svg viewBox="0 0 30 20" preserveAspectRatio="none">' + o.flag(cc) + '</svg>';
  // the countries A to Z, each with its tracks in the list's order and where they are (their middle)
  function countries() {
    const by = new Map();
    for (const id of o.order) { const t = o.all[id]; if (!by.has(t.country)) by.set(t.country, { name: t.country, flag: t.flag, ids: [], lat: 0, lon: 0 }); const c = by.get(t.country); c.ids.push(id); c.lat += (t.lat || 0) / 1; c.lon += (t.lon || 0) / 1; }
    for (const c of by.values()) { c.lat /= c.ids.length; c.lon /= c.ids.length; }
    return [...by.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
  const facts = (t) => {
    const third = t.alt ? (t.alt[1] < t.alt[0] ? '−' : '+') + Math.round(Math.abs(t.alt[1] - t.alt[0])).toLocaleString('en-US') + ' m' : t.corners ? t.corners + ' corners' : '';
    return t.km.toFixed(2) + ' km' + (third ? ' · ' + third : '') + ' · ' + (NAMES[groupOf(t)] || (t.open ? 'Open road' : 'Circuit'));
  };
  // a track's row (its model, name, facts, tag); wf: its country's flag before the name (the search's answers)
  function row(id, wf) { return trow(id, o, 'data-t', id === o.cur, wf); }
  // (oo: the opener's options; on: lit; wf: its country's flag before the name; the progress: a mark on the model, the best race under the facts)
  function trow(id, oo, attr, on, wf) {
    const t = oo.all[id], tag = t.test ? '<em>TEST</em>' : t.pending ? '<em class="p">PENDING</em>' : '', P = window.NAPREDEK, p = P ? P.of(id) : null;
    const fl = '<svg viewBox="0 0 30 20" preserveAspectRatio="none">' + oo.flag(t.flag) + '</svg>';
    return '<button class="izb-t' + (on ? ' on' : '') + '" ' + attr + '="' + id + '"><span class="izb-im"><img src="assets/tracks/' + id + '.webp" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' + (p ? P.mark(id, p) : '') + '</span><span class="tx"><b>' +
      (wf ? '<span class="izb-mf">' + fl + '</span>' : '') + esc(t.name) + '</b><small>' + facts(t) + '</small>' + (p && p.time ? '<span class="bt">' + P.fmt(p.time) + (p.pos ? '<small>' + P.ord(p.pos) + '</small>' : '') + '</span>' : '') + tag + '</span><span class="izb-go">' + GO + '</span></button>';
  }
  // a track's card (a tap on its row here, or on its pin or row on the Earth): its shape from above (the game's road, simplified:
  // vse-proge.js shape; the start gold, an open road's finish white), its heights (as the screen's graph: js/routes.js or MENU.profs),
  // Select (the screen goes to it) and Race! (in the game the race starts)
  function trackCard(id, oo) {
    const t = oo.all[id], S = t.shape || [], n = S.length;
    let w = 1, h = 1, d = '';
    for (let i = 0; i < n; i += 2) { w = Math.max(w, S[i]); h = Math.max(h, S[i + 1]); d += (i ? 'L' : 'M') + S[i] + ' ' + S[i + 1]; }
    if (d && !t.open) d += 'Z';
    const dot = (i, c) => n ? '<circle class="' + c + '" cx="' + S[i] + '" cy="' + S[i + 1] + '" r="7"/>' : '';
    const shape = '<div class="izb-shape"><svg viewBox="-16 -16 ' + (w + 32) + ' ' + (h + 32) + '"><path class="o" d="' + d + '"/><path class="r" d="' + d + '"/>' +
      (t.open ? dot(n - 2, 'f') : '') + dot(0, 's') + '</svg></div>';
    const third = t.alt ? [(t.alt[1] < t.alt[0] ? '−' : '+') + Math.round(Math.abs(t.alt[1] - t.alt[0])).toLocaleString('en-US') + ' m', 'Climb'] : t.corners ? [t.corners, 'Corners'] : null;
    const fact = (v, k) => '<div><b>' + v + '</b><small>' + k + '</small></div>';
    const facts = '<div class="izb-facts">' + fact(t.km.toFixed(2) + ' km', 'Length') + (third ? fact(third[0], third[1]) : '') + fact(NAMES[groupOf(t)] || 'Circuit', 'Type') + '</div>';
    const P = t.profs ? t.profs.prof : window.ROUTES && window.ROUTES[id] ? window.ROUTES[id].prof : null;
    let hg = '';
    if (P && P.length > 1) {
      let lo = Infinity, hi = -Infinity; for (const v of P) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      const span = hi - lo, m = P.length - 1, y = (v) => span < 1 ? 50 : 96 - (v - lo) / span * 88;
      const pts = P.map((v, i) => (i * 300 / m).toFixed(1) + ' ' + y(v).toFixed(1)).join('L');
      hg = '<div class="izb-hg"><span class="ttl">Height</span>' + (t.top != null ? '<span class="top">▲ ' + t.top.toLocaleString('en-US') + ' m</span>' : '') +
        '<svg viewBox="0 0 300 100" preserveAspectRatio="none"><path class="a" d="M0 100L' + pts + 'L300 100Z"/><path class="l" d="M' + pts + '"/></svg>' +
        '<span class="k0">0</span><span class="k1">' + t.km.toFixed(1) + ' km</span></div>';
    }
    const p = window.NAPREDEK ? NAPREDEK.of(id) : null;
    const pr = !p ? '' : p.k === 'new' ? '<div class="izb-best new">' + NAPREDEK.mark(id, p) + '<small>Best race</small><b>Not driven yet</b></div>'
      : '<div class="izb-best">' + NAPREDEK.mark(id, p) + '<small>Best race</small><b>' + (p.time ? NAPREDEK.fmt(p.time) : '—') + (p.pos ? '<span>' + NAPREDEK.ord(p.pos) + ' place</span>' : '') + '</b></div>';
    return '<div class="izb-body in izb-tc"><div class="izb-tcr">' + shape + facts + '</div>' + pr + hg +
      '<div class="izb-btns"><button class="izb-sel" data-sel="' + id + '">Select</button><button class="izb-race" data-race="' + id + '">Race!</button></div></div>';
  }
  function cardView(id) {
    const t = o.all[id];
    return head(t.name, t.country, '<button class="izb-btn" data-back aria-label="Back">' + BACK + '</button><span class="izb-hf">' + flag(t.flag) + '</span>') + trackCard(id, o);
  }
  function head(title, sub, left) {
    return '<div class="izb-head">' + (left || '') + '<div class="t"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div><button class="izb-btn" data-x aria-label="Close">' + X + '</button></div>';
  }
  function grid() {
    const C = countries(), n = o.order.length;
    return head('Choose a country', C.length + ' countries · ' + n + ' tracks') +
      '<div class="izb-tools"><label class="izb-q' + (F.q ? ' has' : '') + '">' + LOUPE + '<input type="search" placeholder="Search a place or a country" value="' + esc(F.q) + '" autocomplete="off" enterkeyhint="search" aria-label="Search">' +
      '<button class="izb-qx" data-qx aria-label="Clear">' + X + '</button></label><div class="izb-chips">' +
      TYPES.map(([k, s]) => '<button class="' + (F.type.has(k) ? 'on' : '') + '" data-f="' + k + '">' + s + '</button>').join('') + '<i></i>' +
      LENS.map(([k, s]) => '<button class="' + (F.len.has(k) ? 'on' : '') + '" data-l="' + k + '">' + s + '</button>').join('') + '</div></div>' +
      '<div class="izb-body in">' + gridBody() + '</div>';
  }
  // the flags by continent, or (a search or a filter on) the tracks found
  function gridBody() {
    if (on()) {
      const ids = o.order.filter(id => match(o.all[id]));
      return ids.length ? '<div class="izb-sub">' + ids.length + (ids.length === 1 ? ' track' : ' tracks') + '</div><div class="izb-list">' + ids.map(id => row(id, true)).join('') + '</div>'
        : '<p class="izb-none">No track found.<br>Try another place or filter.</p>';
    }
    const C = countries(), curC = o.all[o.cur].country, by = CONT.map(() => []);
    for (const c of C) by[contOf(c)].push(c);
    return by.map((cs, k) => !cs.length ? '' : '<div class="izb-ct">' + CONT[k] + '<small>' + cs.reduce((a, c) => a + c.ids.length, 0) + '</small></div><div class="izb-grid">' + cs.map(c => {
      const one = c.ids.length === 1, t = o.all[c.ids[0]];
      return '<button class="izb-c' + (c.name === curC ? ' on' : '') + '" data-c="' + esc(c.name) + '" aria-label="' + esc(c.name) + '"><span class="f">' + flag(c.flag) + (one ? '' : '<span class="n">' + c.ids.length + '</span>') +
        (window.NAPREDEK ? '<span class="izb-pm">' + NAPREDEK.mark(null, NAPREDEK.best(c.ids)) + '</span>' : '') + '</span>' +
        '<b>' + esc(c.name) + '</b><small>' + esc(one ? t.name : c.ids.length + ' tracks') + '</small></button>';
    }).join('') + '</div>').join('');
  }
  function refresh() {   // (the sheet keeps its height while the answers change: it does not jump under the finger)
    const sh = el.querySelector('.izb-sheet'), b = el.querySelector('.izb-body'); if (!sh.style.height) sh.style.height = sh.offsetHeight + 'px';
    b.classList.remove('in'); b.innerHTML = gridBody(); b.scrollTop = 0;
  }
  function country(name) {
    const c = countries().find(k => k.name === name);
    return head(c.name, c.ids.length + ' tracks', '<button class="izb-btn" data-back aria-label="All countries">' + BACK + '</button><span class="izb-hf">' + flag(c.flag) + '</span>') +
      '<div class="izb-body in"><div class="izb-list">' + c.ids.map(id => row(id)).join('') + '</div></div>';
  }
  function style() { if (!document.getElementById('izb-css')) { const st = document.createElement('style'); st.id = 'izb-css'; st.textContent = CSS; document.head.appendChild(st); } }   // (the Earth's card uses it too)
  function show(html) { const sh = el.querySelector('.izb-sheet'); sh.style.height = ''; sh.innerHTML = '<i class="izb-grab"></i>' + html; }
  function go2(f) { view = f; show(f()); }
  function toView(f) { prevs.push(view); go2(f); NAZAJ.push('izbor', () => el && go2(prevs.pop() || grid)); }   // (a layer: Back returns to the view under it)
  const toCard = (id) => toView(() => cardView(id));
  function open(opts) {
    o = opts;
    style();
    if (el) el.remove();
    el = document.createElement('div'); el.className = 'izb'; el.innerHTML = '<div class="izb-dim"></div><div class="izb-sheet" role="dialog" aria-label="Choose a track"></div>';
    document.body.appendChild(el); prevs = []; go2(grid);
    NAZAJ.push('izbor', () => close());
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-x]') || e.target.classList.contains('izb-dim')) return close();
      if (e.target.closest('[data-back]')) { NAZAJ.drop('izbor', 1); return go2(prevs.pop() || grid); }
      const f = e.target.closest('[data-f], [data-l]');
      if (f) { const S = f.dataset.f ? F.type : F.len, k = f.dataset.f || f.dataset.l; if (S.has(k)) S.delete(k); else S.add(k); f.classList.toggle('on', S.has(k)); return refresh(); }
      if (e.target.closest('[data-qx]')) { e.preventDefault(); const i = el.querySelector('.izb-q input'); i.value = F.q = ''; i.parentNode.classList.remove('has'); refresh(); return; }
      const c = e.target.closest('[data-c]');
      if (c) { NAZAJ.buzz(); const k = countries().find(x => x.name === c.dataset.c); if (k.ids.length === 1) return toCard(k.ids[0]); return toView(() => country(k.name)); }
      const t = e.target.closest('[data-t]'); if (t) { NAZAJ.buzz(); return toCard(t.dataset.t); }
      const sl = e.target.closest('[data-sel]'); if (sl) return choose(sl.dataset.sel, sl);
      const r = e.target.closest('[data-race]'); if (r) { NAZAJ.buzz(); r.classList.add('on'); setTimeout(() => (o.race || o.pick)(r.dataset.race), 160); }
    });
    el.addEventListener('input', (e) => { if (!e.target.matches('.izb-q input')) return; F.q = e.target.value; e.target.parentNode.classList.toggle('has', !!F.q); refresh(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.izb-q input')) e.target.blur(); });   // (Search on the keyboard: the keyboard goes, the answers stay)
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  }
  function choose(id, b) {   // (the choice lights up a moment, then the screen goes to it)
    el.querySelectorAll('.on').forEach(x => x !== el && x.classList.remove('on')); b.classList.add('on');
    setTimeout(() => { if (id === o.cur) close(); else o.pick(id); }, 160);
  }
  function close() { if (!el) return; NAZAJ.drop('izbor'); const e = el; el = null; e.classList.remove('on'); setTimeout(() => e.remove(), 330); }
  return { open, close, style, facts, trackCard, trow, isOpen: () => !!el };
})();
