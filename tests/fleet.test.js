// The fleet (Core only, no browser): the vehicle registry and every registered vehicle's physics, destruction and AI.
//  - the files (before Core loads, so a broken one is named): each js/cars/<id>.js runs twice in one empty sandbox and adds exactly one
//    def a run (id = the file's name) and nothing else (a top-level let / const / class fails the second run, a top-level var or
//    function shows as a global, THREE / window touched while loading throws); index.html lists them after the tracks and before
//    core.js in the roster's (registration) order; all of them register, none skipped
//  - the registry: every model (the 11 and the new ones) has sound physics, a drive, a category, stat bars, its own ARC and CSP entries, a
//    career price and a part table; a registered one also its sound preset, description, handling targets, part names, contact circles;
//    the part presets as DESIGN 2.2 lists them
//  - handling (the flat-plane rig, tests/lib/handling.js): 0-100 km/h, top speed, side grip at 100 km/h and 100-0 km/h inside the
//    vehicle's own targets (def.expect), the targets inside its category's envelope (ENVELOPE below: anchored on the 11), the stat bars
//    within 1 of Core.statsOf
//  - destruction: Core.wreckCar takes every part off (the wheels only with damage on), the same every time; the repair puts it all back;
//    the wreck sequence (from 96 %, from a hit and from a hard landing: the bonnet, boot, bumpers and wing 0.4 s apart); any two wheels
//    lost still leave >= 40 km/h; every contact circle of a long vehicle touches (cars, debris, props)
//  - the AI: aiModel without a vehicle is the old four cars (the same objects), fieldSize and the qualifying sim follow the field; a
//    one-make race of every vehicle for 20 s (every rival > 150 m on, every speed profile its model's own and finite, no NaN); retiring:
//    two wheels off (damage alone, or damage for looks only, never); a retired car drives off onto the run-off (from speed, or standing
//    across the road; on Spa's Kemmel straight over to the side with room) and stands there, the marshals place one that does not get
//    there (never two on one spot; with no spot that takes it, once, and there it stays), never a lap or a finish for it; the flags: an
//    incident for 30 s (and as long as it stands on the asphalt), no penalty for passing it; a lost wheel: refitted by the marshals
//    without pits (W.fix counts), a pit stop in a tyre race (in the rain too); whole races on the Nordschleife and in Monaco with wheels
//    knocked off (three seeds each: invariants, not one seed's outcome); attrition: one Nordschleife race in each of the eight one-make
//    fields with the most retirements (five of them with wider AI spacing): no race with more than 4 retired, at most 6 in the eight;
//    SOKOL R and PANTER 6 (they race the four road cars) within 2.5 % of the KAZE RS's lap on three tracks
//  - patch defs and broken defs (a throwaway Core with extra defs): a patch attaches its fields (a part table: that model breaks apart
//    as a registered one does), a glb model joins a field only with a look of its own, a retired model never, a bad def is skipped and
//    listed (nothing of a def silently dropped or replaced)
//  - the retired model at index 5: its heir (Core.heirOf) the LEV S, in no AI field; the real car it once was gone from the game (no
//    word of its maker anywhere, its packed model and its 3D model file deleted)
//   node tests/fleet.test.js                (FLEET_ONLY=titan,mravlja: the per-vehicle checks of those only)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore, coreSource, pageScripts, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

// the registration order (= the script tags' order, append-only: a shipped vehicle is retired, never removed or moved)
const ROSTER = ['miska', 'kolibri', 'raketa', 'jezek', 'sokol', 'panter', 'jelen', 'lisica', 'perun', 'skorpijon', 'modras', 'jastreb', 'gad', 'blisk', 'lev', 'zmaj',
  'pescenjak', 'medved', 'hrosc', 'gozdar', 'kozorog', 'tiger', 'tornado', 'strelica', 'mravlja', 'bizon', 'titan', 'kamen', 'superkombi', 'predsednik', 'goljat', 'levs', 'levk'];
const OLD = ['kaze', 'vortex', 'pico', 'strega', 'rally', 'p206', 'formula', 'lm', 'muscle', 'ev', 'truck'];
// category envelopes: 0-100 km/h (s), top speed (km/h), side grip at 100 km/h with full lock (g), 100-0 km/h (m). Anchored on the 11
// (measured with the rig: t100 2.50 ev .. 3.58 kaze / muscle, vmax 202 truck .. 295 lm, latG 2.07 truck .. 2.86 formula, d100 23.6-24.0
// the road cars, 18.3 formula, 19.9 lm): each category's own members inside it, widened for what the category adds (a 38 kW micro
// car, the trucks and the monster, a kart and a 1930s Grand Prix car); every registered vehicle's expect must lie inside its category's
const ENVELOPE = {
  mali: { t100: [3.0, 6.5], vmax: [140, 245], latG: [2.0, 2.45], d100: [22.5, 26] },          // pico 3.29 / 226 / 2.32 / 23.9, the retired one at index 5 3.28 / 236 / 2.35 / 23.9
  sportni: { t100: [2.7, 4.3], vmax: [180, 265], latG: [2.15, 2.45], d100: [21.5, 26] },     // kaze 3.58 / 225 / 2.25 / 23.9, vortex 2.88 / 222 / 2.38 / 23.9
  super: { t100: [2.0, 3.8], vmax: [235, 330], latG: [2.25, 2.65], d100: [20, 25] },          // strega 3.57 / 243 / 2.30 / 24.0
  klasika: { t100: [3.2, 4.8], vmax: [160, 250], latG: [1.85, 2.25], d100: [23, 31] },        // muscle 3.58 / 239 / 2.13 / 23.9
  reli: { t100: [2.3, 3.2], vmax: [215, 265], latG: [2.25, 2.45], d100: [21.5, 25] },         // rally 2.87 / 235 / 2.38 / 23.9
  teren: { t100: [2.7, 4.6], vmax: [165, 235], latG: [1.95, 2.15], d100: [23, 30] },          // truck 2.93 / 202 / 2.07 / 23.6
  dirkalni: { t100: [2.3, 3.8], vmax: [125, 330], latG: [2.05, 2.95], d100: [17.5, 24.5] },   // formula 2.52 / 282 / 2.86 / 18.3, lm 2.67 / 295 / 2.76 / 19.9
  tovornjaki: { t100: [5.5, 9], vmax: [125, 165], latG: [1.7, 1.95], d100: [29, 40] },        // (new: the racing truck, the rally-raid truck)
  elektricni: { t100: [2.3, 3.9], vmax: [185, 265], latG: [2.2, 2.5], d100: [22.5, 26] },     // ev 2.50 / 252 / 2.43 / 24.0
  posebni: { t100: [2.8, 6.5], vmax: [150, 285], latG: [1.85, 2.5], d100: [21, 33] },         // (new: the racing van, the limousine, the monster truck)
};
const STD = ['bumperF', 'bumperR', 'hood', 'trunk', 'fenderL', 'fenderR', 'quarterL', 'quarterR', 'doorL', 'doorR', 'mirrorL', 'mirrorR', 'wing', 'wheelFL', 'wheelFR', 'wheelRL', 'wheelRR'];
const WHEELS = ['wheelFL', 'wheelFR', 'wheelRL', 'wheelRR'];

const only = (process.env.FLEET_ONLY || '').split(',').filter(Boolean);
const IDS = only.length ? ROSTER.filter(id => only.includes(id)) : ROSTER;
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const info = (s) => console.log('info ' + s);
const t0 = Date.now(), orig = Math.random;

