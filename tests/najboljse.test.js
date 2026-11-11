// Najboljše vožnje (docs/najboljse-voznje.md): js/najboljse.js in Node, with the game's own js/napake.js (the packing, the gzip) and Core;
// IndexedDB and the downloads stubbed. A time trial up Bâlea driven by the autopilot and recorded as js/game.js records a race (as
// tests/voznja.test.js does), and copies of it with a fault each (put back on the road, the pits, a spin, driving backwards, a long trip off
// the road, a hit, the weather changing, a recording without the whole run): the game's check of a run (Najboljse.preveri) gives what
// tools/voznja.mjs gives for the same file (its reason, where, when; a clean run its time); the rules the same as the tool's. Then the game's
// side: a run over the finish (Najboljse.cilj) kept with no device and no log in its header, once per race, not on a test track nor out of a
// time trial; the best 10 per track, weather and driving physics; a run of an older road out; and Deli 10 najboljših: one file of the runs
// one after another, which the tool reads as runs <file> #1 .. #n, each one measured.
//   node tests/najboljse.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const { pathToFileURL } = require('url');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const OUT = path.join(ROOT, 'test-results', 'najboljse-test'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const ctx = vm.createContext({ TextEncoder, TextDecoder, Blob, Response, CompressionStream, DecompressionStream, File: typeof File === 'function' ? File : undefined,
  performance, setTimeout, clearTimeout, console, document: { hidden: true, getElementById: () => null }, Core: C });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'napake.js'), 'utf8') + '\n;this.Napake = Napake;', ctx, { filename: 'js/napake.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'najboljse.js'), 'utf8') + '\n;this.Najboljse = Najboljse;', ctx, { filename: 'js/najboljse.js' });
const NK = ctx.Napake, NB = ctx.Najboljse;
// the store (IndexedDB in the game: Napake.shramba) and the downloads, here in memory
const mem = new Map(), store = {
  getAll: () => ({ result: [...mem.values()] }),
  put: (o) => { mem.set(o.id, o); return { result: o.id }; },
  delete: (id) => { mem.delete(id); return { result: undefined }; }
};
NK.shramba = () => (mode, fn) => Promise.resolve().then(() => { const out = fn(store); return out && 'result' in out ? out.result : undefined; });
let shared = null; NK.prenesi = (blob, name) => { shared = { blob, name }; };
const W = 7;

// a race driven by the autopilot and recorded as js/game.js records it (recStep, rrpOf; tests/voznja.test.js record)
function record(tid, opts) {
  const def = C.TRACKS.find(d => d.id === tid), T = new C.Track(def), orig = Math.random;
  try {
    Math.random = seeded(7);
    const race = new C.Race(T, Object.assign({ numAI: 0, playerModel: C.MODELS[0], assist: 2, seed: 3, damage: 0 }, opts));
    race.start();
    const P = race.player, frames = [];
    let next = 0, prev = -1;
    for (let k = 1; k < 120 * 1500; k++) {
      Math.random = seeded(1000 + k);
      C.aiControl(P, race, DT);
      if (P.stuckT > 3 || P.wrongT > 3) race.rescue(P);
      race.step(DT);
      if ((race.state === 'racing' || race.state === 'done') && race.time >= next) {
        next = race.time + 0.05;
        const f = new Float32Array(1 + 2 * W); f[0] = race.time;
        const put = (o, c, bits) => { f[o] = c.x; f[o + 1] = c.y || 0; f[o + 2] = c.z; f[o + 3] = c.h; f[o + 4] = c.vl || 0; f[o + 5] = c.delta || 0; f[o + 6] = bits; };
        put(1, P, (P.inBrk > 0.08 && P.vl > 0.5 ? 1 : 0) + (race.putT && race.putT.get(P) > prev ? 2 : 0) + (P.inPit || race.isOut(P) ? 4 : 0));
        frames.push(f); prev = race.time;
      }
      if (P.finished && race.time > P.finishTime + 3) break;
    }
    const car = Object.assign({ m: P.m.id, name: P.name, color: P.color, num: P.num, grid: P.grid, pl: 1, lap: P.lap || 1, lapStart: P.lapStart || 0, lapTimes: (P.lapTimes || []).slice(),
      pf: { upg: P.upg, setup: P.setup, deli: P.deli || null } }, P.finished ? { fin: 1, ft: P.finishTime } : {});
    const H = { ver: 'test', track: tid, name: def.name, mode: 'tt', wx: race.rain ? 'dez' : 'suho', laps: race.laps, w: W, n: 1, tt: true, rain: race.rain || 0, season: 'summer', tod: 'day',
      cars: [car], fin: [0], ev: [], flags: [], date: Date.now() };
    return { H, frames, T, P, def };
  } finally { Math.random = orig; }
}
const save = (name, H, F) => { const f = path.join(OUT, name); fs.writeFileSync(f, zlib.gzipSync(Buffer.from(NK.rrp.pack(H, F)))); return f; };
const copyH = (H) => JSON.parse(JSON.stringify(H));
const copyF = (F) => F.map(f => Float32Array.from(f));
const near = (a, b, e) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= e;

(async () => {
  const V = await import(pathToFileURL(path.join(ROOT, 'tools', 'voznja.mjs')).href);

  // 1. the rules of a valid run: the tool's (RULES), the same numbers
  const diff = Object.keys(NB.RULES).filter(k => NB.RULES[k] !== V.RULES[k]);
  check('pravila veljavne vožnje so pravila orodja (tools/voznja.mjs RULES)', !diff.length && Object.keys(NB.RULES).length === 10, diff.join(', '));
  // the time trials of the real tracks are all open roads (a lap of a circuit is not a run the game keeps)
  const hasTT = (d) => !!(d.timeTrial || (d.modes && d.modes.indexOf('tt') >= 0));
  const ttDefs = C.TRACKS.filter(d => !d.test && !d.pending && hasTT(d)), krozne = ttDefs.filter(d => !new C.Track(d).open).map(d => d.id);
  check('vožnje na čas pravih prog so vse po odprti cesti', ttDefs.length > 0 && !krozne.length, ttDefs.length + ' prog' + (krozne.length ? ', krožne: ' + krozne.join(', ') : ''));

  // 2. a clean run up Bâlea and its copies with a fault each: the game's check and the tool's, the same
  const clean = record('balea', { laps: 1, seed: 3 });
  const P = clean.H.cars[0], ft = P.ft, T = clean.T;
  check('vožnja z avtopilotom do cilja (Bâlea)', clean.P.finished && ft > 60 && clean.frames.length > 1000, 'čas ' + (ft || 0).toFixed(2) + ' s, ' + clean.frames.length + ' vzorcev');
  const F0 = clean.frames, NF = F0.length, kAt = (t) => F0.findIndex(f => f[0] >= t);
  const q = {};
  const cases = [{ ime: 'cista', H: clean.H, F: F0, cakaj: { ok: 1 } }];
  { // put back on the road (bit 2) at 40 % of the run
    const F = copyF(F0); F[kAt(ft * 0.4)][7] |= 2; cases.push({ ime: 'vrnjen', H: clean.H, F, cakaj: 'vrnjen na cesto' }); }
  { // the pits, out of the race (bit 4) for 0.3 s at 30 %
    const F = copyF(F0), k = kAt(ft * 0.3); for (let j = k; j < k + 6; j++) F[j][7] |= 4; cases.push({ ime: 'boksi', H: clean.H, F, cakaj: 'boksi' }); }
  { // a spin: the nose turned back for 0.5 s at 50 %, the car going on (the speed over the ground kept)
    const F = copyF(F0), k = kAt(ft * 0.5); for (let j = k; j < k + 10; j++) F[j][4] += Math.PI; cases.push({ ime: 'vrtenje', H: clean.H, F, cakaj: 'vrtenje' }); }
  { // driving backwards: for 1 s at 60 % the car goes back the way it came (the positions mirrored about the sample k)
    const F = copyF(F0), k = kAt(ft * 0.6); for (let j = k + 1; j <= k + 20; j++) { F[j][1] = F0[2 * k - j][1]; F[j][3] = F0[2 * k - j][3]; } cases.push({ ime: 'nazaj', H: clean.H, F, cakaj: 'vožnja nazaj' }); }
  { // a trip off the road: 4 s at 70 % with the car 2.5 m past the asphalt's edge (and its curb)
    const F = copyF(F0), k = kAt(ft * 0.7); let hint = -1;
    for (let j = k; j < k + 80; j++) {
      const f = F[j]; T.query(f[1], f[3], hint, q); hint = q.i;
      const edge = T.wAt(q.a) + (T.curb && T.curb[q.a] ? T.curbW || 1.5 : 0), to = (q.d >= 0 ? 1 : -1) * (edge + 2.5);
      f[1] += q.nx * (to - q.d); f[3] += q.nz * (to - q.d);
    }
    cases.push({ ime: 'zlet', H: clean.H, F, cakaj: 'zlet s ceste' }); }
  { // a hit: at 80 % the car stops dead where it is (its speed 0) for 2 s
    const F = copyF(F0), k = kAt(ft * 0.8); for (let j = k + 1; j <= k + 40; j++) { F[j][1] = F0[k][1]; F[j][2] = F0[k][2]; F[j][3] = F0[k][3]; F[j][5] = 0; } cases.push({ ime: 'trk', H: clean.H, F, cakaj: 'trk' }); }
  { // the rain coming on in the middle of the run (wxs: the road wet while it rains and RULES.wetIn s after)
    const H = copyH(clean.H); H.wxs = { r0: 0, r1: 1, at: ft / 2, dur: 10 }; cases.push({ ime: 'vreme', H, F: F0, cakaj: 'vreme se spreminja' }); }
  { // a recording without the whole run (its last 2 s before the finish missing)
    cases.push({ ime: 'nepopoln', H: clean.H, F: F0.filter(f => f[0] <= ft - 2), cakaj: 'nepopoln krog (posnetek ga nima celega)' }); }
  // and recordings the tool leaves out whole: no player, the driving school, the run not over the finish
  { const H = copyH(clean.H); H.cars[0].pl = 0; cases.push({ ime: 'brez-igralca', H, F: F0, cakaj: 'v posnetku ni igralca', cel: 1 }); }
  { const H = copyH(clean.H); H.mode = 'tt+sola'; cases.push({ ime: 'sola', H, F: F0, cakaj: 'šola vožnje', cel: 1 }); }
  { const H = copyH(clean.H); delete H.cars[0].fin; delete H.cars[0].ft; cases.push({ ime: 'ni-koncana', H, F: F0, cakaj: /^vožnja ni končana \(v posnetku \d+ s dirke\)$/, cel: 1 }); }
  for (const c of cases) c.file = save(c.ime + '.rrp', c.H, c.F);
  const { profil, text } = V.measure(cases.map(c => c.file), { core: C, napake: NK });
  const rows = (k) => profil.proge.flatMap(p => p.krogi[k]);
  for (const c of cases) {
    const v = await NB.preveri(new C.Track(clean.def), c.H, c.F), name = path.basename(c.file);
    if (c.cakaj.ok) {
      const u = rows('uporabljeni').find(r => r.datoteka === name);
      check('čista vožnja velja: v igri in v orodju', v.ok === 1 && v.cas === ft && v.vreme === 'suho' && !!u && near(u.cas, ft, 0.0006), JSON.stringify(v) + ' · orodje: ' + (u ? u.cas : 'ni je'));
      continue;
    }
    if (c.cel) {   // (the tool: the whole recording left out, in its summary)
      const m = text.match(new RegExp('✗ ' + name.replace(/[.]/g, '\\.') + ': (.*)'));
      const ok = v.razlog && (c.cakaj instanceof RegExp ? c.cakaj.test(v.razlog) : v.razlog === c.cakaj);
      check('posnetek brez vožnje (' + c.ime + '): ' + v.razlog, ok && !!m && m[1] === v.razlog, 'orodje: ' + (m ? m[1] : 'ni ga'));
      continue;
    }
    const x = rows('izpusceni').find(r => r.datoteka === name), mine = { razlog: v.razlog, s: v.s, t: v.t }, tools = x ? { razlog: x.razlog, s: x.s, t: x.t } : null;
    check('neveljavna vožnja (' + c.ime + '): ' + c.cakaj + (v.s != null ? ' pri ' + v.s + ' m' : '') + ', kot orodje', v.razlog === c.cakaj && !v.ok && JSON.stringify(mine) === JSON.stringify(tools),
      'igra ' + JSON.stringify(mine) + ' · orodje ' + JSON.stringify(tools));
  }

  // 3. the weather of a run (as the tool's condOf), the list's order and bounds
  const vr = (h, t0, t1) => NB.vremeOf(Object.assign({ wx: 'suho', rain: 0, season: 'summer' }, h), t0 == null ? 0 : t0, t1 == null ? 100 : t1);
  const wx = [
    [vr({}), 'suho'], [vr({ rain: 0.6 }), 'mokro'], [vr({ wx: 'dez' }), 'mokro'], [vr({ season: 'winter' }), 'suho·zima'], [vr({ rain: 1, season: 'winter' }), 'mokro·zima'],
    [vr({ wxs: { r0: 0, r1: 1, at: 150, dur: 10 } }), 'suho'],              // (the rain only after the run)
    [vr({ wxs: { r0: 0, r1: 1, at: 50, dur: 10 } }), null],                 // (the rain in the run)
    [vr({ wxs: { r0: 0, r1: 1, at: -30, dur: 10 } }, 10, 100), null],       // (the road getting wet: till 40 s after the rain's full)
    [vr({ wxs: { r0: 0, r1: 1, at: -30, dur: 10 } }, 25, 100), 'mokro'],    // (from 40 s after the rain's full: wet)
    [vr({ wxs: { r0: 1, r1: 0, at: -300, dur: 10 } }), 'suho'],             // (dried: 240 s per unit of rain gone)
    [vr({ wxs: { r0: 1, r1: 0, at: -200, dur: 10 } }), null],
    [vr({ wxs: { r0: 1, r1: 1, at: 50, dur: 10 }, rain: 1 }), 'mokro']     // (no change: the header's rain)
  ];
  const wbad = wx.map((w, i) => (w[0] === w[1] ? '' : i + ': ' + w[0] + ' ≠ ' + w[1])).filter(Boolean);
  check('vreme vožnje: suho, mokro, zima in vreme, ki se spreminja (kot orodje)', !wbad.length, wbad.join('; '));
  const l9 = Array.from({ length: 9 }, (_, i) => ({ cas: 100 + i })), l10 = l9.concat([{ cas: 120 }]);
  check('v seznamu ostane 10 najboljših (hitrejša od desete pride noter)', NB.MAX === 10 && NB.obdrzi(l9, 500) && NB.obdrzi(l10, 119.9) && !NB.obdrzi(l10, 120) && !NB.obdrzi(l10, 130));

  // 4. over the finish: the run kept (js/game.js NV_HOOKS stand-ins)
  const toasts = [], testDef = C.TRACKS.find(d => d.test && hasTT(d)) || C.TRACKS.find(d => d.test);
  let ttOn = true, rec = {}, track = T, H1 = clean.H, F1 = F0, phys = 'cs';
  NB.init({ tt: () => ttOn, rec: () => rec, track: () => track, phys: () => phys, carName: () => 'Kaze', ime: () => 'Bâlea', cas: (t) => t.toFixed(3), toast: (t) => toasts.push(t),
    rrp: () => ({ H: Object.assign({}, H1, { dev: 'naprava', devIme: 'ime naprave', dn: [{ t: 1, opis: 'napaka' }], file: 'moj.rrp' }), frames: F1 }) });
  const run = async (o) => { rec = {}; if (o.H) H1 = o.H; if (o.F) F1 = o.F; NB.cilj(); await NB.cakaj(); };
  await run({});
  let all = await NB.vse();
  const o1 = all[0], rid = clean.def.recId || clean.def.id;
  check('vožnja čez cilj je shranjena (proga, cesta, vreme, fizika, čas, avto)', all.length === 1 && o1.proga === 'balea' && o1.rid === rid && o1.vreme === 'suho' && o1.fiz === 'cs' && o1.cas === ft && o1.avto === 'Kaze' && o1.m === P.m && o1.bytes === o1.blob.size,
    JSON.stringify(all.map(o => ({ proga: o.proga, rid: o.rid, vreme: o.vreme, fiz: o.fiz, cas: o.cas, avto: o.avto, m: o.m, bytes: o.bytes }))));
  if (o1) {
    const u = new Uint8Array(zlib.gunzipSync(Buffer.from(await o1.blob.arrayBuffer()))), r = NK.rrp.unpack(u), Hk = r.H;
    const same = r.frames.length === NF && r.frames.every((f, j) => f.length === F0[j].length && f.every((x, i) => Object.is(x, F0[j][i])));
    check('posnetek vožnje: brez naprave in dnevnika napak, s fiziko vožnje, vzorci brez izgube', !['dev', 'devIme', 'dn', 'file'].some(k => k in Hk) && Hk.phys === 'cs' && Hk.date === o1.date && same,
      Object.keys(Hk).join(','));
  }
  NB.cilj(); await NB.cakaj();   // (the same race over again: rec the same)
  check('ista dirka se shrani enkrat', (await NB.vse()).length === 1);
  { const keep = track; track = { def: testDef }; await run({}); track = { def: Object.assign({}, clean.def, { pending: true }) }; await run({}); track = keep; }
  ttOn = false; await run({}); ttOn = true;
  check('testna proga, proga na odločanju in vožnja, ki ni na čas: nič', (await NB.vse()).length === 1, testDef ? testDef.id : 'ni testne proge');
  await run({ F: cases.find(c => c.ime === 'trk').F }); F1 = F0;
  check('neveljavna vožnja ni shranjena', (await NB.vse()).length === 1);

  // the best 10 of the dry runs in the classic physics (the times a little apart), one wet, one in the new physics, one of an older road
  const withFt = (d) => { const H = copyH(clean.H); H.cars[0].ft = ft + d; return H; };
  for (let k = 1; k <= 10; k++) await run({ H: withFt(k * 0.01), F: F0 });
  all = await NB.vse();
  const dry = all.filter(o => o.vreme === 'suho' && o.fiz === 'cs').map(o => o.cas).sort((a, b) => a - b);
  check('11 voženj: ostane 10 najboljših', dry.length === 10 && near(dry[9], ft + 0.09, 1e-6), dry.map(c => (c - ft).toFixed(2)).join(' '));
  await run({ H: withFt(0.5) });
  check('počasnejša od desete ni shranjena', (await NB.vse()).length === 10);
  await run({ H: withFt(-0.05) });
  all = await NB.vse();
  const dry2 = all.filter(o => o.vreme === 'suho' && o.fiz === 'cs').map(o => o.cas).sort((a, b) => a - b);
  check('hitrejša pride noter, deseta gre ven', dry2.length === 10 && near(dry2[0], ft - 0.05, 1e-6) && near(dry2[9], ft + 0.08, 1e-6), dry2.map(c => (c - ft).toFixed(2)).join(' '));
  { const H = withFt(-0.01); H.rain = 1; H.wx = 'dez'; await run({ H }); }
  phys = 'nova'; await run({ H: withFt(-0.02) }); phys = 'cs';
  all = await NB.vse();
  check('mokro in nova fizika vožnje: svoja seznama', all.length === 12 && all.some(o => o.vreme === 'mokro' && o.fiz === 'cs') && all.some(o => o.vreme === 'suho' && o.fiz === 'nova'),
    all.map(o => o.vreme + '/' + o.fiz).join(' '));
  // a run of an older road of this track (def.recId changed since): out of the list, and out of the store with the next run kept
  await NB.test.put(Object.assign({}, o1, { id: 'nv-star', rid: rid + '-stara', cas: 1 }));
  await NB.test.put(Object.assign({}, o1, { id: 'nv-testna', proga: testDef.id, rid: testDef.recId || testDef.id, cas: 1 }));
  all = await NB.vse();
  const iz = NB.izbor(all, 'balea');
  check('seznam proge: skupine po vrsti (suho, nova fizika, mokro), najboljša prva; brez stare ceste', iz.length === 12 && !iz.some(o => o.id === 'nv-star') && NB.izbor(all, testDef.id).length === 0 &&
    iz.slice(0, 10).every((o, i) => o.vreme === 'suho' && o.fiz === 'cs' && (!i || o.cas >= iz[i - 1].cas)) && iz[10].fiz === 'nova' && iz[11].vreme === 'mokro',
    iz.map(o => o.vreme + '/' + o.fiz).join(' '));
  await run({ H: withFt(-0.1) });
  all = await NB.vse();
  check('vožnja stare ceste gre iz shrambe z naslednjo shranjeno', !all.some(o => o.id === 'nv-star') && all.filter(o => o.proga === 'balea').length === 12);

  // 5. Deli 10 najboljših: one file, the runs one after another; the tool reads each
  const f = await NB.deli('balea');
  const ok = !!f && !!shared && /^najboljse_balea_\d{8}-\d{4}\.rrp$/.test(shared.name) && f.n === 12 && toasts.some(t => t.indexOf(shared.name) >= 0);
  check('Deli 10 najboljših: datoteka najboljse_balea_<datum>.rrp v Prenosih', ok, shared ? shared.name + ' · ' + f.n + ' voženj · ' + shared.blob.size + ' B' : 'ni datoteke');
  if (shared) {
    const file = path.join(OUT, shared.name); fs.writeFileSync(file, Buffer.from(await shared.blob.arrayBuffer()));
    const recs = V.readRrpAll(NK, file), M = V.measure([file], { core: C, napake: NK }), used = M.profil.proge.flatMap(p => p.krogi.uporabljeni), skip = M.profil.proge.flatMap(p => p.krogi.izpusceni);
    const names = Array.from({ length: 12 }, (_, i) => shared.name + ' #' + (i + 1));
    check('orodje prebere vse vožnje datoteke (' + recs.length + ')', recs.length === 12 && recs.every(r => r.H && r.H.track === 'balea' && r.frames.length === NF));
    check('orodje izmeri vsako vožnjo: <datoteka> #1 … #12, nobena izpuščena', JSON.stringify(M.profil.datoteke) === JSON.stringify(names) && used.length === 12 && !skip.length,
      used.length + ' izmerjenih, ' + skip.length + ' izpuščenih' + (skip.length ? ': ' + skip.map(r => r.datoteka + ' ' + r.razlog).join('; ') : ''));
  }
  check('proga brez voženj: ni datoteke', (await NB.deli('pikes')) === null);

  console.log(`\n${n - bad}/${n} OK`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
