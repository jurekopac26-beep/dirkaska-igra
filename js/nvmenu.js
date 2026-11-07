// NEW VERSION · TEST 1: the garages' menus on the new map (js/newmap.js). Drive onto a garage's coloured floor and its menu opens at
// the top with three choices; it shows while the car stands on the floor, a tap anywhere else closes it (until the car leaves the floor
// and comes back). Every choice says V IZDELAVI for now, except the driving school's: its three licences, each licence's twelve tasks
// in four levels of three (a level's three tasks shown, under them the level's progress; at 50 % the next level opens), a task's card
// with START (the task driven: js/nvschool.js; START says V IZDELAVI for a task not built yet). The places are kept (localStorage
// rra-avtosola). HOME's box in the pit lane says Garaža v izdelavi (the new garage is
// made apart). Loaded with the new map (js/game.js nvStart).
const NVMenu = (function () {
  'use strict';
  const tr = (s) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s) : s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hex = (a) => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (h, to, k) => { const a = rgb(h), b = rgb(to); return hex(a.map((v, i) => v + (b[i] - v) * k)); };
  const ink = (h) => { const [r, g, b] = rgb(h); return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111' : '#fff'; };
  const shades = (c) => [mix(c, '#ffffff', 0.38), c, mix(c, '#000000', 0.32)];

  // the driving school's licences and their twelve tasks (the order they are driven in, four levels of three; the twelfth is the
  // licence's exam)
  const LIC = {
    c: { name: 'ROAD LICENCE', sub: 'asphalt · parking', col: '#8fe0ff', tasks: [
      ['Lap of the track', 'One lap of the circuit through 4 gates, from the line by the practice area, under 2:10.'],
      ['Start and stop', 'Drive off, 30 m, and stop inside the yellow box.'],
      ['Brake to the line', 'Speed up to 50 km/h and stop before the white line.'],
      ['Slalom', '6 cones without touching one, under 25 s.'],
      ['Figure of eight', 'Two laps of a figure of eight round two cones.'],
      ['Reverse parking', 'Back into the free bay between two cars.'],
      ['Parallel parking', 'Along the kerb, between two cars.'],
      ['Junction', 'Up the way to the boxes, turn right onto the road, in your own lane.'],
      ['Emergency stop', 'Up to 80 km/h on the track; when the red board lights up, stop before it.'],
      ['Roundabout', 'Once round the park\'s fountain, out to the next plaza.'],
      ['Lane change', 'At 50 km/h, change lanes between the cones and back, touch none.'],
      ['Exam: road', 'Slalom, braking and parking in one run, under 1:30.']] },
    m: { name: 'GRAVEL LICENCE', sub: 'dirt roads', col: '#23c8ff', tasks: [
      ['Gravel lap', 'The gravel road along the north, end to end, never off it.'],
      ['Braking on gravel', 'Stop inside the box: on gravel the car needs longer to stop.'],
      ['Gravel corner', 'Through 3 gates without leaving the road.'],
      ['Pole slalom', '6 poles without touching one.'],
      ['Gravel eight', 'Twice round two poles on the meadow, one each way.'],
      ['Drift', 'Slide round the cone for at least 3 seconds.'],
      ['Small jump', 'Over the ramp, land straight on the road.'],
      ['Wiggles', 'The winding road, under the time.'],
      ['Turn on a narrow road', 'Turn the car round on the gravel road without leaving it.'],
      ['Handbrake turn', 'Round the post with the handbrake, in one go.'],
      ['Forest road', 'The whole forest road under the time, without leaving it.'],
      ['Exam: gravel', 'The whole course under the time, at most 2 poles knocked down.']] },
    k: { name: 'HILL LICENCE', sub: 'up and down', col: '#1580b0', tasks: [
      ['Hill lap', 'Up the switchbacks, round the top and down the other side, under the time.'],
      ['Hill start', 'Stop in the box on the slope and pull away without rolling back.'],
      ['Steady climb', 'Up to the first bend between 20 and 45 km/h.'],
      ['Switchback up', 'The first switchback without leaving the road.'],
      ['Braking downhill', 'Down to the box, under 40 km/h.'],
      ['Stop at the top', 'Stop in the circle at the top of the hill.'],
      ['To the top', 'All the switchbacks up without sliding off the road.'],
      ['Reverse uphill', '20 m in reverse up the straight part.'],
      ['Switchbacks down', 'All the bends down, under the time.'],
      ['Snow climb', 'Up the snowy road to the top without sliding off.'],
      ['Snow descent', 'Down the snowy road, under 40 km/h.'],
      ['Exam: hill', 'Up and down under the time without sliding off the road.']] },
  };
  // every garage's menu: its choices [name, the line under it] (the school's: its licences). The licences, the races and the missions twelve, four
  // levels of three as the school's tasks (uporabnik 3. 11., ravni za vse garaže: the challenges not built yet, V izdelavi; levels 2-4 a proposal,
  // their names set when they are made); multiplayer its three
  const MENUS = {
    school: { title: 'Driving school', sub: '{car} · choose an exam', col: '#23c8ff', lic: ['c', 'm', 'k'] },
    car: { title: 'Car licence', sub: 'exam · reward LEV S', col: '#3fbf6a', items: [
      ['GRAVEL', 'a lap of the gravel course'], ['LAP', 'a lap of the track under the time'], ['PARKING', 'into the bay by the garage'],
      ['RING ROAD', 'once round the ring road under the time'], ['TUNNEL', 'through the tunnel under the hill, in your lane'], ['WET LAP', 'a lap of the track in the rain'],
      ['NIGHT LAP', 'a lap of the track at night, lights on'], ['OVER THE HILL', 'the road over the hill under the time'], ['OVERTAKING', 'pass five cars in one lap'],
      ['GLASS BRIDGE', 'over the glass bridge without a scratch'], ['THE WHOLE MAP', 'the main road from end to end'], ['EXAM: CAR', 'gravel, a lap and parking in one run']] },
    truck: { title: 'Truck licence', sub: 'exam · reward TITAN', col: '#ff8a2a', items: [
      ['REVERSING', 'back the truck up to the ramp'], ['TIGHT CORNERS', 'through the cones, touch none'], ['DELIVERY', 'a container to the pier'],
      ['HEAVY LOAD', 'a full load up the hill road'], ['SCALES', 'stop on the weighbridge, every wheel on it'], ['FARM RUN', 'hay bales to the farm'],
      ['SITE RUN', 'gravel to the construction site'], ['DOWNHILL', 'down the switchbacks loaded, under 40 km/h'], ['NIGHT DELIVERY', 'boxes to the toy shop at night'],
      ['HARBOUR', 'a container from the pier to the yard'], ['FUEL RUN', 'fuel to the rescue base'], ['EXAM: TRUCK', 'reversing, corners and a delivery in one run']] },
    rally: { title: 'Rally licence', sub: 'gravel exam · reward BURJA R7', col: '#d8282a', items: [
      ['GRAVEL STAGE', 'the forest road against the clock'], ['JUMPS', 'over the crests, land straight'], ['HAIRPINS', 'the hairpins up the hill'],
      ['PACE NOTES', 'the stage as the co-driver calls it'], ['HANDBRAKE', 'the tight bends with the handbrake'], ['NIGHT STAGE', 'the forest road in the dark'],
      ['SNOW STAGE', 'the snowy road up the hill'], ['RAIN STAGE', 'the gravel road in the rain'], ['SUPER SPECIAL', 'side by side on the motocross track'],
      ['LONG STAGE', 'the north road and the forest road in one run'], ['SERVICE', 'in and out of the service park in time'], ['EXAM: RALLY', 'the whole rally route under the time']] },
    circuit: { title: 'Circuit race', sub: '{car} · choose a race', col: '#e8452c', items: [
      ['TUSCANY, ITALY', '8 laps · 12 cars'], ['BATHURST, AUSTRALIA', '5 laps · 10 cars'], ['STYRIA, AUSTRIA', '10 laps · 16 cars'],
      ['SPA, BELGIUM', '5 laps · 16 cars'], ['SUZUKA, JAPAN', '6 laps · 14 cars'], ['MONTEREY, USA', '8 laps · 12 cars'],
      ['RIVERSIDE, USA', '6 laps · 12 cars'], ['CRYSTAL PALACE, ENGLAND', '8 laps · 10 cars'], ['LONGFORD, AUSTRALIA', '4 laps · 12 cars'],
      ['RIO DE JANEIRO, BRAZIL', '6 laps · 16 cars'], ['NÜRBURG, GERMANY', '1 lap · 20 cars'], ['THE SEASON', 'all eleven races · points']] },
    street: { title: 'Street race', sub: '{car} · city streets at night', col: '#c86bff', items: [
      ['MONTE CARLO, MONACO', '6 laps · 10 cars'], ['DETROIT, USA', '5 laps · 12 cars'], ['TORONTO, CANADA', '5 laps · 12 cars'],
      ['MARRAKESH, MOROCCO', '5 laps · 12 cars'], ['NEWCASTLE, AUSTRALIA', '5 laps · 14 cars'], ['TOWNSVILLE, AUSTRALIA', '5 laps · 14 cars'],
      ['TROIS-RIVIÈRES, CANADA', '6 laps · 12 cars'], ['BANG SAEN, THAILAND', '4 laps · 12 cars'], ['MONTRÉAL, CANADA', '6 laps · 16 cars'],
      ['MEDVODE, SLOVENIA', 'through the town · against the clock'], ['LIVORNO, ITALY', 'one lap · flying start · 20 cars'], ['NIGHT SERIES', 'all eleven races · points']] },
    cross: { title: 'Cross rally', sub: '{car} · gravel and jumps', col: '#d9a23a', items: [
      ['HARJU, FINLAND', '4 laps · 8 cars'], ['OUNINPOHJA, FINLAND', 'one stage · against the clock'], ['SANI PASS, SOUTH AFRICA', 'one stage · against the clock'],
      ['MOKI DUGWAY, USA', 'one stage · against the clock'], ['KATU-YARYK, RUSSIA', 'one stage · against the clock'], ['UNCOMPAHGRE, USA', 'one stage · against the clock'],
      ['PIKES PEAK (GRAVEL), USA', 'the old gravel road to the top'], ['HARJU, FINLAND', 'in the snow · 8 cars'], ['OUNINPOHJA, FINLAND', 'at night · against the clock'],
      ['SANI PASS, SOUTH AFRICA', 'in the rain · against the clock'], ['MOTOCROSS TRACK', 'on this map · 6 cars'], ['CROSS FINAL', 'all the stages · points']] },
    mx: { title: 'Motocross school', sub: 'learn to ride · jumps & berms', col: '#ff6a1a', items: [
      ['FIRST RIDE', 'a slow lap of the track'], ['JUMPS', 'the small jumps, land straight'], ['BERMS', 'round the banked corners'],
      ['START GATE', 'away from the gate first'], ['WHOOPS', 'the row of bumps, stay low'], ['DOUBLE', 'both humps in one jump'],
      ['TABLETOP', 'land on the flat top'], ['RHYTHM', 'the jumps in a row, no braking'], ['RUTS', 'stay in the ruts round the corners'],
      ['TIMED LAP', 'a fast lap under the time'], ['RACE', '6 riders, 3 laps'], ['EXAM: MOTOCROSS', 'the whole track clean, under the time']] },
    multi: { title: 'Multiplayer', sub: 'race your friends online', col: '#2ad8b0', items: [['QUICK RACE', 'join the first free room'], ['CREATE A ROOM', 'invite your friends with a code'], ['JOIN A ROOM', 'enter a friend\'s code']] },
    police: { title: 'Police', sub: '{car} · missions', col: '#2f6bff', items: [
      ['ESCAPE THE POLICE', 'lose the patrols in the streets'], ['CATCH THE CRIMINAL', 'you drive the patrol car'], ['WRONG WAY RACE', 'against the traffic, the police behind you'],
      ['SPEED TRAP', 'past the radar under the limit'], ['ROADBLOCK', 'round the roadblock without a scratch'], ['NIGHT CHASE', 'lose the patrols in the dark'],
      ['STOLEN CAR', 'catch it before the border'], ['HELICOPTER', 'lose the helicopter in the tunnel'], ['TRAFFIC STOP', 'pull the speeding car over'],
      ['AMBULANCE', 'clear the way for the ambulance'], ['BIG CHASE', 'five patrols after you'], ['LAST CASE', 'catch three cars before the border']] },
    kamikaze: { title: 'Mission: Kamikaze', sub: 'the wrong way round', col: '#ff3d2a', items: [
      ['NÜRBURG, GERMANY', 'a lap against the field'], ['SPA, BELGIUM', 'a lap against the field'], ['SUZUKA, JAPAN', 'a lap against the field'],
      ['BATHURST, AUSTRALIA', 'a lap against the field'], ['STYRIA, AUSTRIA', 'a lap against the field'], ['MONTEREY, USA', 'a lap against the field'],
      ['RIVERSIDE, USA', 'a lap against the field'], ['CRYSTAL PALACE, ENGLAND', 'a lap against the field'], ['RIO DE JANEIRO, BRAZIL', 'a lap against the field'],
      ['DETROIT, USA', 'a lap against the field · at night'], ['TORONTO, CANADA', 'a lap against the field · in the rain'], ['NÜRBURG, GERMANY', 'a lap against 100 cars']] },
    home: { title: 'Home', sub: 'your garage', col: '#ffd34d', note: 'Garaža v izdelavi' },   // (HOME's box in the pit lane: the new garage is made apart; a note for now)
    president: { title: 'Mission: President', sub: 'protect the president', col: '#4a7ae8', items: [
      ['MEDVODE, SLOVENIA', 'escort the convoy · 6.2 km'], ['VRŠIČ, SLOVENIA', 'escort the convoy over the pass'], ['RIVIERA, FRANCE', 'escort the convoy along the coast'],
      ['BIG SUR, USA', 'escort the convoy along the cliffs'], ['GREAT ALPINE ROAD, AUSTRALIA', 'escort the convoy through the mountains'], ['IROHAZAKA, JAPAN', 'escort the convoy down the hairpins'],
      ['TIANMEN, CHINA', 'escort the convoy up the bends'], ['LOS CARACOLES, CHILE', 'escort the convoy over the pass'], ['MAUNA KEA, USA', 'escort the convoy to the summit'],
      ['SANTA MONICA MOUNTAINS, USA', 'escort the convoy at night'], ['RIO DO RASTRO, BRAZIL', 'escort the convoy up the serra'], ['STATE VISIT', 'three roads in one day']] },
  };

  let host = null, el = null, list = [], carName = () => '', at = null, shut = null, live = true, view = null, wipT = 0, want = null;
  // each task's best, by the place it was driven to: 1st 100 %, 2nd 75 %, 3rd 50 %, 4th 0 % (none driven yet); three tasks a level, the
  // next level opens at 50 % of the one before (the three tasks' average); the licence: its exam (the twelfth task) passed, 3rd or better
  const best = { c: [], m: [], k: [] }, KEY = 'rra-avtosola';
  function load() { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o) for (const l of Object.keys(best)) best[l] = Array.isArray(o[l]) ? o[l].map(v => PLACE.includes(v) ? v : undefined) : []; } catch (e) { } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) { } }
  const LV = 3, OPEN = 50, PLACE = [100, 75, 50, 0], ORD = ['1st', '2nd', '3rd', '4th'];
  const bestOf = (l, i) => best[l][i] || 0, nLv = (l) => Math.ceil(LIC[l].tasks.length / LV);
  const lvP = (l, v) => { let t = 0; for (let i = v * LV; i < (v + 1) * LV; i++) t += bestOf(l, i); return Math.round(t / LV); };
  const lvOpen = (l) => { let v = 0; while (v + 1 < nLv(l) && lvP(l, v) >= OPEN) v++; return v; };   // (the highest level open)
  const allP = (l) => Math.round(LIC[l].tasks.reduce((t, _, i) => t + bestOf(l, i), 0) / LIC[l].tasks.length);
  const nDone = (l) => LIC[l].tasks.filter((_, i) => bestOf(l, i) >= OPEN).length;
  const lic = (l) => bestOf(l, LIC[l].tasks.length - 1) >= OPEN;   // (the licence won: its exam passed)
  // the other garages' challenges (twelve: the licences, the races, the missions) the same way: each one's best by its place, a level of three,
  // the next one open at 50 % of the one before (the challenges are not built yet: V izdelavi, nothing records a place but the tests)
  const gbest = {}, GKEY = 'rra-garaze';
  function gload() { try { const o = JSON.parse(localStorage.getItem(GKEY) || 'null'); if (o) for (const k of Object.keys(o)) if (MENUS[k] && Array.isArray(o[k])) gbest[k] = o[k].map(v => PLACE.includes(v) ? v : 0); } catch (e) { } }
  function gsave() { try { localStorage.setItem(GKEY, JSON.stringify(gbest)); } catch (e) { } }
  const levelled = (k) => !!(MENUS[k] && MENUS[k].items && MENUS[k].items.length > LV);
  const gOf = (k, i) => (gbest[k] && gbest[k][i]) || 0, gnLv = (k) => Math.ceil(MENUS[k].items.length / LV);
  const gLvP = (k, v) => { let t = 0; for (let i = v * LV; i < (v + 1) * LV; i++) t += gOf(k, i); return Math.round(t / LV); };
  const gOpen = (k) => { let v = 0; while (v + 1 < gnLv(k) && gLvP(k, v) >= OPEN) v++; return v; };   // (the highest level open)

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
#nvm .lv { margin-top: 9px; padding: 8px 10px 9px; border-radius: 10px; background: rgba(255,255,255,.07); }
#nvm .lt { display: flex; align-items: center; gap: 8px; }
#nvm .lt b { flex: 1; font: 900 italic 16px var(--f-ui, Roboto, sans-serif); letter-spacing: .5px; }
#nvm .lt span { font: 900 italic 15px var(--f-ui, Roboto, sans-serif); }
#nvm .ar { flex: none; width: 30px; height: 30px; border-radius: 8px; border: 2px solid rgba(255,255,255,.35); background: rgba(255,255,255,.08); color: #fff; font: 900 18px/1 var(--f-ui, Roboto, sans-serif); padding: 0 0 2px; cursor: pointer; }
#nvm .ar:disabled { opacity: .25; cursor: default; }
#nvm .bar { position: relative; height: 9px; margin-top: 7px; border-radius: 5px; background: rgba(255,255,255,.15); }
#nvm .bar u { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 5px; background: var(--c); }
#nvm .bar i { position: absolute; top: -4px; bottom: -4px; width: 3px; margin-left: -1.5px; border-radius: 2px; background: #ffd34d; }
#nvm .nt { margin-top: 6px; font: 600 11px var(--f-ui, Roboto, sans-serif); color: #9aa3ad; }
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
    host = (document.getElementById('hud') || document.body).parentElement || document.body; load(); gload();
    if (typeof NVSchool !== 'undefined') NVSchool.init(H3, { name: (l, i) => [LIC[l].name, LIC[l].tasks[i][0]], col: (l) => LIC[l].col, record, floor: () => { const g = list.find(q => q.key === 'school'); return g && { x: g.x, z: g.z, h: Math.atan2(g.s, g.c) }; },
      closed: (l) => { at = null; shut = null; want = l ? { lvl: 1, lic: l, lv: lvOpen(l) } : null; } });
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
    live = !!on; if (typeof NVSchool !== 'undefined') { NVSchool.tick(P, on); if (NVSchool.active()) { if (el) close(); return; } }   // (a task being driven: no menu)
    if (!list.length || !P) return;
    const k = floorOf(P.x, P.z), v0 = () => { const v = want && k === 'school' ? want : { lvl: 0 }; want = null; return v; };
    if (k !== at) { at = k; shut = null; close(); if (k) { view = v0(); draw(); } }
    else if (k && !el && shut !== k) { view = v0(); draw(); }
    if (el) el.style.display = live ? '' : 'none';
  }
  function close() { if (el) { el.remove(); el = null; } view = null; }

  const PAUSE = '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const BACK = '<svg viewBox="0 0 24 24"><path d="M15.4 4.6 8 12l7.4 7.4 1.8-1.8L11.6 12l5.6-5.6z"/></svg>';
  function row(o) {   // a coloured choice, its progress inside it (the menu of circuit race and race the rival)
    const k = ink(o.t), bt = k === '#111' ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.28)';
    return `<button class="row${o.tk ? ' tk' : ''}" data-a="${o.a}" data-i="${o.i}" style="--t:${o.t};--k:${k};--bt:${bt}">` +
      (o.tk ? `<span class="n">${o.i + 1}</span><span class="tx">${esc(o.name)}<small>${esc(o.sub)}</small></span><em>${o.p} %</em>` : `${esc(o.name)}<small>${esc(o.sub)}</small><em>${o.p} %</em>`) +
      `<s><u style="width:${o.p}%"></u></s></button>`;
  }
  // a level's bar: ‹ LEVEL n p % ›, the 50 % mark, the line under it
  const lvBar = (v, op, p, nt) => `<div class="lv"><div class="lt"><button class="ar" data-a="lvp" aria-label="Level before"${v > 0 ? '' : ' disabled'}>‹</button><b>LEVEL ${v + 1}</b><span style="color:${p >= OPEN ? '#5fe08a' : '#ffd34d'}">${p} %</span><button class="ar" data-a="lvn" aria-label="Next level"${v < op ? '' : ' disabled'}>›</button></div>` +
    `<div class="bar"><u style="width:${p}%"></u><i style="left:${OPEN}%"></i></div><div class="nt">${esc(nt)}</div></div>`;
  function draw() {
    const M = MENUS[at]; if (!M || !view) return;
    if (!el) { el = document.createElement('div'); el.id = 'nvm'; el.addEventListener('click', onClick); host.appendChild(el); }
    const sub = (s) => s.replace('{car}', carName() || 'your car');
    let col = M.col, h = '', title = M.title, line = sub(M.sub);
    if (view.lvl === 0) {
      const T = shades(M.col);
      if (M.note) h = `<div class="note">${esc(tr(M.note))}</div>`;
      else if (M.lic) h = M.lic.map((l, i) => { const L = LIC[l]; return row({ a: 'lic', i, t: L.col, name: L.name + (lic(l) ? ' ✓' : ''), sub: `${L.sub} · level ${lvOpen(l) + 1} · ${nDone(l)} / ${L.tasks.length} tasks`, p: allP(l) }); }).join('');
      else if (levelled(at)) {
        if (view.lv == null) view.lv = gOpen(at);
        const v = view.lv, n = gnLv(at), op = gOpen(at), p = gLvP(at, v); line = `${line} · level ${v + 1} of ${n}`;
        for (let i = v * LV; i < Math.min((v + 1) * LV, M.items.length); i++) h += row({ a: 'wip', i, tk: true, t: T[i % LV], name: M.items[i][0], sub: M.items[i][1], p: gOf(at, i) });
        h += lvBar(v, op, p, v + 1 >= n ? 'the last level' : v + 1 <= op ? `level ${v + 2} is open` : `at ${OPEN} % level ${v + 2} opens`);
      }
      else h = M.items.map((it, i) => row({ a: 'wip', i, t: T[i], name: it[0], sub: it[1], p: 0 })).join('');
      h += `<div class="ft">${esc(M.note ? 'tap anywhere else to close' : 'tap anywhere else to close · shown while you stand on the coloured spot')}</div>`;
    } else if (view.lvl === 1) {
      const l = view.lic, L = LIC[l], v = view.lv, n = nLv(l), op = lvOpen(l), p = lvP(l, v); col = L.col; title = L.name; line = `${M.title} · level ${v + 1} of ${n}`;
      for (let i = v * LV; i < Math.min((v + 1) * LV, L.tasks.length); i++) h += row({ a: 'task', i, tk: true, t: L.col, name: L.tasks[i][0], sub: L.tasks[i][1], p: bestOf(l, i) });
      const nt = v + 1 >= n ? `the last level · pass the exam: the ${L.name.toLowerCase()}` : v + 1 <= op ? `level ${v + 2} is open` : `at ${OPEN} % level ${v + 2} opens`;
      h += lvBar(v, op, p, nt);
    } else {
      const l = view.lic, L = LIC[l], t = L.tasks[view.task], b = bestOf(l, view.task); col = L.col; title = L.name; line = `level ${view.lv + 1} · task ${view.task + 1} / ${L.tasks.length}`;
      h = `<div class="card"><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p><dl><dt>Best</dt><dd>${best[l][view.task] != null ? ORD[PLACE.indexOf(b)] + ' place · ' + b + ' %' : '—'}</dd><dt>Done</dt><dd>${b >= OPEN ? '✓' : 'not yet'}</dd><dt>Licence</dt><dd>${esc(view.task === L.tasks.length - 1 ? 'pass this exam: the ' + L.name.toLowerCase() : 'pass the exam (task ' + L.tasks.length + ')')}</dd></dl></div>` +
        `<button class="go" data-a="start">${esc('Start')}</button>`;
    }
    el.style.setProperty('--c', col); el.style.setProperty('--ck', ink(col));
    el.dataset.key = at; el.dataset.lvl = view.lvl; el.dataset.lv = view.lv != null ? view.lv + 1 : '';
    el.innerHTML = `<div class="hd">${view.lvl ? `<button class="ib" data-a="back" aria-label="Back">${BACK}</button>` : ''}<b>${esc(title)}</b><i>${esc(line)}</i><button class="ib" data-a="pause" aria-label="Pause">${PAUSE}</button></div>${h}<div class="wip">${esc(tr('V izdelavi'))}</div>`;
    el.style.display = live ? '' : 'none';
  }
  function wip() { const w = el && el.querySelector('.wip'); if (!w) return; w.classList.add('on'); clearTimeout(wipT); wipT = setTimeout(() => w.classList.remove('on'), 1400); }
  function onClick(e) {
    const b = e.target.closest('[data-a]'); if (!b || !view) return;
    const a = b.dataset.a, i = +b.dataset.i;
    if (a === 'pause') { const p = document.getElementById('btn-pause'); if (p) p.click(); return; }
    if (a === 'back') { view = view.lvl === 2 ? { lvl: 1, lic: view.lic, lv: view.lv } : { lvl: 0 }; draw(); return; }
    if (a === 'lic') { const l = MENUS[at].lic[i]; view = { lvl: 1, lic: l, lv: lvOpen(l) }; draw(); return; }   // (the highest level open)
    if (a === 'lvp' || a === 'lvn') { const v = view.lv + (a === 'lvn' ? 1 : -1); if (v >= 0 && v <= (view.lic ? lvOpen(view.lic) : gOpen(at))) { view.lv = v; draw(); } return; }
    if (a === 'task') { view = { lvl: 2, lic: view.lic, lv: view.lv, task: i }; draw(); return; }
    if (a === 'start' && typeof NVSchool !== 'undefined' && NVSchool.has(view.lic, view.task)) { const l = view.lic, i = view.task; close(); NVSchool.start(l, i); return; }
    if (a === 'wip' || a === 'start') wip();
  }
  // (the tests: the garages' floors, the menu now)
  const on = () => at;   // (the garage the car stands in: js/game.js hides Na progo there)
  const setPlace = (l, i, place) => { best[l][i] = PLACE[place - 1]; save(); if (el && view) draw(); };   // (the tests: a task driven to 1st-4th)
  const setGarage = (k, i, place) => { (gbest[k] || (gbest[k] = []))[i] = PLACE[place - 1]; gsave(); if (el && view) draw(); };   // (the tests: a garage's challenge, 1st-4th)
  // a task driven (js/nvschool.js): its place kept if better than the best so far
  function record(l, i, place) { const v = PLACE[place - 1]; if (best[l][i] == null || v > best[l][i]) { best[l][i] = v; save(); } }
  const state = () => ({ at, open: !!el && el.style.display !== 'none', view: view && Object.assign({}, view), n: list.length });
  const floors = () => list.map(g => ({ key: g.key, x: g.x, z: g.z, h: Math.atan2(g.s, g.c) }));
  return { init, tick, close, on, setPlace, setGarage, state, floors, floorOf, MENUS, LIC };
})();