// ---- 1. the files, before Core loads (a broken one is named here): each run twice in one empty sandbox, one def a run and nothing else
//      (no other global, no top-level let / const / class: those clash when the page loads every file into one scope; nothing of the
//      page touched while loading) ----
{
  const dir = path.join(ROOT, 'js', 'cars'), files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  check('js/cars: a file for every roster vehicle and none more', files.length === ROSTER.length && ROSTER.every(id => files.includes(id + '.js')), files.length + ' files');
  for (const f of files) {
    const id = f.slice(0, -3), src = fs.readFileSync(path.join(dir, f), 'utf8'), ctx = vm.createContext({});
    let err = '', k1 = '', n1 = -1;
    try {
      vm.runInContext(src, ctx, { filename: f }); k1 = Object.keys(ctx).join(); n1 = Array.isArray(ctx.VEHICLE_DEFS) ? ctx.VEHICLE_DEFS.length : -1;
      vm.runInContext(src, ctx, { filename: f });   // (a second time in the same scope: a top-level let / const / class declared again throws)
    } catch (e) { err = e.message; }
    const k2 = Object.keys(ctx).join(), D = ctx.VEHICLE_DEFS;
    if (!only.length || only.includes(id)) check(`${f}: alone in an empty sandbox, run twice: one def a run, id '${id}', no other global or top-level name`,
      !err && k1 === 'VEHICLE_DEFS' && n1 === 1 && k2 === 'VEHICLE_DEFS' && Array.isArray(D) && D.length === 2 && D.every(d => d && d.id === id), err || `globals ${k2 || '-'}, ${n1} then ${D ? D.length : 0} defs`);
  }
  const S = pageScripts(path.join(ROOT, 'index.html')), cars = S.filter(s => /^js\/cars\//.test(s)), iCars = S.map((s, i) => /^js\/cars\//.test(s) ? i : -1).filter(i => i >= 0);
  const iTrack = Math.max(...S.map((s, i) => /^js\/tracks\//.test(s) ? i : -1)), iCore = S.findIndex(s => /(^|\/)core\.js$/.test(s));
  check('index.html: the vehicle files after the tracks, before core.js, in the roster (registration) order', cars.map(s => s.slice(8, -3)).join() === ROSTER.join() &&
    iCars[0] === iTrack + 1 && iCars[iCars.length - 1] === iCore - 1 && iCars.every((v, i) => !i || v === iCars[i - 1] + 1), cars.length + ' tags');
  // the real car the retired model at index 5 once was: gone from the game, its packed model (js/data/p206.js) and its source (a .glb file),
  // its maker's name nowhere in the page, the scripts, the styles, the tools, the tests or the READMEs, nor in a file's name (the name is
  // split here, so this file does not carry it either)
  const BRAND = new RegExp(['peu', 'geot'].join(''), 'i'), hits = [], glbs = [];
  const scan = (rel) => { const f = path.join(ROOT, rel); if (BRAND.test(rel)) hits.push(rel);
    if (fs.statSync(f).isDirectory()) { for (const e of fs.readdirSync(f)) if (e !== 'node_modules' && e !== 'test-results' && e !== '.git') scan(path.join(rel, e)); return; }
    if (/\.glb$/i.test(rel)) glbs.push(rel);
    else if (/\.(js|mjs|cjs|html|css|md|json|webmanifest|txt|svg|yml|yaml)$/i.test(rel) && BRAND.test(fs.readFileSync(f, 'utf8'))) hits.push(rel); };
  for (const e of fs.readdirSync(ROOT)) if (e !== 'node_modules' && e !== 'test-results' && e !== '.git' && e !== '.claude') scan(e);
  check('the real car is gone: no word of its maker in the page, the scripts (js/**), the styles, the tools, the tests or the READMEs (nor in a file\'s name); its packed model (js/data/p206.js) and its 3D model file (.glb) not in the game, not linked',
    !hits.length && !glbs.length && !fs.existsSync(path.join(ROOT, 'js', 'data', 'p206.js')) && !S.some(s => /^js\/data\//.test(s)), JSON.stringify({ hits: hits.slice(0, 8), glbs }));
}
let C;
try { C = loadCore(); } catch (e) { check('Core loads with every vehicle file (loadCore names a file that breaks it)', false, e.message); console.log(`FAIL: ${bad} of ${n} checks`); process.exit(1); }
const H = require('./lib/handling.js')(C);
const model = (id) => C.MODELS.find(m => m.id === id);
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
check('Core: the 11 first, in their places, then all the new ones in the roster order; no def skipped', C.MODELS.slice(0, 11).map(m => m.id).join() === OLD.join() && C.MODELS.slice(11).map(m => m.id).join() === ROSTER.join() &&
  C.DEFS.length === ROSTER.length && C.DEFS_SKIPPED.length === 0, C.MODELS.length + ' models, ' + C.DEFS.length + ' defs, skipped ' + JSON.stringify(C.DEFS_SKIPPED));

// ---- 2. the registry: every model sound (the 11 and the new ones) ----
{
  const probs = [], ids = new Set(), names = new Set(), kaze = new C.Car(model('kaze'), { phys: 'cs' });
  const DRIVES = ['FR', 'FF', 'MR', 'AWD', 'RR'], cats = C.CATS.map(c => c.id);
  for (const M of C.MODELS) {
    const p = (s) => probs.push(M.id + ': ' + s), PT = C.partsOf(M);
    if (ids.has(M.id)) p('id twice'); ids.add(M.id); if (!M.retired) { if (names.has(M.name)) p('name twice'); names.add(M.name); }   // (a retired model: named as its heir)
    for (const k of ['mass', 'a', 'b', 'kI', 'kw', 'redline', 'final', 'rw', 'cDrag', 'len', 'wid', 'steerMax']) if (!(fin(M[k]) && M[k] > 0)) p(k);
    if (!(fin(M.idle) && M.idle >= 0) || !(M.gears.length && M.gears.every(g => fin(g) && g > 0)) || !(M.a + M.b < M.len) || M.len > 6.4 || M.wid > 3.2) p('idle / gears / wheelbase / size');
    if (M.Tmax !== M.kw * 1000 / (M.redline * (Math.PI * 2) / 60 * Math.max(0.3, 1 - 0.85 * (1.0 - 0.7) * (1.0 - 0.7)))) p('Tmax (not the loop\'s)');
    if (!DRIVES.includes(M.drive)) p('drive ' + M.drive); if (!cats.includes(M.cat)) p('cat ' + M.cat);
    if (!M.stats || !['power', 'grip', 'weight', 'drift'].every(k => fin(M.stats[k]) && M.stats[k] >= 0 && M.stats[k] <= 10)) p('stats');
    const A = C.ARC[M.id], car = new C.Car(M, { phys: 'cs' });
    if (!A || !(A.amax > 0 && A.kv > 0 && A.rmin > 0) || (M.id !== 'kaze' && car.arc === kaze.arc)) p('ARC (own entry)');
    const S = C.CSP[M.id]; if (!S || !['bx', 'coast', 'thr', 'liftP', 'pwr', 'out', 'turn', 'w'].every(k => fin(S[k])) || !(S.out > 0 && S.turn > 0 && S.w > 0)) p('CSP (own entry)');
    if (!(fin(C.CAREER.car[M.id]) && C.CAREER.car[M.id] >= 0)) p('career price');
    for (const k in PT) { const e = PT[k]; if (![0, 1, 2, 3].includes(e.z) || !(e.th > 0) || !(e.m > 0 && e.m <= 14) || !(e.r > 0 && e.h > 0) || !fin(e.lx) || !fin(e.lz) || !fin(e.y)) p('part ' + k); }
    if (!M.kit) { if (PT !== C.PARTS) p('the 8 old parts'); continue; }
    // a registered vehicle
    const d = M.def;
    if (d.name.length > 18 || d.desc.length > 90 || /\d\s*(kW|KM|kg)\b/.test(d.desc)) p('name / desc');
    if (!C.SND_KINDS.includes(M.sndP && M.sndP.kind) || M.snd !== undefined) p('sound preset (sndP from def.snd; snd untouched)');
    if (!d.expect || !['t100', 'vmax', 'latG', 'd100'].every(k => Array.isArray(d.expect[k]))) p('expect');
    if (d.look !== null && !(d.look && typeof d.look === 'object' && typeof d.look.build === 'function' && (d.look.body == null || typeof d.look.body === 'object'))) p('look (null, or { body, wheels, build(K) })');
    if (M.body !== M.id) p('body (its own: the id)');
    for (const k of WHEELS) { const e = PT[k], i = WHEELS.indexOf(k); if (!e || e.wh !== i || Math.abs(e.lx - (i < 2 ? M.a : -M.b) / (M.len / 2)) > 1e-9 || Math.abs(Math.abs(e.lz) - 0.86) > 1e-9 || e.y !== M.rw) p('wheel ' + k); }
    for (const k in PT) if (!STD.includes(k) && !(d.partNames && d.partNames[k])) p('no English name for part ' + k);
    for (const k in d.partNames || {}) if (!PT[k]) p('a name for no part: ' + k);
    let df = 0; for (const k in PT) df += PT[k].df || 0; if (df > 1 + 1e-9) p('downforce shares ' + df);
    if (M.field && !M.field.every(id => C.MODELS.some(m => m.id === id))) p('field');
    if (C.CATS.every(c => c.id !== M.cat)) p('category');
    const c = new C.Car(M, { phys: 'cs' }), r = c.rad, L = c.circles, sp = L.length > 1 ? L[1] - L[0] : 0;
    if (Math.abs(L[0] + (M.len / 2 - r)) > 1e-9 || Math.abs(L[L.length - 1] - (M.len / 2 - r)) > 1e-9 || L.length < 3 || sp > 0.9 * r + 1e-9 || !(c.wreck && c.wreck.wl === 0)) p('contact circles / wreck state');
  }
  check('registry: every model sound (physics, drive, category, bars, own ARC / CSP, price, parts; the new ones: sound, texts, targets, wheels, names, circles)', !probs.length, probs.slice(0, 8).join('; '));
  // the roster's rules (DESIGN section 8): little wheelspin above 300 W/kg (else it spins all the time: smoke, power rotation, the AI's
  // throttle cut); the big ones slow to launch and long to stop; slicks / aero cars weak off the road, the off-roaders strong there and soft
  // on landing
  const rule = [], big = ['titan', 'kamen', 'predsednik', 'goljat'], off = ['teren', 'tovornjaki'];
  for (const M of C.MODELS) {
    if (M.kw * 1000 / M.mass > 300 && !((M.spinK || 1) <= 0.3)) rule.push(M.id + ' spinK ' + M.spinK);
    if (!M.kit) continue;
    if (big.includes(M.id) && !(M.tracK <= 0.75 && M.brakeK <= 0.8)) rule.push(M.id + ' tracK / brakeK');
    if (M.aero && !(M.loose >= 0.66 && M.loose <= 0.8)) rule.push(M.id + ' loose (aero) ' + M.loose);
    if ((off.includes(M.cat) && M.id !== 'titan' || M.id === 'goljat') && !(M.loose >= 1.1 && M.loose <= 1.35 && M.landV >= 16 && M.landV <= 24)) rule.push(M.id + ' off-road loose / landV');
  }
  check('the roster\'s rules: spinK <= 0.3 above 300 W/kg; trucks, limousine, monster: tracK <= .75, brakeK <= .8; aero cars loose .66-.8; off-roaders loose 1.1-1.35, landV 16-24', !rule.length, rule.join('; '));
  const stand = C.MODELS.slice(0, 11).every(M => { const c = new C.Car(M, { phys: 'cs' }); return c.circles.join() === [-M.len * 0.3, 0, M.len * 0.3].join() && !c.wreck && C.partsOf(M) === C.PARTS; });
  check('the 11: three contact circles at -0.3 / 0 / +0.3 len, no wreck state, the 8 old parts (their races unchanged)', stand);
  // the presets (DESIGN 2.2): car (bumpers, bonnet, boot, fenders, quarters, doors, mirrors), race (car + wing), open (car), truck (bumpers,
  // doors, mirrors), none; each with the four wheels
  const PS = { car: ['bumperF', 'bumperR', 'hood', 'trunk', 'fenderL', 'fenderR', 'quarterL', 'quarterR', 'doorL', 'doorR', 'mirrorL', 'mirrorR'], truck: ['bumperF', 'bumperR', 'doorL', 'doorR', 'mirrorL', 'mirrorR'], none: [] };
  PS.race = PS.car.concat(['wing']); PS.open = PS.car.slice();
  const psBad = Object.keys(C.PART_SETS).filter(k => !PS[k]).concat(Object.keys(PS).filter(k => !C.PART_SETS[k] || C.PART_SETS[k].slice().sort().join() !== PS[k].concat(WHEELS).sort().join()));
  check('the part presets as DESIGN 2.2 lists them (car, race, open, truck, none; every one with the four wheels)', !psBad.length, psBad.map(k => k + ': ' + (C.PART_SETS[k] || []).join(' ')).join('; '));
  // the retired model (DESIGN R3: kept at index 5 with its physics, never shown): a stored id or index of it goes to its heir, the LEV S
  // (Core.heirOf: a vehicle in use, the name the same), no skin and no credit of its own; every other model its own heir
  const R5 = C.MODELS[5], H5 = C.heirOf(R5);
  check('the retired model at index 5: retired, its heir the LEV S (in use, the same name), no glb skin, no credit; every other model is its own heir',
    R5.id === 'p206' && R5.retired === true && H5 === model('levs') && !H5.retired && H5.name === R5.name && R5.glb === undefined && R5.credit === undefined && C.MODELS.every(M => M === R5 || C.heirOf(M) === M),
    `${R5.id}: retired ${R5.retired}, heir ${H5 && H5.id}, name ${R5.name}, glb ${R5.glb}, credit ${R5.credit}`);
  const inField = [];
  for (const M of [null].concat(C.MODELS.filter(m => !m.retired))) for (let k = 0; k < 16; k++) { const A = C.aiModel(k, M || undefined); if (!A || A.retired) inField.push((M ? M.id : 'none') + ':' + k); }
  check('the retired model in no AI field: aiModel with every model in use as the player\'s (and with none), drivers 0-15', !inField.length, inField.slice(0, 6).join(', '));
}

// ---- 3. handling: inside the own targets, the targets inside the category's envelope; the stat bars ----
const MEAS = {};
{
  for (const M of C.MODELS) { if (M.kit && !IDS.includes(M.id)) continue; const lo = H.longi(M.id), st = H.steady(M.id, 100, 1.0); MEAS[M.id] = { t100: lo.t100, vmax: H.topOf(M.id, 90)._v * 3.6, latG: st.ay, d100: lo.d100, bmax: lo.bmax }; }
  const fmt = (m) => `${m.t100.toFixed(2)} s / ${m.vmax.toFixed(0)} km/h / ${m.latG.toFixed(2)} g / ${m.d100.toFixed(1)} m`;
  const anchorBad = OLD.filter(id => { const E = ENVELOPE[model(id).cat], m = MEAS[id]; return !Object.keys(E).every(k => m[k] >= E[k][0] && m[k] <= E[k][1]); });
  check('envelopes: each of the 11 inside its category\'s (the anchor)', !anchorBad.length, anchorBad.map(id => id + ' ' + fmt(MEAS[id])).join('; '));
  for (const id of IDS) {
    const M = model(id), E = ENVELOPE[M.cat], X = M.def.expect, m = MEAS[id], keys = ['t100', 'vmax', 'latG', 'd100'];
    const outX = keys.filter(k => !(m[k] >= X[k][0] && m[k] <= X[k][1])), outE = keys.filter(k => !(X[k][0] >= E[k][0] && X[k][1] <= E[k][1]));
    check(`${id}: 0-100 / top speed / side grip / 100-0 within its targets, the targets within the ${M.cat} envelope`, !outX.length && !outE.length && m.bmax < 1,
      fmt(m) + (outX.length ? ' outside expect: ' + outX.join(',') : '') + (outE.length ? ' expect outside the envelope: ' + outE.join(',') : ''));
    const S = C.statsOf(M), off = Object.keys(S).filter(k => Math.abs(S[k] - M.stats[k]) > 1);
    check(`${id}: stat bars within 1 of statsOf`, !off.length, JSON.stringify(M.stats) + ' vs ' + JSON.stringify(S));
  }
  info('statsOf on the 11 (the hand-made bars, -> the formula): ' + OLD.map(id => { const S = C.statsOf(model(id)), M = model(id); return id + ' ' + ['power', 'grip', 'weight', 'drift'].map(k => M.stats[k] + (S[k] !== M.stats[k] ? '>' + S[k] : '')).join('/'); }).join(', '));
  if (!only.length) {
    const big = ['titan', 'kamen', 'predsednik', 'goljat'], road = C.MODELS.filter(M => !big.includes(M.id) && M.cat !== 'dirkalni').map(M => M.id);
    const dBig = Math.min(...big.map(id => MEAS[id].d100)), dRoad = Math.max(...road.map(id => MEAS[id].d100)), tBig = Math.min(...big.map(id => MEAS[id].t100));
    check('the trucks, the limousine and the monster truck: longer stops than any road car, slow launches (0-100 over 4.5 s)', dBig > dRoad && tBig > 4.5, `100-0 >= ${dBig.toFixed(1)} m (road cars <= ${dRoad.toFixed(1)} m), 0-100 >= ${tBig.toFixed(2)} s`);
    check('TITAN: the 160 km/h limiter holds it (150-160.5 km/h flat out)', MEAS.titan.vmax >= 150 && MEAS.titan.vmax <= 160.5, MEAS.titan.vmax.toFixed(1) + ' km/h');
  }
}

// ---- 4. destruction ----
{
  const wreckState = (c) => JSON.stringify([c.dmg, c.dz, c.cd, Object.keys(c.lost), c.detach, c.winOut, c.roofDmg, c.wreck && c.wreck.wl]);
  for (const id of IDS) {
    const M = model(id), PT = C.partsOf(M), names = Object.keys(PT);
    const a = new C.Car(M, { phys: 'cs' }), b = new C.Car(M, { phys: 'cs' }); a.dmgMode = b.dmgMode = 2;
    C.wreckCar(a); C.wreckCar(b);
    const all = names.every(k => a.lost[k]) && a.detach.length === names.length && a.dmg === 1 && a.wreck.wl === 15 && a.wreck.nL === 4;
    const v = new C.Car(M, { phys: 'cs' }); v.dmgMode = 1; C.wreckCar(v);
    const vis = names.every(k => !!v.lost[k] === !WHEELS.includes(k)) && v.wreck.wl === 0;
    C.Race.prototype.repairCar(a);
    const fresh = new C.Car(M, { phys: 'cs' }), back = !Object.keys(a.lost).length && !a.detach.length && a.dmg === 0 && a.wreck.wl === 0 && a.wreck.nL === 0 && a.wreck.seq === null && a.aeroK === fresh.aeroK;
    const c3 = new C.Car(M, { phys: 'cs' }); c3.dmgMode = 2; C.wreckCar(c3);
    check(`${id}: wreckCar takes all ${names.length} parts off (the 4 wheels only with damage on), the same every time; the repair puts it all back`, all && vis && wreckState(b) === wreckState(c3) && back,
      `lost ${Object.keys(b.lost).length}/${names.length}, wheels ${b.wreck.wl}, visual-only wheels ${v.wreck.wl}, repaired ${back}`);
    if (M.aero && PT.wing) { const c = new C.Car(M, { phys: 'cs' }), k0 = c.aeroK; C.detachPart(c, 'wing'); check(`${id}: losing the wing takes its share of the downforce (df ${PT.wing.df})`, Math.abs(k0 - c.aeroK - M.aero * PT.wing.df) < 1e-12 && c.aeroK < k0, `${k0} -> ${c.aeroK}`); }
  }
  { // toughness (model.dmgK) multiplies; the police factor on top
    const T = model('titan'), K = model('mravlja'), a = new C.Car(T, { phys: 'cs' }), b = new C.Car(K, { phys: 'cs' }), c = new C.Car(model('rally'), { phys: 'cs' });
    for (const x of [a, b, c]) C.applyDamage(x, 0.1, x.m.len / 2, 0);
    c.dmgK = 0.6; C.applyDamage(c, 0.1, c.m.len / 2, 0);
    check('toughness: a hit costs the truck 0.6x, the kart 1.3x, a road car 1x (with the police factor 0.6 on top)', Math.abs(a.dmg - 0.06) < 1e-12 && Math.abs(b.dmg - 0.13) < 1e-12 && Math.abs(c.dmg - 0.16) < 1e-12, [a.dmg, b.dmg, c.dmg].map(v => v.toFixed(3)).join(' / '));
  }
  { // the wreck queue: the most battered zone's parts first; whatever is already off is not queued (a tail hit to 97 %: the rear's parts off at
    // once, then the wheel at the crushed rear corner, then the front's)
    const c = new C.Car(model('perun'), { phys: 'cs' }); c.dmgMode = 2;
    C.applyDamage(c, 0.97, -c.m.len / 2, 0);
    check('the wreck queue: the most battered zone first, nothing already off (a tail hit: the rear parts off at once, then the rear wheel, the bonnet, the front bumper)',
      c.wreck.seq.join() === 'wheelRL,hood,bumperF' && ['trunk', 'bumperR', 'wing'].every(k => c.lost[k]), c.wreck.seq.join(','));
  }
  { // the wreck sequence: a side hit to 97 % sheds the side's panels at once, then the bonnet, boot, bumpers and wing one by one, 0.4 s apart
    Math.random = seeded(41);
    const r = new C.Race(track('jezero'), { numAI: 3, playerGrid: 4, laps: 2, playerModel: model('modras'), assist: 2, seed: 4, difficulty: 1, damage: 2 });
    r.start(); for (let k = 0; k < 600; k++) { Math.random = seeded(4000 + k); C.aiControl(r.player, r, DT); r.step(DT); }
    const c = r.cars.find(o => !o.isPlayer), hw = c.m.wid / 2;
    C.applyDamage(c, 0.97, 0, -hw);
    const seq = c.wreck.seq.slice(), side = ['doorL', 'mirrorL', 'fenderL', 'quarterL'].every(k => c.lost[k]), at = [];
    for (let k = 0; k < 360 && c.wreck.seq.length + at.length < seq.length + 10; k++) { Math.random = seeded(5000 + k); const n0 = Object.keys(c.lost).length; C.aiControl(r.player, r, DT); r.step(DT); if (Object.keys(c.lost).length > n0) at.push([k, Object.keys(c.lost).pop()]); }
    const gaps = at.slice(1).map((e, i) => (e[0] - at[i][0]) * DT);
    check('the wreck sequence: from 96 % the side\'s panels at once, then bonnet, boot, bumpers and wing one by one, 0.4 s apart; the car does not retire (no wheel off)',
      seq.join() === 'hood,trunk,bumperF,bumperR,wing' && side && at.map(e => e[1]).join() === seq.join() && gaps.every(g => Math.abs(g - 0.4) < 0.02) && !c.wreck.dnf,
      `queue ${seq.join(',')}, shed ${at.map(e => e[1]).join(',')}, gaps ${gaps.map(g => g.toFixed(2)).join(' ')}`);
  }
  { // ... and from a hard landing (applyDamage without an impact point: every zone alike, no corner): the same queue, shed in the race
    Math.random = seeded(43);
    const r = new C.Race(track('jezero'), { numAI: 3, playerGrid: 4, laps: 2, playerModel: model('kozorog'), assist: 2, seed: 4, difficulty: 1, damage: 2 });
    r.start(); for (let k = 0; k < 600; k++) { Math.random = seeded(4300 + k); C.aiControl(r.player, r, DT); r.step(DT); }
    const c = r.cars.find(o => !o.isPlayer); C.applyDamage(c, 0.97);
    const seq = c.wreck.seq ? c.wreck.seq.slice() : [], lost0 = Object.keys(c.lost).length;
    for (let k = 0; k < 360; k++) { Math.random = seeded(4400 + k); C.aiControl(r.player, r, DT); r.step(DT); }
    check('the wreck sequence from a hard landing too (no impact point): bonnet, boot, bumpers and wing queued at 97 %, all shed in the race 0.4 s apart',
      seq.join() === 'hood,trunk,bumperF,bumperR,wing' && !lost0 && seq.every(k => c.lost[k]) && c.wreck.seq.length === 0 && !c.wreck.dnf, `queue ${seq.join(',') || '(none)'}, lost now ${Object.keys(c.lost).join(',')}`);
  }
  { // every contact circle of a long vehicle touches: another car, a loose part, a cone, each right at its nose (past its third circle)
    const Tj = track('jezero'), i0 = 40, K = model('kaze'), miss = [], longs = C.MODELS.filter(M => M.kit && new C.Car(M, { phys: 'cs' }).circles.length > 3);
    for (const M of longs) {
      const A = new C.Car(M, { phys: 'cs' }), B = new C.Car(K, { phys: 'cs' }), nose = A.circles[A.circles.length - 1];
      A.place(0, 0, 0); B.place(nose + A.rad + K.len * 0.3 + B.rad - 0.3, 0, 0); A.vx = 10;   // (B's rear circle 0.3 m into A's nose circle, clear of the others)
      const car = C.carCollide(A, B) > 0;
      const r = new C.Race(Tj, { numAI: 0, playerGrid: 1, laps: 1, playerModel: M, seed: 1, damage: 0 }); r.start();
      const P = r.player, h = Tj.hd[i0], ux = Math.cos(h), uz = Math.sin(h);
      P.place(Tj.px[i0], Tj.pz[i0], h); P.q = Tj.query(P.x, P.z, i0, P.q); P.sPrev = P.q.s; P.vx = ux * 5; P.vz = uz * 5;
      const dr = 0.4, ad = nose + P.rad + dr * 0.7 - 0.05;   // (a part resting just inside the nose circle's reach)
      const d = { id: 1, car: 99, part: 'hood', x: P.x + ux * ad, z: P.z + uz * ad, y: (P.y || 0) + 0.05, vx: 0, vy: 0, vz: 0, yaw: 0, rx: 0, rz: 0, wx: 0, wy: 0, wz: 0, r: dr, m: 6, h: 0.1, rest: true, ground: true, q: null, dead: false };
      r.debris.push(d);
      r.step(DT);
      const deb = !d.rest && P.hitDebris > 0;
      const r2 = new C.Race(Tj, { numAI: 0, playerGrid: 1, laps: 1, playerModel: M, seed: 1, damage: 0 }); r2.start();
      const P2 = r2.player; P2.place(Tj.px[i0], Tj.pz[i0], h); P2.q = Tj.query(P2.x, P2.z, i0, P2.q); P2.sPrev = P2.q.s; P2.vx = ux * 5; P2.vz = uz * 5;
      const c0 = nose + P2.rad + 0.2; r2.setProps([{ kind: 'cone', x: P2.x + ux * c0, z: P2.z + uz * c0, i: i0 }]);   // (placed near the nose, then just inside its reach)
      const b = r2.props[0], cd = nose + P2.rad + b.K.rh - 0.05; b.x = P2.x + ux * cd; b.z = P2.z + uz * cd;
      r2.step(DT);
      const prop = !b.sleep;
      if (!car || !deb || !prop) miss.push(M.id + (car ? '' : ' car') + (deb ? '' : ' part') + (prop ? '' : ' cone'));
    }
    check(`every contact circle of a long vehicle touches (${longs.length} with more than 3): a car, a loose part and a cone at its nose`, longs.length >= 4 && !miss.length, miss.join('; '));
  }
}

// ---- 5. lost wheels: any two of them still leave 40 km/h on flat asphalt (the hub on the road: LOSTW) ----
{
  const PAIRS = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]], slow = [];
  let worst = 1e9, wid = '';
  for (const id of IDS) for (const [i, j] of PAIRS) {
    const c = H.mkCar(id, { v: 0 }); c.wreck.wl = (1 << i) | (1 << j); c.wreck.nL = 2;
    let vmax = 0; for (let k = 0; k < 40 / DT; k++) { H.step(c, { thr: 1 }); vmax = Math.max(vmax, c._v); }
    if (vmax * 3.6 < worst) { worst = vmax * 3.6; wid = id + ' ' + WHEELS[i] + '+' + WHEELS[j]; }
    if (vmax * 3.6 < 40) slow.push(id + ' ' + WHEELS[i] + '+' + WHEELS[j] + ' ' + (vmax * 3.6).toFixed(0));
  }
  check('two wheels lost (every pair, every vehicle): still 40 km/h or more on flat asphalt', !slow.length, slow.length ? slow.slice(0, 6).join(', ') : `slowest ${wid} ${worst.toFixed(0)} km/h`);
}

// ---- 6. the AI's cars ----
{
  const same = Array.from({ length: 21 }, (_, k) => C.aiModel(k) === C.MODELS[(k * 3 + 1) % 4] && C.aiDriver(k).model === C.MODELS[(k * 3 + 1) % 4] && C.aiModel(k, model('rally')) === C.MODELS[(k * 3 + 1) % 4]).every(Boolean);
  check('aiModel(k) without a vehicle (or with one of the 11): the old four road cars in turn, the same objects (k 0..20)', same);
  const T = model('titan'), S = model('sokol');
  check('aiModel with a field: the field\'s vehicles (TITAN: titans); SOKOL R / PANTER 6 (no field): the four road cars', Array.from({ length: 12 }, (_, k) => C.aiModel(k, T) === T && C.aiModel(k, S) === C.MODELS[(k * 3 + 1) % 4] && C.aiModel(k, model('panter')) === C.MODELS[(k * 3 + 1) % 4]).every(Boolean));
  // the qualifying sim (game.js qsimStep: each rival alone, aiOrder [k], sized by fieldSize, the player's car as playerModel): the race's cars
  const F = model('formula'), Tq = track('rbring'), qs = (pm, k) => new C.Race(Tq, { numAI: C.fieldSize(pm, 12), aiOrder: [k], noPlayer: true, playerModel: pm, laps: 1, qualiBack: 200, seed: 3, damage: 0 }).cars;
  const sizes = [C.fieldSize(T, 12), C.fieldSize(T, 5), C.fieldSize(model('kaze'), 12), C.fieldSize(F, 12), C.fieldSize(null, 12), C.fieldSize(model('goljat'), 12)];
  check('fieldSize: as many rivals as the race (TITAN 9 of 12, 5 of 5; KAZE, the formula, none: 12; GOLJAT 7); the qualifying sim drives the race\'s cars (TITAN: each of its 9 a TITAN; the formula: formulas)',
    sizes.join() === '9,5,12,12,12,7' && Array.from({ length: 9 }, (_, k) => { const L = qs(T, k); return L.length === 1 && L[0].m === T; }).every(Boolean) && qs(F, 3)[0].m === F && qs(model('kaze'), 4)[0].m === C.MODELS[(4 * 3 + 1) % 4],
    sizes.join(','));
}

// ---- 7. a one-make race of every vehicle, 20 s ----
{
  const Tj = track('jezero');
  for (const id of IDS) {
    const M = model(id); Math.random = seeded(7);
    const r = new C.Race(Tj, { numAI: 12, playerGrid: 12, laps: 3, playerModel: M, assist: 2, seed: 7, difficulty: 1, damage: 2 });
    r.start(); const P = r.player, ai = r.cars.filter(c => !c.isPlayer);
    let nan = false;
    for (let k = 1; k <= 20 / DT; k++) { Math.random = seeded(7000 + k); C.aiControl(P, r, DT); r.step(DT); for (const c of r.cars) if (!fin(c.x + c.z + c.vx + c.vz + c.h)) nan = true; }
    const want = M.field ? Math.min(12, M.fieldN || 12) : 12, cars = M.field ? ai.every(c => c.m === C.aiModel(0, M)) : ai.every((c, k) => c.m === C.MODELS[(k * 3 + 1) % 4]);
    const prof = M.field ? r.cars.every(c => c.vprof instanceof Float32Array && c.vprof.every(v => fin(v) && v > 0)) && P.vprof === ai[0].vprof : ai.every(c => !c.vprof) && !P.vprof && r.vprof.every(fin);
    const minD = Math.min(...ai.map(c => c.dist));
    check(`${id}: a ${M.field ? 'one-make ' : ''}race, 20 s: ${want} rivals${M.field ? ' in ' + M.field.join('/') : ' in the four road cars'}, every one > 150 m on, ${M.field ? 'every profile the model\'s own, finite' : 'the race\'s profile'}, no NaN`,
      ai.length === want && cars && prof && minD > 150 && !nan, `slowest rival ${minD.toFixed(0)} m${nan ? ', NaN' : ''}`);
  }
}

// ---- 8. retiring, the marshals, the pits ----
const out = (r) => r.cars.every(c => r.isOut(c));
// where a retired car stands: its inner edge past the asphalt's edge (in m; < 0: on the asphalt) and how much further out the barrier
// would let it go; parked well: stopped, its inner edge at most 0.3 m on the asphalt, or at the barrier with at most 0.7 m on it (a run-off
// narrower than the car: GOLJAT's 3.2 m in Monaco)
const standOf = (T, c) => { const q = T.query(c.x, c.z, c.q.i, {}), hw = c.m.wid / 2; return { inner: Math.abs(q.d) - hw - T.w, slack: (q.d > 0 ? q.br : q.bl) - hw - 0.4 - Math.abs(q.d) }; };
const parkedOff = (T, c) => { const p = standOf(T, c); return !!(c.wreck.stop && c.speed < 0.5 && (p.inner >= -0.3 || (p.inner >= -0.7 && p.slack <= 0.6))); };
const fmtStand = (T, c) => { const p = standOf(T, c); return `inner edge ${p.inner >= 0 ? p.inner.toFixed(2) + ' m off' : (-p.inner).toFixed(2) + ' m on'} the asphalt, ${p.slack.toFixed(2)} m to the barrier limit, ${c.wreck.stop ? 'standing' : 'moving ' + c.speed.toFixed(1) + ' m/s'}`; };
{ // a destroyed rival retires: off onto the run-off, stops there, last in the order, a DNF in the results; it never blocks the race end
  const T = track('jezero'); Math.random = seeded(11);
  const r = new C.Race(T, { numAI: 5, playerGrid: 6, laps: 1, playerModel: model('tornado'), assist: 2, seed: 11, difficulty: 1, damage: 2 });
  r.start(); const P = r.player;
  let k = 0; const run = (sec) => { for (let i = 0; i < sec / DT; i++) { Math.random = seeded(11000 + ++k); C.aiControl(P, r, DT); r.step(DT); } };
  run(15);
  const X = r.order.find(c => !c.isPlayer); C.wreckCar(X); run(0.1);
  const retired = X.wreck.dnf && r.isOut(X) && !X.finished;
  run(12);
  const res = r.estimateResults(), last = res[res.length - 1];
  check('a wrecked rival (four wheels off) retires: drives off the line onto the run-off and stands there, last in the order, a DNF at the end of the results', retired && parkedOff(T, X) &&
    r.order[r.order.length - 1] === X && last.car === X && last.dnf === true && last.time === Infinity, `${fmtStand(T, X)}, place ${r.order.indexOf(X) + 1}/${r.order.length}`);
  for (let i = 0; i < 300 / DT && !out(r); i++) { Math.random = seeded(12000 + i); C.aiControl(P, r, DT); r.step(DT); }
  check('... and the race still ends: every other car finishes', out(r) && r.cars.filter(c => c !== X).every(c => c.finished), r.cars.filter(c => !r.isOut(c)).map(c => c.name).join(', '));
  const PL = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 1, playerModel: model('kaze'), assist: 2, seed: 2, damage: 2 }); PL.start(); for (let i = 0; i < 600; i++) { C.aiControl(PL.player, PL, DT); PL.step(DT); }
  PL.retire(PL.player); for (let i = 0; i < 1200; i++) PL.step(DT);
  const pr = PL.estimateResults();
  check('the player retires (Odstopi; any car): it drives off the line and stands on the run-off, a DNF last in the results', PL.player.wreck.dnf && parkedOff(T, PL.player) && pr[pr.length - 1].car === PL.player && pr[pr.length - 1].dnf, fmtStand(T, PL.player));
}
{ // the rule: an AI car with two wheels off at once can not race on: it retires. Destroyed at dmg 1 with one or none off it limps on (as
  // every car does); with damage for looks only (dmgMode 1, "Samo videz") nothing comes off that matters and nobody retires
  const T = track('jezero'), mk = (dm) => { Math.random = seeded(13); const r = new C.Race(T, { numAI: 4, playerGrid: 5, laps: 3, playerModel: model('jelen'), assist: 2, seed: 13, difficulty: 1, damage: dm }); r.start(); return r; };
  const run = (r, sec, s0) => { for (let i = 0; i < sec / DT; i++) { Math.random = seeded(s0 + i); C.aiControl(r.player, r, DT); r.step(DT); } };
  const r2 = mk(2); run(r2, 10, 13000);
  const [a, b, c] = r2.cars.filter(o => !o.isPlayer);
  C.applyDamage(a, 1, 0, -a.m.wid / 2);   // (a side hit to 100 %: its panels and the wreck's go, no corner crushed, no wheel)
  C.detachPart(b, 'wheelFL'); C.detachPart(c, 'wheelFL'); C.detachPart(c, 'wheelRR');
  run(r2, 0.05, 13500); const cOut = c.wreck.dnf;
  run(r2, 4, 13600);
  const r1 = mk(1); run(r1, 10, 14000); const v = r1.cars.find(o => !o.isPlayer); C.wreckCar(v); run(r1, 4, 14500);
  // the title screen's demo (no player, never over; a field by opts.fieldModel) has no retirements: the marshals refit the wheels, pits or not
  Math.random = seeded(15); const rd = new C.Race(track('gozd'), { numAI: 6, noPlayer: true, fieldModel: model('kozorog'), laps: 9999, seed: 15, difficulty: 2, damage: 2 }); rd.start();
  for (let i = 0; i < 10 / DT; i++) { Math.random = seeded(15000 + i); rd.step(DT); }
  const dm = rd.cars[2]; C.detachPart(dm, 'wheelFL'); C.detachPart(dm, 'wheelRL'); for (let i = 0; i < 2.5 / DT; i++) { Math.random = seeded(15500 + i); rd.step(DT); }
  check('the rule: two wheels off -> retired at once; destroyed (dmg 1) with no wheel off, or one (refitted), races on; damage for looks only: a total wreck keeps its wheels and races on; the title demo (no player): no retirement, its wheels refitted (a pit track too)',
    cOut && !a.wreck.dnf && a.dmg === 1 && a.speed > 5 && !b.wreck.dnf && b.wreck.fix === 1 && !v.wreck.dnf && v.dmg === 1 && v.wreck.wl === 0 && !r1.cars.some(o => o.wreck && o.wreck.dnf) &&
    dm.m.id === 'kozorog' && !dm.wreck.dnf && dm.wreck.wl === 0 && dm.wreck.fix === 1,
    `two wheels ${cOut}; dmg 1: dnf ${a.wreck.dnf} at ${a.speed.toFixed(1)} m/s; one wheel: dnf ${b.wreck.dnf}, refits ${b.wreck.fix}; looks only: dnf ${v.wreck.dnf}, wheels off ${v.wreck.nL}; demo: dnf ${dm.wreck.dnf}, refits ${dm.wreck.fix}`);
}
{ // where a retired car stands: wrecked at 15-25 m/s on narrow and twisty tracks, or standing across the middle of the road; on Spa's
  // Kemmel straight, where its own side has no room; off the asphalt (or at the barrier), no hard knock from the others once it stands,
  // never a lap or a finish for it
  const bad = [], rows = [];
  for (const [tid, id] of [['gora', 'titan'], ['toskana', 'jelen'], ['grom', 'titan'], ['monaco', 'goljat'], ['monaco', 'jelen']]) {
    const T = track(tid); Math.random = seeded(3);
    const r = new C.Race(T, { numAI: 6, playerGrid: 7, laps: 3, playerModel: model(id), assist: 2, seed: 3, difficulty: 1, damage: 2, flags: true });
    r.start(); const P = r.player; let k = 0; const step = () => { Math.random = seeded(3000 + ++k); C.aiControl(P, r, DT); r.step(DT); };
    for (let i = 0; i < 20 / DT; i++) step();
    let X = null; for (let i = 0; i < 60 / DT && !X; i++) { step(); X = r.order.find(c => !c.isPlayer && !c.finished && c.speed > 15 && c.speed < 25 && c.lap >= 1) || null; }
    if (!X) { bad.push(tid + '/' + id + ': no rival at 15-25 m/s'); continue; }
    const v0 = X.speed; C.wreckCar(X);
    let tStop = -1, hard = 0, prev = false;
    for (let t = 0; t < 40; t += DT) { X.hitCar = 0; step(); if (X.wreck.stop && tStop < 0) tStop = t; const h = X.hitCar > 3.5; if (h && !prev && X.wreck.stop) hard++; prev = h; }
    rows.push(`${tid}/${id} at ${v0.toFixed(0)} m/s: stood after ${tStop.toFixed(1)} s`);
    if (!parkedOff(T, X) || tStop < 0 || tStop > 12 || hard) bad.push(`${tid}/${id}: ${fmtStand(T, X)}, stood after ${tStop.toFixed(1)} s, ${hard} hard knocks`);
  }
  for (const [tid, id] of [['jezero', 'tiger'], ['monaco', 'titan']]) {   // standing across the road (spun by the crash that ended it)
    const T = track(tid); Math.random = seeded(4);
    const r = new C.Race(T, { numAI: 4, playerGrid: 5, laps: 3, playerModel: model(id), assist: 2, seed: 4, difficulty: 1, damage: 2, flags: true });
    r.start(); const P = r.player; let k = 0; const step = () => { Math.random = seeded(4000 + ++k); C.aiControl(P, r, DT); r.step(DT); };
    for (let i = 0; i < 25 / DT; i++) step();
    const X = r.order.find(c => !c.isPlayer && !c.finished), i0 = X.q.i;
    X.place(T.px[i0], T.pz[i0], T.hd[i0] + Math.PI / 2); if (T.hasElev) X.y = X.py = T.hy[i0]; X.q = T.query(X.x, X.z, i0, X.q); X.sPrev = X.q.s;
    r.retire(X);
    let tStop = -1; for (let t = 0; t < 40; t += DT) { step(); if (X.wreck.stop && tStop < 0) tStop = t; }
    rows.push(`${tid}/${id} across the road: stood after ${tStop.toFixed(1)} s`);
    if (!parkedOff(T, X) || tStop < 0 || tStop > 15) bad.push(`${tid}/${id} across the road: ${fmtStand(T, X)}, stood after ${tStop.toFixed(1)} s`);
  }
  // Spa's Kemmel straight (s 360-860): 1.5 m from the asphalt to the barrier on the right, 3.8 m or more on the left. Wrecked on the right
  // at 20 m/s (s 380): over to the left, standing off the asphalt, at most one placement by the marshals; held on the right (its run-off
  // the right one, as one retiring before the narrow stretch would choose): after 8 s the marshals put it on the left, once (no re-placing)
  for (const id of ['titan', 'jelen']) for (const held of [false, true]) {
    const T = track('spa'); Math.random = seeded(5);
    const r = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 2, playerModel: model(id), assist: 2, seed: 5, difficulty: 1, damage: 2, flags: true, tyres: true });
    r.start(); const P = r.player; let k = 0; const step = () => { Math.random = seeded(5000 + ++k); C.aiControl(P, r, DT); r.step(DT); };
    for (let i = 0; i < 3 / DT; i++) step();
    const X = r.cars.find(c => !c.isPlayer), i0 = T.idx(380), v0 = held ? 0 : 20;
    X.place(T.px[i0] + T.nx[i0] * 4, T.pz[i0] + T.nz[i0] * 4, T.hd[i0]); if (T.hasElev) X.y = X.py = T.hy[i0];
    X.q = T.query(X.x, X.z, i0, X.q); X.sPrev = X.q.s; X.vx = Math.cos(X.h) * v0; X.vz = Math.sin(X.h) * v0;
    let places = 0; const park = r._parkRetired.bind(r); r._parkRetired = (c) => { if (c === X) places++; return park(c); };
    if (held) { X.locked = true; r.retire(X); X.wreck.side = 1; } else C.wreckCar(X);
    let tStop = -1; for (let t = 0; t < 40; t += DT) { step(); if (X.wreck.stop && tStop < 0) tStop = t; }
    const what = `spa/${id} ${held ? 'held on the right' : 'at 20 m/s on the right'}`;
    rows.push(`${what}: stood after ${tStop.toFixed(1)} s on the ${X.wreck.side > 0 ? 'right' : 'left'}, ${places} placement${places === 1 ? '' : 's'}`);
    if (!parkedOff(T, X) || places > 1 || X.wreck.side !== -1 || tStop < 0 || tStop > (held ? 9.5 : 12) || (held && places !== 1))
      bad.push(`${what}: ${fmtStand(T, X)}, on the ${X.wreck.side > 0 ? 'right' : 'left'}, stood after ${tStop.toFixed(1)} s, ${places} placements by the marshals`);
  }
  { // the leader retiring 40 m before the line of a one-lap race rolls over it: no lap, no finish
    const T = track('jezero'); Math.random = seeded(17);
    const r = new C.Race(T, { numAI: 4, playerGrid: 5, laps: 1, playerModel: model('jelen'), assist: 2, seed: 17, difficulty: 1, damage: 2 });
    r.start(); const P = r.player; let k = 0; const step = () => { Math.random = seeded(17000 + ++k); C.aiControl(P, r, DT); r.step(DT); };
    let L = null; for (let i = 0; i < 200 / DT && !L; i++) { step(); const o = r.order[0]; if (!o.isPlayer && !o.finished && o.dist > T.len - 40) L = o; }
    if (L) { r.retire(L); for (let i = 0; i < 15 / DT; i++) step(); }
    rows.push(`retired 40 m before the line: ${L ? (L.finished ? 'finished!' : 'no finish, ' + (L.dist - T.len).toFixed(0) + ' m past the line') : '(no leader there)'}`);
    if (!L || L.finished || r.finishOrder.includes(L) || L.lap > 1) bad.push('retired before the line: ' + (L ? 'lap ' + L.lap + ', finished ' + L.finished : 'no set-up'));
  }
  check('a retired car drives off onto the run-off and stands there: from 15-25 m/s within 12 s, from standing across the road within 15 s; off the asphalt (or at the barrier), no hard knock once it stands, no lap or finish past the line; on Spa\'s Kemmel straight (no room on the right): over to the left, or put there by the marshals once', !bad.length, bad.length ? bad.join('; ') : rows.join('; '));
}
{ // the marshals: a retired car that can not get off (here held where it is: locked) is put on its side's run-off after 8 s, clear of a
  // retired car standing there; the flags: a retired car is an incident (a yellow flag) for 30 s, by when it stands off the road, then not
  const T = track('jezero'); Math.random = seeded(19);
  const r = new C.Race(T, { numAI: 5, playerGrid: 6, laps: 3, playerModel: model('jelen'), assist: 2, seed: 19, difficulty: 1, damage: 2, flags: true });
  r.start(); const P = r.player; let k = 0; const step = () => { Math.random = seeded(19000 + ++k); C.aiControl(P, r, DT); r.step(DT); };
  for (let i = 0; i < 25 / DT; i++) step();
  const [X, Y] = r.order.filter(c => !c.isPlayer).slice(-2), i0 = (P.q.i + Math.round(300 / T.ds)) % T.N, sideAt = (c, d) => { c.place(T.px[i0] + T.nx[i0] * d, T.pz[i0] + T.nz[i0] * d, T.hd[i0]); c.q = T.query(c.x, c.z, i0, c.q); c.sPrev = c.q.s; };
  sideAt(X, 3); X.locked = true; r.retire(X);   // (300 m up the road from the player, on the asphalt, 3 m right of the middle)
  let tx = -1, yel20 = null; const age = () => r.time - X.wreck.dnfT, yel = () => r.fl.yel.some(y => y.car === X);
  for (let t = 0; t < 12; t += DT) { step(); if (X.wreck.stop && tx < 0) tx = t; }
  sideAt(Y, 3); Y.locked = true; r.retire(Y);   // (a second one just there, on the asphalt beside the first one's spot)
  let ty = -1; for (let t = 0; t < 12; t += DT) { step(); if (Y.wreck.stop && ty < 0) ty = t; if (yel20 === null && age() >= 20) yel20 = yel(); }
  const gap = Math.abs(((X.q.s - Y.q.s) % T.len + T.len * 1.5) % T.len - T.len / 2), need = (X.m.len + Y.m.len) / 2 + 1.5;
  while (age() < 45) step();
  const late = !yel() && X.fl.stopT === 0;
  check('the marshals: a retired car held on the asphalt 8 s is put on its run-off, a second one there clear of the first; the flags: a yellow for it 20 s on, none 45 s on',
    tx > 7.9 && tx < 9.5 && ty > 7.9 && ty < 9.5 && parkedOff(T, X) && parkedOff(T, Y) && X.wreck.side === Y.wreck.side && gap >= need - 0.01 && yel20 && late,
    `placed after ${tx.toFixed(1)} / ${ty.toFixed(1)} s, ${gap.toFixed(1)} m apart (>= ${need.toFixed(1)}), ${fmtStand(T, X)} / ${fmtStand(T, Y)}, yellow at 20 s ${yel20}, none at 45 s ${late}`);
}
{ // ... and where no spot takes it (the barrier 0.6 m past the asphalt all round): the marshals put it where it is least on the asphalt,
  // once, and leave it there (no placing it again every 8 s); the flags keep the yellow for it past 30 s (it stands on the asphalt)
  const T = track('jezero'); T.br.fill(T.w + 0.6); T.bl.fill(T.w + 0.6); Math.random = seeded(19);
  const r = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 3, playerModel: model('jelen'), assist: 2, seed: 19, difficulty: 1, damage: 2, flags: true });
  r.start(); const P = r.player; let k = 0; const step = () => { Math.random = seeded(19000 + ++k); C.aiControl(P, r, DT); r.step(DT); };
  for (let i = 0; i < 20 / DT; i++) step();
  const X = r.order.filter(c => !c.isPlayer).pop(), i0 = (P.q.i + Math.round(300 / T.ds)) % T.N;
  X.place(T.px[i0] + T.nx[i0] * 3, T.pz[i0] + T.nz[i0] * 3, T.hd[i0]); X.q = T.query(X.x, X.z, i0, X.q); X.sPrev = X.q.s; X.locked = true; r.retire(X);
  let places = 0, tp = -1; const park = r._parkRetired.bind(r); r._parkRetired = (c) => { if (c === X) { places++; if (tp < 0) tp = r.time - X.wreck.dnfT; } return park(c); };
  while (r.time - X.wreck.dnfT < 45) step();
  const yel = r.fl.yel.some(y => y.car === X), p = standOf(T, X);
  check('... no spot that takes it within 1 km (the barrier 0.6 m past the asphalt all round): put where it is least on the asphalt once, after 8 s, and left there; the flags keep its yellow past 30 s',
    places === 1 && tp > 7.9 && tp < 9.5 && !!X.wreck.fin && X.wreck.stop && p.slack < 0.05 && yel, `${places} placement${places === 1 ? '' : 's'} (the first after ${tp.toFixed(1)} s), ${fmtStand(T, X)}, yellow at 45 s ${yel}`);
}
{ // the flags: the player overtaking a retired car under the safety car owes nothing (it never comes back past)
  const T = track('jezero'); let found = 0, warned = 0, pen = 0;
  for (const seed of [1, 2, 3]) {
    Math.random = seeded(seed);
    const r = new C.Race(T, { numAI: 6, playerGrid: 7, laps: 4, playerModel: model('jelen'), assist: 2, seed, difficulty: 1, damage: 2, flags: true });
    r.start(); const P = r.player; let k = 0; const step = () => { Math.random = seeded(seed * 100000 + ++k); C.aiControl(P, r, DT); r.step(DT); };
    let X = null;
    for (let i = 0; i < 200 / DT && !X; i++) { step(); if (P.lap < 2 || r.fl.sc || r.fl.yel.length) continue; for (const o of r.cars) if (o !== P && o.dist - P.dist > 4 && o.dist - P.dist < 12 && o.speed > 15 && Math.abs(o.q.d - P.q.d) < 3) { X = o; break; } }
    if (!X) continue;
    found++; r._scOut(r.order.find(c => !c.finished)); r.retire(X);
    const pen0 = P.fl.pen || 0;
    for (let i = 0; i < 20 / DT; i++) { const ev0 = r.fl.pev; step(); if (r.fl.pev !== ev0 && r.fl.pevK === 'passWarn' && P.fl.owe && P.fl.owe.car === X) warned++; }
    pen += (P.fl.pen || 0) - pen0;
  }
  check('the flags: passing a retired car under the safety car owes nothing (no warning, no penalty)', found >= 2 && !warned && !pen, `${found} set-ups, ${warned} warnings for it, +${pen} s`);
}
{ // a wheel knocked off where there are no pits: the marshals refit it (the AI after 1.5 s, the player with the rescue button); 6 s standing
  const T = track('jezero'); Math.random = seeded(21);
  const r = new C.Race(T, { numAI: 4, playerGrid: 5, laps: 2, playerModel: model('jelen'), assist: 2, seed: 21, difficulty: 1, damage: 2 });
  r.start(); const P = r.player, A = r.cars.find(c => !c.isPlayer);
  let k = 0; const run = (sec) => { for (let i = 0; i < sec / DT; i++) { Math.random = seeded(21000 + ++k); C.aiControl(P, r, DT); r.step(DT); } };
  run(10); C.detachPart(A, 'wheelRL'); C.detachPart(P, 'wheelFR');
  run(1.0); const still = A.wreck.wl === 4 && A.lost.wheelRL && A.wreck.fix === 0; run(1.0);
  const fixed = A.wreck.wl === 0 && !A.lost.wheelRL && A.wreck.hold > 0 && A.wreck.fix === 1;
  r.rescue(P); const pf = P.wreck.wl === 0 && !P.lost.wheelFR && P.wreck.hold === 6 && P.wreck.fix === 1;
  run(5); const stood = A.speed < 0.5 && P.speed < 0.5; run(4);
  r.repairCar(A); const kept = A.wreck.fix === 1 && A.repairN === 1;
  check('no pits: a rival\'s lost wheel refitted by the marshals after 1.5 s, the player\'s with the rescue button; each stands 6 s, then drives on; every refit counted (wreck.fix, kept through a repair)', still && fixed && pf && stood && A.speed > 5 && P.speed > 3 && !A.wreck.dnf && kept,
    `rival ${still}/${fixed}, player ${pf}, stood ${stood}, then ${A.speed.toFixed(1)} / ${P.speed.toFixed(1)} m/s, refits after a repair ${A.wreck.fix}`);
}
{ // a pit track, a race with tyres: a rival with a wheel off comes in for a new one (the stop 1 s longer for it)
  const T = track('gozd'); Math.random = seeded(31);
  const r = new C.Race(T, { numAI: 5, playerGrid: 6, laps: 4, playerModel: model('modras'), assist: 2, seed: 31, difficulty: 1, damage: 2, tyres: true });
  r.start(); const P = r.player, A = r.cars.find(c => !c.isPlayer);
  let k = 0, want = false, dur = 0, wlAt = -1;
  for (; k < 240 / DT && !(A.repairN && !A.inPit); k++) {
    Math.random = seeded(31000 + k); if (k === Math.round(12 / DT)) { C.detachPart(A, 'wheelRR'); wlAt = A.dist; }
    C.aiControl(P, r, DT); r.step(DT); if (A.pitWant) want = true; if (A.pitState === 'repair') dur = A.pitDur;
  }
  check('a pit track in a race with tyres: a rival with a wheel knocked off pits for a new one (the stop a second longer), then races on', want && A.repairN >= 1 && A.wreck.wl === 0 && !A.lost.wheelRR && dur >= 3.5 && !A.wreck.dnf,
    `pitWant ${want}, repairs ${A.repairN}, stop ${dur.toFixed(2)} s, after ${((A.dist - wlAt) / 1000).toFixed(2)} km`);
}
{ // ... in the rain too: on slicks with the line wet past the wet tyres' mark but below this driver's own (no tyre stop yet), it still
  // comes in at once for the wheel
  const T = track('gozd'); Math.random = seeded(31);
  const r = new C.Race(T, { numAI: 5, playerGrid: 6, laps: 6, playerModel: model('modras'), assist: 2, seed: 31, difficulty: 1, damage: 2, tyres: true, rain: 0, weather: { at: 0, dur: 30, to: 0.45 } });
  r.start(); const P = r.player, A = r.cars.filter(c => !c.isPlayer).sort((a, b) => ((b.grid * 7) % 13) - ((a.grid * 7) % 13))[0];
  let wl = false, want = false, t = 0, line = 0;
  for (let k = 0; k < 120 / DT && !want; k++) {
    Math.random = seeded(32000 + k); C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (!wl && t > 40 && A.lap >= 1 && !A.inPit && !A.pitWant) { C.detachPart(A, 'wheelRR'); wl = t; line = r.wst.line; }
    if (wl && A.pitWant) want = t - wl;
  }
  const j = ((A.grid * 7) % 13) / 12;
  check('... in the rain too: on slicks, the line wet (0.45) but short of the driver\'s own mark for wet tyres, a wheel knocked off: in for it within a second', wl && A.ty.k === 'dry' && line > 0.3 && line < 0.35 + 0.35 * j && want !== false && want < 1,
    `tyres ${A.ty.k}, line ${line.toFixed(2)} (its mark ${(0.35 + 0.35 * j).toFixed(2)}), asked ${want === false ? 'never' : 'after ' + want.toFixed(2) + ' s'}`);
}
{ // whole races with wheels knocked off: the Nordschleife (one lap, 21 cars) and Monaco (two laps), three seeds each; no pits. Invariants
  // over every car, not one seed's outcomes: the two-wheel rival out at once; the one-wheel rivals refitted (or out with two off); the
  // player's wheel refitted by its rescue, then it drives on; every car out (finished or retired); every retired one with two wheels off;
  // the retired last in the results; no NaN
  for (const [tid, id, laps] of [['nring', 'kozorog', 1], ['monaco', 'lev', 2]]) {
    const T = track(tid), bad = [], rows = [];
    for (const sd of [51, 53, 55]) {
      Math.random = seeded(sd);
      const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps, playerModel: model(id), assist: 2, seed: sd, difficulty: 1, damage: 2 });
      r.start(); const P = r.player, ai = r.cars.filter(c => !c.isPlayer), A = ai[2], B = ai[5], D = ai[8];
      const cap = T.len * laps / 12 + 240; let t = 0, k = 0, nan = false, dOut = null, refit = null, pFix = null, pOn = null;
      while (t < cap && !out(r)) {
        Math.random = seeded(sd * 1000 + ++k);
        if (k === Math.round(30 / DT)) { C.detachPart(A, 'wheelFL'); C.detachPart(B, 'wheelRR'); C.detachPart(D, 'wheelFL'); C.detachPart(D, 'wheelRL'); C.detachPart(P, 'wheelRL'); }
        if (k === Math.round(36 / DT)) { r.rescue(P); pFix = P.wreck.wl === 0 && P.wreck.hold === 6 && P.wreck.fix === 1; }   // (the player presses the rescue button)
        C.aiControl(P, r, DT); r.step(DT); t += DT;
        if (k === Math.round(30 / DT)) dOut = D.wreck.dnf;
        if (k === Math.round(33 / DT)) refit = [A, B].every(c => (c.wreck.fix >= 1 && c.wreck.wl === 0) || (c.wreck.dnf && c.wreck.nL >= 2));
        if (k === Math.round(46 / DT)) pOn = P.speed > 3 && P.wreck.hold <= 0;
        if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
        for (const c of r.cars) if (!fin(c.x + c.z + c.vx + c.vz)) nan = true;
      }
      const res = r.estimateResults(), dnfs = r.cars.filter(c => c.wreck.dnf), nres = res.length - dnfs.length;
      const ok = out(r) && dOut && refit && pFix && pOn && P.finished && dnfs.every(c => !c.isPlayer && c.wreck.nL >= 2) && res.slice(nres).every(e => e.dnf) && res.slice(0, nres).every(e => !e.dnf) && !nan;
      rows.push(`seed ${sd}: ${t.toFixed(0)} s, retired ${dnfs.length}`);
      if (!ok) bad.push(`seed ${sd}: out ${out(r)}, two-wheel rival out ${dOut}, refits ${refit}, player refit ${pFix} / on ${pOn} / finished ${P.finished}, retired ${dnfs.map(c => c.name + ' (' + c.wreck.nL + ' wheels)').join(' ')}, NaN ${nan}`);
    }
    check(`${tid}: ${laps}-lap ${id} races with wheels knocked off (three seeds): the two-wheel rival out, one-wheel rivals and the player refitted, every car finished or retired with two wheels off, the retired last`,
      !bad.length, bad.length ? bad.join('; ') : rows.join(', '));
  }
}

