// Svetovna lestvica, the game's side (seja 4; js/svet.js, docs/svetovna-lestvica.md, »V igri«): the client against the real server code
// (streznik/svetovna-lestvica: the Worker in Node with a fake D1 over node:sqlite and a fake R2, as tests/svet-streznik.test.js) and
// against failing servers:
// 1. no server address: not available, nothing queued; before the player joins nothing queued either
// 2. a run before the nickname: the server wants one (404), the run waits; the nickname, then the run taken (waiting for the check), its
//    envelope as the server reads it (the signature, the record's gzip and the ghost's hashes); a slower run of the key not queued, a faster one is
// 3. the queue: kept in the store (a reload keeps it), the best of each key, at most 20; 503 and the network down: tried again after 1 min,
//    then 2; 429: as long as the server says; a refused run (400) dropped with its code; a banned player (403) sends nothing more
// 4. the tables: a board and a place read and kept; the server down: the kept one with its time; the cache at most 200 KB
// 5. a request that does not answer gives up (the timeout); a report; the player's data deleted on the server and on the device
// Invented nicknames only; no network, no key.
//   node tests/svet.test.js
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
process.removeAllListeners('warning');   // (node:sqlite is experimental in Node 22)
const { DatabaseSync } = require('node:sqlite');
const Lestvica = require('../js/lestvica.js');
const Svet = require('../js/svet.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const MAPA = path.join(__dirname, '..', 'streznik', 'svetovna-lestvica');
const store = () => { const m = new Map(); return { m, getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };

function lazniD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(MAPA, 'schema.sql'), 'utf8'));
  const val = (v) => v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v;
  const izvedi = (sql, vez) => { const rows = db.prepare(sql).all(...vez); const changes = db.prepare('SELECT changes() c').get().c; return { results: rows, meta: { changes } }; };
  const stavek = (sql, vez = []) => ({ sql, vez, bind: (...v) => stavek(sql, v.map(val)), all: async () => izvedi(sql, vez), run: async () => izvedi(sql, vez),
    first: async (col) => { const r = izvedi(sql, vez).results[0]; return r == null ? null : col == null ? r : (r[col] ?? null); } });
  return { prepare: (sql) => stavek(sql), exec: (sql) => db.exec(sql), vrstice: (sql, ...v) => db.prepare(sql).all(...v),
    batch: async (st) => { db.exec('BEGIN'); try { const r = st.map(s => izvedi(s.sql, s.vez)); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } } };
}
function lazniR2() {
  const m = new Map();
  return { m,
    async get(k) { if (!m.has(k)) return null; const u = Buffer.from(m.get(k)); return { body: new Uint8Array(u), json: async () => JSON.parse(u.toString('utf8')), text: async () => u.toString('utf8'), arrayBuffer: async () => u.buffer.slice(u.byteOffset, u.byteOffset + u.length) }; },
    async put(k, v) { m.set(k, typeof v === 'string' ? v : Uint8Array.from(v)); },
    async delete(k) { for (const x of Array.isArray(k) ? k : [k]) m.delete(x); } };
}
const MEJE = { v: 1, jedro: 'lokalno', vmax: 90, vk: 1.15, segK: 0.8, avti: ['hitri', 'pocasni'], nad: ['motor', 'gume', 'zavore', 'aero'], nadMax: 3, pomoc: 3,
  kljuci: { 'gora@cs': { k: 'tt', b: 60, d: 2000, seg: [20, 25, 15] }, 'dolina@cs': { k: 'tt', b: 30, d: 1000, seg: [12, 18] } } };

// a run's fields as js/game.js makes them (ttFinish), its record (JSON) and ghost (ghWrite's JSON: samples moving 1.25 × the line's length)
function voznja(o = {}) {
  const kljuc = o.kljuc || 'gora@cs', e = MEJE.kljuci[kljuc], t = o.t || 80000, s1 = 200 + Math.round(t * 0.12);
  const vmes = e.seg.slice(0, -1).map((_, i, a) => Math.round(t * (a.slice(0, i + 1).reduce((x, y) => x + y, 0) + 1) / (e.b + 2)));
  const gn = Math.floor(t / 100) + 2, b = Buffer.alloc(gn * 14), x = Math.round(1.25 * e.d * 100 / (gn - 1));
  for (let k = 1; k < gn; k++) b.writeInt16LE(x, k * 14);
  const ghost = JSON.stringify({ v: 1, dt: 0.1, n: gn, t: t / 1000, car: 'hitri', color: 0x1c5fd6, stripe: 0, q0: [0, 0, 0], d: b.toString('base64'), cond: { rain: 0 } });
  const f = { kljuc, avto: 'hitri', nad: o.nad || { motor: 1, gume: 2, zavore: 0, aero: 3 }, pomoc: 2, t, zig: { igra: 'lokalno', jedro: 'lokalno' }, eng: 'node', vmes, n: s1 + 90, s0: s1 - Math.round(t * 0.12), s1, fs: s1 };
  return { f, rec: JSON.stringify({ v: 1, ok: true, track: kljuc.split('@')[0], t, inp: [1, 2, 3] }), ghost };
}

