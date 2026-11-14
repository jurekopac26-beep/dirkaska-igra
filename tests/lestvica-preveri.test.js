// Lestvica, preverjanje (Svetovna lestvica, seja 2: strežnik; docs/svetovna-lestvica.md, »Zaščita pred goljufanjem«, »2. Ponovitev vožnje v
// Node«): tools/lestvica-preveri.mjs checks the times waiting on the server in Node (--krog). Harju, Finska: time trials recorded in Node by their
// own core (js/vnos.js; the autopilot's inputs played back as a player's) and replayed by the tool's. Accepted: a plain run, a rescue, career wear,
// upgrades, a car with a part, the test cars' switch, a crash setting. Rejected: a part or a test car the run may not have, and a record forged (the
// autopilot, the time step, settings, weather, upgrades or assists other than the packet's, a time or a step count off, events cut, a slower
// throttle); a field set mid-run is suspicious, a time within 0.2 % of the replay is accepted as approximate (the crash rule, 13. 11.). The tool's
// core is clean after every check. The round against a fake server: the list, a record missing or broken, a server error, the results posted in
// batches of 200, the token sent as given, one line of counts only; the token from GitHub's OIDC with the audience »lestvica«. No network, no key.
//   node tests/lestvica-preveri.test.js
'use strict';
const path = require('path'), zlib = require('zlib');
const { loadCore } = require('./lib/core');
const { DT, seeded } = require('./lib/sim.js');
const V = require('../js/vnos.js');
const { stampOf } = require('../tools/stamp.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const kl = (x) => JSON.parse(JSON.stringify(x));
for (const k of ['LESTVICA_ZETON', 'LESTVICA_STREZNIK', 'ACTIONS_ID_TOKEN_REQUEST_URL', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN', 'GITHUB_STEP_SUMMARY']) delete process.env[k];

(async () => {
  const m = await import('../tools/lestvica-preveri.mjs');
  const K = m.koda();
  m.preveriCas({ st: 0, kljuc: 'x' }, {}, K);   // (a first call primes the tool's core: its clean settings, which every check puts back)
  const cisto = () => JSON.stringify([K.C.XR, K.C.TX, K.C.LOD]), S0 = cisto();
  const Crec = loadCore(), T = new Crec.Track(Crec.TRACKS.find(d => d.id === 'harju')), RND = Math.random, MAX = 120 * 400;
  const UP0 = { motor: 0, gume: 0, zavore: 0, aero: 0 };

  // a time trial recorded as the game records it: the autopilot drives once, its inputs are played back as a player's in a recorded race
  function posnemi(o = {}) {
    const model = Crec.MODELS.find(x => x.id === (o.model || 'rally')), max = o.max || MAX;
    Crec.setTest(o.tx || { cv: 1 }); Crec.setCrash(o.xr || {});
    const opts = () => ({ playerModel: model, fieldModel: undefined, playerUpg: o.upg || UP0, playerSetup: { wing: 1, gear: 1 }, playerColor: 1859542,
      playerDeli: o.deli, playerNum: 7, playerSlide: false, seed: 546600, difficulty: 1, assist: 2, repro: true, numAI: 0, numSet: undefined, playerGrid: 1,
      aiOrder: undefined, qualiBack: 0, laps: 1, fuel: false, damage: 2, phys: 'cs', rain: 0, weather: null, tyres: false, compounds: true, playerCmp: 'auto',
      strat: false, flags: false, winter: false, champ: false, tt: true, traffic: false, police: false, flying: 0, chars: false, slip: false, faults: false,
      radio: false, rival: undefined, tyreRule: Crec.MODELS.map(x => x.id), tyreCold: m.TYRE_COLD.slice(), wheelRule: undefined, voznja: undefined });
    try {
      Math.random = seeded(7);
      let race = new Crec.Race(T, opts()), P = race.player; const inp = [];
      if (o.wear) (Crec.careerWear.__vnos || Crec.careerWear)(P, o.wear);
      race.start();
      const AI = Crec.aiControl.__vnos || Crec.aiControl;
      for (let k = 0; k < max && !P.finished; k++) {
        AI(P, race, DT); P.inHand = 0; P.digitalSteer = false; inp.push([P.inSteer, P.inThr, P.inBrk]);
        if (o.rescue && k === o.rescue) { race.rescue(P); P.pitApT = P.pitCfT = P.pitBoxT = null; }
        race.step(DT);
      }
      Math.random = seeded(7);
      race = new Crec.Race(T, opts()); V.made(Crec, race, { kind: 'tt' }); P = race.player;
      if (o.wear) Crec.careerWear(P, o.wear);
      race.start();
      for (let k = 0; k < max && !P.finished; k++) {
        const a = inp[Math.min(k, inp.length - 1)]; P.inSteer = a[0]; P.inThr = a[1]; P.inBrk = a[2]; P.inHand = 0; P.digitalSteer = false;
        if (o.rescue && k === o.rescue) { race.rescue(P); P.pitApT = P.pitCfT = P.pitBoxT = null; }
        race.step(DT);
      }
      return { R: kl(V.out(race)), ft: P.finishTime, o };
    } finally { Math.random = RND; Crec.setTest({ cv: 1 }); Crec.setCrash({}); }
  }
  const zig = { igra: stampOf(path.join(__dirname, '..', 'js', 'game.js')), jedro: K.core };
  // the packet the game sends with the time (the fields the server checks at submission, streznik/svetovna-lestvica/src/pregled.js: the key, the time, the car, its upgrades, the assist, the stamps, the steps)
  function paket({ R, ft, o }, st = 1) {
    const ms = Number.isFinite(ft) ? Math.round(ft * 1000) : 90000, up = o.upg || UP0;
    return { st, kljuc: 'harju@cs', ms, vmes: [], avto: o.model || 'rally', nad: Object.fromEntries(Object.keys(UP0).map(k => [k, +(up[k] || 0)])), pomoc: 2,
      zig, eng: 'node', n: R.n, fs: R.fs, s0: (R.fs ?? R.n) - Math.round(ms * 0.12), s1: R.fs };
  }
  const opis = (g) => `${g.izid}${g.razlog ? ' ' + g.razlog : ''}${g.t !== undefined ? ' t ' + g.t : ''}${g.priblizno ? ' približno' : ''}`;
  function je(ime, got, exp) {
    const ok = got.izid === exp.izid && (exp.razlog === undefined || got.razlog === exp.razlog) && (exp.t === undefined || (exp.t ? Number.isInteger(got.t) : got.t === undefined))
      && (exp.priblizno === undefined || !!got.priblizno === exp.priblizno);
    check(ime, ok, opis(got) + (ok ? '' : ', pričakovano ' + opis(exp)));
  }
  const pc = (rec, c) => m.preveriCas(c, rec, K);
  function dodaj(R, nm, val, kje = 0) { const r = kl(R); let i = r.f.indexOf(nm); if (i < 0) { i = r.f.length; r.f.push(nm); } r.e.splice(kje * 3, 0, 0, i, val); return r; }
  const sredi = (R) => { const i = R.f.indexOf('!start'); let j = 0; for (let k = 0; k < R.e.length; k += 3) if (R.e[k + 1] === i) j = k / 3; return j + Math.floor((R.e.length / 3 - j) / 2); };
  const Z = (r) => ({ izid: 'zavrnjeno', razlog: r }), SU = (r) => ({ izid: 'sumljivo', razlog: r });

  // --- runs as the game records them
  const A = posnemi(), R = A.R, c0 = paket(A);
  check('posnetek do cilja', Number.isFinite(A.ft) && R.fs > 0 && R.n >= R.fs, `n ${R.n}, fs ${R.fs}, čas ${A.ft}`);
  je('osnovni', pc(R, c0), { izid: 'ok', t: false });
  je('osnovni, preizkus {}', pc(posnemi({ tx: {} }).R, c0), { izid: 'ok' });
  for (const [ime, o, exp] of [
    ['reševanje pri 3000', { rescue: 3000 }, { izid: 'ok', t: false }],
    ['obraba kariere', { wear: { body: 0.7, engine: 0.8 } }, { izid: 'ok' }],
    ['nadgradnje 3', { upg: { motor: 3, gume: 3, zavore: 3, aero: 3 } }, { izid: 'ok' }],
    ['miska s krilom', { model: 'miska', deli: { krilo: 16 } }, { izid: 'ok' }],
    ['preizkus cv 2', { tx: { cv: 2 } }, { izid: 'ok' }],
    ['trki roll 1', { xr: { roll: 1 } }, { izid: 'ok' }],
    ['cisterna, preizkus cv 2', { model: 'cisterna', tx: { cv: 2 }, max: 600 }, Z('preizkus')],
    ['rally s krilom', { deli: { krilo: 16 }, max: 600 }, Z('deli')],
  ]) { const X = posnemi(o); je(ime, pc(X.R, paket(X)), exp); }
  check('jedro čisto po pravih vožnjah', cisto() === S0);

  // --- forged
  const mid = sredi(R), op = (f) => { const r = kl(R); f(r.opts.o); return r; };
  for (const [ime, rec, c, exp] of [
    ['avtopilot', dodaj(R, '!aiControl', 0, mid), c0, Z('avtopilot')],
    ['korak dt', dodaj(R, 'dt', 0.01, mid), c0, Z('dogodki')],
    ['t.cE med vožnjo', dodaj(R, 't.cE', 0.5, mid), c0, SU('preizkus cE')],
    ['t.foo', dodaj(R, 't.foo', 1, mid), c0, Z('preizkus')],
    ['t.cv 9', dodaj(R, 't.cv', 9, mid), c0, Z('preizkus')],
    ['numAI 1', op(o => { o.numAI = 1; }), c0, Z('nastavitve')],
    ['duelModel', op(o => { o.duelModel = { m: 'rally' }; }), c0, Z('nastavitve')],
    ['launch', op(o => { o.launch = true; }), c0, Z('nastavitve')],
    ['flying 1', op(o => { o.flying = 1; }), c0, Z('nastavitve')],
    ['r.zbMode', dodaj(R, 'r.zbMode', 'sx', 0), c0, Z('nastavitve')],
    ['nadgradnje v paketu', R, { ...c0, nad: { ...c0.nad, motor: 1 } }, Z('nadgradnje')],
    ['pomoč v paketu', R, { ...c0, pomoc: 1 }, Z('pomoc')],
    ['nevihta brez dežja', dodaj(R, 'r.storm', true, 0), c0, Z('vreme')],
    ['vreme v nastavitvah', op(o => { o.weather = 'sclear'; }), c0, Z('vreme')],
    ['__proto__', JSON.parse(JSON.stringify(R).replace('"opts":{"o":{', '"opts":{"o":{"__proto__":1,')), c0, Z('zapis')],
    ['funkcija v nastavitvah', op(o => { o.playerSetup = { fn: 1 }; }), c0, Z('zapis')],
    ['neznan model', op(o => { o.playerModel = { m: 'nope' }; }), c0, Z('zapis')],
    ['c0.m med vožnjo', dodaj(R, 'c0.m', { m: 'raketa' }, mid), c0, SU('polje c0.m')],
    ['c0.x med vožnjo', dodaj(R, 'c0.x', 5, mid), c0, SU('polje c0.x')],
    ['čas +1 %', R, { ...c0, ms: Math.round(c0.ms * 1.01) }, Z('cas')],
    ['čas +0,1 %', R, { ...c0, ms: Math.round(c0.ms * 1.001) }, { izid: 'ok', t: true, priblizno: false }],
    ['korakov +1', R, { ...c0, n: c0.n + 1 }, Z('koraki')],
    ['prehodi krajši', (() => { const r = kl(R); r.cp.pop(); return r; })(), c0, Z('zapis')],
    ['tla krajša', (() => { const r = kl(R); r.dg.pop(); return r; })(), c0, Z('zapis')],
    ['trk dopisan', (() => { const r = kl(R); r.pf['5'] = [0, 1]; return r; })(), c0, { izid: 'ok', priblizno: true }],
    ['motor v paketu', R, { ...c0, eng: 'V8' }, Z('motor')],
    ['JSC v obeh', (() => { const r = kl(R); r.eng = 'JSC'; return r; })(), { ...c0, eng: 'JSC' }, { izid: 'ok', t: false }],
    ['drugo jedro', R, { ...c0, zig: { ...zig, jedro: 'drugo' } }, { izid: 'ni-mogoce' }],
    ['krog, ne čas', R, { ...c0, kljuc: 'harju-krog@cs' }, { izid: 'ni-mogoce' }],
    ['počasnejši plin', (() => { const r = kl(R), i = r.f.indexOf('c0.inThr'); for (let k = 0; k < r.e.length; k += 3) if (r.e[k + 1] === i && typeof r.e[k + 2] === 'number') r.e[k + 2] *= 0.8; return r; })(), c0, { izid: 'zavrnjeno' }],
  ]) je(ime, pc(rec, c), exp);
  check('jedro čisto po ponaredkih', cisto() === S0);

  // --- the round against a fake server (no network): the list, each record, the results posted; one line of counts only
  async function krog(odg, o = {}) {
    const posted = [], glave = new Set(), naslovi = [], vrstice = [], log0 = console.log;
    const f = async (u, init = {}) => {
      naslovi.push(String(u)); glave.add(init.headers && init.headers.Authorization);
      if (init.method === 'POST') { posted.push(JSON.parse(init.body)); return new Response('{"ok":true}', { status: 200 }); }
      return odg(String(u));
    };
    console.log = (...a) => vrstice.push(a.join(' '));
    try { const r = await m.krog({ zeton: 'x', streznik: 'http://x/', K, fetch: f, ...o }); return { ...r, posted, glave, naslovi, vrstice }; } finally { console.log = log0; }
  }
  const gz = zlib.gzipSync(JSON.stringify(R));
  const k1 = await krog((u) => {
    if (/[?&]st=43&/.test(u)) return new Response('{"ok":false,"napaka":"ni"}', { status: 404 });
    if (/[?&]st=42&del=vnos$/.test(u)) return new Response(gz, { status: 200 });
    return new Response(JSON.stringify({ ok: true, casi: [{ ...c0, st: 42 }, { ...c0, st: 43 }] }), { status: 200 });
  });
  const iz = k1.posted.flatMap(p => p.izidi);
  je('krog: posnetek se ujema', iz.find(x => x.st === 42) || {}, { izid: 'ok', t: false });
  je('krog: posnetka ni', iz.find(x => x.st === 43) || {}, Z('ni-posnetka'));
  check('krog: en POST, žeton kot je dan, naslovi brez dvojne poševnice', k1.posted.length === 1 && k1.glave.size === 1 && k1.glave.has('Bearer x')
    && k1.naslovi.every(u => u.startsWith('http://x/v1/preveri')), `${k1.posted.length} POST, ${[...k1.glave].join('|')}`);
  check('krog: ena vrstica s števili', k1.vrstice.length === 1 && k1.vrstice[0] === '2 preverjenih: 1 ok (0 približno), 1 zavrnjenih, 0 ni mogoče, 0 sumljivih', k1.vrstice.join(' | '));
  const k2 = await krog((u) => {
    const st = (/[?&]st=(\d+)/.exec(u) || [])[1];
    if (!st) return new Response(JSON.stringify({ ok: true, casi: Array.from({ length: 201 }, (_, i) => ({ ...c0, st: i + 1 })) }), { status: 200 });
    if (st === '1') return new Response('{"ok":false}', { status: 500 });
    if (st === '2') return new Response('ni gzip', { status: 200 });
    return new Response('{"ok":false,"napaka":"ni"}', { status: 404 });
  });
  const iz2 = k2.posted.flatMap(p => p.izidi);
  check('krog: 201 izidov v dveh POST (200 + 1)', k2.posted.length === 2 && k2.posted[0].izidi.length === 200 && k2.posted[1].izidi.length === 1 && iz2.length === 201);
  je('krog: napaka strežnika', iz2.find(x => x.st === 1) || {}, { izid: 'ni-mogoce' });
  je('krog: pokvarjen posnetek', iz2.find(x => x.st === 2) || {}, Z('zapis'));
  check('krog: vrstica 201', k2.vrstice[0] === '201 preverjenih: 0 ok (0 približno), 200 zavrnjenih, 1 ni mogoče, 0 sumljivih', k2.vrstice.join(' | '));
  const napaka = async (p) => { try { await p; return ''; } catch (e) { return String(e && e.message); } };
  check('krog: seznam zavrnjen', /^seznam: 401$/.test(await napaka(krog(() => new Response('{}', { status: 401 })))));
  check('krog brez naslova strežnika', /ni naslova strežnika/.test(await napaka(m.krog({ zeton: 'x', K, fetch: async () => { throw new Error('omrežje'); } }))));

  // --- the token: given, from the environment, from GitHub's OIDC (audience »lestvica«), else an error
  check('žeton brez vira', /ni žetona/.test(await napaka(m.zeton({}))));
  process.env.LESTVICA_ZETON = 'iz-okolja';
  check('žeton iz okolja', (await m.zeton({})) === 'iz-okolja');
  delete process.env.LESTVICA_ZETON;
  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://oidc.test/token?api-version=2.0'; process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'zahteva';
  let vid = null;
  const tok = await m.zeton({ fetch: async (u, init) => { vid = { u: String(u), h: init && init.headers && init.headers.Authorization }; return new Response('{"value":"abc"}', { status: 200 }); } });
  check('žeton iz GitHub OIDC', tok === 'abc' && vid && vid.u === 'https://oidc.test/token?api-version=2.0&audience=lestvica' && vid.h === 'Bearer zahteva', vid && vid.u);
  check('OIDC zavrnjen', /^OIDC: 403$/.test(await napaka(m.zeton({ fetch: async () => new Response('{}', { status: 403 }) }))));

  console.log(`\n${n - bad}/${n} checks passed`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
