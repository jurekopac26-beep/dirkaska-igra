// The players' requests (docs/svetovna-lestvica.md, »Vmesnik«; README.md here, »Vmesnik«): each a signed envelope (ovoj.js); every write
// also counts the hashed IP's minute, after the signature (garbage costs no write). A player is made by their first nickname; a run or a
// report is written only while its player is there and not banned (one statement: nothing is left behind by a deletion meanwhile).
import { Napaka, ID_RE, DAY, cleanName, preberi } from './ovoj.js';
import { ura, json, omeji, ipOdtis, kesBrisi, beriMeje, brisiObjekte, poti, zapisiPoti, brisiPoti } from './skupno.js';
import { hitri, preveriDuh } from './pregled.js';
import { razlog } from './vzdevki.js';

const PISE = new Set(['vzdevek', 'oddaja', 'prijava', 'izbris']);
// the mark of a deleted player (omejitve, izbrisan:<id>): the deletion's signed time, kept 3 days (a request is taken at most a day off)
const IZBRISAN = (id) => `izbrisan:${id}`, IZBRISAN_MS = 3 * DAY;
export const PRIJAV_SKRIJE = 3;   // (reports not yet reviewed that hide a nickname until the keeper looks)
const ziv = (i) => `EXISTS (SELECT 1 FROM igralci WHERE id = ?${i} AND prepoved = 0)`;   // (the player of the statement's ?i there and not banned)

async function zacni(req, env, zahtevek) {
  const now = ura(env), o = await preberi(req, zahtevek, now); o.now = now;
  if (PISE.has(zahtevek)) { o.ip = await ipOdtis(env, req, now); await omeji(env, 'pisanje_ip_m', o.ip, now); }
  return o;
}
const igralec = (env, id) => env.DB.prepare('SELECT id, pub, ime, sent0, skrit, prepoved FROM igralci WHERE id = ?1').bind(id).first();
// the player of a request: there, of this key, the request signed after they were made (an older one is not taken), not banned
function preveriIgralca(g, p, prepoved = true) {
  if (!g) throw new Napaka(404, 'ni-igralca');
  if (g.pub !== p.pub) throw new Napaka(409, 'kljuc');
  if (p.sent < g.sent0) throw new Napaka(400, 'ura');
  if (prepoved && g.prepoved) throw new Napaka(403, 'prepoved');
}

// POST /v1/vzdevek { ime }: the nickname set (the player made by the first one) → { id, ime, nov, skrit }; a name that cannot be one: 400
// vzdevek { razlog } (vzdevki.js). A hidden nickname stays hidden when it changes (the keeper decides).
export async function vzdevek(req, env) {
  const { p, id, now, ip } = await zacni(req, env, 'vzdevek');
  const r = razlog(p.ime); if (r) throw new Napaka(400, 'vzdevek', { razlog: r });
  const ime = cleanName(p.ime).normalize('NFC');
  let g = await igralec(env, id);
  if (!g) {
    const n = await env.DB.prepare('SELECT n FROM omejitve WHERE k = ?1 AND konec > ?2').bind(IZBRISAN(id), now).first('n');
    if (n != null && p.sent <= n) throw new Napaka(400, 'ura');   // (signed before the player was deleted)
    await omeji(env, 'novi_ip_d', ip, now);
    const nov = await env.DB.prepare('INSERT INTO igralci (id, pub, ime, ustvarjen, sent0, zadnjic) VALUES (?1, ?2, ?3, ?4, ?5, ?4) ON CONFLICT DO NOTHING RETURNING id')
      .bind(id, p.pub, ime, now, p.sent).first('id');
    if (nov) return json({ ok: true, id, ime, nov: true, skrit: false });
    g = await igralec(env, id);   // (made meanwhile by another request)
  }
  preveriIgralca(g, p);
  if (g.ime !== ime) {
    await omeji(env, 'vzdevek_d', id, now);
    await env.DB.prepare('UPDATE igralci SET ime = ?2 WHERE id = ?1').bind(id, ime).run();
    kesBrisi(env);
  }
  return json({ ok: true, id, ime, nov: false, skrit: !!g.skrit });
}

