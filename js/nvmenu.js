// NEW VERSION · TEST 1: the garages' menus on the new map (js/newmap.js). Drive onto a garage's coloured floor and its menu opens at
// the top with three choices; it shows while the car stands on the floor, a tap anywhere else closes it (until the car leaves the floor
// and comes back). Every choice says V IZDELAVI for now, except the driving school's: its three licences, each licence's ten tasks, a
// task's card with START (START says V IZDELAVI until the tasks are built). HOME's box in the pit lane says Garaža v izdelavi (the new
// garage is made apart). Loaded with the new map (js/game.js nvStart).
const NVMenu = (function () {
  'use strict';
  const tr = (s) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s) : s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hex = (a) => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (h, to, k) => { const a = rgb(h), b = rgb(to); return hex(a.map((v, i) => v + (b[i] - v) * k)); };
  const ink = (h) => { const [r, g, b] = rgb(h); return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111' : '#fff'; };
  const shades = (c) => [mix(c, '#ffffff', 0.38), c, mix(c, '#000000', 0.32)];

  // the driving school's licences and their ten tasks (the order they are driven in; the tenth is the licence's exam)
  const LIC = {
    c: { name: 'ROAD LICENCE', sub: 'asphalt · parking', col: '#8fe0ff', tasks: [
      ['Lap of the track', 'One lap of the asphalt circuit through 4 checkpoints, under 2:10. Start and finish at the gate of the practice lot.'],
      ['Start and stop', 'Drive off, 30 m, and stop inside the yellow box.'],
      ['Brake to the line', 'Speed up to 50 km/h and stop before the white line.'],
      ['Slalom', '6 cones without touching one, under 25 s.'],
      ['Figure of eight', 'Two laps of a figure of eight round two cones.'],
      ['Reverse parking', 'Back into the free bay between two cars.'],
      ['Parallel parking', 'Along the kerb, between two cars.'],
      ['Crossroads', 'Left and right at the practice crossroads, in your own lane.'],
      ['Emergency stop', 'At 80 km/h, stop before the obstacle when the sign lights up.'],
      ['Exam: road', 'Slalom, braking and parking in one run, under 1:30.']] },
    m: { name: 'GRAVEL LICENCE', sub: 'dirt roads', col: '#23c8ff', tasks: [
      ['Gravel lap', 'The whole gravel course in the field under 1:45, never on the asphalt.'],
      ['Braking on gravel', 'Stop inside the box: on gravel the car needs longer to stop.'],
      ['Gravel corner', 'Through 3 gates without leaving the road.'],
      ['Pole slalom', '6 poles without touching one.'],
      ['Gravel eight', 'Round the figure-of-eight road.'],
      ['Drift', 'Slide round the cone for at least 3 seconds.'],
      ['Small jump', 'Over the ramp, land straight on the road.'],
      ['Wiggles', 'The winding road, under the time.'],
      ['Turn on a narrow road', 'Turn the car round on the gravel road without leaving it.'],
      ['Exam: gravel', 'The whole course under the time, at most 2 poles knocked down.']] },
    k: { name: 'HILL LICENCE', sub: 'up and down', col: '#1580b0', tasks: [
      ['Hill lap', 'Up the switchbacks, round the top and down the other side, under 2:30.'],
      ['Hill start', 'Stop in the box on the slope and pull away without rolling back.'],
      ['Steady climb', 'Up to the first bend at a steady speed.'],
      ['Switchback up', 'The first switchback without leaving the road.'],
      ['Braking downhill', 'Down to the box, under 40 km/h.'],
      ['Stop at the top', 'Stop in the circle at the top of the hill.'],
      ['To the top', 'All the switchbacks up without sliding off the road.'],
      ['Reverse uphill', '20 m in reverse up the straight part.'],
      ['Switchbacks down', 'All the bends down, under the time.'],
      ['Exam: hill', 'Up and down under the time without sliding off the road.']] },
  };
  // every garage's menu: its three choices [name, the line under it] (the school's: its licences)
  const MENUS = {
    school: { title: 'Driving school', sub: '{car} · choose an exam', col: '#23c8ff', lic: ['c', 'm', 'k'] },
    car: { title: 'Car licence', sub: 'exam · reward LEV S', col: '#3fbf6a', items: [['GRAVEL', 'a lap of the gravel course'], ['LAP', 'a lap of the track under the time'], ['PARKING', 'into the bay by the garage']] },
    truck: { title: 'Truck licence', sub: 'exam · reward TITAN', col: '#ff8a2a', items: [['REVERSING', 'back the truck up to the ramp'], ['TIGHT CORNERS', 'through the cones, touch none'], ['DELIVERY', 'a container to the pier']] },
    rally: { title: 'Rally licence', sub: 'gravel exam · reward BURJA R7', col: '#d8282a', items: [['GRAVEL STAGE', 'the forest road against the clock'], ['JUMPS', 'over the crests, land straight'], ['HAIRPINS', 'the hairpins up the hill']] },
    circuit: { title: 'Circuit race', sub: '{car} · choose a race', col: '#e8452c', items: [['TUSCANY, ITALY', '8 laps · 12 cars'], ['BATHURST, AUSTRALIA', '5 laps · 10 cars'], ['STYRIA, AUSTRIA', '10 laps · 16 cars']] },
    street: { title: 'Street race', sub: '{car} · city streets at night', col: '#c86bff', items: [['MONTE CARLO, MONACO', '6 laps · 10 cars'], ['DETROIT, USA', '5 laps · 12 cars'], ['TORONTO, CANADA', '5 laps · 12 cars']] },
    cross: { title: 'Cross rally', sub: '{car} · gravel and jumps', col: '#d9a23a', items: [['HARJU, FINLAND', '4 laps · 8 cars'], ['OUNINPOHJA, FINLAND', 'one stage · against the clock'], ['SANI PASS, SOUTH AFRICA', 'one stage · against the clock']] },
    mx: { title: 'Motocross school', sub: 'learn to ride · jumps & berms', col: '#ff6a1a', items: [['FIRST RIDE', 'a slow lap of the track'], ['JUMPS', 'the small jumps, land straight'], ['BERMS', 'round the banked corners']] },
    multi: { title: 'Multiplayer', sub: 'race your friends online', col: '#2ad8b0', items: [['QUICK RACE', 'join the first free room'], ['CREATE A ROOM', 'invite your friends with a code'], ['JOIN A ROOM', 'enter a friend\'s code']] },
    police: { title: 'Police', sub: '{car} · missions', col: '#2f6bff', items: [['ESCAPE THE POLICE', 'lose the patrols in the streets'], ['CATCH THE CRIMINAL', 'you drive the patrol car'], ['WRONG WAY RACE', 'against the traffic, the police behind you']] },
    kamikaze: { title: 'Mission: Kamikaze', sub: 'the wrong way round', col: '#ff3d2a', items: [['NÜRBURG, GERMANY', 'a lap against the field'], ['SPA, BELGIUM', 'a lap against the field'], ['SUZUKA, JAPAN', 'a lap against the field']] },
    home: { title: 'Home', sub: 'your garage', col: '#ffd34d', note: 'Garaža v izdelavi' },   // (HOME's box in the pit lane: the new garage is made apart; a note for now)
    president: { title: 'Mission: President', sub: 'protect the president', col: '#4a7ae8', items: [['MEDVODE, SLOVENIA', 'escort the convoy · 6.2 km'], ['VRŠIČ, SLOVENIA', 'escort the convoy over the pass'], ['RIVIERA, FRANCE', 'escort the convoy along the coast']] },
  };

  let host = null, el = null, list = [], carName = () => '', at = null, shut = null, live = true, view = null, wipT = 0;
  const done = { c: [], m: [], k: [] };   // (tasks driven: none yet; kept here for when the tasks are built)

  function css() {
    if (document.getElementById('nvm-css')) return;
    const s = document.createElement('style'); s.id = 'nvm-css';
    s.textContent = `
#nvm { position: absolute; z-index: 7; left: 50%; top: calc(8px + var(--st, 0px)); transform: translateX(-50%); width: min(520px, calc(100% - 16px - var(--sl, 0px) - var(--sr, 0px))); max-height: calc(100% - 16px - var(--st, 0px) - var(--sb, 0px)); overflow-y: auto; box-sizing: border-box; background: rgba(9,13,20,.95); border-radius: 14px; border-top: 4px solid var(--c); padding: 9px 12px 9px; color: #fff; font-family: var(--f-ui, Roboto, sans-serif); box-shadow: 0 6px 22px rgba(0,0,0,.55); pointer-events: auto; touch-action: pan-y; -webkit-tap-highlight-color: transparent; user-select: none; }
@media (orientation: landscape) { #nvm { width: min(460px, calc(100% - 16px - var(--sl, 0px) - var(--sr, 0px))); } }
#nvm .hd { display: flex; align-items: center; gap: 10px; min-height: 38px; }
#nvm .hd b { font: 900 italic 20px/1.1 var(--f-ui, Roboto, sans-serif); text-transform: uppercase; }
#nvm .hd i { flex: 1; font: 700 11px var(--f-ui, Roboto, sans-serif); font-style: normal; letter-spacing: 1.2px; color: var(--c); text-transform: uppercase; }
#nvm .ib { flex: none; width: 38px; height: 38px; border-radius: 10px; border: 2px solid rgba(255,255,255,.35); background: rgba(255,255,255,.08); display: flex; align-items: center; justify-content: center; color: #fff; padding: 0; cursor: pointer; }
#nvm .ib svg { width: 20px; height: 20px; fill: currentColor; }
#nvm .row { position: relative; display: block; width: 100%; margin-top: 7px; padding: 9px 9px 12px; border: 0; border-radius: 10px; background: var(--t); color: var(--k); text-align: center; font: 900 italic 16px/1.15 var(--f-ui, Roboto, sans-serif); cursor: pointer; }
#nvm .row small { display: block; font: 600 11px/1.3 var(--f-ui, Roboto, sans-serif); font-style: normal; opacity: .75; margin-top: 2px; }
#nvm .row em { position: absolute; right: 10px; top: 9px; font: 900 italic 13px var(--f-ui, Roboto, sans-serif); }
#nvm .row s { position: absolute; left: 10px; right: 10px; bottom: 4px; height: 4px; border-radius: 2px; background: var(--bt); overflow: hidden; text-decoration: none; }
#nvm .row s u { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: var(--k); }
#nvm .row.tk { display: flex; align-items: center; gap: 10px; text-align: left; padding: 7px 10px 10px; margin-top: 5px; font-size: 14px; }
#nvm .row.tk .n { flex: none; width: 26px; height: 26px; border-radius: 50%; background: var(--bt); display: flex; align-items: center; justify-content: center; font: 900 13px var(--f-ui, Roboto, sans-serif); font-style: normal; }
#nvm .row.tk .tx { flex: 1; min-width: 0; }
#nvm .row.tk small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nvm .row.tk em { position: static; flex: none; }
#nvm .card { margin-top: 8px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.06); }
#nvm .card h3 { margin: 0; font: 900 italic 22px/1.15 var(--f-ui, Roboto, sans-serif); text-transform: uppercase; }
#nvm .card p { margin: 6px 0 8px; font: 500 13px/1.4 var(--f-ui, Roboto, sans-serif); color: #d4dae2; }
#nvm .card dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 12px; margin: 0; font: 700 12px var(--f-ui, Roboto, sans-serif); }
#nvm .card dt { color: #9aa3ad; } #nvm .card dd { margin: 0; color: #fff; }
#nvm .go { display: block; width: 100%; margin-top: 9px; padding: 10px; border: 0; border-radius: 10px; background: var(--c); color: var(--ck); font: 900 italic 19px var(--f-ui, Roboto, sans-serif); text-transform: uppercase; cursor: pointer; }
#nvm .note { padding: 16px 6px 8px; text-align: center; font: 900 italic 24px/1.15 var(--f-ui, Roboto, sans-serif); color: var(--c); text-transform: uppercase; }
#nvm .ft { margin-top: 8px; text-align: center; font: 600 11px var(--f-ui, Roboto, sans-serif); color: #9aa3ad; }
#nvm .wip { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(.9); padding: 9px 20px; border-radius: 22px; background: #ffd34d; color: #111; font: 900 italic 20px var(--f-ui, Roboto, sans-serif); text-transform: uppercase; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,.5); opacity: 0; pointer-events: none; transition: opacity .15s, transform .15s; }
#nvm .wip.on { opacity: 1; transform: translate(-50%, -50%) scale(1); }`;
    document.head.appendChild(s);
  }

  // the garages: their coloured floors (the ring, the way through it, its length and half width); HOME's box in the pit lane: round
  // its turntable
  function init(H3, o = {}) {
    css(); carName = o.car || carName; list = [];
    const add = (key, s) => { if (s && s.ring && s.Lg && MENUS[key]) list.push({ key, x: s.ring.x, z: s.ring.z, c: Math.cos(s.ring.hd), s: Math.sin(s.ring.hd), hl: s.Lg / 2 - 0.3, hw: s.half - 0.3 }); };
    for (const [k, s] of Object.entries(H3.st || {})) add(k, s);
    for (const [k, s] of Object.entries(H3.lic || {})) add(k, s);
    for (const b of (H3.pits || [])) if (b.tune) list.push({ key: 'home', x: b.x, z: b.z, c: 1, s: 0, r: 5 });
    host = (document.getElementById('hud') || document.body).parentElement || document.body;
    if (!init.on) { init.on = true; document.addEventListener('pointerdown', (e) => { if (el && el.style.display !== 'none' && !el.contains(e.target)) { shut = at; close(); } }, true); }
  }
  // the garage whose coloured floor the car stands on (null: none)
  function floorOf(x, z) {
    for (const g of list) {
      const dx = x - g.x, dz = z - g.z;
      if (g.r ? dx * dx + dz * dz < g.r * g.r : Math.abs(dx * g.c + dz * g.s) < g.hl && Math.abs(-dx * g.s + dz * g.c) < g.hw) return g.key;
    }
    return null;
  }
  // every frame of the race: on a floor the menu opens (once per visit: a tap elsewhere closes it until the car leaves the floor)
  function tick(P, on) {
    live = !!on; if (!list.length || !P) return;
    const k = floorOf(P.x, P.z);
    if (k !== at) { at = k; shut = null; close(); if (k) { view = { lvl: 0 }; draw(); } }
    else if (k && !el && shut !== k) { view = { lvl: 0 }; draw(); }
    if (el) el.style.display = live ? '' : 'none';
  }
  function close() { if (el) { el.remove(); el = null; } view = null; }

  const PAUSE = '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const BACK = '<svg viewBox="0 0 24 24"><path d="M15.4 4.6 8 12l7.4 7.4 1.8-1.8L11.6 12l5.6-5.6z"/></svg>';
  const pct = (n, of) => Math.round(100 * n / of);
  function row(o) {   // a coloured choice, its progress inside it (the menu of circuit race and race the rival)
    const k = ink(o.t), bt = k === '#111' ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.28)';
    return `<button class="row${o.tk ? ' tk' : ''}" data-a="${o.a}" data-i="${o.i}" style="--t:${o.t};--k:${k};--bt:${bt}">` +
      (o.tk ? `<span class="n">${o.i + 1}</span><span class="tx">${esc(o.name)}<small>${esc(o.sub)}</small></span><em>${o.p} %</em>` : `${esc(o.name)}<small>${esc(o.sub)}</small><em>${o.p} %</em>`) +
      `<s><u style="width:${o.p}%"></u></s></button>`;
  }
  function draw() {
    const M = MENUS[at]; if (!M || !view) return;
    if (!el) { el = document.createElement('div'); el.id = 'nvm'; el.addEventListener('click', onClick); host.appendChild(el); }
    const sub = (s) => s.replace('{car}', carName() || 'your car');
    let col = M.col, h = '', title = M.title, line = sub(M.sub);
    if (view.lvl === 0) {
      const T = shades(M.col);
      if (M.note) h = `<div class="note">${esc(tr(M.note))}</div>`;
      else if (M.lic) h = M.lic.map((l, i) => { const L = LIC[l], n = done[l].length; return row({ a: 'lic', i, t: L.col, name: L.name, sub: `${L.sub} · ${n} / ${L.tasks.length} tasks`, p: pct(n, L.tasks.length) }); }).join('');
      else h = M.items.map((it, i) => row({ a: 'wip', i, t: T[i], name: it[0], sub: it[1], p: 0 })).join('');
      h += `<div class="ft">${esc(M.note ? 'tap anywhere else to close' : 'tap anywhere else to close · shown while you stand on the coloured spot')}</div>`;
    } else if (view.lvl === 1) {
      const L = LIC[view.lic]; col = L.col; title = L.name; line = `${M.title} · ${done[view.lic].length} / ${L.tasks.length} tasks`;
      h = L.tasks.map((t, i) => row({ a: 'task', i, tk: true, t: L.col, name: t[0], sub: t[1], p: done[view.lic].includes(i) ? 100 : 0 })).join('');
      h += `<div class="ft">${esc('all ten tasks: the ' + L.name.toLowerCase())}</div>`;
    } else {
      const L = LIC[view.lic], t = L.tasks[view.task]; col = L.col; title = L.name; line = `task ${view.task + 1} / ${L.tasks.length}`;
      h = `<div class="card"><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p><dl><dt>Best</dt><dd>—</dd><dt>Done</dt><dd>${done[view.lic].includes(view.task) ? '✓' : 'not yet'}</dd><dt>Licence</dt><dd>${esc('all ' + L.tasks.length + ' tasks of the ' + L.name.toLowerCase())}</dd></dl></div>` +
        `<button class="go" data-a="start">${esc('Start')}</button>`;
    }
    el.style.setProperty('--c', col); el.style.setProperty('--ck', ink(col));
    el.dataset.key = at; el.dataset.lvl = view.lvl;
    el.innerHTML = `<div class="hd">${view.lvl ? `<button class="ib" data-a="back" aria-label="Back">${BACK}</button>` : ''}<b>${esc(title)}</b><i>${esc(line)}</i><button class="ib" data-a="pause" aria-label="Pause">${PAUSE}</button></div>${h}<div class="wip">${esc(tr('V izdelavi'))}</div>`;
    el.style.display = live ? '' : 'none';
  }
  function wip() { const w = el && el.querySelector('.wip'); if (!w) return; w.classList.add('on'); clearTimeout(wipT); wipT = setTimeout(() => w.classList.remove('on'), 1400); }
  function onClick(e) {
    const b = e.target.closest('[data-a]'); if (!b || !view) return;
    const a = b.dataset.a, i = +b.dataset.i;
    if (a === 'pause') { const p = document.getElementById('btn-pause'); if (p) p.click(); return; }
    if (a === 'back') { view = view.lvl === 2 ? { lvl: 1, lic: view.lic } : { lvl: 0 }; draw(); return; }
    if (a === 'lic') { view = { lvl: 1, lic: MENUS[at].lic[i] }; draw(); return; }
    if (a === 'task') { view = { lvl: 2, lic: view.lic, task: i }; draw(); return; }
    if (a === 'wip' || a === 'start') wip();
  }
  // (the tests: the garages' floors, the menu now)
  const on = () => at;   // (the garage the car stands in: js/game.js hides Na progo there)
  const state = () => ({ at, open: !!el && el.style.display !== 'none', view: view && Object.assign({}, view), n: list.length });
  const floors = () => list.map(g => ({ key: g.key, x: g.x, z: g.z, h: Math.atan2(g.s, g.c) }));
  return { init, tick, close, on, state, floors, floorOf, MENUS, LIC };
})();
