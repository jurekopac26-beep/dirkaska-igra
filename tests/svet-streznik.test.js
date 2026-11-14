// Svetovna lestvica, strežnik (seja 3; docs/svetovna-lestvica.md, »Vmesnik«; streznik/svetovna-lestvica/README.md): the Worker run in Node
// against a fake D1 (node:sqlite with schema.sql), a fake R2 (a Map) and a fake GitHub (the OIDC keys). Players with their own ECDSA keys:
// a nickname, runs sent (the quick checks: every refusal by its code; the ghost rebuilt; R2 failing leaves no row), the checking job's list
// and outcomes (only with the workflow's token), the boards, a place, a ghost, reports (the third hides a nickname), the name filter, the
// limits (429 with Retry-After; a key over its limit refused without a write), a deletion and its mark, the router (CORS, 404, 405, 500
// without the body), the keeper's tool (tools/lestvica-skrbnik.mjs) on the same database, the daily clean-up, the client's constants and
// the bounds tool's file. Invented nicknames only; no network, no key.
//   node tests/svet-streznik.test.js
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
process.removeAllListeners('warning');   // (node:sqlite is experimental in Node 22)
const { DatabaseSync } = require('node:sqlite');
const { loadCore } = require('./lib/core');
const Lestvica = require('../js/lestvica.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const MAPA = path.join(__dirname, '..', 'streznik', 'svetovna-lestvica');
const subtle = globalThis.crypto.subtle;
const b64u = (u8) => Buffer.from(u8).toString('base64url');

// D1 over node:sqlite: prepare / bind / first / all / run, batch in one transaction (as D1: all or nothing)
function lazniD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(MAPA, 'schema.sql'), 'utf8'));
  const val = (v) => v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v;
  const izvedi = (sql, vez) => { const rows = db.prepare(sql).all(...vez); const changes = db.prepare('SELECT changes() c').get().c; return { results: rows, meta: { changes } }; };
  const stavek = (sql, vez = []) => ({
    sql, vez,
    bind: (...v) => stavek(sql, v.map(val)),
    all: async () => izvedi(sql, vez),
    run: async () => izvedi(sql, vez),
    first: async (col) => { const r = izvedi(sql, vez).results[0]; return r == null ? null : col == null ? r : (r[col] ?? null); },
  });
  return {
    db,
    prepare: (sql) => stavek(sql),
    batch: async (st) => {
      db.exec('BEGIN');
      try { const r = st.map(s => izvedi(s.sql, s.vez)); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    exec: (sql) => db.exec(sql),
    vrstice: (sql, ...v) => db.prepare(sql).all(...v),
  };
}
// R2: a Map of copies; pokvarjen: every call throws (as R2 failing)
function lazniR2() {
  const m = new Map();
  const R = {
    m, pokvarjen: false,
    async get(k) {
      if (R.pokvarjen) throw new Error('r2'); if (!m.has(k)) return null;
      const v = m.get(k), u = typeof v === 'string' ? Buffer.from(v) : Buffer.from(v);
      return { body: new Uint8Array(u), json: async () => JSON.parse(u.toString('utf8')), text: async () => u.toString('utf8'), arrayBuffer: async () => u.buffer.slice(u.byteOffset, u.byteOffset + u.length) };
    },
    async put(k, v) { if (R.pokvarjen) throw new Error('r2'); m.set(k, typeof v === 'string' ? v : Uint8Array.from(v)); },
    async delete(k) { if (R.pokvarjen) throw new Error('r2'); for (const x of Array.isArray(k) ? k : [k]) m.delete(x); },
  };
  return R;
}

const MEJE = {
  v: 1, jedro: 'testno-jedro', vmax: 90, vk: 1.15, segK: 0.8, avti: ['hitri', 'pocasni'], nad: ['motor', 'gume', 'zavore', 'aero'], nadMax: 3, pomoc: 3,
  kljuci: { 'gora-tt@suho': { k: 'tt', b: 60, d: 2000, seg: [20, 25, 15] }, 'krog-lap@suho': { k: 'lap', b: 40, d: 1500 } },
};

(async () => {
  const W = await import('../streznik/svetovna-lestvica/src/index.js');
  const O = await import('../streznik/svetovna-lestvica/src/ovoj.js');
  const S = await import('../streznik/svetovna-lestvica/src/skupno.js');
  const PR = await import('../streznik/svetovna-lestvica/src/pregled.js');
  const VZ = await import('../streznik/svetovna-lestvica/src/vzdevki.js');
  const BE = await import('../streznik/svetovna-lestvica/src/besede.js');
  const OI = await import('../streznik/svetovna-lestvica/src/oidc.js');
  const SK = await import('../tools/lestvica-skrbnik.mjs');
  const MJ = await import('../tools/lestvica-meje.mjs');

  let now = Date.UTC(2026, 10, 14, 10, 0, 0);
  // GitHub's OIDC: an RSA key published in the JWKS the fake fetch serves (counted)
  const rsa = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await subtle.exportKey('jwk', rsa.publicKey)), kid: 'k1', alg: 'RS256' };
  let dohvatov = 0;
  const FETCH = async (u) => { dohvatov++; return new Response(JSON.stringify({ keys: u === OI.JWKS ? [jwk] : [] }), { headers: { 'Content-Type': 'application/json' } }); };
  const env = { DB: lazniD1(), R2: lazniR2(), URA: () => now, FETCH, IP_SOL: 'testna-sol', OIDC_AUD: 'lestvica', IZVORI: 'https://jurekopac26-beep.github.io,https://localhost' };
  const DB = env.DB, R2 = env.R2;

  async function zeton(o = {}, kid = 'k1', kljuc = rsa.privateKey) {
    const t = Math.floor(now / 1000);
    const c = { iss: OI.ISS, aud: 'lestvica', repository: OI.REPO, ref: OI.REF, workflow_ref: OI.WORKFLOW, event_name: 'schedule', exp: t + 300, iat: t - 5, ...o };
    const h = b64u(Buffer.from(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }))), b = b64u(Buffer.from(JSON.stringify(c)));
    const s = new Uint8Array(await subtle.sign('RSASSA-PKCS1-v1_5', kljuc, Buffer.from(h + '.' + b)));
    return `${h}.${b}.${b64u(s)}`;
  }
  const zahteva = (pot, o = {}, e = env) => W.default.fetch(new Request('https://lestvica.test' + pot, o), e, {});
  const beri = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch (_) { return t; } };
  async function zJob(pot, metoda = 'GET', telo, tok, e = env) {
    const h = { Authorization: 'Bearer ' + (tok || await zeton()) }; if (telo != null) h['Content-Type'] = 'application/json';
    return zahteva(pot, { method: metoda, headers: h, body: telo == null ? undefined : typeof telo === 'string' ? telo : JSON.stringify(telo) }, e);
  }

  // a player: an ECDSA P-256 key, the id as the server computes it; their signed requests (packet \n signature \n rest)
  async function igralec() {
    const k = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = b64u(new Uint8Array(await subtle.exportKey('raw', k.publicKey)));
    return { k, pub, id: await O.idOf(pub) };
  }
  async function ovoj(g, req, polja = {}, rest = new Uint8Array(0), o = {}) {
    const p = { app: 'apex-racing', kind: 'world', v: 1, req, pub: g.pub, sent: Math.floor(now / 1000), ...polja };
    const pb = Buffer.from(JSON.stringify(p));
    const sig = b64u(new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, (o.podpisnik || g).k.privateKey, pb)));
    return Buffer.concat([pb, Buffer.from('\n' + sig + '\n'), Buffer.from(rest)]);
  }
  const poslji = (pot, body, e = env) => zahteva(pot, { method: 'POST', body, headers: { 'CF-Connecting-IP': '198.51.100.7', 'Content-Type': 'text/plain' } }, e);
  const zahtevek = async (g, req, polja, rest, o) => { const r = await poslji('/v1/' + req, await ovoj(g, req, polja, rest, o)); return { st: r.status, j: await beri(r), r }; };

  // a run as the game sends it: the record gzipped, the ghost's samples moving 1.25 × the line's length (under the bound's step)
  const sha = (u) => require('crypto').createHash('sha256').update(u).digest('base64url');
  function voznja(o = {}) {
    const kljuc = o.kljuc || 'gora-tt@suho', e = MEJE.kljuci[kljuc], t = o.t || 80000, lap = e.k === 'lap', avto = o.avto || 'hitri';
    const s0 = 120, s1 = s0 + Math.round(t * 0.12) + (o.korakiZamik || 0), nn = s1 + 80 + (o.n0 || 0);
    const vmes = o.vmes || (lap ? [] : [Math.round(t * 0.34), Math.round(t * 0.75)]);
    const vnos = zlib.gzipSync(Buffer.from(JSON.stringify({ v: 1, inp: [1, 2, 3], t })));
    let duh = Buffer.alloc(0);
    if (o.duh !== false) {
      const gn = Math.floor(t / 100) + 2, b = Buffer.alloc(gn * 14), x = Math.round(1.25 * e.d * 100 / (gn - 1));
      for (let k = 1; k < gn; k++) b.writeInt16LE(x, k * 14);
      const g = { v: 1, dt: 0.1, t: t / 1000, n: gn, d: b.toString('base64'), q0: [0, 0, 0], car: o.duhAvto || avto, color: 0x1c5fd6, cond: { rain: 1, tod: 'dusk', season: 'zima', setup: { wing: 2 } }, x: 'smeti', ...(lap ? { lap: 1 } : {}) };
      duh = Buffer.from(JSON.stringify(g));
    }
    const p = { kljuc, avto, nad: o.nad || { motor: 1, gume: 2, zavore: 0, aero: 3 }, pomoc: o.pomoc ?? 0, t, vmes, zig: { igra: 'abc123', jedro: 'testno-jedro' }, eng: o.eng || 'test 1',
      n: nn, s0, s1, fs: lap ? null : s1, lv: vnos.length, ld: duh.length, hv: o.hv || sha(vnos), ...(duh.length ? { hd: sha(duh) } : {}), ...(o.polja || {}) };
    return { p, rest: Buffer.concat([vnos, duh]), vnos, duh };
  }
  const oddaj = (g, o) => { const v = voznja(o); return zahtevek(g, 'oddaja', v.p, v.rest); };
  const casi = () => DB.vrstice('SELECT st, igralec, kljuc, ms, stanje, razlog, duh, posnetek FROM casi ORDER BY st');

  // 1. no bounds yet: the server says so; a player made by their nickname; a run waits for the bounds (503 ni-mej)
  let r = await zahteva('/v1/stanje'), j = await beri(r);
  check('stanje brez mej', r.status === 200 && j.ok && j.meje === false && j.sol === true && j.kljuci === 0 && r.headers.get('Cache-Control') === 'no-store', JSON.stringify(j));
  const A = await igralec(), B = await igralec(), C = await igralec(), D = await igralec(), X = await igralec();
  let z = await zahtevek(A, 'vzdevek', { ime: '  Lisica ' });
  check('nov igralec (vzdevek)', z.st === 200 && z.j.nov === true && z.j.id === A.id && z.j.ime === 'Lisica' && z.j.skrit === false, JSON.stringify(z.j));
  z = await zahtevek(A, 'vzdevek', { ime: 'Lisica' });
  check('isti vzdevek znova: ni nov', z.st === 200 && z.j.nov === false, JSON.stringify(z.j));
  z = await oddaj(A);
  check('oddaja brez mej: 503 ni-mej', z.st === 503 && z.j.napaka === 'ni-mej', JSON.stringify(z.j));

  // 2. the bounds from the checking job only
  r = await zJob('/v1/meje', 'POST', MEJE); j = await beri(r);
  check('meje z žetonom', r.status === 200 && j.ok && j.kljuci === 2 && j.jedro === 'testno-jedro' && R2.m.has('meje.json'), JSON.stringify(j));
  r = await zahteva('/v1/meje', { method: 'POST', body: JSON.stringify(MEJE) });
  check('meje brez žetona: 401 oidc', r.status === 401 && (await beri(r)).napaka === 'oidc');
  r = await zJob('/v1/meje', 'POST', { ...MEJE, segK: 2 }); j = await beri(r);
  check('neveljavne meje: 400 meje', r.status === 400 && j.napaka === 'meje', JSON.stringify(j));
  r = await zJob('/v1/meje', 'POST', '{nic'); j = await beri(r);
  check('meje niso JSON: 400 meje', r.status === 400 && j.napaka === 'meje', JSON.stringify(j));
  j = await beri(await zahteva('/v1/stanje'));
  check('stanje z mejami', j.meje === true && j.jedro === 'testno-jedro' && j.kljuci === 2, JSON.stringify(j));

  // 3. runs: an unknown player; a good one (the ghost rebuilt); every refusal of the quick checks
  z = await oddaj(X);
  check('oddaja neznanega igralca: 404 ni-igralca', z.st === 404 && z.j.napaka === 'ni-igralca', JSON.stringify(z.j));
  const vA = voznja();
  z = await zahtevek(A, 'oddaja', vA.p, vA.rest);
  const stA = z.j.st;
  check('oddaja: čaka', z.st === 200 && z.j.ok && z.j.stanje === 'caka' && Number.isInteger(stA), JSON.stringify(z.j));
  const vR2 = R2.m.get(`posnetki/gora-tt@suho/${stA}.vnos`), dR2 = R2.m.get(`posnetki/gora-tt@suho/${stA}.duh`);
  check('R2: posnetek nespremenjen', vR2 && Buffer.compare(Buffer.from(vR2), vA.vnos) === 0);
  let gd = dR2 ? JSON.parse(Buffer.from(dR2).toString()) : {};
  check('R2: duh na novo sestavljen (brez tujih polj, pogoji iz paketa)', !('x' in gd) && gd.car === 'hitri' && gd.n === 802 && gd.lap === undefined && gd.stripe === true && gd.color === 0x1c5fd6
    && JSON.stringify(gd.cond) === JSON.stringify({ rain: 1, tod: 'dusk', season: 'summer', upg: { motor: 1, gume: 2, zavore: 0, aero: 3 }, setup: { wing: 2, gear: 1 } }), JSON.stringify(gd).slice(0, 300));
  const zavrni = [
    ['ze-oddano', 409, {}],
    ['ni-boljsi', 409, { t: 85000 }, (j) => j.ms === 80000],
    ['prehiter', 400, { t: 59000 }],
    ['koraki', 400, { t: 75000, korakiZamik: 3 }],
    ['neznan-kljuc', 400, { kljuc: 'gora-tt@suho', polja: { kljuc: 'ni-proge@suho' } }],
    ['avto', 400, { avto: 'nepoznan' }],
    ['nadgradnje', 400, { nad: { motor: 1, gume: 2, zavore: 0 } }],
    ['nadgradnje', 400, { nad: { motor: 1, gume: 2, zavore: 0, aero: 4 } }],
    ['pomoc', 400, { pomoc: 3 }],
    ['polja', 400, { eng: 'Ž<script>' }],
    ['vmesni', 400, { t: 75000, vmes: [30000] }],
    ['vmesni', 400, { t: 75000, vmes: [10000, 45000] }],
    ['duh', 400, { t: 75000, duhAvto: 'pocasni' }],
    ['hash', 400, { t: 75000, hv: 'A'.repeat(43) }],
  ];
  for (const [koda, st, o, f] of zavrni) {
    z = await oddaj(A, o);
    check(`oddaja zavrnjena: ${st} ${koda}`, z.st === st && z.j.napaka === koda && (!f || f(z.j)), `${z.st} ${JSON.stringify(z.j)}`);
  }
  let v = voznja({ t: 75000 });
  z = await zahtevek(A, 'oddaja', { ...v.p, sent: Math.floor(now / 1000) - 2 * 86400 }, v.rest);
  check('oddaja s staro uro: 400 ura', z.st === 400 && z.j.napaka === 'ura', JSON.stringify(z.j));
  z = await zahtevek(A, 'oddaja', v.p, v.rest, { podpisnik: B });
  check('tuj podpis: 401 podpis', z.st === 401 && z.j.napaka === 'podpis', JSON.stringify(z.j));
  r = await poslji('/v1/oddaja', Buffer.from('{"app":"apex-racing"}')); j = await beri(r);
  check('brez ovoja: 400 ovoj', r.status === 400 && j.napaka === 'ovoj', JSON.stringify(j));
  z = await zahtevek(A, 'oddaja', v.p, Buffer.concat([v.rest, Buffer.from('x')]));
  check('dolžina se ne ujema: 400 ovoj', z.st === 400 && z.j.napaka === 'ovoj', JSON.stringify(z.j));
  z = await zahtevek(A, 'moje', {}, Buffer.from('x'));
  check('ostanek pri moje: 400 ovoj', z.st === 400 && z.j.napaka === 'ovoj', JSON.stringify(z.j));
  r = await poslji('/v1/vzdevek', Buffer.alloc(9000, 0x61)); j = await beri(r);
  check('prevelik zahtevek: 413 prevelik', r.status === 413 && j.napaka === 'prevelik', JSON.stringify(j));
  // R2 failing: the row goes, the objects wait in brisanje
  R2.pokvarjen = true;
  const pred = casi().length;
  z = await oddaj(A, { t: 78000 });
  R2.pokvarjen = false;
  check('R2 odpove: 503 shramba, vrstice ni', z.st === 503 && z.j.napaka === 'shramba' && casi().length === pred, JSON.stringify(z.j));
  check('R2 odpove: poti čakajo v brisanje', DB.vrstice('SELECT pot FROM brisanje').length === 2);
  z = await zahtevek(A, 'moje', {});
  check('moje: igralec in čas, ki čaka', z.st === 200 && z.j.igralec.ime === 'Lisica' && z.j.igralec.prepoved === false && z.j.casi.length === 1 && z.j.casi[0].stanje === 'caka' && z.j.casi[0].priblizno === false, JSON.stringify(z.j));
  z = await zahtevek(X, 'moje', {});
  check('moje neznanega: null', z.st === 200 && z.j.igralec === null && z.j.casi.length === 0, JSON.stringify(z.j));

  // 4. more players: a lap with a ghost, a time trial without one, a run that will be rejected
  await zahtevek(B, 'vzdevek', { ime: 'Turbo Tina' }); await zahtevek(C, 'vzdevek', { ime: 'Kapitan K' });
  const zB1 = await oddaj(B, { kljuc: 'krog-lap@suho', t: 50000, avto: 'pocasni' });
  const zB2 = await oddaj(B, { t: 70000, vmes: [25000, 52000], duh: false });
  const zC = await oddaj(C, { t: 90000 });
  check('krog z duhom, vožnja brez duha, še ena', zB1.st === 200 && zB2.st === 200 && zC.st === 200, [zB1, zB2, zC].map(x => JSON.stringify(x.j)).join(' '));
  check('krog: duh z lap 1', JSON.parse(Buffer.from(R2.m.get(`posnetki/krog-lap@suho/${zB1.j.st}.duh`)).toString()).lap === 1);
  check('brez duha: duh 0 in nič v R2', casi().find(c => c.st === zB2.j.st).duh === 0 && !R2.m.has(`posnetki/gora-tt@suho/${zB2.j.st}.duh`));

  // 5. the checking job: the list 2 minutes after a run came, a record, the outcomes
  r = await zJob('/v1/preveri'); j = await beri(r);
  check('seznam: prvi dve minuti prazen', r.status === 200 && j.casi.length === 0, JSON.stringify(j));
  now += 3 * 60000;
  r = await zJob('/v1/preveri'); j = await beri(r);
  const cA = j.casi && j.casi.find(c => c.st === stA);
  check('seznam: štirje časi, brez igralca in vzdevka', j.casi.length === 4 && cA && !('igralec' in cA) && cA.duh === true && cA.zig.jedro === 'testno-jedro' && cA.nad.aero === 3 && cA.vmes.length === 2 && cA.fs === cA.s1
    && r.headers.get('Cache-Control') === 'no-store', JSON.stringify(cA));
  r = await zJob(`/v1/preveri?st=${stA}&del=vnos`);
  check('posnetek za ponovitev', r.status === 200 && r.headers.get('Content-Type') === 'application/gzip' && Buffer.compare(Buffer.from(await r.arrayBuffer()), vA.vnos) === 0);
  r = await zJob(`/v1/preveri?st=${zB2.j.st}&del=duh`);
  check('duha ni: 404 ni', r.status === 404 && (await beri(r)).napaka === 'ni');
  r = await zJob(`/v1/preveri?st=0&del=vnos`);
  check('slab st: 400 poizvedba', r.status === 400 && (await beri(r)).napaka === 'poizvedba');
  r = await zJob('/v1/preveri', 'POST', { izidi: [{ st: stA, izid: 'ok' }, { st: stA, izid: 'ok' }] });
  check('izidi: dvakrat isti st: 400 izidi', r.status === 400 && (await beri(r)).napaka === 'izidi');
  r = await zJob('/v1/preveri', 'POST', { izidi: [
    { st: stA, izid: 'ok' }, { st: zC.j.st, izid: 'zavrnjeno', razlog: 'hitrost (12 %)' },
    { st: zB2.j.st, izid: 'ok', t: 70500, vmes: [25100, 52300], priblizno: true }, { st: zB1.j.st, izid: 'sumljivo' }, { st: 99999, izid: 'ok' },
  ] });
  j = await beri(r);
  check('izidi: števci', r.status === 200 && JSON.stringify(j.izidi) === JSON.stringify({ ok: 2, zavrnjeno: 1, 'ni-mogoce': 0, potekli: 0, sumljivo: 1 }), JSON.stringify(j));
  let cc = casi();
  const cC = cc.find(c => c.st === zC.j.st), cB2 = cc.find(c => c.st === zB2.j.st), cB1 = cc.find(c => c.st === zB1.j.st);
  check('izidi: zavrnjen izgubi posnetek in duha', cC.stanje === 'zavrnjeno' && cC.razlog === 'hitrost (12 %)' && cC.duh === 0 && cC.posnetek === 0
    && !R2.m.has(`posnetki/gora-tt@suho/${zC.j.st}.vnos`) && !R2.m.has(`posnetki/gora-tt@suho/${zC.j.st}.duh`));
  check('izidi: preverjen čas in sumljiv z razlogom', cB2.stanje === 'ok' && cB2.ms === 70500 && cB1.stanje === 'sumljivo' && cB1.razlog === 'sumljivo');
  r = await zJob('/v1/preveri', 'POST', { izidi: [{ st: stA, izid: 'zavrnjeno' }] }); j = await beri(r);
  check('izidi: preverjen čas se ne spremeni več', j.izidi.zavrnjeno === 0 && casi().find(c => c.st === stA).stanje === 'ok', JSON.stringify(j));

  // 6. the boards: the order, the checked time, approximate; a place; a ghost of the first 100; the queries
  r = await zahteva('/v1/lestvica?kljuc=gora-tt@suho'); j = await beri(r);
  check('lestvica: vrstni red in polja', r.status === 200 && j.skupaj === 2 && j.vrstice.length === 2 && j.vrstice[0].ime === 'Turbo Tina' && j.vrstice[0].ms === 70500 && j.vrstice[0].priblizno === true
    && j.vrstice[0].duh === false && JSON.stringify(j.vrstice[0].vmes) === '[25100,52300]' && j.vrstice[1].ime === 'Lisica' && j.vrstice[1].mesto === 2 && j.vrstice[1].duh === true
    && j.vrstice[1].oznaka === A.id.slice(0, 4).toUpperCase() && r.headers.get('Cache-Control') === 'public, max-age=60', JSON.stringify(j).slice(0, 400));
  j = await beri(await zahteva('/v1/lestvica?kljuc=gora-tt@suho&od=1&n=1'));
  check('lestvica: od in n', j.od === 1 && j.vrstice.length === 1 && j.vrstice[0].mesto === 2, JSON.stringify(j).slice(0, 200));
  for (const q of ['kljuc=GORA', 'kljuc=gora-tt@suho&od=50&n=60', 'kljuc=gora-tt@suho&n=0', 'kljuc=gora-tt@suho&od=-1']) {
    r = await zahteva('/v1/lestvica?' + q);
    check(`lestvica: 400 poizvedba (${q})`, r.status === 400 && (await beri(r)).napaka === 'poizvedba');
  }
  j = await beri(await zahteva(`/v1/mesto?kljuc=gora-tt@suho&id=${A.id}`));
  check('mesto', j.mesto === 2 && j.ms === 80000 && j.skupaj === 2, JSON.stringify(j));
  j = await beri(await zahteva(`/v1/mesto?kljuc=gora-tt@suho&id=${C.id}`));
  check('mesto brez preverjenega časa: null', j.mesto === null && j.ms === null, JSON.stringify(j));
  r = await zahteva(`/v1/duh?kljuc=gora-tt@suho&id=${A.id}`);
  check('duh iz prvih 100', r.status === 200 && r.headers.get('Cache-Control') === 'public, max-age=300' && (await beri(r)).n === 802);
  r = await zahteva(`/v1/duh?kljuc=gora-tt@suho&id=${B.id}`);
  check('duh časa brez duha: 404', r.status === 404);
  r = await zahteva(`/v1/duh?kljuc=krog-lap@suho&id=${B.id}`);
  check('duh sumljivega časa: 404', r.status === 404);

  // 7. reports: one per reporter and player, not one's own; the third hides the nickname (the board shows »Voznik #…«)
  await zahtevek(D, 'vzdevek', { ime: 'Modra' });
  z = await zahtevek(B, 'prijava', { id: A.id });
  check('prijava', z.st === 200 && z.j.nova === true && z.j.skrit === false, JSON.stringify(z.j));
  z = await zahtevek(B, 'prijava', { id: A.id });
  check('ista prijava znova: ni nova', z.st === 200 && z.j.nova === false, JSON.stringify(z.j));
  z = await zahtevek(B, 'prijava', { id: B.id });
  check('prijava sebe: 400 prijava', z.st === 400 && z.j.napaka === 'prijava', JSON.stringify(z.j));
  z = await zahtevek(B, 'prijava', { id: X.id });
  check('prijava neznanega: 400 prijava', z.st === 400 && z.j.napaka === 'prijava', JSON.stringify(z.j));
  await zahtevek(C, 'prijava', { id: A.id });
  z = await zahtevek(D, 'prijava', { id: A.id });
  check('tretja prijava skrije vzdevek', z.st === 200 && z.j.nova === true && z.j.skrit === true, JSON.stringify(z.j));
  j = await beri(await zahteva('/v1/lestvica?kljuc=gora-tt@suho'));
  check('lestvica: skrit vzdevek je null (predpomnilnik izpraznjen)', j.vrstice[1].ime === null && j.vrstice[1].oznaka.length === 4, JSON.stringify(j.vrstice[1]));
  z = await zahtevek(A, 'vzdevek', { ime: 'Lisica Druga' });
  check('skrit ostane skrit ob novem vzdevku', z.st === 200 && z.j.skrit === true, JSON.stringify(z.j));

  // 8. the name filter (vzdevki.js) through the route; a nickname changed 3 times a day
  const beseda = VZ.odkodiraj(BE.BESEDE).find(w => VZ.razlog(w) === 'beseda');
  for (const [ime, raz] of [['ab', 'oblika'], ['Adm1n', 'zasedeno'], ['www.x.com', 'povezava'], ['Mixвед', 'oblika'], [beseda, 'beseda']]) {
    z = await zahtevek(D, 'vzdevek', { ime });
    check(`vzdevek zavrnjen: ${raz}`, z.st === 400 && z.j.napaka === 'vzdevek' && z.j.razlog === raz, JSON.stringify(z.j));
  }
  const imena = ['Šef Žan', 'Modra Dva', 'Modra Tri'];
  let ok3 = true; for (const ime of imena) { z = await zahtevek(D, 'vzdevek', { ime }); ok3 = ok3 && z.st === 200 && z.j.ime === ime; }
  check('trije novi vzdevki v dnevu (tudi šumniki)', ok3);
  z = await zahtevek(D, 'vzdevek', { ime: 'Modra Stiri' });
  const ra = Number(z.r.headers.get('Retry-After'));
  check('četrti: 429 omejitev z Retry-After', z.st === 429 && z.j.napaka === 'omejitev' && z.j.cez === ra && ra > 0 && ra <= 86400, `${z.st} ${JSON.stringify(z.j)} ${ra}`);

  // 9. a deletion: everything of the player goes; a request signed before it does not make them again
  const sentIzbris = Math.floor(now / 1000);
  z = await zahtevek(B, 'izbris', {});
  check('izbris: oba časa', z.st === 200 && z.j.izbrisano === true && z.j.casov === 2, JSON.stringify(z.j));
  check('izbris: nič ne ostane', DB.vrstice('SELECT 1 FROM igralci WHERE id = ?', B.id).length === 0 && DB.vrstice('SELECT 1 FROM casi WHERE igralec = ?', B.id).length === 0
    && DB.vrstice('SELECT 1 FROM prijave WHERE prijavitelj = ?', B.id).length === 0 && ![...R2.m.keys()].some(k => k.includes(`/${zB1.j.st}.`) || k.includes(`/${zB2.j.st}.`)));
  z = await zahtevek(B, 'vzdevek', { ime: 'Turbo Tina', sent: sentIzbris });
  check('zahtevek, podpisan pred izbrisom: 400 ura', z.st === 400 && z.j.napaka === 'ura', JSON.stringify(z.j));
  z = await zahtevek(B, 'izbris', {});
  check('izbris neznanega', z.st === 200 && z.j.izbrisano === false && z.j.casov === 0, JSON.stringify(z.j));
  now += 1000;
  z = await zahtevek(B, 'vzdevek', { ime: 'Turbo Tina' });
  check('pozneje znova nov igralec', z.st === 200 && z.j.nov === true, JSON.stringify(z.j));
  z = await zahtevek(B, 'oddaja', voznja({ t: 72000 }).p, voznja({ t: 72000 }).rest, {});
  check('nova vožnja (za pospravljanje)', z.st === 200 && z.j.stanje === 'caka', JSON.stringify(z.j));
  z = await zahtevek(B, 'moje', { sent: sentIzbris });
  check('moje, podpisan pred novim igralcem: null', z.st === 200 && z.j.igralec === null, JSON.stringify(z.j));

  // 10. the limits: a fixed window; past the limit the isolate refuses without a write
  for (let i = 0; i < 20; i++) await S.omeji(env, 'oddaja_h', 'preizkus', now);
  let e429 = null; try { await S.omeji(env, 'oddaja_h', 'preizkus', now); } catch (e) { e429 = e; }
  check('omejitev: 21. v uri 429', e429 && e429.st === 429 && e429.extra.cez > 0 && e429.extra.cez <= 3600);
  try { await S.omeji(env, 'oddaja_h', 'preizkus', now + 1000); } catch (_) { }
  check('omejitev: čez mejo brez pisanja', DB.vrstice(`SELECT n FROM omejitve WHERE k LIKE 'oddaja_h:preizkus:%'`)[0].n === 21);
  const okno = (Math.floor(now / 3600e3) + 1) * 3600e3;
  let e2 = null; try { await S.omeji(env, 'oddaja_h', 'preizkus', okno + 1); } catch (e) { e2 = e; }
  check('omejitev: novo okno spet dovoli', e2 === null);
  const brezSoli = { ...env, IP_SOL: '' };
  r = await poslji('/v1/vzdevek', await ovoj(X, 'vzdevek', { ime: 'Modra' }), brezSoli);
  check('brez IP_SOL: 503 ni-nastavitve', r.status === 503 && (await beri(r)).napaka === 'ni-nastavitve');

  // 11. GitHub's token: the claims, the key's id, the keys fetched again at most once a minute, the settings
  const slabi = [['brez Bearer', 'x'], ['tuj aud', await zeton({ aud: 'drug' })], ['tuj repozitorij', await zeton({ repository: 'nekdo/drugo' })], ['druga veja', await zeton({ ref: 'refs/heads/dev' })],
    ['drug potek', await zeton({ workflow_ref: OI.REPO + '/.github/workflows/drug.yml@' + OI.REF })], ['pull_request', await zeton({ event_name: 'pull_request' })],
    ['potekel', await zeton({ exp: Math.floor(now / 1000) - 120 })], ['tuj podpis', await zeton({}, 'k1', (await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign'])).privateKey)]];
  for (const [ime, tok] of slabi) {
    r = await zahteva('/v1/preveri', { headers: { Authorization: tok === 'x' ? 'Token abc' : 'Bearer ' + tok } });
    check(`žeton zavrnjen: ${ime}`, r.status === 401 && (await beri(r)).napaka === 'oidc');
  }
  r = await zJob('/v1/preveri', 'GET', null, await zeton({ aud: ['drug', 'lestvica'], event_name: 'workflow_dispatch' }));
  check('žeton: aud kot seznam, ročni zagon', r.status === 200);
  let d0 = dohvatov;
  r = await zJob('/v1/preveri', 'GET', null, await zeton({}, 'k9'));
  check('neznan kid: ključi znova prebrani enkrat', r.status === 401 && dohvatov === d0 + 1, `${dohvatov - d0}`);
  r = await zJob('/v1/preveri', 'GET', null, await zeton({}, 'k9'));
  check('neznan kid v isti minuti: brez novega branja', r.status === 401 && dohvatov === d0 + 1, `${dohvatov - d0}`);
  r = await zJob('/v1/preveri', 'GET', null, null, { ...env, OIDC_AUD: '' });
  check('brez OIDC_AUD: 503 ni-nastavitve', r.status === 503 && (await beri(r)).napaka === 'ni-nastavitve');
  r = await zJob('/v1/preveri', 'GET', null, null, { ...env, DB: lazniD1(), FETCH: async () => { throw new Error('mreža'); } });
  check('ključev ni mogoče dobiti: 503 oidc-kljuci', r.status === 503 && (await beri(r)).napaka === 'oidc-kljuci');

  // 12. the router: CORS for the game's pages and a local server, OPTIONS, 405, 404, 500 without the body
  const izvor = async (o) => (await zahteva('/v1/stanje', { headers: { Origin: o } })).headers.get('Access-Control-Allow-Origin');
  check('CORS: GitHub Pages, aplikacija, lokalno', await izvor('https://jurekopac26-beep.github.io') === 'https://jurekopac26-beep.github.io' && await izvor('https://localhost') === 'https://localhost'
    && await izvor('http://127.0.0.1:8080') === 'http://127.0.0.1:8080');
  check('CORS: tuj izvor ne', await izvor('https://zlo.example') === null && await izvor('http://localhost.zlo.example') === null);
  r = await zahteva('/v1/oddaja', { method: 'OPTIONS', headers: { Origin: 'https://localhost' } });
  check('OPTIONS: 204', r.status === 204 && /POST/.test(r.headers.get('Access-Control-Allow-Methods')) && r.headers.get('Vary') === 'Origin' && r.headers.get('X-Content-Type-Options') === 'nosniff');
  r = await zahteva('/v1/oddaja');
  check('napačna metoda: 405 z Allow', r.status === 405 && r.headers.get('Allow') === 'POST, OPTIONS' && (await beri(r)).napaka === 'metoda');
  r = await zahteva('/v1/nic');
  check('neznana pot: 404 ni', r.status === 404 && (await beri(r)).napaka === 'ni');
  r = await zahteva('/v1/__proto__');
  check('pot __proto__: 404 ni', r.status === 404);
  const log = console.log, izpis = []; console.log = (...a) => izpis.push(a.join(' '));
  const zlomljen = { ...env, DB: { ...DB, batch: async () => { throw new TypeError('zlomljeno'); } } };
  r = await zahteva('/v1/lestvica?kljuc=nova-proga@suho', {}, zlomljen);
  console.log = log;
  check('nepričakovana napaka: 500 in ena vrstica dnevnika', r.status === 500 && (await beri(r)).napaka === 'napaka' && izpis.length === 1 && izpis[0] === 'napaka: TypeError: zlomljeno', izpis.join(' | '));

  // 13. the keeper's tool on the same database
  const sk = (args) => { for (const s of SK.ukaz(args, now).sql) DB.exec(s); };
  const skNapaka = (args) => { try { SK.ukaz(args, now); return false; } catch (e) { return /raba:/.test(e.message); } };
  check('skrbnik: slabi argumenti', skNapaka(['skrij', 'kratek']) && skNapaka(['zavrni', '0']) && skNapaka(['zavrni', '5', "x'; DROP TABLE casi; --"]) && skNapaka(['neznan']) && skNapaka([]));
  check('skrbnik: seznam in preglej sta branje', SK.ukaz(['seznam']).sql.every(s => /^SELECT/.test(s)) && SK.ukaz(['preglej', A.id]).sql.length === 3);
  const seznam = SK.ukaz(['seznam']).sql.map(s => DB.vrstice(s));
  check('skrbnik: seznam pokaže prijavljen vzdevek (prijava izbrisanega B ne šteje)', seznam[0].length === 1 && seznam[0][0].id === A.id && seznam[0][0].prijav === 2, JSON.stringify(seznam[0]));
  sk(['pokazi', A.id]);
  check('skrbnik: pokazi (prijave pregledane)', DB.vrstice('SELECT skrit FROM igralci WHERE id = ?', A.id)[0].skrit === 0 && DB.vrstice('SELECT 1 FROM prijave WHERE pregledana = 0').length === 0);
  sk(['prepovej', A.id]);
  z = await oddaj(A, { t: 76000 });
  check('skrbnik: prepovej (oddaja 403 prepoved)', z.st === 403 && z.j.napaka === 'prepoved', JSON.stringify(z.j));
  now += 61000;
  j = await beri(await zahteva('/v1/lestvica?kljuc=gora-tt@suho'));
  check('prepovedan igralec ni na lestvici', j.vrstice.length === 0, JSON.stringify(j).slice(0, 200));
  sk(['dovoli', A.id]); sk(['prepovej', A.id]);
  z = await oddaj(C, { t: 95000 });
  sk(['zavrni', String(z.j.st), 'hitrost', 'na', 'ravnini']);
  const cz = casi().find(c => c.st === z.j.st);
  check('skrbnik: zavrni (razlog, objekti v brisanje)', cz.stanje === 'zavrnjeno' && cz.razlog === 'hitrost na ravnini' && cz.duh === 0
    && DB.vrstice('SELECT pot FROM brisanje WHERE pot LIKE ?', `%/${z.j.st}.%`).length === 2);
  sk(['izbrisi', D.id]);
  check('skrbnik: izbrisi (oznaka izbrisa)', DB.vrstice('SELECT 1 FROM igralci WHERE id = ?', D.id).length === 0 && DB.vrstice('SELECT konec FROM omejitve WHERE k = ?', 'izbrisan:' + D.id)[0].konec === now + 3 * 864e5);
  z = await zahtevek(D, 'vzdevek', { ime: 'Modra', sent: Math.floor(now / 1000) - 10 });
  check('skrbnik: izbrisan ne pride nazaj s starim zahtevkom', z.st === 400 && z.j.napaka === 'ura', JSON.stringify(z.j));

  // 14. the daily clean-up: waiting too long, banned, rejected long ago, the leftovers in brisanje; inactive players after 24 months
  const pospravi = async (t) => { const p = []; const log0 = console.log; console.log = () => {}; await W.default.scheduled({ scheduledTime: t }, env, { waitUntil: (x) => p.push(x) }); const v = await Promise.all(p); console.log = log0; return v; };
  const izpos = [], log1 = console.log; console.log = (s) => izpos.push(s);
  const P = await import('../streznik/svetovna-lestvica/src/pospravi.js');
  const p1 = await P.pospravi(env, now + 31 * 864e5);
  console.log = log1;
  check('pospravi +31 d: potekel, prepoved, stari zavrnjeni, ostanki', p1.potekli === 1 && p1.prepoved === 1 && p1.casi === 2 && p1.ostanki === 4 && p1.omejitve > 0 && p1.igralci === 0
    && DB.vrstice('SELECT 1 FROM brisanje').length === 0, JSON.stringify(p1));
  check('pospravi: ena vrstica dnevnika brez podatkov igralcev', izpos.length === 1 && /^pospravi: omejitve \d+/.test(izpos[0]) && !izpos[0].includes(A.id));
  check('pospravi: v R2 ostanejo le meje', [...R2.m.keys()].join() === 'meje.json', [...R2.m.keys()].join());
  await pospravi(now + 800 * 864e5);
  check('pospravi +800 d: neaktivni igralci izbrisani', DB.vrstice('SELECT 1 FROM igralci').length === 0 && DB.vrstice('SELECT 1 FROM casi').length === 0);

  // 15. the client and the server agree: the patterns, the packet, the names
  const cl = fs.readFileSync(path.join(__dirname, '..', 'js', 'lestvica.js'), 'utf8'), sv = fs.readFileSync(path.join(MAPA, 'src', 'ovoj.js'), 'utf8');
  const vzorci = (s) => (/const KEY_RE = .*ID_RE = \/[^;]+;/.exec(s) || [''])[0];
  check('vzorci odjemalca in strežnika enaki', vzorci(cl) !== '' && vzorci(cl) === vzorci(sv).replace(/^export /, ''));
  check('APP in V enaka', /const APP = 'apex-racing', V = 1\b/.test(cl) && O.APP === 'apex-racing' && O.V === 1);
  const imena2 = ['  Lisica  ', 'a\u0000b c', 'x'.repeat(30), 'Turbo\t\tTina', 12345, null];
  check('cleanName enak', imena2.every(x => Lestvica.cleanName(x) === O.cleanName(x)), imena2.map(x => JSON.stringify([Lestvica.cleanName(x), O.cleanName(x)])).join(' '));
  check('idOf enak', (await Lestvica.idOf(A.pub)) === A.id);

  // 16. the bounds tool's file is valid for the server (Harju, Finska)
  const M = MJ.meje({ proge: ['harju'], jedro: 'abc1234', C: loadCore() });
  check('meje orodja veljavne za strežnik', PR.veljavneMeje(M) && Object.keys(M.kljuci).some(k => k.startsWith('harju')), Object.keys(M.kljuci).join(','));

  console.log(`${bad ? 'FAIL' : 'OK'} svet-streznik: ${n - bad}/${n}`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL svet-streznik: ' + (e && e.stack || e)); process.exit(1); });
