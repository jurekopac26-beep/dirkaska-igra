// What the handlers share (README.md here, »Omejitve« and »Brezplačni paket«): the clock and the fetch (a test gives its own), JSON answers,
// the boards' cache, the bounds from R2, the limits of sending, the hashed IP, deleting runs and their objects. A request may make at most
// 50 queries (D1 on the free plan; each statement of a batch counts): a list goes to D1 as one JSON value (json_each; D1 binds at most 100
// values a query), so every helper here is one query or one batch, whatever the number of rows.
import { Napaka, enc, sha } from './ovoj.js';
import { veljavneMeje } from './pregled.js';

export const ura = (env) => env.URA ? env.URA() : Date.now();
export const dohvat = (env) => env.FETCH || ((u, o) => fetch(u, o));
export const json = (obj, st = 200, glave = {}) => new Response(JSON.stringify(obj), { status: st, headers: { 'Content-Type': 'application/json; charset=utf-8', ...glave } });
export const V_SEZNAMU = 'IN (SELECT value FROM json_each(?1))';   // (a list bound as one JSON value, the query's first)
// a run's objects in R2: its record (gzip) and its ghost (JSON)
export const poti = (kljuc, st) => [`posnetki/${kljuc}/${st}.vnos`, `posnetki/${kljuc}/${st}.duh`];

// the boards' answers kept 60 s in the isolate (the Cache API does nothing on workers.dev; the answer also says max-age=60); a run that
// changes a board empties it (another isolate keeps its copy at most 60 s)
const KES = new WeakMap(), KES_MS = 60000, KES_MAX = 500;
const kes = (env) => { let m = KES.get(env.DB); if (!m) { m = new Map(); KES.set(env.DB, m); } return m; };
export function kesBeri(env, k, now) { const e = kes(env).get(k); return e && e.do > now ? e.v : null; }
export function kesPisi(env, k, v, now) { const m = kes(env); if (m.size >= KES_MAX) m.clear(); m.set(k, { v, do: now + KES_MS }); }
export function kesBrisi(env) { kes(env).clear(); }

// the bounds (meje.json in R2, tools/lestvica-meje.mjs): kept 10 minutes; a missing or broken file is null (the run waits: 503 ni-mej)
const MEJE = new WeakMap(), MEJE_MS = 600000;
export async function beriMeje(env, now) {
  const c = MEJE.get(env.R2); if (c && c.do > now) return c.M;
  let M = null;
  try { const o = await env.R2.get('meje.json'); M = o ? await o.json() : null; } catch (_) { M = null; }
  if (!veljavneMeje(M)) return null;
  MEJE.set(env.R2, { M, do: now + MEJE_MS });
  return M;
}
export function mejeBrisi(env) { MEJE.delete(env.R2); }

// the limits of sending (docs/svetovna-lestvica.md, »Omejitev pošiljanja«): [how many, in a window of s seconds] for a player's id or the
// hashed IP; a fixed window, one row a window, the clean-up deletes the ended ones. A key found over its limit is kept in the isolate until
// its window ends: the requests after it are refused without a write (a flood does not spend the day's writes, »Brezplačni paket«).
export const OMEJITVE = { oddaja_h: [20, 3600], oddaja_d: [100, 86400], vzdevek_d: [3, 86400], prijava_d: [10, 86400], novi_ip_d: [50, 86400], pisanje_ip_m: [300, 60] };
const PREKO = new WeakMap(), PREKO_MAX = 1000;
export async function omeji(env, kaj, kdo, now) {
  const [max, s] = OMEJITVE[kaj], w = s * 1000, konec = (Math.floor(now / w) + 1) * w, k = `${kaj}:${kdo}:${konec}`;
  const cez = () => new Napaka(429, 'omejitev', { cez: Math.max(1, Math.ceil((konec - now) / 1000)) });
  let m = PREKO.get(env.DB); if (!m) { m = new Map(); PREKO.set(env.DB, m); }
  if (m.has(k)) { if (m.get(k) > now) throw cez(); m.delete(k); }
  const n = await env.DB.prepare('INSERT INTO omejitve (k, n, konec) VALUES (?1, 1, ?2) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n').bind(k, konec).first('n');
  if (n > max) { if (m.size >= PREKO_MAX) m.clear(); m.set(k, konec); throw cez(); }
}
// the IP's hash: SHA-256 of the salt (a secret, IP_SOL), the day (UTC) and the IP, 22 characters; never kept longer than its window (≤ a
// day) plus a day to the clean-up
export async function ipOdtis(env, req, now) {
  if (!env.IP_SOL) throw new Napaka(503, 'ni-nastavitve');
  const ip = req.headers.get('CF-Connecting-IP') || '?';
  return (await sha(enc(`${env.IP_SOL}:${new Date(now).toISOString().slice(0, 10)}:${ip}`))).slice(0, 22);
}