// POST /v1/izbris: the player deleted with all their runs, records, ghosts and reports (also a banned one) → { izbrisano, casov }; the mark
// keeps a request signed before it from making the player again
export async function izbris(req, env) {
  const { p, id, now } = await zacni(req, env, 'izbris');
  const oznaka = env.DB.prepare('INSERT INTO omejitve (k, n, konec) VALUES (?1, ?2, ?3) ON CONFLICT(k) DO UPDATE SET n = MAX(n, excluded.n), konec = MAX(konec, excluded.konec)')
    .bind(IZBRISAN(id), p.sent, now + IZBRISAN_MS);
  const g = await igralec(env, id);
  if (!g) { await oznaka.run(); return json({ ok: true, izbrisano: false, casov: 0 }); }
  preveriIgralca(g, p, false);
  const r = await env.DB.batch([
    zapisiPoti(env, 'igralec = ?1', id),
    env.DB.prepare('DELETE FROM casi WHERE igralec = ?1').bind(id),
    env.DB.prepare('DELETE FROM prijave WHERE prijavitelj = ?1 OR prijavljen = ?1').bind(id),
    env.DB.prepare('DELETE FROM igralci WHERE id = ?1').bind(id),
    oznaka,
  ]);
  await brisiPoti(env, r[0]);
  kesBrisi(env);
  return json({ ok: true, izbrisano: true, casov: r[1].meta.changes });
}

// POST /v1/prijava { id }: a report of a player's nickname, one per reporter and player → { nova, skrit }; the third not yet reviewed hides it
export async function prijava(req, env) {
  const { p, id, now } = await zacni(req, env, 'prijava');
  preveriIgralca(await igralec(env, id), p);
  if (typeof p.id !== 'string' || !ID_RE.test(p.id) || p.id === id) throw new Napaka(400, 'prijava');
  const t = await env.DB.prepare('SELECT skrit FROM igralci WHERE id = ?1').bind(p.id).first();
  if (!t) throw new Napaka(400, 'prijava');
  await omeji(env, 'prijava_d', id, now);
  const nova = await env.DB.prepare(`INSERT INTO prijave (prijavitelj, prijavljen, cas) SELECT ?1, ?2, ?3 WHERE ${ziv(1)} AND EXISTS (SELECT 1 FROM igralci WHERE id = ?2) ON CONFLICT DO NOTHING RETURNING cas`)
    .bind(id, p.id, now).first('cas');
  let skrit = !!t.skrit;
  if (nova != null && !skrit) {
    const h = await env.DB.prepare(`UPDATE igralci SET skrit = 1 WHERE id = ?1 AND skrit = 0 AND (SELECT COUNT(*) FROM prijave WHERE prijavljen = ?1 AND pregledana = 0) >= ${PRIJAV_SKRIJE} RETURNING id`)
      .bind(p.id).first('id');
    if (h) { skrit = true; kesBrisi(env); }
  }
  return json({ ok: true, nova: nova != null, skrit });
}

// POST /v1/moje: the player and all their runs with their state (only the player sees the waiting, suspicious and rejected ones) →
// { igralec: { id, ime, skrit, prepoved } | null, casi: [{ st, kljuc, ms, ms0, stanje, razlog, priblizno, oddan, preverjen }] }
export async function moje(req, env) {
  const { p, id } = await zacni(req, env, 'moje');
  const g = await igralec(env, id);
  if (!g || g.pub !== p.pub || p.sent < g.sent0) return json({ ok: true, igralec: null, casi: [] });
  const r = await env.DB.prepare('SELECT st, kljuc, ms, ms0, stanje, razlog, priblizno, oddan, preverjen FROM casi WHERE igralec = ?1 ORDER BY kljuc, st LIMIT 2000').bind(id).all();
  return json({ ok: true, igralec: { id, ime: g.ime, skrit: !!g.skrit, prepoved: !!g.prepoved }, casi: r.results.map(c => ({ ...c, priblizno: !!c.priblizno })) });
}