(async () => {
  const W = await import('../streznik/svetovna-lestvica/src/index.js');
  let now = Date.UTC(2026, 10, 15, 18, 0, 0);
  const env = { DB: lazniD1(), R2: lazniR2(), URA: () => now, FETCH: async () => new Response('{}'), IP_SOL: 'testna-sol', OIDC_AUD: 'lestvica', IZVORI: 'https://localhost' };
  env.R2.m.set('meje.json', JSON.stringify(MEJE));
  let streznik = null, klicev = 0, telesa = [];
  const pravi = async (u, o) => { const rq = new Request(u, { method: o.method, body: o.body, headers: { 'CF-Connecting-IP': '198.51.100.7' } }); if (o.body) telesa.push(Buffer.from(o.body)); return W.default.fetch(rq, env, {}); };
  const FETCH = async (u, o) => { klicev++; if (o.signal && o.signal.aborted) throw new Error('abort'); return (streznik || pravi)(u, o); };
  const St = store();
  Lestvica.use(St);
  const cfg = { store: St, fetch: FETCH, now: () => now, lestvica: Lestvica, gzip: async (s) => new Uint8Array(zlib.gzipSync(Buffer.from(s))) };

  // 1. no address: nothing
  Svet.config({ ...cfg, url: '' });
  check('brez naslova strežnika: ni na voljo', !Svet.avail() && !Svet.on());
  let v = voznja();
  check('brez naslova: nič v vrsti', !(await Svet.add(v.f, v.rec, v.ghost)) && Svet.queue().length === 0);
  Svet.config({ url: 'https://lestvica.test/' });
  check('naslov: na voljo, igralec še ni vprašan', Svet.avail() && Svet.state().on === null && Svet.CFG.url === 'https://lestvica.test');
  check('pred pridružitvijo nič v vrsti', !(await Svet.add(v.f, v.rec, v.ghost)) && Svet.queue().length === 0);

  // 2. the nickname, then the run
  Svet.join();
  check('pridružen', Svet.on() && Svet.state().on === true);
  check('čas v vrsti', await Svet.add(v.f, v.rec, v.ghost) && Svet.queue().length === 1 && JSON.parse(St.getItem(Svet.QUEUE)).length === 1);
  let r = await Svet.flush();
  check('brez vzdevka: strežnik ga hoče (404), čas čaka', r.length === 1 && r[0].r === 'ime' && Svet.queue().length === 1 && Svet.queue()[0].why === 'ime', JSON.stringify(r));
  r = await Svet.flush();
  check('čaka na vzdevek: ni poslan znova', r.length === 0);
  check('vzdevek, ki ga strežnik ne vzame', (await Svet.nick('x')).ok === false);
  let nk = await Svet.nick('  Lisica ');
  const me = await Lestvica.me(false);
  check('vzdevek: ime in id (id ključa lestvice prijateljev)', nk.ok && nk.ime === 'Lisica' && nk.id === me.id && Svet.state().ime === 'Lisica', JSON.stringify(nk));
  r = await Svet.flush();
  let casi = env.DB.vrstice('SELECT st, igralec, kljuc, ms, stanje, avto, pomoc, eng, n, s0, s1, fs FROM casi ORDER BY st');
  check('po vzdevku čas poslan, čaka na preverjanje', Svet.queue().length === 0 && casi.length === 1 && casi[0].stanje === 'caka' && casi[0].igralec === me.id && casi[0].ms === 80000 && casi[0].kljuc === 'gora@cs', JSON.stringify(casi));
  check('poslan: zapisan v stanju (čaka)', Svet.state().sent['gora@cs'] && Svet.state().sent['gora@cs'][0] === 80000 && Svet.state().sent['gora@cs'][1] === casi[0].st);
  { // the envelope as the server read it: the packet, the signature, the record gzipped and the ghost after it
    const u = telesa[telesa.length - 1], i0 = u.indexOf(10), i1 = u.indexOf(10, i0 + 1), p = JSON.parse(u.subarray(0, i0).toString()), rest = u.subarray(i1 + 1);
    const gz = rest.subarray(0, p.lv), du = rest.subarray(p.lv);
    check('ovoj: paket, zapis (gzip) in duh', p.app === 'apex-racing' && p.kind === 'world' && p.req === 'oddaja' && p.pub === me.pub && gz[0] === 0x1f && zlib.gunzipSync(gz).toString() === v.rec && du.toString() === v.ghost && p.ld === du.length);
    const R2k = [...env.R2.m.keys()].filter(k => !/meje/.test(k));
    check('strežnik shrani zapis in duha', R2k.length >= 1, R2k.join(','));
  }
  check('počasnejši čas istega ključa ne gre v vrsto', !(await Svet.add(voznja({ t: 81000 }).f, v.rec, voznja({ t: 81000 }).ghost)) && Svet.queue().length === 0);
  const v2 = voznja({ t: 79000 });
  check('hitrejši gre', await Svet.add(v2.f, v2.rec, v2.ghost) && (await Svet.flush())[0].r === 'ok' && env.DB.vrstice('SELECT ms FROM casi').length === 2);

  // 3. the queue: the store, the best of each key, at most 20; failing servers
  streznik = async () => new Response(JSON.stringify({ ok: false, napaka: 'shramba' }), { status: 503 });
  const v3 = voznja({ kljuc: 'dolina@cs', t: 40000 });
  await Svet.add(v3.f, v3.rec, v3.ghost);
  r = await Svet.flush();
  let q = Svet.queue();
  check('503: znova čez 1 min', r[0].r === 'later' && q.length === 1 && q[0].n === 1 && q[0].at === now + 60e3, JSON.stringify(q.map(e => [e.n, e.at - now])));
  klicev = 0; r = await Svet.flush();
  check('pred časom ni poslan', r.length === 0 && klicev === 0);
  now += 61e3; r = await Svet.flush(); q = Svet.queue();
  check('drugič: čez 2 min', r[0].r === 'later' && q[0].n === 2 && q[0].at === now + 120e3);
  Svet.config({});   // (the game opened again: the queue from the store)
  q = Svet.queue();
  check('vrsta ostane po ponovnem zagonu', q.length === 1 && q[0].k === 'dolina@cs' && q[0].n === 2);
  const v4 = voznja({ kljuc: 'dolina@cs', t: 39000 });
  await Svet.add(v4.f, v4.rec, v4.ghost);
  check('boljši čas ključa zamenja starega v vrsti', Svet.queue().length === 1 && Svet.queue()[0].t === 39000 && Svet.queue()[0].n === 0);
  check('slabši od tistega v vrsti ne gre', !(await Svet.add(v3.f, v3.rec, v3.ghost)));
  streznik = async () => { throw new TypeError('Failed to fetch'); };
  r = await Svet.flush();
  check('brez interneta: znova čez 1 min', r[0].r === 'later' && Svet.queue()[0].at === now + 60e3);
  now += 61e3;
  streznik = async () => new Response(JSON.stringify({ ok: false, napaka: 'omejitev', cez: 300 }), { status: 429, headers: { 'Retry-After': '300' } });
  r = await Svet.flush();
  check('429: toliko, kot reče strežnik', r[0].r === 'later' && Svet.queue()[0].at === now + 300e3);
  { // at most 20: the oldest out (a store of its own, keys the server does not know: nothing sent)
    const S2 = store(); Svet.config({ store: S2 }); Svet.join();
    for (let i = 0; i < 25; i++) { const x = voznja(); x.f.kljuc = 'proga' + i + '@cs'; await Svet.add(x.f, x.rec, x.ghost); }
    q = Svet.queue();
    check('vrsta največ 20 (najstarejši ven)', q.length === 20 && q[0].k === 'proga5@cs' && JSON.parse(S2.getItem(Svet.QUEUE)).length === 20);
    Svet.config({ store: St });
  }
  streznik = null; now += 301e3;
  r = await Svet.flush();
  check('strežnik spet dela: čas poslan', r[0].r === 'ok' && Svet.queue().length === 0);
  const v5 = voznja({ kljuc: 'dolina@cs', t: 38000, nad: { motor: 7, gume: 0, zavore: 0, aero: 0 } });
  await Svet.add(v5.f, v5.rec, v5.ghost);
  r = await Svet.flush();
  check('zavrnjen čas (400) iz vrste, s kodo', r[0].r === 'drop' && Svet.queue().length === 0 && Svet.state().err === 'nadgradnje', Svet.state().err);

  // 4. the tables
  let b = await Svet.board('gora@cs');
  check('lestvica: odgovor strežnika (časi še čakajo: prazna)', b && !b.old && b.j && b.j.kljuc === 'gora@cs' && Array.isArray(b.j.vrstice) && b.at === now, JSON.stringify(b && b.j));
  let pl = await Svet.place('gora@cs');
  check('mesto prebrano', pl && (pl.j || pl.err), JSON.stringify(pl));
  const at0 = now; now += 6e5;
  streznik = async () => { throw new TypeError('Failed to fetch'); };
  b = await Svet.board('gora@cs');
  check('strežnik nedosegljiv: shranjena lestvica s časom', b && b.old && b.at === at0 && b.j && b.j.kljuc === 'gora@cs');
  check('shranjena brez vprašanja', Svet.kept('gora@cs').at === at0 && Svet.kept('neznana@cs') === null);
  b = await Svet.board('neznana@cs');
  check('brez shranjene: nič, s kodo', b && b.j === null && b.err === 'mreza');
  { // the cache at most 200 KB
    const vel = { ok: true, kljuc: 'x@cs', vrstice: Array.from({ length: 300 }, (_, i) => ({ mesto: i + 1, id: 'abcdefghijkl', ime: 'Voznik ' + i, ms: 60000 + i })) };
    streznik = async () => new Response(JSON.stringify(vel), { status: 200 });
    for (let i = 0; i < 20; i++) { now += 1000; await Svet.board('proga' + i + '@cs'); }
    const c = St.getItem(Svet.CACHE);
    check('predpomnilnik največ 200 KB, najnovejše ostane', c.length <= 2e5 && !!Svet.kept('proga19@cs') && !Svet.kept('proga0@cs'), String(c.length));
  }

  // 5. the timeout, a report, the deletion
  Svet.config({ timeout: 300 });
  streznik = (u, o) => new Promise((res, rej) => o.signal.addEventListener('abort', () => rej(new Error('abort'))));
  let t0 = Date.now(); b = await Svet.board('tiho@cs');
  check('zahteva brez odgovora odneha', b.err === 'mreza' && Date.now() - t0 < 2000);
  Svet.config({ timeout: 0 });
  streznik = null;
  const B = { st: store() };
  Lestvica.use(B.st); Svet.config({ store: B.st }); Svet.join(); const nb = await Svet.nick('Sova');
  Lestvica.use(St); Svet.config({ store: St });
  check('prijava drugega voznika', nb.ok && await Svet.report(nb.id) && env.DB.vrstice('SELECT COUNT(*) c FROM prijave')[0].c === 1);
  check('prijava neveljavnega id: ne', !(await Svet.report('x')));
  const moje = await Svet.mine();
  check('moji podatki s strežnika', moje && moje.ok && Array.isArray(moje.casi) && moje.casi.length >= 3, JSON.stringify(moje && moje.casi && moje.casi.length));
  check('izbris', await Svet.erase() && env.DB.vrstice('SELECT COUNT(*) c FROM igralci WHERE id = ?', me.id)[0].c === 0 && env.DB.vrstice('SELECT COUNT(*) c FROM casi WHERE igralec = ?', me.id)[0].c === 0);
  check('po izbrisu: na napravi nič, ne pošilja', !Svet.on() && Svet.state().on === false && Svet.state().ime === '' && St.getItem(Svet.QUEUE) === null && St.getItem(Svet.CACHE) === null && !(await Svet.add(v.f, v.rec, v.ghost)));
  { // banned (403): nothing more
    now += 2000; Svet.join(); check('po izbrisu znova (nov podpis)', (await Svet.nick('Lisica')).ok);
    streznik = async () => new Response(JSON.stringify({ ok: false, napaka: 'prepoved' }), { status: 403 });
    const v6 = voznja({ t: 70000 }); await Svet.add(v6.f, v6.rec, v6.ghost); await Svet.flush();
    check('prepovedan: nič več', Svet.state().ban && !Svet.on() && Svet.queue().length === 0);
  }

  console.log(`\n${n - bad} / ${n} OK`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
