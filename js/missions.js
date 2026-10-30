/* Real Roads Atlas — the special missions (Posebne misije): the list of the missions, the run of one (its intro card, the clock, the
   panel of its gauges at the top, the hint at the bottom, the end: done or failed, and why), the result (the time, the stars, the best),
   the records (localStorage rra-misije). Each mission is a def given to Missions.add (the missions themselves in js/missions/<nn>.js, or
   here for the practice one); the game (js/game.js) only calls it at a few places: Missions.init (its bridge), opts and begin in newRace,
   step in stepRace, over in the racing phase, stop in toTitle. Loadable without a browser too (tests/missions.test.js): the run's logic
   has no DOM, the screens are drawn only where there is a document.
   A mission's def:
     id ('06'), title, story, goal, hint: the texts (Slovenian, English in js/lang.js through tr());
     track: the track's id; car: the vehicle's id (else the player's own); test: true for the practice one (last in the list);
     limit: the seconds to do it in (none: the clock runs up); stars: [the time for 3 stars, for 2] (else 3 for a mission done);
     opts: what the race is made with (Core.Race's options over the game's own: alone, no laps, the traffic ...), a function of the def;
     rows: the gauges of the panel [{ k, label, bar: true (a bar under it), col }], set with run.set(k, text, frac, col);
     made(race): its own cars on the race before it is drawn; begin(run), step(run, dt): the mission's own logic (run.add(obj): a THREE
     object of its own in the scene while the run lasts); run.win(), run.fail(why) end it; the player over the finish line is a win
     unless the mission's finish(run) says otherwise. */