// ---- 8b. attrition (the rule: two wheels off): whole one-lap races on the Nordschleife as the game runs them (its 20 rivals, flags),
//      one race (seed 7) in each of the eight one-make fields with the most retirements in a survey of all 29 (seeds 7-12, the eight also
//      13-24; retired a race: tornado 1.11, superkombi .94, skorpijon .89, modras .44, jelen .33, gad .28, perun .22, lev .17, the rest .17
//      at most; up to 5 in one race; Spa, 2 laps: 1 in 116 races, so not here). The first five drive with wider AI spacing (aiGap 7.5,
//      aiPass 4; over seeds 7-24 then .39, .06, .33, .22 and 0 a race, at most 2 in one). Destroyed cars (dmg 1) race on, so a field
//      stays a field (with the old rule, dmg >= 0.98, they lost 3-8 cars a lap here). Enforced: those five with that spacing, every race
//      over, no race with more than 4 retired, at most 6 in the eight ----
if (!only.length) {
  const d = C.TRACKS.find(x => x.id === 'nring'), T = new C.Track(d), laps = d.laps || 3, sd = 7, rows = [], bad = [];
  const FIELDS = ['tornado', 'superkombi', 'skorpijon', 'modras', 'gad', 'jelen', 'perun', 'lev'], spaced = FIELDS.slice(0, 5);
  let tot = 0, most = 0;
  for (const id of FIELDS) {
    Math.random = seeded(sd);
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps, playerModel: model(id), assist: 2, seed: sd, difficulty: 1, damage: 2, tyres: !!d.pit, compounds: true, flags: true });
    r.start(); const P = r.player; let t = 0, k = 0; const cap = T.len * laps / 10 + 120;
    while (t < cap && !out(r)) { Math.random = seeded(sd * 1000 + ++k); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    const n = r.cars.filter(c => c.wreck && c.wreck.dnf).length; tot += n; most = Math.max(most, n);
    rows.push(`${id} ${n}`);
    if (!out(r)) bad.push(`${id}: not over after ${t.toFixed(0)} s`);
  }
  const sp = spaced.filter(id => !(model(id).aiGap === 7.5 && model(id).aiPass === 4));
  if (sp.length) bad.push('no wider AI spacing: ' + sp.join(', '));
  check(`attrition on the Nordschleife (1 lap, 20 rivals, flags), one race (seed ${sd}) in each of the eight fields with the most retirements in the survey (${spaced.join(', ')}: wider AI spacing, aiGap 7.5 / aiPass 4; ${FIELDS.slice(5).join(', ')}): no race with more than 4 retired, at most 6 in the eight`,
    !bad.length && most <= 4 && tot <= 6, (bad.length ? bad.join('; ') + '; ' : '') + `retired ${rows.join(', ')} (${tot} in all)`);
}

