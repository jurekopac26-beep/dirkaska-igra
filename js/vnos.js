/* Vnos: a run's input as a record, and its replay (Svetovna lestvica, seja 1: ponovljivost; docs/svetovna-lestvica.md, »Ponovljivost med
   brskalniki«). A repeatable race (opts.repro: its random events from its own seed, js/core.js Race.rnd; the game asks for it in a run alone,
   js/game.js newRace, and in the test mode) records what the game did to it between its physics steps: every field of the race, its options,
   its cars and the shared settings (Core.XR, TX, LOD) the game set (the player's steering, throttle and brake, step by step; anything else the
   same way), and its calls into the race (start, rescue, retire, the props from the world with their floor's answers, the autopilot's
   aiControl, the career's wear). Only a record: the physics is not touched (a car that touches nothing drives the same to the number).
   Replayed (Vnos.replay; tools/lestvica-preveri.mjs in Node, no server) the same race is built from the record and stepped with the same
   events; the player's path (every 0.5 s, in cm), a digest of the whole state (every 10 s) and the finish (its step, its time) are compared.
   A field changed inside an object of the race (not set on it) is not seen: the comparison tells whether it mattered.
   No names in a record (name, playerName at any depth; the race's chal and champ, the game's own) */
const Vnos = (() => {
  const V = 1, STEP = 1 / 120, CP = 60, DG = 1200, MAXE = 900000, MAXW = 40, DEEP = 10, TOL = STEP;   // (TOL: the finish time's room, s: to the step, as the plan
  // has it; within one engine's version it is the same to the bit, across engines Math's last bit differs: docs/svetovna-lestvica.md)
  const SKIP = new Set(['name', 'playerName']);   // (names: never in a record, never physics)
  const IGN = new Set(['chal', 'champ']);   // (the race's: the game's own, the core never reads them; a friend's name in chal)
  const CALLS = ['start', 'rescue', 'retire', 'pitLaunch', 'putBack', 'setProps'];   // (the race's methods the game calls that change it)
  const own = Object.prototype.hasOwnProperty, SES = new WeakMap();
  let cur = null;   // (the race being recorded: one at a time, the last made)

  // a value as JSON, to the last bit: a number as it is (-0, NaN, ±Infinity as text), a text 's…', undefined 'u'; a car model {m: id}, an
  // assist {a: index}, a car of the race {c: index}, the race {r: 1}, a list {l: […]}, a plain object {o: {…}} without names; a function
  // {fn: 1} only where it may be (a call's argument: the props' floor). Anything else (a class's object, a typed array) is an error
  function enc(v, X, d) {
    if (v === undefined) return 'u';
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') return Number.isFinite(v) ? (Object.is(v, -0) ? '-0' : v) : v !== v ? 'nan' : v > 0 ? 'inf' : '-inf';
    if (typeof v === 'string') return 's' + v;
    if (typeof v === 'function' && X.fn) return { fn: 1 };
    if (typeof v !== 'object') throw new Error(typeof v);
    if (d > DEEP) throw new Error('pregloboko');
    if (X.race && v === X.race) return { r: 1 };
    let i = X.C.MODELS.indexOf(v); if (i >= 0) return { m: v.id };
    i = X.C.ASSISTS.indexOf(v); if (i >= 0) return { a: i };
    if (X.race) { i = X.race.cars.indexOf(v); if (i >= 0) return { c: i }; }
    if (Array.isArray(v)) return { l: v.map(x => enc(x, X, d + 1)) };
    const p = Object.getPrototypeOf(v);
    if (p !== Object.prototype && p !== null) throw new Error('razred ' + ((v.constructor && v.constructor.name) || '?'));
    const o = {}; for (const k of Object.keys(v)) if (!SKIP.has(k)) o[k] = enc(v[k], X, d + 1);
    return { o };
  }
  const SPEC = { u: undefined, '-0': -0, nan: NaN, inf: Infinity, '-inf': -Infinity };
  function dec(v, X) {
    if (v === null || typeof v === 'number' || typeof v === 'boolean') return v;
    if (typeof v === 'string') { if (v[0] === 's') return v.slice(1); if (own.call(SPEC, v)) return SPEC[v]; throw new Error('vrednost ' + v); }
    if (!v || typeof v !== 'object') throw new Error('vrednost');
    if (own.call(v, 'l')) return v.l.map(x => dec(x, X));
    if (own.call(v, 'o')) { const o = {}; for (const k of Object.keys(v.o)) o[k] = dec(v.o[k], X); return o; }
    if (own.call(v, 'm')) { const m = X.C.MODELS.find(q => q.id === v.m); if (!m) throw new Error('ni avta ' + v.m); return m; }
    if (own.call(v, 'a')) { const a = X.C.ASSISTS[v.a]; if (!a) throw new Error('ni pomoči ' + v.a); return a; }
    if (own.call(v, 'c')) { const c = X.race && X.race.cars[v.c]; if (!c) throw new Error('ni avta #' + v.c); return c; }
    if (own.call(v, 'r')) return X.race;
    if (own.call(v, 'fn')) return X.fn;
    throw new Error('vrednost');
  }

  // the whole state as a digest (FNV-1a over every plain value of the race and of every car, sorted by name; no names): tests/lib/sim.js stateLine
  const pl1 = (v) => typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string';
  const pl = (v) => pl1(v) || (Array.isArray(v) && v.length > 0 && v.every(pl1));   // (an empty list left out, as a list of objects is: the renderer
  // empties a car's dents in place, js/render.js, a queue the physics reads only for its cap of 24, so in a replay without it they pile up)
  const num = (v) => Object.is(v, -0) ? '-0' : String(v);
  function line(o, r) {
    let s = '';
    for (const k of Object.keys(o).filter(k => !SKIP.has(k) && !(r && IGN.has(k)) && pl(o[k])).sort()) { const v = o[k]; s += k + '=' + (Array.isArray(v) ? v.map(num).join(',') : num(v)) + ';'; }
    return s;
  }
  function digest(race) {
    let h = 0x811c9dc5 | 0;
    const add = (s) => { for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193); };
    add(line(race, true)); for (const c of race.cars) add('|' + line(c, false));
    return (h >>> 0).toString(36);
  }

  // what the record is from: the stamps of js/game.js and js/core.js (the publish step puts them on the page: tools/stamp.js; a page without them,
  // as the repository's on a local server, 'lokalno') and the engine (V8, JSC, Gecko; node); never the browser's full name
  function stamp() {
    const v = (f) => { try { const s = typeof document !== 'undefined' && document.querySelector('script[src^="js/' + f + '.js"]'), m = s && /[?&]v=(\w+)/.exec(s.getAttribute('src') || ''); return m ? m[1] : 'lokalno'; } catch (_) { return 'lokalno'; } };
    return { game: v('game'), core: v('core') };
  }
  function engine() {
    const u = typeof navigator !== 'undefined' && navigator.userAgent || '';
    if (!u || /^Node\.js\//.test(u)) return typeof process !== 'undefined' && process.versions && process.versions.node ? 'node' : '?';
    const e = /iPhone|iPad|iPod/.test(u) ? 'JSC' : /Firefox\//.test(u) ? 'Gecko' : /Chrome\/|Chromium\/|Edg\/|OPR\/|SamsungBrowser\//.test(u) ? 'V8' : /Safari\//.test(u) ? 'JSC' : '?';
    return e + (/Mobi|Android|iPhone|iPad/.test(u) ? ' tel' : '');
  }

  /* ---------------- the record ---------------- */
  const def = (o, k, v) => Object.defineProperty(o, k, { value: v, configurable: true, writable: true, enumerable: false });
  const CK = [];   // ('c0', 'c1' …: a car's name in the record)
  function eachT(S, fn) {   // (the objects watched, each by its name: the race, its options, the shared settings, its flags, its cars)
    const r = S.race, C = S.C; fn('r', r); fn('o', r.opts); fn('x', C.XR); fn('t', C.TX); fn('l', C.LOD);
    if (r.fl && typeof r.fl === 'object') fn('fl', r.fl);
    for (let i = 0; i < r.cars.length; i++) fn(CK[i] || (CK[i] = 'c' + i), r.cars[i]);
  }
  function snapAll(S) {   // (after a step or a call: what every watched object holds now; its names and values side by side)
    eachT(S, (key, obj) => {
      const ks = Object.keys(obj); let s = S.snap.get(key);
      if (!s || s.obj !== obj) S.snap.set(key, s = { obj, ks, vs: [] });
      const vs = s.vs; s.ks = ks; vs.length = ks.length;
      for (let i = 0; i < ks.length; i++) vs[i] = obj[ks[i]];
    });
    S.cars = S.race.cars; S.nc = S.cars.length;   // (in a step the race may change its cars: so be it)
  }
  function bad(S, why) { const R = S.rec; if (R.ok) { R.ok = false; R.why = why; } S.done = true; }
  function warn(S, w) { const R = S.rec; if (R.w.length < MAXW && !R.w.includes(w)) R.w.push(w); }
  function push(S, name, val) {   // (an event: the steps since the one before, the name's index, the value)
    const R = S.rec; let i = S.fi.get(name); if (i === undefined) { i = R.f.length; R.f.push(name); S.fi.set(name, i); }
    R.e.push(S.n - S.en, i, val); S.en = S.n;
    if (R.e.length > MAXE) { bad(S, 'predolgo'); R.e.length = 0; }
  }
  function sync(S) {   // (before a step or a call: what the game set since, as events); false: not recorded any more
    const race = S.race;
    if (race.cars !== S.cars || race.cars.length !== S.nc) { bad(S, 'avti'); return false; }
    eachT(S, (key, obj) => {
      const s = S.snap.get(key); if (!s || s.obj !== obj) return;   // (an object put in whole: its owner's event has it)
      const ks = Object.keys(obj), ok = s.ks, vs = s.vs, r = key === 'r', n = ks.length;
      let same = n === ok.length;
      for (let i = 0; same && i < n; i++) same = ks[i] === ok[i];
      if (same) { for (let i = 0; i < n; i++) { const v = obj[ks[i]]; if (!Object.is(v, vs[i])) put(S, key, ks[i], v, r); } return; }
      const was = new Map(); for (let i = 0; i < ok.length; i++) was.set(ok[i], vs[i]);   // (names added or gone: by name)
      for (let i = 0; i < n; i++) { const k = ks[i], v = obj[k]; if (!was.has(k) || !Object.is(was.get(k), v)) put(S, key, k, v, r); }
      for (let i = 0; i < ok.length; i++) if (!own.call(obj, ok[i]) && !SKIP.has(ok[i]) && !(r && IGN.has(ok[i]))) push(S, key + '.' + ok[i], { x: 1 });
    });
    return !S.done;
  }
  function put(S, key, k, v, r) {   // (a field set by the game: its event; a value that cannot be written down, a warning)
    if (SKIP.has(k) || (r && IGN.has(k))) return;
    let e; try { e = enc(v, S.X, 0); } catch (err) { warn(S, key + '.' + k + ': ' + err.message); return; }
    push(S, key + '.' + k, e);
  }
  function after(S) {   // (a step done: the path, the digest, the finish)
    const R = S.rec, race = S.race, P = race.player, n = ++S.n; R.n = n;
    if (n % CP === 0) R.cp.push(Math.round(P.x * 100), Math.round(P.z * 100));
    if (n % DG === 0) R.dg.push(digest(race));
    if (P.finished) { R.fs = n; R.fin = { t: enc(P.finishTime, S.X, 0), x: P.x, z: P.z, dg: digest(race) }; S.done = true; return; }
    snapAll(S);
  }
  // a call into the race (or the core's, on it) as an event; 'mr': the random numbers it drew outside the race's own (Math.random), kept
  function logged(S, k, val, run, mr) {
    if (!sync(S)) return run();
    push(S, '!' + k, val);
    const M0 = Math.random, A = S.rec.mr;
    if (mr) Math.random = function () { const x = M0.call(Math); A.push(x); return x; };
    S.inCall = true;
    try { return run(); } finally { if (mr) Math.random = M0; S.inCall = false; snapAll(S); }
  }
  const free = (S) => !S.done && !S.inStep && !S.inCall && cur === S;
  function stepW(S, f) {
    return function (dt) {
      if (!free(S) || !sync(S)) return f.call(this, dt);
      if (!Object.is(dt, S.dt)) { push(S, 'dt', enc(dt, S.X, 0)); S.dt = dt; }
      S.inStep = true;
      try { f.call(this, dt); } finally { S.inStep = false; }
      after(S);
    };
  }
  // the props: what setProps reads of each (its kind, place, height, turn, colour) and of the floor (its inset: the solid scenery in front of a
  // barrier, js/world.js propSolid); the floor's answers kept, in a step or in setProps, as runs, each prop its own (by its place in race.props;
  // 'p': setProps's): a prop that moves a little otherwise in another engine takes no other prop's answers
  const PK = ['x', 'z', 'i', 'y', 'yaw', 'col'];
  const pkey = (race, ix, b) => { if (!b || typeof b !== 'object') return 'p'; let k = ix.get(b); if (k === undefined) { const i = race.props ? race.props.indexOf(b) : -1; ix.set(b, k = i >= 0 ? String(i) : 'p'); } return k; };
  function floorW(S, fl) {
    if (typeof fl !== 'function') return fl;
    const A = S.rec.pf, ix = new WeakMap();
    const w = function (q, near, b) {
      const y = fl.call(this, q, near);
      if (!S.done && (S.inStep || S.inCall) && cur === S) { const k = pkey(S.race, ix, b), L = A[k] || (A[k] = []), v = enc(y, S.X, 0), m = L.length; if (m && L[m - 2] === v) L[m - 1]++; else L.push(v, 1); }
      return y;
    };
    Object.defineProperty(w, 'inset', { get: () => fl.inset, configurable: true });   // (Core propStep reads it from the floor)
    return w;
  }
  function insetOf(fl, X) {   // (the floor's inset: the place and value of each one not 0; null: none)
    const I = fl && fl.inset; if (!I || typeof I.length !== 'number') return null;
    const o = []; for (let i = 0; i < I.length; i++) if (I[i] !== 0) o.push(i, enc(I[i], X, 0));
    return o;
  }
  function callW(S, k, f) {
    return function (...a) {
      if (!free(S)) return f.apply(this, a);
      let val;
      try { val = k === 'setProps' ? { p: (a[0] || []).map(it => [String(it.kind)].concat(PK.map(q => enc(it[q], S.X, 0)))), f: typeof a[1] === 'function' ? 1 : 0, ins: insetOf(a[1], S.X) } : enc(a, Object.assign({ fn: true }, S.X), 0); }
      catch (err) { bad(S, k + ': ' + err.message); return f.apply(this, a); }
      return logged(S, k, val, () => f.apply(this, k === 'setProps' ? [a[0], floorW(S, a[1])] : a), true);
    };
  }
  function wrapCore(C, k, mine, val, mr) {   // (the core's own functions the game calls on the race: Core.aiControl, Core.careerWear)
    const f = C[k]; if (typeof f !== 'function' || f.__vnos) return;
    const w = function (...a) {
      const S = cur; if (!S || !free(S) || !mine(S, a)) return f.apply(this, a);
      let v; try { v = val(S, a); } catch (err) { bad(S, k + ': ' + err.message); return f.apply(this, a); }
      return logged(S, k, v, () => f.apply(this, a), mr);
    };
    w.__vnos = f; C[k] = w;
  }

  // a race made (js/game.js newRace, before the game's own settings on it): recorded if repeatable, with a player; info: { kind, track }
  function made(C, race, info) {
    cur = null;
    if (!race || !race.opts || !race.opts.repro || !race.player || !Array.isArray(race.cars)) return null;
    wrapCore(C, 'aiControl', (S, a) => a[1] === S.race && S.race.cars.includes(a[0]), (S, a) => a[2] === STEP ? S.race.cars.indexOf(a[0]) : enc([a[0], a[2]], S.X, 0), false);   // (its own numbers: Race.rnd)
    wrapCore(C, 'careerWear', (S, a) => S.race.cars.includes(a[0]), (S, a) => enc(a, S.X, 0), true);
    const X = { C, race }, X0 = { C };
    const S = { C, race, X, cars: race.cars, nc: race.cars.length, n: 0, en: 0, dt: STEP, done: false, inStep: false, inCall: false, snap: new Map(), fi: new Map() };
    const R = S.rec = { v: V, ok: true, why: '', w: [], stamp: stamp(), eng: engine(), kind: (info && info.kind) || '', track: race.track.def.id, opts: null,
      xr: enc(Object.assign({}, C.XR), X0, 0), tx: enc(Object.assign({}, C.TX), X0, 0), lod: enc(Object.assign({}, C.LOD), X0, 0), f: [], e: [], mr: [], pf: {}, cp: [], dg: [], n: 0, fs: null, fin: null };
    SES.set(race, S);
    try { R.opts = enc(race.opts, X0, 0); } catch (err) { bad(S, 'opts: ' + err.message); return R; }
    def(race, 'step', stepW(S, race.step));
    for (const k of CALLS) if (typeof race[k] === 'function') def(race, k, callW(S, k, race[k]));
    snapAll(S); cur = S;
    return R;
  }
  // the record of a race (js/game.js rrpOf: into the recording's file, H.vnos), undefined if none
  function out(race) { const S = race && SES.get(race); return S ? S.rec : undefined; }

  /* ---------------- the replay ---------------- */
  // the record replayed in a race of its own (Node: tools/lestvica-preveri.mjs; o.track: a Track to reuse). { ok, why, n, fs (the step of the
  // finish, null: not reached), dft (the finish time less the recorded one, s), maxD (the path's largest distance from the record, m), cpBad (the
  // first step 0.5 m off, -1 none), dgBad (the first step whose digest differs, -1 none), exact (every digest and the finish to the last bit),
  // tla, mr (the floor's answers and the calls' random numbers the replay asked for and the record didn't have, or left over: 0 in one engine) }
  function replay(C, rec, o) {
    o = o || {};
    const res = { ok: false, why: '', n: 0, fs: null, dft: null, maxD: 0, cpBad: -1, dgBad: -1, exact: false, tla: 0, mr: 0 };
    if (!rec || rec.v !== V) { res.why = 'zapis ni te različice'; return res; }
    const tdef = C.TRACKS.find(d => d.id === rec.track); if (!tdef) { res.why = 'ni proge ' + rec.track; return res; }
    const xr0 = Object.assign({}, C.XR), tx0 = Object.assign({}, C.TX), lod0 = Object.assign({}, C.LOD), cur0 = cur, M0 = Math.random;
    cur = null;
    try {
      const X = { C, race: null, fn: null };
      C.setCrash(dec(rec.xr, X)); C.setTest(dec(rec.tx, X)); Object.assign(C.LOD, dec(rec.lod, X));
      const race = new C.Race(o.track || new C.Track(tdef), dec(rec.opts, X)), P = race.player; X.race = race;
      if (!P) throw new Error('dirka brez igralca');
      // the floor's answers, each prop's in turn, and the calls' random numbers; one the record hasn't (another engine: a prop moved otherwise) is
      // that prop's last (none yet: the road's height), a number 0.5: counted, the path and the finish decide
      const PF = rec.pf && typeof rec.pf === 'object' && !Array.isArray(rec.pf) ? rec.pf : {}, MRV = Array.isArray(rec.mr) ? rec.mr : [], pat = {}, plast = {}, pix = new WeakMap();
      let mi = 0;
      X.fn = function (q, near, b) {
        const k = pkey(race, pix, b), L = own.call(PF, k) && Array.isArray(PF[k]) ? PF[k] : null, c = pat[k] || (pat[k] = [0, 0]);
        if (!L || c[0] >= L.length) { res.tla++; return own.call(plast, k) ? plast[k] : 0; }
        const v = dec(L[c[0]], X); if (++c[1] >= L[c[0] + 1]) { c[0] += 2; c[1] = 0; }
        return (plast[k] = v);
      };
      const rnd = () => { if (mi >= MRV.length) { res.mr++; return 0.5; } return MRV[mi++]; };
      const tgt = (key) => key === 'r' ? race : key === 'o' ? race.opts : key === 'x' ? C.XR : key === 'l' ? C.LOD : key === 'fl' ? race.fl : key[0] === 'c' ? race.cars[+key.slice(1)] : null;
      let dt = STEP;
      const apply = (name, val) => {
        if (name === 'dt') { dt = dec(val, X); return; }
        if (name[0] === '!') {
          const k = name.slice(1);
          if (k === 'aiControl') { const a = typeof val === 'number' ? [race.cars[val], STEP] : dec(val, X); if (!a || !a[0]) throw new Error('ni avta #' + val); C.aiControl(a[0], race, a[1]); return; }
          if (k === 'setProps') { let I; if (Array.isArray(val.ins)) { I = new Float32Array(race.track.N * 2); for (let j = 0; j + 1 < val.ins.length; j += 2) if (val.ins[j] >= 0 && val.ins[j] < I.length) I[val.ins[j]] = dec(val.ins[j + 1], X); } X.fn.inset = I; }
          const a = k === 'setProps' ? [val.p.map(t => { const it = { kind: t[0] }; PK.forEach((q, j) => { it[q] = dec(t[j + 1], X); }); return it; }), val.f ? X.fn : null] : dec(val, X);
          Math.random = rnd;
          try { if (k === 'careerWear') C.careerWear(...a); else if (CALLS.includes(k)) race[k](...a); else throw new Error('klic ' + k); } finally { Math.random = M0; }
          return;
        }
        const p = name.indexOf('.'), key = name.slice(0, p), f = name.slice(p + 1), del = !!val && typeof val === 'object' && own.call(val, 'x');
        if (key === 't') { const t = Object.assign({}, C.TX); if (del) delete t[f]; else t[f] = dec(val, X); C.setTest(t); return; }
        const obj = tgt(key); if (!obj) throw new Error('ni ' + key);
        if (del) delete obj[f]; else obj[f] = dec(val, X);
      };
      const E = rec.e, F = rec.f, N = rec.fs != null ? rec.fs : rec.n;
      let ei = 0, at = E.length ? E[0] : Infinity, dgOk = true;
      for (let n = 0; ; n++) {
        while (ei < E.length && at === n) { apply(F[E[ei + 1]], E[ei + 2]); ei += 3; if (ei < E.length) at += E[ei]; }
        if (n >= N) break;
        race.step(dt); const k = n + 1; res.n = k;
        if (k % CP === 0) {
          const j = 2 * (k / CP - 1);
          if (j + 1 < rec.cp.length) { const d = Math.hypot(Math.round(P.x * 100) - rec.cp[j], Math.round(P.z * 100) - rec.cp[j + 1]) / 100; if (d > res.maxD) res.maxD = d; if (d > 0.5 && res.cpBad < 0) res.cpBad = k; }
        }
        if (k % DG === 0 && k / DG - 1 < rec.dg.length && digest(race) !== rec.dg[k / DG - 1]) { dgOk = false; if (res.dgBad < 0) res.dgBad = k; }
        if (P.finished && res.fs == null) res.fs = k;
        if (P.finished && rec.fs == null) break;
      }
      const rest = ei < E.length ? 'dogodki' : '';
      for (const k of Object.keys(PF)) { const L = PF[k], c = pat[k] || [0, 0]; if (Array.isArray(L)) for (let j = c[0]; j + 1 < L.length; j += 2) res.tla += Math.max(0, (+L[j + 1] || 0) - (j === c[0] ? c[1] : 0)); }
      res.mr += Math.max(0, MRV.length - mi);
      if (rec.fs != null) {
        if (res.fs == null) res.why = 'cilja ni (zapis: korak ' + rec.fs + ')';
        else if (res.fs !== rec.fs) res.why = 'cilj v koraku ' + res.fs + ', zapis ' + rec.fs;
        if (res.fs != null) {
          const ft = dec(rec.fin.t, X); res.dft = P.finishTime - ft;
          const d = Math.hypot(P.x - rec.fin.x, P.z - rec.fin.z); if (d > res.maxD) res.maxD = d;
          if (!res.why && !(Math.abs(res.dft) < TOL)) res.why = 'čas cilja ' + res.dft + ' s od zapisa';
          res.exact = dgOk && res.fs === rec.fs && Object.is(P.finishTime, ft) && P.x === rec.fin.x && P.z === rec.fin.z && digest(race) === rec.fin.dg;
        }
      } else if (res.fs != null) res.why = 'cilj v koraku ' + res.fs + ', zapis ga nima';
      else res.exact = dgOk && res.maxD === 0;
      if (!res.why && res.cpBad >= 0) res.why = 'pot več kot 0,5 m od zapisa (korak ' + res.cpBad + ')';
      if (!res.why && rest) res.why = 'v zapisu ostanejo ' + rest;
      if (rest || res.tla || res.mr) res.exact = false;
      res.ok = !res.why;
    } catch (err) { res.why = 'zapis ne gre skozi: ' + ((err && err.message) || String(err)); }
    finally { Math.random = M0; C.setCrash(xr0); C.setTest(tx0); Object.assign(C.LOD, lod0); cur = cur0; }
    return res;
  }

  return { V, STEP, made, out, replay, digest, enc, dec };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Vnos;