const Missions = (function () {
  'use strict';
  const tr = (s, ...a) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s, ...a) : s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const DEFS = [];
  const KEY = 'rra-misije';
  let G = null, cur = null, run = null, el = null;   // (G: the game's bridge; cur: the mission chosen, kept over a restart; run: the one being driven)

  function add(def) {
    const d = Object.assign({ test: false, limit: 0, stars: null, rows: [], hint: '', opts: null, begin: null, step: null, finish: null }, def);
    const i = DEFS.findIndex(x => x.id === d.id); if (i >= 0) DEFS[i] = d; else DEFS.push(d);
    DEFS.sort((a, b) => (a.test - b.test) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));   // (by number, the practice one last)
    return d;
  }
  const numOf = (d) => String(d.id).toUpperCase();   // (what the screens say: MISIJA 06, MISIJA VAJA)
  const byId = (id) => DEFS.find(d => d.id === String(id)) || null;
  // the track's name as the game shows it ("Kraj, Država"; the English page: def.en.name)
  function placeOf(d) {
    const T = typeof Core !== 'undefined' && Core.TRACKS ? Core.TRACKS.find(t => t.id === d.track) : null;
    return T ? (typeof Lang !== 'undefined' && Lang.of ? Lang.of(T, 'name') : T.name) || T.name : d.track;
  }

  /* ---------------- the records: per mission the most stars and the best time of a mission done ---------------- */
  const mem = { data: null };
  function recs() {
    if (mem.data) return mem.data;
    try { mem.data = JSON.parse((typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) || '{}') || {}; } catch (e) { mem.data = {}; }
    return mem.data;
  }
  const recOf = (id) => recs()[id] || { stars: 0, best: 0, runs: 0 };
  function recSave(id, r) {
    const all = recs(), o = Object.assign({ stars: 0, best: 0, runs: 0 }, all[id]);
    o.runs++;
    const pb = r.ok && (!o.best || r.time < o.best);
    if (r.ok) { o.stars = Math.max(o.stars, r.stars); if (pb) o.best = r.time; }
    all[id] = o;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* (a private window: kept for the visit) */ }
    return { pb, rec: o };
  }

  /* ---------------- the run of a mission (no DOM: the tests drive it with a race of their own) ---------------- */
  function Run(def, race) {
    this.def = def; this.race = race; this.P = race && race.player;
    this.t = 0; this.end = null; this.why = ''; this.stars = 0; this.vals = {}; this.hint = def.hint; this.res = null;
  }
  Run.prototype = {
    get left() { return this.def.limit > 0 ? Math.max(0, this.def.limit - this.t) : null; },
    set(k, text, frac, col) { this.vals[k] = { text: text == null ? '' : String(text), frac: frac == null ? null : Math.max(0, Math.min(1, frac)), col: col || null }; },
    say(text) { this.hint = text; },
    // a thing of the mission's own in the world (a THREE object: a building, a vehicle standing there): in the scene while the run lasts
    add(o) { (this.props || (this.props = [])).push(o); if (typeof Render !== 'undefined' && Render.scene) Render.scene.add(o); return o; },
    win() { if (this.end) return; this.end = 'win'; this.stars = starsOf(this.def, this.t); },
    fail(why) { if (this.end) return; this.end = 'fail'; this.why = why || ''; this.stars = 0; },
    // a step of the race (only while it is on: the clock runs from the start of the race)
    step(dt) {
      if (this.end) return;
      this.t += dt;
      const d = this.def;
      if (d.step) d.step(this, dt);
      if (!this.end && this.P && this.P.finished) { if (d.finish) d.finish(this); else this.win(); }
      if (!this.end && d.limit > 0 && this.t >= d.limit) this.fail(tr('Zmanjkalo je časa.'));
    },
  };
  function starsOf(def, t) {
    if (!def.stars) return 3;
    return t <= def.stars[0] ? 3 : t <= def.stars[1] ? 2 : 1;
  }

  /* ---------------- the game's hooks ---------------- */
  function init(bridge) { G = bridge; if (typeof document !== 'undefined') quick(); }
  // a mission from its id: the track loaded, the race made (newRace asks opts, then begin)
  function start(id) {
    const d = byId(id); if (!d || !G) return false;
    cur = d; closeList(); G.start(d.track);
    return true;
  }
  // the race's options over the game's own (newRace): alone, one run, dry, no lights' flying start ...; the mission's vehicle
  function opts() {
    if (!cur) return null;
    const o = Object.assign({ numAI: 0, laps: 1, tt: true, flying: 0, rain: 0, weather: null, fuel: false, flags: false, chars: false, slip: false, faults: false, radio: false, traffic: false, police: false, tyreRule: undefined, tyreAll: undefined, wheelRule: undefined }, cur.opts ? cur.opts(cur) : null);
    if (cur.car && typeof Core !== 'undefined') { const M = Core.MODELS.find(m => m.id === cur.car); if (M) o.playerModel = M; }
    return o;
  }
  // the run's own things out of the scene, their geometry and paint freed
  function unprops() {
    if (!run || !run.props) return;
    for (const o of run.props) { if (o.parent) o.parent.remove(o); o.traverse((m) => { if (m.geometry) m.geometry.dispose(); for (const x of [].concat(m.material || [])) { if (x.map) x.map.dispose(); x.dispose(); } }); }
    run.props = null;
  }
  // the race is made, not drawn yet: the mission's own cars (made(race), e.g. the escort)
  function made(race) { if (cur && cur.made && race) cur.made(race); }
  // the race is made: the mission's run on it
  function begin(race) {
    unprops();
    if (!cur || !race) { run = null; hud(false); return; }
    run = new Run(cur, race);
    if (cur.begin) cur.begin(run);
    hud(true); intro(true);
  }
  // every step of the race
  function step(dt) {
    if (!run || !G) return;
    const ph = G.phase;
    if (ph === 'racing') { if (intro.on) intro(false); run.step(dt); }
    draw();
  }
  // the racing phase asks: is the mission over (done or failed)? The game then stops the race; the result is shown here
  function over() {
    if (!run || !run.end || run.res) return !!(run && run.res);
    run.res = Object.assign({ ok: run.end === 'win', time: run.t, stars: run.stars, why: run.why }, recSave(run.def.id, { ok: run.end === 'win', time: run.t, stars: run.stars }));
    if (G && G.msg) G.msg(run.end === 'win' ? tr('MISIJA OPRAVLJENA!') : tr('MISIJA NEUSPELA'), run.end === 'win' ? 'fast' : 'slow', 2.5);
    if (typeof setTimeout !== 'undefined') setTimeout(() => { if (run && run.res) result(); }, 1600);
    return true;
  }
  // back to the title (or another race than the mission's): no mission
  function stop() { unprops(); cur = null; run = null; hud(false); closeResult(); closeList(); }
  const on = () => !!cur;

  /* ---------------- the screens (a document only; their look in css/missions.css) ---------------- */
  // the panel in the HUD: the mission's card (left, under the speed), the clock (top middle, for the game's own), the gauges (right, under
  // the map), the hint (bottom)
  function hud(show) {
    if (typeof document === 'undefined') return;
    const H = document.getElementById('hud'); if (!H) return;
    H.classList.toggle('mis', !!show);
    if (!show) { if (el) { el.remove(); el = null; } return; }
    if (!el) { el = document.createElement('div'); el.id = 'mis'; H.appendChild(el); }
    const d = run.def;
    el.innerHTML = '<div class="mis-card"><small><b>' + esc(tr('MISIJA {0}', numOf(d))) + '</b> ' + esc(placeOf(d)) + '</small><h2>' + esc(tr(d.title)) + '</h2><p>' + esc(tr(d.goal)) + '</p></div>' +
      '<div class="mis-clock">--:--</div>' +
      '<div class="mis-rows">' + d.rows.map(r => '<div class="mis-row" data-k="' + esc(r.k) + '"><span>' + esc(tr(r.label)) + '</span><b></b>' + (r.bar ? '<i><u' + (r.col ? ' style="background:' + r.col + '"' : '') + '></u></i>' : '') + '</div>').join('') + '</div>' +
      '<div class="mis-hint"></div><div class="mis-intro"></div>';
    draw();
  }
  function clock(t) { t = Math.max(0, t); const m = Math.floor(t / 60), s = Math.floor(t - m * 60); return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }
  function draw() {
    if (!el || !run) return;
    const c = el.querySelector('.mis-clock'), left = run.left;
    c.textContent = clock(left != null ? Math.ceil(left - 1e-9) : run.t);
    c.classList.toggle('low', left != null && left < 30);
    for (const r of el.querySelectorAll('.mis-row')) {
      const v = run.vals[r.dataset.k]; if (!v) continue;
      r.querySelector('b').textContent = v.text;
      const u = r.querySelector('u'); if (u && v.frac != null) { u.style.width = (v.frac * 100).toFixed(1) + '%'; if (v.col) u.style.background = v.col; }
    }
    const h = el.querySelector('.mis-hint'), ht = run.hint ? tr(run.hint) : '';
    if (h.textContent !== ht) h.textContent = ht;
    h.classList.toggle('off', !ht);
  }
  // the intro card over the start (the intro and the lights): the story, the goal
  function intro(show) {
    intro.on = !!show;
    const box = el && el.querySelector('.mis-intro'); if (!box) return;
    if (!show) { box.classList.remove('on'); return; }
    const d = run.def;
    box.innerHTML = '<small>' + esc(tr('MISIJA {0}', numOf(d))) + ' · ' + esc(placeOf(d)) + '</small><h1>' + esc(tr(d.title)) + '</h1><p>' + esc(tr(d.story)) + '</p><p class="g"><b>' + esc(tr('Cilj')) + ':</b> ' + esc(tr(d.goal)) + '</p>' +
      (d.limit > 0 ? '<p class="g"><b>' + esc(tr('Čas')) + ':</b> ' + clock(d.limit) + '</p>' : '');
    box.classList.add('on');
  }
  const STAR = (n) => '<span class="mis-st">' + [0, 1, 2].map(i => '<i class="' + (i < n ? 'on' : '') + '">★</i>').join('') + '</span>';
  // the result: done (the stars, the time, a new best) or failed (why); Ponovi, Misije, Glavni meni
  let resEl = null;
  function result() {
    if (typeof document === 'undefined' || !run || !run.res) return;
    closeResult();
    const R = run.res, d = run.def, f = G && G.fmt ? G.fmt : clock;
    resEl = document.createElement('div'); resEl.id = 'mis-res'; resEl.className = R.ok ? 'ok' : 'no';
    resEl.innerHTML = '<div class="mis-box"><small>' + esc(tr('MISIJA {0}', numOf(d))) + ' · ' + esc(placeOf(d)) + '</small><h1>' + esc(tr(d.title)) + '</h1>' +
      '<h2>' + esc(R.ok ? tr('MISIJA OPRAVLJENA!') : tr('MISIJA NEUSPELA')) + '</h2>' + (R.ok ? STAR(R.stars) : '<p class="why">' + esc(R.why) + '</p>') +
      '<dl><dt>' + esc(tr('Čas')) + '</dt><dd>' + esc(f(R.time)) + (R.pb ? ' <em>' + esc(tr('NOV REKORD!')) + '</em>' : '') + '</dd>' +
      '<dt>' + esc(tr('Najboljši')) + '</dt><dd>' + (R.rec.best ? esc(f(R.rec.best)) + ' ' + STAR(R.rec.stars) : '—') + '</dd></dl>' +
      '<div class="mis-btns"><button data-mis="again" class="pri">' + esc(tr('Ponovi')) + '</button><button data-mis="list">' + esc(tr('Misije')) + '</button><button data-mis="title">' + esc(tr('Glavni meni')) + '</button></div></div>';
    resEl.addEventListener('click', onBtn);
    document.body.appendChild(resEl);
  }
  function closeResult() { if (resEl) { resEl.remove(); resEl = null; } }
  function onBtn(e) {
    const b = e.target.closest('[data-mis]'); if (!b) return;
    e.preventDefault(); if (G && G.click) G.click();
    const a = b.dataset.mis;
    if (a === 'again') { closeResult(); if (G) G.act('restart'); }
    else if (a === 'list') { closeResult(); const k = cur; if (G) G.act('to-title'); openList(k && k.id); }
    else if (a === 'title') { closeResult(); if (G) G.act('to-title'); }
    else if (a === 'close') closeList();
    else if (a === 'go') start(b.dataset.id);
  }
  // the list of the missions: a card each (the number, the name, the track, the goal, the stars won); a tap starts it
  let listEl = null;
  function openList(focus) {
    if (typeof document === 'undefined') return;
    closeList();
    listEl = document.createElement('div'); listEl.id = 'mis-list';
    const card = (d) => { const r = recOf(d.id); return '<button class="mis-c' + (d.test ? ' test' : '') + '" data-mis="go" data-id="' + esc(d.id) + '"><span class="n">' + esc(d.id) + '</span><span class="tx"><b>' + esc(tr(d.title)) + '</b><small>' + esc(placeOf(d)) + (d.limit > 0 ? ' · ' + clock(d.limit) : '') + '</small><small class="g">' + esc(tr(d.goal)) + '</small></span>' + (r.stars ? STAR(r.stars) : '<em>' + esc(tr('NOVA')) + '</em>') + '</button>'; };
    const real = DEFS.filter(d => !d.test), test = DEFS.filter(d => d.test);
    listEl.innerHTML = '<div class="mis-lb"><div class="mis-hd"><h1>' + esc(tr('Posebne misije')) + '</h1><button data-mis="close" aria-label="' + esc(tr('Zapri')) + '">✕</button></div>' +
      (real.length ? real.map(card).join('') : '<p class="mis-none">' + esc(tr('Misije so v izdelavi.')) + '</p>') +
      (test.length ? '<h3>' + esc(tr('Za izbris · samo za testiranje')) + '</h3>' + test.map(card).join('') : '') + '</div>';
    listEl.addEventListener('click', onBtn);
    document.body.appendChild(listEl);
    if (focus) { const c = listEl.querySelector('[data-id="' + focus + '"]'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' }); }
  }
  function closeList() { if (listEl) { listEl.remove(); listEl = null; } }
  // the quick entry: index.html?misija=<id> starts that mission straight away (the tests, a link to try one on the phone)
  function quick() {
    const id = new URLSearchParams(location.search).get('misija'); if (id == null) return;
    const d = byId(id.trim().toLowerCase().padStart(2, '0')) || byId(id.trim().toLowerCase());
    if (!d) { if (G.toast) G.toast(tr('Hitri vstop: neveljavno {0}.', 'misija=' + id), 4000); return; }
    start(d.id);
  }

  /* ---------------- the practice mission (the system's own test; last in the list, under Za izbris) ---------------- */
  add({
    id: 'vaja', test: true, title: 'Vaja: na vrh', track: 'mulholland', limit: 180, stars: [150, 165],
    story: 'Preizkus sistema misij: pripelji avto na vrh ceste, preden se izteče čas.',
    goal: 'Pripelji avto na vrh v treh minutah, ne da ga preveč poškoduješ.',
    hint: 'Vozi hitro, a pazi na avto: pri polovični škodi je misija izgubljena.',
    rows: [{ k: 'cilj', label: 'DO CILJA' }, { k: 'avto', label: 'AVTO', bar: true }],
    step(r) {
      const T = r.race.track, P = r.P, left = Math.max(0, (T.raceLen || T.len) - Math.max(0, P.dist));
      r.set('cilj', dec((left / 1000).toFixed(1)) + ' km');
      const ok = 1 - Math.min(1, (P.dmg || 0) / 0.5);
      r.set('avto', Math.round(ok * 100) + ' %', ok, ok > 0.5 ? '#3fbf6a' : ok > 0.25 ? '#ffb020' : '#e8452c');
      if (ok <= 0) r.fail(tr('Avto je preveč poškodovan.'));
    },
  });

  return { add, DEFS, byId, init, start, opts, made, begin, step, over, stop, on, openList, closeList, Run, recOf, starsOf, placeOf, clock,
    get run() { return run; }, get cur() { return cur; } };
})();
if (typeof module !== 'undefined') module.exports = Missions;