// POST /v1/oddaja: a run (the packet's fields, the record, the ghost) checked quickly (pregled.js) and kept waiting for the checking job →
// { st, stanje: 'caka' }. The same run again: 409 ze-oddano; no faster than the player's best not rejected one (waiting, suspicious or
// checked): 409 ni-boljsi { ms }. The row first, then the objects in R2 (the job takes a run 2 minutes after it came); R2 failing: the row
// goes, 503 shramba. Then the row is read again: an object whose run went meanwhile (deleted, banned, a faster one checked) or lost it is
// deleted (they did not find it in R2 yet).
export async function oddaja(req, env) {
  const { p, id, now, vnos, duh } = await zacni(req, env, 'oddaja');
  preveriIgralca(await igralec(env, id), p);
  const M = await beriMeje(env, now); if (!M) throw new Napaka(503, 'ni-mej');
  const e = hitri(p, M), duhB = duh ? preveriDuh(duh, p, e, M) : null;
  const d = await env.DB.prepare(`SELECT MIN(CASE WHEN stanje <> 'zavrnjeno' THEN ms END) m, MAX(ms0 = ?3 AND n = ?4) ista FROM casi WHERE igralec = ?1 AND kljuc = ?2`)
    .bind(id, p.kljuc, p.t, p.n).first();
  if (d && d.ista) throw new Napaka(409, 'ze-oddano');
  if (d && d.m != null && p.t >= d.m) throw new Napaka(409, 'ni-boljsi', { ms: d.m });
  await omeji(env, 'oddaja_h', id, now);
  await omeji(env, 'oddaja_d', id, now);
  const nad = {}; for (const k of M.nad) nad[k] = p.nad[k];
  const r = await env.DB.batch([
    env.DB.prepare(`INSERT INTO casi (kljuc, igralec, ms, ms0, vmes, avto, nad, pomoc, zig, eng, n, fs, s0, s1, stanje, oddan, duh, posnetek) SELECT ?1, ?2, ?3, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'caka', ?14, ?15, 1 WHERE ${ziv(2)} RETURNING st`)
      .bind(p.kljuc, id, p.t, JSON.stringify(p.vmes), p.avto, JSON.stringify(nad), p.pomoc, JSON.stringify({ igra: p.zig.igra, jedro: p.zig.jedro }), p.eng, p.n, p.fs ?? null, p.s0, p.s1, now, duhB ? 1 : 0),
    env.DB.prepare('UPDATE igralci SET zadnjic = ?2 WHERE id = ?1').bind(id, now),
  ]);
  if (!r[0].results.length) throw new Napaka(404, 'ni-igralca');   // (deleted or banned meanwhile)
  const st = r[0].results[0].st, [pv, pd] = poti(p.kljuc, st);
  try {
    await env.R2.put(pv, vnos, { httpMetadata: { contentType: 'application/gzip' } });
    if (duhB) await env.R2.put(pd, duhB, { httpMetadata: { contentType: 'application/json' } });
  } catch (_) {
    await env.DB.prepare('DELETE FROM casi WHERE st = ?1').bind(st).run();
    await brisiObjekte(env, duhB ? [pv, pd] : [pv]);
    throw new Napaka(503, 'shramba');
  }
  const f = await env.DB.prepare('SELECT stanje, posnetek, duh FROM casi WHERE st = ?1').bind(st).first();
  const ostanki = []; if (!f || !f.posnetek) ostanki.push(pv); if (duhB && (!f || !f.duh)) ostanki.push(pd);
  await brisiObjekte(env, ostanki);
  if (!f) throw new Napaka(404, 'ni-igralca');
  return json({ ok: true, st, stanje: f.stanje });
}