// ---- 9. pace: SOKOL R and PANTER 6 race the four road cars (no field): their autopilot lap within 2.5 % of the KAZE RS's ----
if (!only.length || only.includes('sokol') || only.includes('panter')) {
  const lap = (id, tid) => {   // the player alone on autopilot, damage off: its second lap, a flying one
    const T = track(tid); Math.random = seeded(61);
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: model(id), assist: 2, seed: 61, difficulty: 1, damage: 0 });
    r.start(); const P = r.player;
    for (let k = 1; k < (T.len * 2 / 15 + 60) / DT && !P.finished; k++) { Math.random = seeded(61000 + k); C.aiControl(P, r, DT); r.step(DT); if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    return P.lapTimes[1];
  };
  for (const tid of ['jezero', 'spa', 'monaco']) {
    const k = lap('kaze', tid), s = lap('sokol', tid), p = lap('panter', tid);
    check(`${tid}: SOKOL R and PANTER 6 within 2.5 % of the KAZE RS's lap`, Math.abs(s / k - 1) <= 0.025 && Math.abs(p / k - 1) <= 0.025, `kaze ${k.toFixed(2)} s, sokol ${(100 * (s / k - 1)).toFixed(2)} %, panter ${(100 * (p / k - 1)).toFixed(2)} %`);
  }
}