// objects whose run is gone deleted from R2 (a thousand a call); when R2 fails they wait in brisanje for the clean-up
export async function brisiObjekte(env, p) {
  if (!p.length) return;
  try { for (let i = 0; i < p.length; i += 1000) await env.R2.delete(p.slice(i, i + 1000)); }
  catch (_) { await env.DB.prepare(`INSERT OR IGNORE INTO brisanje (pot) SELECT value FROM json_each(?1)`).bind(JSON.stringify(p)).run(); }
}
// the objects of the runs that pogoj picks (SQL on casi; ?1 … the values vez), their paths written to brisanje: one statement, for the batch
// that deletes those runs or clears their flags (a request that stops halfway leaves nothing in R2 that the clean-up does not find)
export const zapisiPoti = (env, pogoj, ...vez) => env.DB.prepare(`INSERT OR REPLACE INTO brisanje (pot) SELECT 'posnetki/' || kljuc || '/' || st || '.vnos' FROM casi WHERE posnetek = 1 AND (${pogoj}) UNION ALL SELECT 'posnetki/' || kljuc || '/' || st || '.duh' FROM casi WHERE duh = 1 AND (${pogoj}) RETURNING pot`).bind(...vez);
// then, with that statement's result: the objects deleted from R2 at once and brisanje forgets them (R2 failing: the clean-up does it)
export async function brisiPoti(env, res) {
  const p = res.results.map(r => r.pot); if (!p.length) return 0;
  try {
    for (let i = 0; i < p.length; i += 1000) await env.R2.delete(p.slice(i, i + 1000));
    await env.DB.prepare(`DELETE FROM brisanje WHERE pot ${V_SEZNAMU}`).bind(JSON.stringify(p)).run();
  } catch (_) { }
  return p.length;
}
// runs (their st) deleted with their objects; ocistiCase: only the objects (the runs stay, without them)
export async function izbrisiCase(env, sts) {
  if (!sts.length) return 0;
  const s = JSON.stringify(sts), r = await env.DB.batch([zapisiPoti(env, `st ${V_SEZNAMU}`, s), env.DB.prepare(`DELETE FROM casi WHERE st ${V_SEZNAMU}`).bind(s)]);
  await brisiPoti(env, r[0]);
  return r[1].meta.changes;
}
export async function ocistiCase(env, sts) {
  if (!sts.length) return 0;
  const s = JSON.stringify(sts), r = await env.DB.batch([zapisiPoti(env, `st ${V_SEZNAMU}`, s), env.DB.prepare(`UPDATE casi SET duh = 0, posnetek = 0 WHERE st ${V_SEZNAMU}`).bind(s)]);
  await brisiPoti(env, r[0]);
  return r[1].meta.changes;
}

// a player keeps one checked time a board, the best: their slower checked ones deleted, and the waiting or suspicious ones no faster than
// it (they could not count); igralci: these players (null: all, the clean-up)
export async function odvecni(env, igralci) {
  if (igralci && !igralci.length) return 0;
  const r = await env.DB.prepare(`SELECT st FROM (SELECT st, stanje, ms, ROW_NUMBER() OVER (PARTITION BY igralec, kljuc, stanje = 'ok' ORDER BY ms, oddan, st) r, MIN(CASE WHEN stanje = 'ok' THEN ms END) OVER (PARTITION BY igralec, kljuc) b FROM casi WHERE stanje IN ('ok', 'caka', 'sumljivo')${igralci ? ` AND igralec ${V_SEZNAMU}` : ''}) WHERE (stanje = 'ok' AND r > 1) OR (stanje <> 'ok' AND ms >= b) LIMIT 2000`)
    .bind(...(igralci ? [JSON.stringify([...new Set(igralci)])] : [])).all();
  return izbrisiCase(env, r.results.map(x => x.st));
}

// only the first 100 of a board keep the record and the ghost (»Kaj se shrani«): those further down lose both, 1000 at a time (the clean-up
// goes on the next day); kljuci: these boards only (null: all)
export const PRVIH = 100;
export async function obrezi(env, kljuci) {
  if (kljuci && !kljuci.length) return 0;
  const r = await env.DB.prepare(`SELECT st FROM (SELECT st, duh, posnetek, ROW_NUMBER() OVER (PARTITION BY kljuc ORDER BY ms, oddan, st) r FROM casi WHERE stanje = 'ok'${kljuci ? ` AND kljuc ${V_SEZNAMU}` : ''}) WHERE r > ${PRVIH} AND (duh = 1 OR posnetek = 1) LIMIT 1000`)
    .bind(...(kljuci ? [JSON.stringify([...new Set(kljuci)])] : [])).all();
  return ocistiCase(env, r.results.map(x => x.st));
}