// ---- 10. patch defs and broken defs: a throwaway Core with more defs pushed before core.js ----
if (!only.length) {
  const coreWith = (extra) => { const src = coreSource(), at = src.lastIndexOf('const Core = (function'); return new Function('module', 'exports', 'require', src.slice(0, at) + '\n;' + extra + '\n;' + src.slice(at) + '\n;return Core;')({ exports: {} }, {}, require); };
  const good = C.DEFS.find(d => d.id === 'raketa'), clone = (o) => JSON.stringify(Object.assign(JSON.parse(JSON.stringify(good)), o));
  const pc = (o) => Object.assign({ set: 'car', ht: 1.4, y0: 0.2 }, o);
  const warn = console.warn; console.warn = () => { };   // (the skipped defs' warnings: expected here)
  let X;
  try {
    X = coreWith(`var VEHICLE_DEFS = VEHICLE_DEFS || [];
      VEHICLE_DEFS.push({ id: 'ev', patch: true, cat: 'reli', field: ['ev', 'lev'], price: 21000, partNames: { spoiler: 'rear spoiler' }, snd: { kind: 'i4', hz: 1.1, loud: 1 }, look: { body: { len: 4.62 } },
        parts: { set: 'car', ht: 1.42, y0: 0.2, extra: { spoiler: { z: 1, th: 0.6, m: 2, r: 0.4, h: 0.05, lx: -0.95, lz: 0, f: 0.97 } } } });
      VEHICLE_DEFS.push({ id: 'pico', patch: true, field: ['ev'], parts: { set: 'car', ht: 1.42, y0: 0.2 } }, { id: 'titan', patch: true, fieldN: 5, desc: 'Drugo besedilo.' },
        { id: 'vortex', patch: true, field: ['zzglb'] }, { id: 'zzbare', patch: true, glb: null });
      VEHICLE_DEFS.push({ id: 'nosuch', patch: true, cat: 'mali' }, { id: 'kaze', patch: true, colour: 'red' }, { id: 'raketa', patch: true, parts: { set: 'car', ht: 1.4, y0: 0.2, drop: ['wheelFL'] } },
        { id: 'muscle', patch: true, parts: { set: 'race', ht: 1.3, y0: 0.2, over: { wing: { df: 0.8 }, bumperF: { df: 0.5 } } } });
      VEHICLE_DEFS.push(${clone({ id: 'zzbad', phys: Object.assign({}, good.phys, { warp: 9 }) })}, ${clone({ id: 'zzfield', field: ['nowhere'] })}, ${clone({ id: 'titan' })}, ${clone({ id: 'hatch' })},
        ${clone({ id: 'zzsnd', snd: { kind: 'v16', hz: 1, loud: 1 } })}, ${clone({ id: 'zzdesc', desc: 'Ima 300 kW moči.' })}, ${clone({ id: 'zzok', name: 'ZZ OK', field: ['zzok', 'p206', 'zzskin'] })},
        ${clone({ id: 'zzglb', name: 'ZZ GLB', glb: 'zz', field: ['zzglb'], look: null })}, ${clone({ id: 'zzskin', name: 'ZZ SKIN', glb: 'zz', field: ['zzskin'] })},
        ${clone({ id: 'zzbare', name: 'ZZ BARE', glb: 'zz', field: ['zzbare'], look: null })}, ${clone({ id: 'zzx1', parts: pc({ extra: { spoilerx: true } }) })}, ${clone({ id: 'zzx2', parts: pc({ over: { wheelFL: { r: 0.9 } } }) })},
        ${clone({ id: 'zzx3', parts: pc({ extra: { skirt: { z: 2, th: 0.6, cth: 0.5, m: 2, r: 0.5, h: 0.05, lx: 0, lz: -1, f: 0.2 } } }) })}, ${clone({ id: 'zzx4', arc: { amax: 1.7, kv: 2, rmin: 4.2, bscale: 9 } })},
        ${clone({ id: 'zzbs', name: 'ZZ BS', arc: { amax: 1.7, kv: 2, rmin: 4.2, bscale: 1.3 }, parts: pc({ over: { doorL: { rW: 0.3 } } }) })});`);
  } finally { console.warn = warn; }
  const m = (id) => X.MODELS.find(o => o.id === id), ev = m('ev'), skipped = X.DEFS_SKIPPED.map(s => s.id).sort();
  check('patch defs: one attaches its fields to a vehicle (the STRELA EV: category, part table with its extra, price, sound preset, look, names; the Core without the patch untouched)', ev.cat === 'reli' && X.partsOf(ev) === ev.parts && ev.parts.spoiler && ev.parts.wheelRR.wh === 3 &&
    X.CAREER.car.ev === 21000 && ev.sndP.kind === 'i4' && ev.def.look.body.len === 4.62 && ev.def.partNames.spoiler === 'rear spoiler' && ev.glb === undefined && !C.MODELS.find(o => o.id === 'ev').parts && C.CAREER.car.ev === 75000, Object.keys(ev.parts).length + ' parts');
  const four = (k) => X.MODELS[(k * 3 + 1) % 4];
  check('fields: a patched field (the STRELA EV\'s: an EV / LEV R cup; the PICO TURBO\'s: STRELA EVs); a glb model races in one only with a look of its own for the AI (a throwaway def with a look: in; one with no look: out, the field left empty: the four road cars); a patch may take the glb away (null: in again); the retired model never (left out of a field that names it); fieldN and texts patched, the def itself untouched',
    Array.from({ length: 6 }, (_, k) => X.aiModel(k, ev) === (k % 2 ? m('lev') : ev) && X.aiModel(k, m('pico')) === ev && X.aiModel(k, m('vortex')) === four(k) && X.aiModel(k, m('zzok')) === (k % 2 ? m('zzskin') : m('zzok')) &&
      X.aiModel(k, m('zzskin')) === m('zzskin') && X.aiModel(k, m('zzbare')) === m('zzbare')).every(Boolean) &&
    m('zzglb') && X.aiModel(0, m('zzglb')) === four(0) && m('zzskin').glb === 'zz' && m('zzbare').glb === null && X.DEFS.find(d => d.id === 'zzbare' && !d.patch).glb === 'zz' && m('p206').retired &&
    m('titan').fieldN === 5 && m('titan').def.desc === 'Drugo besedilo.' && X.DEFS.find(d => d.id === 'titan' && !d.patch).desc !== 'Drugo besedilo.');
  const why = (id) => (X.DEFS_SKIPPED.find(s => s.id === id) || {}).why || '';
  check('broken defs are skipped and listed (a patch of no vehicle, an unknown key, no wheel to drop, downforce shares over 1, an unknown phys key, a field of no vehicle, an id taken, a body\'s name, an unknown sound, kW in the text, true for a part with no standard entry, a wheel\'s place or size, cth with no corner, bscale out of range); good ones register as given (bscale kept, rW over a standard r)',
    skipped.join() === ['hatch', 'kaze', 'muscle', 'nosuch', 'raketa', 'titan', 'zzbad', 'zzdesc', 'zzfield', 'zzsnd', 'zzx1', 'zzx2', 'zzx3', 'zzx4'].join() && /downforce/.test(why('muscle')) && /standard/.test(why('zzx1')) && /wheel/.test(why('zzx2')) && /cth/.test(why('zzx3')) && /bscale/.test(why('zzx4')) &&
    X.MODELS.length === C.MODELS.length + 5 && X.MODELS.slice(0, C.MODELS.length).every((o, i) => o.id === C.MODELS[i].id) && X.ARC.zzbs.bscale === 1.3 && Math.abs(m('zzbs').parts.doorL.r - 0.3 * m('zzbs').wid) < 1e-12 && X.ARC.zzok.bscale === 1,
    'skipped ' + skipped.join(', ') + '; ' + ['muscle', 'zzx1', 'zzx2', 'zzx3', 'zzx4'].map(id => id + ': ' + why(id)).join(' / '));
  { // a patched one of the 11 with a part table of its own breaks apart as a registered vehicle does (the pico, the STRELA EV)
    const pico = m('pico'), HX = require('./lib/handling.js')(X);
    const w = new X.Car(pico, { phys: 'cs' }); w.dmgMode = 2; X.wreckCar(w);
    const all = !!w.wreck && Object.keys(pico.parts).every(k => w.lost[k]) && w.wreck.wl === 15 && w.wreck.nL === 4 && !new X.Car(m('kaze'), { phys: 'cs' }).wreck;
    const run30 = (wl) => { const c = HX.mkCar(pico, { v: 0 }); if (wl) { c.wreck.wl = wl; c.wreck.nL = 2; } for (let k = 0; k < 30 / DT; k++) HX.step(c, { thr: 1 }); return c.x; };
    const dOn = run30(0), dHub = run30(3);
    const T = new X.Track(X.TRACKS.find(d => d.id === 'jezero')); Math.random = seeded(23);
    const r = new X.Race(T, { numAI: 4, playerGrid: 5, laps: 3, playerModel: pico, assist: 2, seed: 23, difficulty: 1, damage: 2 });
    r.start(); let k = 0; const run = (sec) => { for (let i = 0; i < sec / DT; i++) { Math.random = seeded(23000 + ++k); X.aiControl(r.player, r, DT); r.step(DT); } };
    run(10); const [a, b, c] = r.cars.filter(o => !o.isPlayer);
    X.detachPart(a, 'wheelRL'); X.detachPart(b, 'wheelFL'); X.detachPart(b, 'wheelRR'); X.applyDamage(c, 0.97);
    const seq = c.wreck && c.wreck.seq ? c.wreck.seq.length : 0;
    run(2.5);
    check('a patched one of the 11 with a part table breaks apart as a registered vehicle: every part off in a wreck (wheels too), slower on the hub, the wreck sequence, the marshals\' refit, two wheels off retire it',
      all && dHub < 0.9 * dOn && a.m === ev && a.wreck.fix === 1 && a.wreck.wl === 0 && b.wreck.dnf && seq === 4 && !c.wreck.dnf,
      `wreck ${all}, 30 s flat out on four / two wheels ${dOn.toFixed(0)} / ${dHub.toFixed(0)} m, refits ${a.wreck.fix}, two off: retired ${b.wreck.dnf}, wreck queue ${seq}`);
  }
}

// ---- 11. info: the golden crash set-up (the player at full lock into the barrier at 6 s, 60 s) in a few of the new vehicles ----
if (!only.length) {
  const { SETUPS } = require('./lib/sim.js'), rows = [];
  let wl = 0, nr = 0;
  for (const id of ['miska', 'sokol', 'perun', 'gad', 'lev', 'pescenjak', 'tiger', 'mravlja', 'titan', 'goljat']) {
    for (const tid of ['jezero', 'gozd']) {
      const T = track(tid); Math.random = seeded(7);
      const r = new C.Race(T, Object.assign(SETUPS.crash.opts(C, false, 'cs'), { playerModel: model(id) })); r.start();
      let lost = 0;
      for (let k = 1; k <= 60 / DT; k++) { Math.random = seeded(1000 + k); SETUPS.crash.drive(C, r, k); r.step(DT); for (const c of r.cars) if (c.wreck) lost = Math.max(lost, c.wreck.nL); }
      nr++; if (lost) wl++; rows.push(`${id}@${tid} ${lost}`);
    }
  }
  info(`golden crash set-up in new vehicles (60 s): a wheel knocked off in ${wl} of ${nr} runs (the most in one car: ${rows.join(', ')})`);
}

Math.random = orig;
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} fleet checks (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(bad ? 1 : 0);
